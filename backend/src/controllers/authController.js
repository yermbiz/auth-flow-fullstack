const getDb = require('../../db/knex');
const knex = getDb();
const logger = require('../utils/logger');

const client = require('../utils/googleClient');
const bcrypt = require('bcrypt');
const usersRepo = require('../repositories/users');
const policiesRepo = require('../repositories/policies');
const authService = require('../services/authService');
const refreshTokensRepo = require('../repositories/refresh_tokens');
const emailService = require('../services/emailsService');
const validatePasswordComplexity = require('../utils/passwordValidation');
const passwordResetTokensRepo = require('../repositories/password_reset_tokens');
const generateConfirmationToken = require('../utils/generateConfirmationToken');


const googleLogin = async (req, res) => {
  logger.info('Google login initiated.');
  const { googleToken } = req.body;

  try {
    if (!googleToken) {
      logger.warn('Google login failed: missing token.');
      return res.status(400).json({ message: 'Google token is required' });
    }
    logger.debug('Verifying Google token.');
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;
    if (!email || !name) {
      logger.warn('Google login failed: invalid token payload.');
      return res.status(400).json({ message: 'Invalid Google token' });
    }
    logger.info(`Google login attempt for email: ${email}`);
    const existingUser = await usersRepo.getByEmail(email);
    if (existingUser) {
      logger.info(`User found for email: ${email}, generating tokens.`);
      const accessToken = authService.generateAccessToken({ id: existingUser.id, email: existingUser.email, nickname: existingUser.nickname });
      const refreshToken = authService.generateRefreshToken({ id: existingUser.id });

      await refreshTokensRepo.saveRefreshToken({ userId: existingUser.id, token: refreshToken });

      logger.info(`Google login successful for email: ${email}`);
      return res.status(200).json({
        userId: existingUser.id,
        accessToken,
        refreshToken,
      });
    }

    logger.info(`New Google user registration required for email: ${email}`);
    res.status(200).json({ email, name });
  } catch (error) {
    logger.error('Error Google OAuth:', error);
    res.status(500).json({ message: 'Auth error' });
  }
}

const checkUser = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email || !email.trim()) {
      logger.warn('Email is missing or empty in the request body.');
      return res.status(400).json({ error: 'Email is required.' });
    }

    logger.debug(`Checking existence of user with email: ${email}`);
    const user = await usersRepo.getByEmail(email);

    if (user) {
      logger.info(`User found with email: ${email}`);
      return res.status(200).json({
        exists: true,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          email_confirmed: user.email_confirmed,
        },
      });
    } else {
      logger.info(`No user found with email: ${email}`);
      return res.status(200).json({ exists: false });
    }
  } catch (err) {
    logger.error(`Error checking user existence for email: ${email}: ${err.message}`, { error: err });
    res.status(500).json({ error: 'Error checking user existence' });
  }
};

