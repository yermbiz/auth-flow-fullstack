const request = require('supertest');
const app = require('../../../server');
const client = require('../../../src/utils/googleClient');

const usersRepo = require('../../../src/repositories/users');
const authService = require('../../../src/services/authService');
const refreshTokensRepo = require('../../../src/repositories/refresh_tokens');

jest.mock('../../../src/repositories/users');
jest.mock('../../../src/repositories/refresh_tokens');
jest.mock('../../../src/services/authService');
jest.mock('../../../src/utils/googleClient', () => ({
  verifyIdToken: jest.fn(),
}));

describe('Smoke Test: Google login', () => {
  let verifyIdTokenMock;
  let mockPayload;

  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
  });

  beforeEach(() => {
    verifyIdTokenMock = client.verifyIdToken;
    mockPayload = { email: 'user@example.com', name: 'Test User' };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.clearAllTimers();
    process.removeAllListeners();
  });

  describe('POST /api/auth/google-login', () => {
    it('should log in an existing user successfully and return tokens', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: jest.fn().mockReturnValue(mockPayload),
      });

      usersRepo.getByEmail.mockResolvedValueOnce({
        id: 1,
        email: mockPayload.email,
        nickname: 'ExistingUser',
      });
      authService.generateAccessToken.mockReturnValue('access-token');
      authService.generateRefreshToken.mockReturnValue('refresh-token');
      refreshTokensRepo.saveRefreshToken.mockResolvedValue();

      const res = await request(app)
        .post('/api/auth/google-login')
        .send({ googleToken: 'valid-google-token' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        userId: 1,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(verifyIdTokenMock).toHaveBeenCalledWith({
        idToken: 'valid-google-token',
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      expect(usersRepo.getByEmail).toHaveBeenCalledWith(mockPayload.email);
    });

    it('should return email and name for a new Google user', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: jest.fn().mockReturnValue(mockPayload),
      });

      usersRepo.getByEmail.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/auth/google-login')
        .send({ googleToken: 'valid-google-token' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        email: mockPayload.email,
        name: mockPayload.name,
      });
      expect(verifyIdTokenMock).toHaveBeenCalledWith({
        idToken: 'valid-google-token',
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      expect(usersRepo.getByEmail).toHaveBeenCalledWith(mockPayload.email);
    });

    it('should return 400 if googleToken is missing', async () => {
      const res = await request(app)
        .post('/api/auth/google-login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Google token is required');
      expect(verifyIdTokenMock).not.toHaveBeenCalled();
    });

    it('should return 500 for an invalid Google token', async () => {
      verifyIdTokenMock.mockRejectedValueOnce(new Error('Invalid token'));

      const res = await request(app)
        .post('/api/auth/google-login')
        .send({ googleToken: 'invalid-google-token' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Auth error');
      expect(verifyIdTokenMock).toHaveBeenCalledWith({
        idToken: 'invalid-google-token',
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      expect(usersRepo.getByEmail).not.toHaveBeenCalled();
    });

    it('should return 500 if saving refresh token fails', async () => {
      verifyIdTokenMock.mockResolvedValueOnce({
        getPayload: jest.fn().mockReturnValue(mockPayload),
      });

      usersRepo.getByEmail.mockResolvedValueOnce({
        id: 1,
        email: mockPayload.email,
        nickname: 'ExistingUser',
      });
      authService.generateRefreshToken.mockReturnValue('refresh-token');
     
      refreshTokensRepo.saveRefreshToken.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/auth/google-login')
        .send({ googleToken: 'valid-google-token' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Auth error');
      expect(refreshTokensRepo.saveRefreshToken).toHaveBeenCalledWith({
        userId: 1,
        token: 'refresh-token',
      });
    });

    it('should return 500 for unexpected errors', async () => {
      verifyIdTokenMock.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const res = await request(app)
        .post('/api/auth/google-login')
        .send({ googleToken: 'valid-google-token' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Auth error');
      expect(verifyIdTokenMock).toHaveBeenCalledWith({
        idToken: 'valid-google-token',
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      expect(usersRepo.getByEmail).not.toHaveBeenCalled();
    });
  });
});
