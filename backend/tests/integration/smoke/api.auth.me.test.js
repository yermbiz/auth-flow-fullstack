const request = require('supertest');
const app = require('../../../server'); // Adjust path to your server
const usersRepo = require('../../../src/repositories/users');
const jwt = require('jsonwebtoken');

jest.mock('../../../src/repositories/users');
jest.mock('jsonwebtoken');

describe('Smoke Test: Get user details (/api/auth/me)', () => {
  let mockUser;

  beforeEach(() => {
    mockUser = {
      id: 1,
      email: 'user@example.com',
      nickname: 'TestUser',
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-02T00:00:00.000Z',
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/auth/me', () => {
    it('should return user details successfully', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 123 }); // Simulate successful verification
      });

      // Mock repository response
      usersRepo.getFieldsByUserId.mockResolvedValueOnce(mockUser);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-jwt-token') // Simulate valid authentication
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUser);
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid-jwt-token',
        process.env.JWT_SECRET,
        expect.any(Function)
      );
      expect(usersRepo.getFieldsByUserId).toHaveBeenCalledWith(123, [
        'id',
        'email',
        'nickname',
        'created_at',
        'updated_at',
      ]);
    });

    it('should return 404 if user is not found', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 123 }); // Simulate successful verification
      });

      // Mock repository response
      usersRepo.getFieldsByUserId.mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-jwt-token') // Simulate valid authentication
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'User not found' });
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid-jwt-token',
        process.env.JWT_SECRET,
        expect.any(Function)
      );
      expect(usersRepo.getFieldsByUserId).toHaveBeenCalledWith(123, [
        'id',
        'email',
        'nickname',
        'created_at',
        'updated_at',
      ]);
    });

    it('should return 500 if there is a server error', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 123 }); // Simulate successful verification
      });

      // Mock repository error
      usersRepo.getFieldsByUserId.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-jwt-token') // Simulate valid authentication
        .send();

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to fetch user data' });
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid-jwt-token',
        process.env.JWT_SECRET,
        expect.any(Function)
      );
      expect(usersRepo.getFieldsByUserId).toHaveBeenCalledWith(123, [
        'id',
        'email',
        'nickname',
        'created_at',
        'updated_at',
      ]);
    });

    it('should return 401 if the token is missing', async () => {
      const res = await request(app).get('/api/auth/me').send();

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Access token is required' });
      expect(jwt.verify).not.toHaveBeenCalled();
      expect(usersRepo.getFieldsByUserId).not.toHaveBeenCalled();
    });

    it('should return 403 if the token is invalid', async () => {
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid token'));
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-jwt-token') // Simulate invalid token
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Invalid or expired token' });
      expect(jwt.verify).toHaveBeenCalledWith(
        'invalid-jwt-token',
        process.env.JWT_SECRET,
        expect.any(Function)
      );
      expect(usersRepo.getFieldsByUserId).not.toHaveBeenCalled();
    });
  });
});
