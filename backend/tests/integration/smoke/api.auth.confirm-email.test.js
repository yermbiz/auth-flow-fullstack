const request = require('supertest');
const app = require('../../../server');
const usersRepo = require('../../../src/repositories/users');

jest.mock('../../../src/repositories/users');

describe('Smoke Test: Confirm Email', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/confirm-email', () => {
    it('should confirm email successfully', async () => {
      usersRepo.getByEmailConfirmationToken.mockResolvedValueOnce({ id: 1 });
      usersRepo.updateById.mockResolvedValueOnce();

      const res = await request(app)
        .post('/api/auth/confirm-email')
        .send({ token: 'valid-token' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Email confirmed successfully.' });
      expect(usersRepo.getByEmailConfirmationToken).toHaveBeenCalledWith('valid-token');
      expect(usersRepo.updateById).toHaveBeenCalledWith(1, {
        email_confirmed: true,
        email_confirmation_token: null,
        email_confirmation_token_expires: null,
      });
    });

    it('should return 400 if no token is provided', async () => {
      const res = await request(app)
        .post('/api/auth/confirm-email')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Token is required.' });
      expect(usersRepo.getByEmailConfirmationToken).not.toHaveBeenCalled();
      expect(usersRepo.updateById).not.toHaveBeenCalled();
    });

    it('should return 400 if token is invalid or expired', async () => {
      usersRepo.getByEmailConfirmationToken.mockResolvedValueOnce(null); // No user found

      const res = await request(app)
        .post('/api/auth/confirm-email')
        .send({ token: 'invalid-token' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Invalid or expired token.' });
      expect(usersRepo.getByEmailConfirmationToken).toHaveBeenCalledWith('invalid-token');
      expect(usersRepo.updateById).not.toHaveBeenCalled();
    });

    it('should return 500 if there is a server error', async () => {
      usersRepo.getByEmailConfirmationToken.mockRejectedValueOnce(new Error('Database error')); // Mock server error

      const res = await request(app)
        .post('/api/auth/confirm-email')
        .send({ token: 'valid-token' });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'Server error. Please try again later.' });
      expect(usersRepo.getByEmailConfirmationToken).toHaveBeenCalledWith('valid-token');
      expect(usersRepo.updateById).not.toHaveBeenCalled();
    });
  });
});
