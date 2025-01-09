
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../../server');
const passwordResetTokensRepo = require('../../../src/repositories/password_reset_tokens');
const usersRepo = require('../../../src/repositories/users');

jest.mock('bcrypt');
jest.mock('../../../src/repositories/password_reset_tokens');
jest.mock('../../../src/repositories/users');

// Mock password validation utility
jest.mock('../../../src/utils/passwordValidation', () =>
  jest.fn().mockImplementation((password) => password.length >= 8) // Simplified validation for tests
);

const validatePasswordComplexity = require('../../../src/utils/passwordValidation');

describe('Smoke Test: Reset Password', () => {


  describe('POST /api/auth/reset-password', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    it('should return 400 if token or password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Token and new password are required.' });
      expect(passwordResetTokensRepo.getByToken).not.toHaveBeenCalled();
      expect(usersRepo.getById).not.toHaveBeenCalled();
    });

    it('should return 400 if password complexity is invalid', async () => {
      validatePasswordComplexity.mockReturnValueOnce(false);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token', password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Password must be at least/);
      expect(passwordResetTokensRepo.getByToken).not.toHaveBeenCalled();
      expect(usersRepo.getById).not.toHaveBeenCalled();
    });

    it('should return 400 for an invalid token', async () => {
      passwordResetTokensRepo.getByToken.mockResolvedValueOnce(null);
      validatePasswordComplexity.mockReturnValueOnce(true);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalid-token', password: 'ValidPassword123!' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Invalid token.' });
      expect(passwordResetTokensRepo.getByToken).toHaveBeenCalledWith('invalid-token');
      expect(usersRepo.getById).not.toHaveBeenCalled();
    });

    it('should return 400 if the token has expired', async () => {
      const mockTokenRecord = {
        reset_token: 'expired-token',
        expires_at: new Date(Date.now() - 3600000), // 1 hour in the past
      };
      validatePasswordComplexity.mockReturnValueOnce(true);

      passwordResetTokensRepo.getByToken.mockResolvedValueOnce(mockTokenRecord);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'expired-token', password: 'ValidPassword123!' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Token has expired.' });
      expect(passwordResetTokensRepo.getByToken).toHaveBeenCalledWith('expired-token');
      expect(usersRepo.getById).not.toHaveBeenCalled();
    });

    it('should return 400 if the user does not exist', async () => {
      const mockTokenRecord = {
        reset_token: 'valid-token',
        user_id: 1,
        expires_at: new Date(Date.now() + 3600000), // 1 hour in the future
      };
      validatePasswordComplexity.mockReturnValueOnce(true);

      passwordResetTokensRepo.getByToken.mockResolvedValueOnce(mockTokenRecord);
      usersRepo.getById.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token', password: 'ValidPassword123!' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'User associated with this token does not exist.' });
      expect(usersRepo.getById).toHaveBeenCalledWith(mockTokenRecord.user_id);
    });

    it('should return 400 if the user email is not confirmed', async () => {
      const mockTokenRecord = {
        reset_token: 'valid-token',
        user_id: 1,
        expires_at: new Date(Date.now() + 3600000), // 1 hour in the future
      };
      validatePasswordComplexity.mockReturnValueOnce(true);

      const mockUser = { id: 1, email_confirmed: false };

      passwordResetTokensRepo.getByToken.mockResolvedValueOnce(mockTokenRecord);
      usersRepo.getById.mockResolvedValueOnce(mockUser);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token', password: 'ValidPassword123!' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Email not confirmed. Please confirm your email first.' });
      expect(usersRepo.getById).toHaveBeenCalledWith(mockTokenRecord.user_id);
    });

    it('should return 400 if the user is a Google account', async () => {
      const mockTokenRecord = {
        reset_token: 'valid-token',
        user_id: 1,
        expires_at: new Date(Date.now() + 3600000), // 1 hour in the future
      };
      validatePasswordComplexity.mockReturnValueOnce(true);

      const mockUser = { id: 1, email_confirmed: true, google_oauth: true };

      passwordResetTokensRepo.getByToken.mockResolvedValueOnce(mockTokenRecord);
      usersRepo.getById.mockResolvedValueOnce(mockUser);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token', password: 'ValidPassword123!' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Password reset is not available for Google accounts.' });
      expect(usersRepo.getById).toHaveBeenCalledWith(mockTokenRecord.user_id);
    });

    it('should successfully reset the password', async () => {
      const mockTokenRecord = {
        reset_token: 'valid-token',
        user_id: 1,
        expires_at: new Date(Date.now() + 3600000), // 1 hour in the future
      };
      validatePasswordComplexity.mockReturnValueOnce(true);

      const mockUser = { id: 1, email_confirmed: true, google_oauth: false }; 

      passwordResetTokensRepo.getByToken.mockResolvedValueOnce(mockTokenRecord);
      usersRepo.getById.mockResolvedValueOnce(mockUser);
      bcrypt.hash.mockResolvedValueOnce('hashed-password');
      usersRepo.updateById.mockResolvedValueOnce();
      passwordResetTokensRepo.deleteByToken.mockResolvedValueOnce();

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token', password: 'ValidPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Password reset successfully. You can now log in.' });
      expect(usersRepo.updateById).toHaveBeenCalledWith(mockUser.id, { password_hash: 'hashed-password' });
      expect(passwordResetTokensRepo.deleteByToken).toHaveBeenCalledWith('valid-token');
    });

    it('should return 500 if there is a server error', async () => {
      passwordResetTokensRepo.getByToken.mockRejectedValueOnce(new Error('Database error'));
      validatePasswordComplexity.mockReturnValueOnce(true);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token', password: 'ValidPassword123!' });
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'Failed to reset password. Please try again later.' });
      expect(passwordResetTokensRepo.getByToken).toHaveBeenCalledWith('valid-token');
    });
  });
});
