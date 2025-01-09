const request = require('supertest');
const app = require('../../../server'); // Adjust path to your server
const bcrypt = require('bcrypt');
const usersRepo = require('../../../src/repositories/users');
const authService = require('../../../src/services/authService');
const refreshTokensRepo = require('../../../src/repositories/refresh_tokens');

jest.mock('../../../src/repositories/users');
jest.mock('../../../src/repositories/refresh_tokens');
jest.mock('../../../src/services/authService');
jest.mock('bcrypt');

describe('Smoke Test: userPasswordLogin', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    const mockUser = {
      id: 1,
      email: 'testuser@example.com',
      nickname: 'TestUser',
      password_hash: 'hashedpassword',
      email_confirmed: true,
      deleted_at: null,
    };

    it('should log in successfully with valid credentials', async () => {
      usersRepo.getByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      authService.generateAccessToken.mockReturnValue('access-token');
      authService.generateRefreshToken.mockReturnValue('refresh-token');
      refreshTokensRepo.saveRefreshToken.mockResolvedValue();

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: mockUser.email, password: 'ValidPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(usersRepo.getByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(bcrypt.compare).toHaveBeenCalledWith('ValidPassword123!', mockUser.password_hash);
      expect(authService.generateAccessToken).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        nickname: mockUser.nickname,
      });
      expect(authService.generateRefreshToken).toHaveBeenCalledWith({ id: mockUser.id });
      expect(refreshTokensRepo.saveRefreshToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        token: 'refresh-token',
      });
    });

    it('should return 400 if the user is not registered', async () => {
      usersRepo.getByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unregistered@example.com', password: 'SomePassword123!' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Invalid email or password' });
      expect(usersRepo.getByEmail).toHaveBeenCalledWith('unregistered@example.com');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return 403 if the account is deleted', async () => {
      const deletedUser = { ...mockUser, deleted_at: new Date() };
      usersRepo.getByEmail.mockResolvedValue(deletedUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: deletedUser.email, password: 'SomePassword123!' });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        error: 'This account has been deleted. Please contact support or create a new account.',
      });
      expect(usersRepo.getByEmail).toHaveBeenCalledWith(deletedUser.email);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return 400 if the password is invalid', async () => {
      usersRepo.getByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: mockUser.email, password: 'InvalidPassword!' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Invalid credentials' });
      expect(usersRepo.getByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(bcrypt.compare).toHaveBeenCalledWith('InvalidPassword!', mockUser.password_hash);
    });

    
    it('should return 500 if there is a server error', async () => {
      usersRepo.getByEmail.mockImplementation(() => {
        return Promise.reject(new Error('Database error'));
      });
        
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: mockUser.email, password: 'SomePassword123!' });
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Server error occurred. Please try again later.' });
      expect(usersRepo.getByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });
});
