jest.mock('../../../../db/knex', () => {
  const mockKnex = {
    transaction: jest.fn(),
    destroy: jest.fn(),
    // Mock any additional methods
  };
  return jest.fn(() => mockKnex); // Mock the function that returns the Knex instance
});

jest.mock('../../../../src/repositories/users', () => ({
  getByEmail: jest.fn(),
  getByNickname: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  getByEmailConfirmationToken: jest.fn(),
  getFieldsByUserId: jest.fn(),
  getById: jest.fn()
}));
jest.mock('../../../../src/repositories/policies', () => ({
  getLatestPolicies: jest.fn(),
}));
jest.mock('../../../../src/repositories/password_reset_tokens', () => ({
  getByToken: jest.fn(),
  saveResetToken: jest.fn(),
  deleteByToken: jest.fn()
}));
jest.mock('../../../../src/services/emailsService', () => ({
  sendConfirmationEmail: jest.fn(),
  sendEmail: jest.fn(),
}));
jest.mock('../../../../src/middlewares/authenticateToken', () => {
  return (req, res, next) => {
    req.user = { id: 1 };
    next();
  };
});

const bcrypt = require('bcrypt');
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const request = require('supertest');
const app = require('../../../../server');
const usersRepo = require('../../../../src/repositories/users');
const policiesRepo = require('../../../../src/repositories/policies');
const authService = require('../../../../src/services/authService');
const emailService = require('../../../../src/services/emailsService');
const passwordResetTokensRepo = require('../../../../src/repositories/password_reset_tokens');
const refreshTokensRepo = require('../../../../src/repositories/refresh_tokens');
const { OAuth2Client } = require('google-auth-library');
const getDb = require('../../../../db/knex');
const knex = getDb();

jest.mock('../../../../src/repositories/users');
jest.mock('../../../../src/repositories/refresh_tokens');
jest.mock('../../../../src/services/authService');
jest.mock('google-auth-library');

