const request = require('supertest');
const app = require('../../server');
const getDb = require('../../db/knex');
const db = getDb();
const bcrypt = require('bcrypt');
     
const userEmail = 'testuser@example.com';
const userPassword = 'Password123!';
const seedUsers = async () => {
  await db('users').insert([
    {
      email: userEmail,
      password_hash: await bcrypt.hash(userPassword, 10),
      nickname: 'testuser',
      email_confirmed: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
  await db('policies').insert([
    {
      id: 1,
      type: 'terms',
      version: 1,
      content: 'Terms content v1',
      effective_date: new Date('2025-01-01T23:00:00.000Z'), // Use Date to ensure correct timestamp handling
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 2,
      type: 'privacy',
      version: 1,
      content: 'Privacy content v1',
      effective_date: new Date('2025-01-01T23:00:00.000Z'),
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
};

// Clean up the database
const cleanDatabase = async () => {
  await db('users').del(); 
  await db('policies').del();
  await db('password_reset_tokens').del();
  await db('refresh_tokens').del();
};

describe('Integration Test: /api/auth', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedUsers();
  });

  afterEach(async () => {
    await cleanDatabase();
  });
  afterAll(async () => {
    await db.destroy(); // Close the connection pool
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const payload = {
        email: 'newuser@example.com',
        password: userPassword,
        nickname: 'newuser',
        termsAccepted: true,
        privacyAccepted: true,
        agreedPolicyVersions: {
          terms: { version: '1' },
          privacy: { version: '1' },
        },
      };
    
      const res = await request(app).post('/api/auth/register').send(payload);
    
      expect(res.status).toBe(201);  
      expect(res.body).toHaveProperty('userId');
      expect(res.body).toHaveProperty('message', 'Registration successful. Please check your email to confirm your account.');
    
      const newUser = await db('users').where({ email: 'newuser@example.com' }).first();
      expect(newUser).not.toBeUndefined();
      expect(newUser.nickname).toBe('newuser');
      expect(newUser.email_confirmed).toBe(false);
    
      const isPasswordValid = await bcrypt.compare(userPassword, newUser.password_hash);
      expect(isPasswordValid).toBe(true);
    
      expect(newUser.terms_version).toBe('1');
      expect(newUser.privacy_version).toBe('1');
    });
    

    it('should return 400 if required fields are missing', async () => {
      const payload = { email: 'incomplete@example.com' };
      const res = await request(app).post('/api/auth/register').send(payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Nickname is required.');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in an existing user with valid credentials', async () => {
      const payload = { email: userEmail, password: userPassword };
    
      const res = await request(app).post('/api/auth/login').send(payload);
    
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    
      const { accessToken, refreshToken } = res.body;
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
      expect(accessToken.length).toBeGreaterThan(0);
      expect(refreshToken.length).toBeGreaterThan(0);
    
      const jwt = require('jsonwebtoken');
      const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_SECRET);
      const decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
      expect(decodedAccessToken).toHaveProperty('id');
      expect(decodedAccessToken).toHaveProperty('email', userEmail);
      expect(decodedAccessToken).toHaveProperty('nickname', 'testuser');
    
      expect(decodedRefreshToken).toHaveProperty('id');
      expect(decodedRefreshToken).not.toHaveProperty('email');
    
      const dbRefreshToken = await db('refresh_tokens')
        .where({ user_id: decodedAccessToken.id })
        .first();
      expect(dbRefreshToken).not.toBeUndefined();
      expect(dbRefreshToken.token).toBe(refreshToken);
    
      expect(decodedAccessToken).toHaveProperty('iat');
      expect(decodedAccessToken).toHaveProperty('exp');
    });
    

    it('should return 400 for invalid credentials', async () => {
      const payload = { email: userEmail, password: 'WrongPassword' };
      const res = await request(app).post('/api/auth/login').send(payload);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid credentials');
    });
  });

  describe('POST /api/auth/check-user', () => {
    it('should return user exists for existing email', async () => {
      const email = userEmail;
    
      const res = await request(app).post('/api/auth/check-user').send({ email });
    
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('exists', true);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('email', email);
      expect(res.body.user).toHaveProperty('nickname');
      expect(res.body.user).toHaveProperty('email_confirmed');
    
      const userInResponse = res.body.user;
      expect(userInResponse.email).toBe(email);
      expect(typeof userInResponse.nickname).toBe('string');
      expect(typeof userInResponse.email_confirmed).toBe('boolean');
    
      const userInDb = await db('users').where({ email }).first();
      expect(userInDb).not.toBeUndefined();
      expect(userInResponse.id).toBe(userInDb.id);
      expect(userInResponse.nickname).toBe(userInDb.nickname);
      expect(userInResponse.email_confirmed).toBe(userInDb.email_confirmed);
    });
    
    it('should return user does not exist for non-existent email', async () => {
      const res = await request(app).post('/api/auth/check-user').send({ email: 'nonexistent@example.com' });
      expect(res.status).toBe(200);
      expect(res.body.exists).toBe(false);
    });
  });

  describe('POST /api/auth/check-nickname', () => {
    it('should return nickname exists for existing nickname', async () => {
      const nickname = 'testuser';
    
      const res = await request(app).post('/api/auth/check-nickname').send({ nickname });
    
      expect(res.status).toBe(200);
    
      expect(res.body).toHaveProperty('exists');
      expect(typeof res.body.exists).toBe('boolean');
      expect(res.body.exists).toBe(true);
    
      const userInDb = await db('users').where({ nickname }).first();
      expect(userInDb).not.toBeUndefined();
      expect(userInDb.nickname).toBe(nickname);
    });
    
    it('should return nickname does not exist for non-existent nickname', async () => {
      const res = await request(app).post('/api/auth/check-nickname').send({ nickname: 'newnickname' });
      expect(res.status).toBe(200);
      expect(res.body.exists).toBe(false);
    });
  });

  describe('POST /api/auth/request-password-reset', () => {
    it('should send a reset link for an existing email', async () => {
      const email = userEmail;
    
      const emailService = require('../../src/services/emailsService');
      jest.spyOn(emailService, 'sendEmail').mockResolvedValueOnce();
    
      const user = await db('users').where({ email }).first();
      expect(user).not.toBeUndefined(); // Ensure the user exists
      const userId = user.id;
    
      const res = await request(app).post('/api/auth/request-password-reset').send({ email });
    
      expect(res.status).toBe(200);
     expect(res.body).toHaveProperty('message', 'If the email exists, a password reset link has been sent.');
    
      const resetTokenRecord = await db('password_reset_tokens')
        .where({ user_id: userId })
        .orderBy('created_at', 'desc')
        .first(); // Fetch the latest reset token
      expect(resetTokenRecord).not.toBeUndefined();
      expect(resetTokenRecord.user_id).toBe(userId);
      expect(resetTokenRecord.reset_token).toBeTruthy(); // Ensure the token is not null or empty
      const expiresAt = new Date(resetTokenRecord.expires_at).getTime();
      const now = new Date().getTime();
      expect(expiresAt).toBeGreaterThan(now);

      expect(emailService.sendEmail).toHaveBeenCalledWith({
        to: email,
        subject: 'Password Reset Request',
        html: expect.stringContaining('Click the link below to reset your password:'),
      });
    
      const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetTokenRecord.reset_token}`;
      const emailContent = emailService.sendEmail.mock.calls[0][0].html;
      expect(emailContent).toContain(resetLink);
    
      emailService.sendEmail.mockRestore();
    });

    it('should return a success message even if the email does not exist', async () => {
      const email = 'nonexistent@example.com';
    
      const emailService = require('../../src/services/emailsService');
      const sendEmailMock = jest.spyOn(emailService, 'sendEmail').mockResolvedValueOnce();
    
      const res = await request(app).post('/api/auth/request-password-reset').send({ email });
    
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'If the email exists, a password reset link has been sent.');
    
      const resetTokenRecord = await db('password_reset_tokens')
        .where({ reset_token: email }) // Ensure no entry for the given email
        .first();
      expect(resetTokenRecord).toBeUndefined();
    
      expect(sendEmailMock).not.toHaveBeenCalled();
    
      sendEmailMock.mockRestore();
    });
    
    it('should return 400 for invalid email format', async () => {
      const email = 'invalidemailformat';
    
      const res = await request(app).post('/api/auth/request-password-reset').send({ email });
    
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid email format.');
    }); 
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset the password with a valid token', async () => {
      const token = 'valid-token';
      const userPrepare = await db('users').where({ email: userEmail }).first();
      
      const userId = userPrepare.id;
    
      await db('password_reset_tokens').insert({
        user_id: userId,
        reset_token: token,
        expires_at: new Date(Date.now() + 3600000), // Valid for 1 hour
        created_at: new Date(),
      });
    
      const res = await request(app).post('/api/auth/reset-password').send({
        token,
        password: 'NewPassword123!',
      });
    
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Password reset successfully. You can now log in.');
    
      const user = await db('users').where({ id: userId }).first();
      expect(user).not.toBeUndefined();
    
      const bcrypt = require('bcrypt');
      const isPasswordUpdated = await bcrypt.compare('NewPassword123!', user.password_hash);
      expect(isPasswordUpdated).toBe(true);
    
      const resetTokenRecord = await db('password_reset_tokens').where({ reset_token: token }).first();
      expect(resetTokenRecord).toBeUndefined(); // Token should be deleted after use
    });
    
    it('should return 400 if the reset token has expired', async () => {
      const expiredToken = 'expired-token';
      const userPrepare = await db('users').where({ email: userEmail }).first();
      
      await db('password_reset_tokens').insert({
        user_id: userPrepare.id,
        reset_token: expiredToken,
        expires_at: new Date(Date.now() - 3600000), // Expired 1 hour ago
        created_at: new Date(),
      });
    
      const res = await request(app).post('/api/auth/reset-password').send({
        token: expiredToken,
        password: 'NewPassword123!',
      });
    
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Token has expired.');
    
      const tokenRecord = await db('password_reset_tokens').where({ reset_token: expiredToken }).first();
      expect(tokenRecord).not.toBeUndefined();
    });
    
    it('should return 400 if the token is invalid', async () => {
      const res = await request(app).post('/api/auth/reset-password').send({
        token: 'invalid-token',
        password: 'NewPassword123!',
      });
    
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid token.');
    
      const user = await db('users').where({ email: userEmail }).first();
      expect(user).not.toBeUndefined();
      const isPasswordUnchanged = await bcrypt.compare(userPassword, user.password_hash);
      expect(isPasswordUnchanged).toBe(true);
    });

    it('should return 400 if the new password does not meet complexity requirements', async () => {
      const token = 'complexity-check-token';
      const userPrepare = await db('users').where({ email: userEmail }).first();
      
      await db('password_reset_tokens').insert({
        user_id: userPrepare.id,
        reset_token: token,
        expires_at: new Date(Date.now() + 3600000), // Valid for 1 hour
        created_at: new Date(),
      });
    
      const res = await request(app).post('/api/auth/reset-password').send({
        token,
        password: '12',
      });
    
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', expect.stringContaining('Password must be at least'));
    
      const user = await db('users').where({ email: userEmail }).first();
      const isPasswordUnchanged = await bcrypt.compare(userPassword, user.password_hash);
      expect(isPasswordUnchanged).toBe(true);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return the current user data when authenticated', async () => {
      const loginPayload = { email: userEmail, password: userPassword };
      const loginResponse = await request(app).post('/api/auth/login').send(loginPayload);
      const token = loginResponse.body.accessToken;
    
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    
      expect(res.status).toBe(200);
    
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email', userEmail);
      expect(res.body).toHaveProperty('nickname');
      expect(res.body).toHaveProperty('created_at');
      expect(res.body).toHaveProperty('updated_at');
    
      const user = await db('users').where({ email: userEmail }).first();
      expect(user).not.toBeUndefined(); // Ensure user exists in DB
      expect(res.body.id).toBe(user.id);
      expect(res.body.nickname).toBe(user.nickname);
      expect(new Date(res.body.created_at)).toEqual(new Date(user.created_at));
      expect(new Date(res.body.updated_at)).toEqual(new Date(user.updated_at));
    
      expect(res.body).not.toHaveProperty('password_hash');
      expect(res.body).not.toHaveProperty('google_oauth');
    });
    

    it('should return 401 if the token is invalid or missing', async () => {
      let res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Access token is required');
    
      res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Invalid or expired token');
    });

    it('should return 401 if the token has expired', async () => {
      const expiredToken = 'expired-token'; 
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expiredToken}`);
    
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Invalid or expired token');
    });

    it('should return 404 if the user associated with the token no longer exists', async () => {
      // Simulate a scenario where the user is deleted after login
      const loginPayload = { email: userEmail, password: userPassword };
      const loginResponse = await request(app).post('/api/auth/login').send(loginPayload);
      const token = loginResponse.body.accessToken;
    
      await db('users').where({ email: userEmail }).del();
    
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'User not found');
    });
            
  });
});
