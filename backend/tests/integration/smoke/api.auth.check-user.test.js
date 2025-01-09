const request = require('supertest');
const app = require('../../../server'); // Adjust path to your server
const usersRepo = require('../../../src/repositories/users');

jest.mock('../../../src/repositories/users', () => ({
  getByEmail: jest.fn(),
}));

describe('Smoke Test: checkUser', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/check-user', () => {
    it('should return exists: true with user details if the user exists', async () => {
      const mockUser = {
        id: 1,
        email: 'existinguser@example.com',
        nickname: 'ExistingUser',
        email_confirmed: true,
      };
      usersRepo.getByEmail.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/check-user')
        .send({ email: 'existinguser@example.com' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        exists: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          nickname: mockUser.nickname,
          email_confirmed: mockUser.email_confirmed,
        },
      });
      expect(usersRepo.getByEmail).toHaveBeenCalledWith('existinguser@example.com');
    });

    it('should return exists: false if the user does not exist', async () => {
      usersRepo.getByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/check-user')
        .send({ email: 'nonexistentuser@example.com' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ exists: false });
      expect(usersRepo.getByEmail).toHaveBeenCalledWith('nonexistentuser@example.com');
    });

    it('should return 500 if there is a server error', async () => {
      usersRepo.getByEmail.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .post('/api/auth/check-user')
        .send({ email: 'error@example.com' });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Error checking user existence' });
      expect(usersRepo.getByEmail).toHaveBeenCalledWith('error@example.com');
    });

    it('should return 400 if email is missing in the request', async () => {
      const res = await request(app)
        .post('/api/auth/check-user')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Email is required.' });
      expect(usersRepo.getByEmail).not.toHaveBeenCalled();
    });
  });
});
