const request = require('supertest');
const app = require('../../../server');
const usersRepo = require('../../../src/repositories/users');

// Mock the users repository
jest.mock('../../../src/repositories/users', () => ({
  getByNickname: jest.fn(),
}));

describe('Smoke Test: checkNickname', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/check-nickname', () => {
    it('should return exists: true if the nickname exists', async () => {
      usersRepo.getByNickname.mockResolvedValue({ id: 1, nickname: 'ExistingUser' });

      const res = await request(app)
        .post('/api/auth/check-nickname')
        .send({ nickname: 'ExistingUser' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ exists: true });
      expect(usersRepo.getByNickname).toHaveBeenCalledWith('ExistingUser');
    });

    it('should return exists: false if the nickname does not exist', async () => {
      usersRepo.getByNickname.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/check-nickname')
        .send({ nickname: 'NonexistentUser' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ exists: false });
      expect(usersRepo.getByNickname).toHaveBeenCalledWith('NonexistentUser');
    });

    it('should return 400 if the nickname is missing', async () => {
      const res = await request(app)
        .post('/api/auth/check-nickname')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Nickname is required.' });
      expect(usersRepo.getByNickname).not.toHaveBeenCalled();
    });

    it('should return 400 if the nickname is an empty string', async () => {
      const res = await request(app)
        .post('/api/auth/check-nickname')
        .send({ nickname: '' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Nickname is required.' });
      expect(usersRepo.getByNickname).not.toHaveBeenCalled();
    });

    it('should return 500 if there is a server error', async () => {
      usersRepo.getByNickname.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .post('/api/auth/check-nickname')
        .send({ nickname: 'ServerErrorUser' });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Server error occurred while checking nickname.' });
      expect(usersRepo.getByNickname).toHaveBeenCalledWith('ServerErrorUser');
    });
  });
});
