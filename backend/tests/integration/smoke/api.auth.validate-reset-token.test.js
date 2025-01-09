const request = require('supertest');
const app = require('../../../server');

const passwordResetTokensRepo = require('../../../src/repositories/password_reset_tokens');

jest.mock('../../../src/repositories/password_reset_tokens');

describe('Smoke Test: Validate Reset Token', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/validate-reset-token', () => {
    it('should return 400 if token is not provided', async () => {
      const res = await request(app)
        .post('/api/auth/validate-reset-token')
        .send({}); // No token provided

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Token is required.' });
      expect(passwordResetTokensRepo.getByToken).not.toHaveBeenCalled();
    });

    it('should return 400 for an invalid token', async () => {
      passwordResetTokensRepo.getByToken.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/auth/validate-reset-token')
        .send({ token: 'invalid-token' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Invalid token.' });
      expect(passwordResetTokensRepo.getByToken).toHaveBeenCalledWith('invalid-token');
    });

    it('should return 400 if the token has expired', async () => {
      const mockTokenRecord = {
        reset_token: 'expired-token',
        expires_at: new Date(Date.now() - 3600000), // 1 hour in the past
      };
      passwordResetTokensRepo.getByToken.mockResolvedValueOnce(mockTokenRecord);

      const res = await request(app)
        .post('/api/auth/validate-reset-token')
        .send({ token: 'expired-token' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Token has expired.' });
      expect(passwordResetTokensRepo.getByToken).toHaveBeenCalledWith('expired-token');
    });

    it('should return 200 if the token is valid', async () => {
      const mockTokenRecord = {
        reset_token: 'valid-token',
        expires_at: new Date(Date.now() + 3600000), // 1 hour in the future
      };
      passwordResetTokensRepo.getByToken.mockResolvedValueOnce(mockTokenRecord);

      const res = await request(app)
        .post('/api/auth/validate-reset-token')
        .send({ token: 'valid-token' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Token is valid.' });
      expect(passwordResetTokensRepo.getByToken).toHaveBeenCalledWith('valid-token');
    });

    it('should return 500 if there is a server error', async () => {
      passwordResetTokensRepo.getByToken.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/auth/validate-reset-token')
        .send({ token: 'error-token' });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'Failed to validate reset token.' });
      expect(passwordResetTokensRepo.getByToken).toHaveBeenCalledWith('error-token');
    });
  });
});