describe('Auth Controller - Google Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('google auth', () => {

    it('should authenticate successfully with an existing user', async () => {
      // Mock Google token verification
      const mockVerifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => ({ email: 'test@example.com', name: 'Test User' }),
      });
      OAuth2Client.prototype.verifyIdToken = mockVerifyIdToken;

      // Mock existing user
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        nickname: 'testuser',
      };
      usersRepo.getByEmail.mockResolvedValue(mockUser);
      authService.generateAccessToken.mockReturnValue('mockAccessToken');
      authService.generateRefreshToken.mockReturnValue('mockRefreshToken');
      refreshTokensRepo.saveRefreshToken.mockResolvedValue();

      const response = await request(app)
        .post('/api/auth/google-login')
        .send({ googleToken: 'mockGoogleToken' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        userId: 1,
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
      });
      expect(usersRepo.getByEmail).toHaveBeenCalledWith('test@example.com');
      expect(refreshTokensRepo.saveRefreshToken).toHaveBeenCalledWith({
        userId: 1,
        token: 'mockRefreshToken',
      });
    });

    it('should return email and name if user does not exist', async () => {
      // Mock Google token verification
      const mockVerifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => ({ email: 'newuser@example.com', name: 'New User' }),
      });
      OAuth2Client.prototype.verifyIdToken = mockVerifyIdToken;

      usersRepo.getByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/google-login')
        .send({ googleToken: 'mockGoogleToken' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        email: 'newuser@example.com',
        name: 'New User',
      });
      expect(usersRepo.getByEmail).toHaveBeenCalledWith('newuser@example.com');
    });

    it('should return an error if Google token is invalid', async () => {
      // Mock Google token verification to throw an error
      const mockVerifyIdToken = jest.fn().mockRejectedValue(new Error('Invalid token'));
      OAuth2Client.prototype.verifyIdToken = mockVerifyIdToken;

      const response = await request(app)
        .post('/api/auth/google-login')
        .send({ googleToken: 'invalidToken' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Auth error' });
      expect(usersRepo.getByEmail).not.toHaveBeenCalled();
    });

  });
  describe('checkUser', () => {
    it('should return exists: true for an existing user', async () => {
      const mockUser = { id: 1, email: 'test@example.com', nickname: 'TestUser', email_confirmed: true };
      usersRepo.getByEmail.mockResolvedValue(mockUser);

      const res = await request(app).post('/api/auth/check-user').send({ email: 'test@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.exists).toBe(true);
      expect(res.body.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        nickname: mockUser.nickname,
        email_confirmed: mockUser.email_confirmed,
      });
    });

    it('should return exists: false for a non-existent user', async () => {
      usersRepo.getByEmail.mockResolvedValue(null);

      const res = await request(app).post('/api/auth/check-user').send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.exists).toBe(false);
    });
  });

  describe('checkNickname', () => {
    it('should return exists: true if nickname is taken', async () => {
      const mockUser = { id: 1, nickname: 'TakenNickname' };
      usersRepo.getByNickname.mockResolvedValue(mockUser);

      const res = await request(app).post('/api/auth/check-nickname').send({ nickname: 'TakenNickname' });

      expect(res.status).toBe(200);
      expect(res.body.exists).toBe(true);
    });

    it('should return exists: false if nickname is available', async () => {
      usersRepo.getByNickname.mockResolvedValue(null);

      const res = await request(app).post('/api/auth/check-nickname').send({ nickname: 'AvailableNickname' });

      expect(res.status).toBe(200);
      expect(res.body.exists).toBe(false);
    });

    it('should return an error if nickname is not provided', async () => {
      const res = await request(app).post('/api/auth/check-nickname').send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Nickname is required.');
    });
  });

  describe('register', () => {
    let mockTransaction;
  
    beforeEach(() => {
      mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      knex.transaction.mockResolvedValue(mockTransaction);
    });
  
    afterEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
      jest.clearAllTimers();
    });
  
    it('should register a new user successfully', async () => {
      usersRepo.getByEmail.mockResolvedValue(null);
      usersRepo.getByNickname.mockResolvedValue(null);
      policiesRepo.getLatestPolicies.mockResolvedValue([
        { type: 'terms', version: 1 },
        { type: 'privacy', version: 1 },
      ]);
      usersRepo.create.mockResolvedValue([{ id: 1 }]);
      emailService.sendConfirmationEmail.mockResolvedValue();
  
      const res = await request(app).post('/api/auth/register').send({
        email: 'newuser@example.com',
        nickname: 'NewUser',
        password: 'Password1!',
        termsAccepted: true,
        privacyAccepted: true,
        agreedPolicyVersions: { terms: { version: 1 }, privacy: { version: 1 } },
      });
  
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Registration successful. Please check your email to confirm your account.');
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  
    it('should return an error if email is already confirmed', async () => {
      policiesRepo.getLatestPolicies.mockResolvedValue([
        { type: 'terms', version: 1 },
        { type: 'privacy', version: 1 },
      ]);
      usersRepo.getByEmail.mockResolvedValue({ id: 1, email_confirmed: true });
  
      const res = await request(app).post('/api/auth/register').send({
        email: 'existinguser@example.com',
        nickname: 'ExistingUser',
        password: 'Password1!',
        termsAccepted: true,
        privacyAccepted: true,
        agreedPolicyVersions: { terms: { version: 1 }, privacy: { version: 1 } },
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User already exists.');
      expect(mockTransaction.commit).not.toHaveBeenCalled();
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });
  
    it('should resend confirmation email for unconfirmed account', async () => {
      // Mock data for an unconfirmed account
      usersRepo.getByEmail.mockResolvedValue({
        id: 1,
        email_confirmed: false,
        google_oauth: false,
      });
      policiesRepo.getLatestPolicies.mockResolvedValue([
        { type: 'terms', version: 1 },
        { type: 'privacy', version: 1 },
      ]);
    
      emailService.sendConfirmationEmail.mockResolvedValue();
    
      const res = await request(app).post('/api/auth/register').send({
        email: 'unconfirmed@example.com',
        nickname: 'UnconfirmedUser',
        password: 'Password1!',
        termsAccepted: true,
        privacyAccepted: true,
        agreedPolicyVersions: { terms: { version: 1 }, privacy: { version: 1 } },
      });
    
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Registration successful. A new confirmation email has been sent.');
      expect(emailService.sendConfirmationEmail).toHaveBeenCalledWith('unconfirmed@example.com', expect.any(String));
      expect(mockTransaction.commit).not.toHaveBeenCalled();
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });
    
  
    it('should return an error if password does not meet requirements', async () => {
      // Mock `policiesRepo.getLatestPolicies` to return valid policy versions
      policiesRepo.getLatestPolicies.mockResolvedValue([
        { type: 'terms', version: 1 },
        { type: 'privacy', version: 1 },
      ]);
    
      // Mock `usersRepo.getByEmail` and `usersRepo.getByNickname` to simulate no existing user
      usersRepo.getByEmail.mockResolvedValue(null);
      usersRepo.getByNickname.mockResolvedValue(null);
    
      // Make the request
      const res = await request(app).post('/api/auth/register').send({
        email: 'newuser@example.com',
        nickname: 'NewUser',
        password: 'sh', // Short password to trigger validation error
        termsAccepted: true,
        privacyAccepted: true,
        agreedPolicyVersions: { terms: { version: 1 }, privacy: { version: 1 } },
      });
    
      // Assertions
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Password must be at least 6 characters long.');
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });
    
  });

  describe('confirmEmail', () => {
    it('should confirm email successfully', async () => {
      usersRepo.getByEmailConfirmationToken.mockResolvedValue({ id: 1 });
      usersRepo.updateById.mockResolvedValue();

      const res = await request(app).post('/api/auth/confirm-email').send({ token: 'validToken' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Email confirmed successfully.');
    });

    it('should return an error if token is invalid or expired', async () => {
      usersRepo.getByEmailConfirmationToken.mockResolvedValue(null);

      const res = await request(app).post('/api/auth/confirm-email').send({ token: 'invalidToken' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid or expired token.');
    });
  });

  describe('requestPasswordReset', () => {
    it('should successfully send a password reset link', async () => {
      usersRepo.getByEmail.mockResolvedValue({ id: 1, email_confirmed: true, google_oauth: false });
      emailService.sendEmail.mockResolvedValue();
      passwordResetTokensRepo.saveResetToken.mockResolvedValue();
  
      const res = await request(app).post('/api/auth/request-password-reset').send({
        email: 'confirmed@example.com',
      });
  
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('If the email exists, a password reset link has been sent.');
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
  
    it('should respond with a safe message if email does not exist', async () => {
      usersRepo.getByEmail.mockResolvedValue(null);
  
      const res = await request(app).post('/api/auth/request-password-reset').send({
        email: 'nonexistent@example.com',
      });
  
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('If the email exists, a password reset link has been sent.');
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });
  
    it('should send a confirmation email if email is not confirmed', async () => {
      usersRepo.getByEmail.mockResolvedValue({ id: 1, email_confirmed: false, google_oauth: false });
      emailService.sendConfirmationEmail.mockResolvedValue();
  
      const res = await request(app).post('/api/auth/request-password-reset').send({
        email: 'unconfirmed@example.com',
      });
  
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Your account is not confirmed. A new confirmation email has been sent.');
      expect(emailService.sendConfirmationEmail).toHaveBeenCalledWith('unconfirmed@example.com', expect.any(String));
    });
  });
  describe('validateResetToken', () => {
    it('should successfully validate a token', async () => {
      passwordResetTokensRepo.getByToken.mockResolvedValue({
        reset_token: 'valid-token',
        expires_at: new Date(Date.now() + 3600 * 1000), // Not expired
      });
  
      const res = await request(app).post('/api/auth/validate-reset-token').send({
        token: 'valid-token',
      });
  
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Token is valid.');
    });
  
    it('should return an error if the token has expired', async () => {
      passwordResetTokensRepo.getByToken.mockResolvedValue({
        reset_token: 'expired-token',
        expires_at: new Date(Date.now() - 3600 * 1000), // Expired
      });
  
      const res = await request(app).post('/api/auth/validate-reset-token').send({
        token: 'expired-token',
      });
  
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Token has expired.');
    });
  
    it('should return an error if the token is invalid', async () => {
      passwordResetTokensRepo.getByToken.mockResolvedValue(null);
  
      const res = await request(app).post('/api/auth/validate-reset-token').send({
        token: 'invalid-token',
      });
  
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid token.');
    });
  });
  describe('resetPassword', () => {
    it('should successfully reset the password', async () => {
      passwordResetTokensRepo.getByToken.mockResolvedValue({
        reset_token: 'valid-token',
        expires_at: new Date(Date.now() + 3600 * 1000), // Not expired
        user_id: 1,
      });
      usersRepo.getById.mockResolvedValue({
        id: 1,
        email_confirmed: true,
        google_oauth: false,
      });
      bcrypt.hash.mockResolvedValue('hashed-password');
      usersRepo.updateById.mockResolvedValue();
      passwordResetTokensRepo.deleteByToken.mockResolvedValue();
  
      const res = await request(app).post('/api/auth/reset-password').send({
        token: 'valid-token',
        password: 'ValidPassword1!',
      });
  
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password reset successfully. You can now log in.');
      expect(usersRepo.updateById).toHaveBeenCalledWith(1, { password_hash: 'hashed-password' });
      expect(passwordResetTokensRepo.deleteByToken).toHaveBeenCalledWith('valid-token');
    });
  
    it('should return an error if the token is expired', async () => {
      passwordResetTokensRepo.getByToken.mockResolvedValue({
        reset_token: 'expired-token',
        expires_at: new Date(Date.now() - 3600 * 1000), // Expired
      });
  
      const res = await request(app).post('/api/auth/reset-password').send({
        token: 'expired-token',
        password: 'ValidPassword1!',
      });
  
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Token has expired.');
    });
  
    it('should return an error if the token is invalid', async () => {
      passwordResetTokensRepo.getByToken.mockResolvedValue(null);
  
      const res = await request(app).post('/api/auth/reset-password').send({
        token: 'invalid-token',
        password: 'ValidPassword1!',
      });
  
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid token.');
    });
  
    it('should return an error if the password does not meet requirements', async () => {
      const res = await request(app).post('/api/auth/reset-password').send({
        token: 'valid-token',
        password: '12',
      });
  
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Password must be at least 6 characters long.');
    });
  });

  describe('me', () => {
    it('should successfully retrieve current user data', async () => {
      usersRepo.getFieldsByUserId.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        nickname: 'TestUser',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      });
  
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token'); // Mocked valid token
  
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: 1,
        email: 'user@example.com',
        nickname: 'TestUser',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      });
    });
  
    it('should return an error if the user is not found', async () => {
      usersRepo.getFieldsByUserId.mockResolvedValue(null);
    
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token'); // Mocked valid token
    
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });
    
  });
  
    
});