const checkNickname = async (req, res) => {
  const { nickname } = req.body;

  if (!nickname || !nickname.trim()) {
    logger.warn('Nickname is missing or empty in the request body.');
    return res.status(400).json({ error: 'Nickname is required.' });
  }

  try {
    logger.debug(`Checking existence of user with nickname: ${nickname}`);
    const userWithNickname = await usersRepo.getByNickname(nickname);

    if (userWithNickname) {
      logger.info(`Nickname "${nickname}" is already taken.`);
      return res.status(200).json({ exists: true });
    } else {
      logger.info(`Nickname "${nickname}" is available.`);
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    logger.error(`Error checking nickname "${nickname}": ${error.message}`, { error });
    return res.status(500).json({ error: 'Server error occurred while checking nickname.' });
  }
};

const register = async (req, res) => {
  logger.info('User registration initiated.');
  const { googleToken, email, password, nickname, termsAccepted, privacyAccepted, agreedPolicyVersions } = req.body;
  let trx;
  try {
    logger.debug(`Registration details: email=${email}, nickname=${nickname}`);
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      logger.warn('Registration failed: invalid email.');
      return res.status(400).json({ message: 'A valid email is required.' });
    }


    const trimmedNickname = nickname ? nickname.trim() : null;
    if (!trimmedNickname) {
      logger.warn('Registration failed: missing nickname.');
      return res.status(400).json({ message: 'Nickname is required.' });
    }

    const nicknameRegex = /^[a-zA-Z0-9_-]{3,15}$/;
    if (!nicknameRegex.test(trimmedNickname)) {
      return res.status(400).json({
        message: 'Nickname should be 3-15 characters long and contain only letters, numbers, underscores, or dashes.',
      });
    }

    const existingUserWithNickname = await usersRepo.getByNickname(trimmedNickname, trx);
    if (existingUserWithNickname) {
      logger.warn(`Registration failed: nickname '${trimmedNickname}' already exists.`);
      return res.status(400).json({ message: 'Nickname already exists.' });
    }

    logger.debug('Checking latest policy versions.');
    const latestPolicies = await policiesRepo.getLatestPolicies();
    if (!latestPolicies) {
      logger.error('Registration failed: unable to fetch policy versions.');
      return res.status(500).json({ message: 'Unable to fetch policy versions.' });
    }

    const latestTermsVersion = latestPolicies.find((policy) => policy.type === 'terms')?.version;
    const latestPrivacyVersion = latestPolicies.find((policy) => policy.type === 'privacy')?.version;

    if (
      agreedPolicyVersions.terms.version !== latestTermsVersion ||
      agreedPolicyVersions.privacy.version !== latestPrivacyVersion ||
      !termsAccepted ||
      !privacyAccepted
    ) {
      return res.status(400).json({ message: 'You must agree to the latest Terms and Privacy Policy.' });
    }

    let hashedPassword = null;
    if (!googleToken) {
      if (!password) {
        return res.status(400).json({ message: 'Password is required.' });
      }
      if (!validatePasswordComplexity(password)) {
        return res.status(400).json({
          message:
            process.env.PASSWORD_COMPLEXITY === 'complex'
              ? 'Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.'
              : 'Password must be at least 6 characters long.',
        });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    if (googleToken) {
      try {
        const ticket = await client.verifyIdToken({
          idToken: googleToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (payload.email !== email) {
          return res.status(400).json({ message: 'Google token email does not match provided email' });
        }
      } catch (error) {
        return res.status(400).json({ message: 'Invalid Google token' });
      }
    }
  
    const existingUser = await usersRepo.getByEmail(email);
    if (existingUser) {
      if (!existingUser.email_confirmed && !existingUser.google_oauth) {
        const { token, tokenExpiration } = generateConfirmationToken();

        await usersRepo.updateById(existingUser.id, {
          nickname: trimmedNickname,
          password_hash: password ? await bcrypt.hash(password, 10) : existingUser.password_hash,
          email_confirmation_token: token,
          email_confirmation_token_expires: tokenExpiration,
        });

        await emailService.sendConfirmationEmail(email, token);

        return res.status(200).json({
          message: 'Registration successful. A new confirmation email has been sent.',
          userId: existingUser.id,
          emailConfirmed: false,
        });
      }

      return res.status(400).json({ message: 'User already exists.' });
    }

    trx = await knex.transaction();
  
    const [user] = await usersRepo.create({
      email,
      nickname: trimmedNickname,
      password_hash: hashedPassword, // Optional for Google OAuth
      terms_version: agreedPolicyVersions.terms.version,
      privacy_version: agreedPolicyVersions.privacy.version,
      google_oauth: !!googleToken || false,
      email_confirmed: !!googleToken || false,
    }, trx);

    if (googleToken) {
      const accessToken = authService.generateAccessToken({ id: user.id, email: user.email, nickname: user.nickname });
      const refreshToken = authService.generateRefreshToken({ id: user.id });

      await refreshTokensRepo.saveRefreshToken({ userId: user.id, token: refreshToken }, trx);

      await trx.commit();
      logger.info(`Google registration successful for user: ${user.id}`);
      return res.status(201).json({
        message: 'User registered successfully.',
        userId: user.id,
        emailConfirmed: true,
        accessToken,
        refreshToken,
      });
    }

    const { token, tokenExpiration } = generateConfirmationToken();
    await usersRepo.updateById(user.id, {
      email_confirmation_token: token,
      email_confirmation_token_expires: tokenExpiration,
    }, trx);
   
    await emailService.sendConfirmationEmail(email, token);

    await trx.commit();
    logger.info(`Email registration successful for user: ${user.id}`);
    res.status(201).json({
      message: 'Registration successful. Please check your email to confirm your account.',
      userId: user.id,
      emailConfirmed: false,
    });
  } catch (err) {
    if (trx) await trx.rollback();
    logger.error('Error during user registration:', err);
    res.status(500).json({ error: err.message || 'Error registering user' });
  }
};

const userPasswordLogin = async (req, res) => {
  logger.info('User login attempt initiated.');
  const { email, password } = req.body;
  
  try {
    logger.debug(`Login attempt for email: ${email}`);
    const user = await usersRepo.getByEmail(email);
    if (!user || !user.email_confirmed) {
      logger.warn(`Login failed for email: ${email} - Invalid email or unconfirmed account.`);
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (user.deleted_at) {
      return res.status(403).json({
        error: 'This account has been deleted. Please contact support or create a new account.',
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      logger.warn(`Login failed for email: ${email} - Invalid password.`); 
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    logger.info(`Login successful for email: ${email}`);
    const accessToken = authService.generateAccessToken({ id: user.id, email: user.email, nickname: user.nickname });
    const refreshToken = authService.generateRefreshToken({ id: user.id });

    await refreshTokensRepo.saveRefreshToken({
      userId: user.id,
      token: refreshToken,
    });
    
    res.status(200).json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error('Error during user login:', error);
    res.status(500).json({ error: 'Server error occurred. Please try again later.' });
  }
};

const confirmEmail = async (req, res) => {
  logger.info('Email confirmation initiated.');
  
  try {
    const { token } = req.body;

    if (!token) {
      logger.warn('Email confirmation failed: missing token.');
      return res.status(400).json({ message: 'Token is required.' });
    }

    logger.debug(`Email confirmation attempt with token: ${token}`);
    const user = await usersRepo.getByEmailConfirmationToken(token);

    if (!user) {
      logger.warn(`Email confirmation failed: invalid or expired token (${token}).`);
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    logger.info(`Email confirmation successful for user ID: ${user.id}`);
    await usersRepo.updateById(user.id, {
      email_confirmed: true,
      email_confirmation_token: null,
      email_confirmation_token_expires: null,
    });

    res.status(200).json({ message: 'Email confirmed successfully.' });
  } catch (error) {
    logger.error('Error during email confirmation:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

const requestPasswordReset = async (req, res) => {
  logger.info('Password reset request initiated.');

  const { email } = req.body;

  if (!email) {
    logger.warn('Password reset request failed: missing email.');
    return res.status(400).json({ message: 'Email is required.' });
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    logger.warn(`Password reset request failed: invalid email format (${email}).`);
    return res.status(400).json({ message: 'Invalid email format.' });
  }

  try {
    logger.debug(`Checking if user exists for email: ${email}`);
    const user = await usersRepo.getByEmail(email);

    if (!user || user.google_oauth) {
      logger.info(`Password reset request: no action required for email (${email}).`);
      return res.status(200).json({ message: 'If the email exists, a password reset link has been sent.' });
    }

    if (!user.email_confirmed) {
      logger.info(`User (${user.id}) email not confirmed. Sending confirmation email.`);
      const { token, tokenExpiration } = generateConfirmationToken();

      await usersRepo.updateById(user.id, {
        email_confirmation_token: token,
        email_confirmation_token_expires: tokenExpiration,
      });

      await emailService.sendConfirmationEmail(email, token);
      
      return res.status(200).json({
        message: 'Your account is not confirmed. A new confirmation email has been sent.',
      });
    }

    logger.info(`Generating password reset token for user (${user.id}).`);
    const { token, tokenExpiration } = generateConfirmationToken();

    await passwordResetTokensRepo.saveResetToken({
      user_id: user.id,
      reset_token: token,
      expires_at: tokenExpiration,
      created_at: new Date(),
    });

    const resetLink = `${process.env.BASE_URL}/reset-password?token=${token}`;
    logger.debug(`Password reset link generated: ${resetLink}`);

    await emailService.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset. Click the link below to reset your password:</p>
             <a href="${resetLink}">${resetLink}</a>
             <p>If you didn't request this, you can ignore this email.</p>`,
    });

    logger.info(`Password reset email sent to ${email}.`);
    res.status(200).json({ message: 'If the email exists, a password reset link has been sent.' });
  } catch (error) {
    logger.error('Error during password reset request:', error);
    res.status(500).json({ message: 'Failed to process the password reset request.' });
  }
};

const validateResetToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    logger.warn('Validation attempt without token');
    return res.status(400).json({ message: 'Token is required.' });
  }

  try {
    logger.debug(`Validating reset token: ${token}`);

    const resetTokenRecord = await passwordResetTokensRepo.getByToken(token);

    if (!resetTokenRecord) {
      logger.warn(`Invalid reset token: ${token}`);
      return res.status(400).json({ message: 'Invalid token.' });
    }

    if (new Date(resetTokenRecord.expires_at) < new Date()) {
      logger.warn(`Expired reset token: ${token}`);
      return res.status(400).json({ message: 'Token has expired.' });
    }

    logger.info(`Reset token validated successfully for token: ${token}`);
    res.status(200).json({ message: 'Token is valid.' });
  } catch (error) {
    logger.error(`Error validating reset token: ${error.message}`, { error });
    res.status(500).json({ message: 'Failed to validate reset token.' });
  }
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    logger.warn('Password reset attempt missing token or password');
    return res.status(400).json({ message: 'Token and new password are required.' });
  }

  try {
    logger.debug('Validating password complexity for password reset');
    if (!validatePasswordComplexity(password)) {
      logger.warn('Password reset failed due to invalid password complexity');
      return res.status(400).json({
        message: process.env.PASSWORD_COMPLEXITY === 'complex'
          ? 'Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.'
          : 'Password must be at least 6 characters long.',
      });
    }

    logger.debug(`Fetching reset token record for token: ${token}`);
    const resetTokenRecord = await passwordResetTokensRepo.getByToken(token);
    
    if (!resetTokenRecord) {
      logger.warn(`Invalid password reset token: ${token}`);
      return res.status(400).json({ message: 'Invalid token.' });
    }

    if (new Date(resetTokenRecord.expires_at) < new Date()) {
      logger.warn(`Expired password reset token: ${token}`);
      return res.status(400).json({ message: 'Token has expired.' });
    }

    logger.debug(`Fetching user for reset token: ${resetTokenRecord.user_id}`);
    const user = await usersRepo.getById(resetTokenRecord.user_id);
    
    if (!user) {
      logger.error(`User not found for reset token: ${resetTokenRecord.user_id}`);
      return res.status(400).json({ message: 'User associated with this token does not exist.' });
    }

    if (!user.email_confirmed) {
      logger.warn(`Password reset attempt for unconfirmed email: ${user.email}`);
      return res.status(400).json({ message: 'Email not confirmed. Please confirm your email first.' });
    }

    if (user.google_oauth) {
      logger.warn(`Password reset attempt for Google account: ${user.email}`);
      return res.status(400).json({ message: 'Password reset is not available for Google accounts.' });
    }

    logger.debug(`Updating password for user: ${user.id}`);
    const hashedPassword = await bcrypt.hash(password, 10);
    await usersRepo.updateById(user.id, { password_hash: hashedPassword });

    logger.debug(`Deleting reset token for user: ${user.id}`);
    await passwordResetTokensRepo.deleteByToken(token);
   
    logger.info(`Password reset successfully for user: ${user.id}`);
    res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    logger.error(`Error during password reset: ${error.message}`, { error });
    res.status(500).json({ message: 'Failed to reset password. Please try again later.' });
  }
};

const me = async (req, res) => {
  try {
    const userId = req.user.id;
    logger.debug(`Fetching profile data for user ID: ${userId}`);

    const user = await usersRepo.getFieldsByUserId(
      userId,
      ['id', 'email', 'nickname', 'created_at', 'updated_at']
    );

    if (!user) {
      logger.warn(`User profile not found for user ID: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`Profile data fetched successfully for user ID: ${userId}`);
    res.status(200).json(user);
  } catch (error) {
    logger.error(`Error fetching user data for user ID: ${req.user.id}: ${error.message}`, { error });
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
};

module.exports = {
  googleLogin,
  userPasswordLogin,
  checkUser,
  checkNickname,
  register,
  confirmEmail,
  requestPasswordReset,
  validateResetToken,
  resetPassword,
  me,
};
