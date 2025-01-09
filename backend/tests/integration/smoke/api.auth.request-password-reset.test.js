const request = require('supertest');
const app = require('../../../server');

const usersRepo = require('../../../src/repositories/users');
const passwordResetTokensRepo = require('../../../src/repositories/password_reset_tokens');
const emailService = require('../../../src/services/emailsService');
const generateConfirmationToken = require('../../../src/utils/generateConfirmationToken');

jest.mock('../../../src/repositories/users');
jest.mock('../../../src/repositories/password_reset_tokens');
jest.mock('../../../src/services/emailsService');
jest.mock('../../../src/utils/generateConfirmationToken');

describe('Smoke Test: Request Password Reset', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/request-password-reset', () => {
    it('should return 400 if email is not provided', async () => {
      const res = await request(app)
        .post('/api/auth/request-password-reset')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Email is required.' });
      expect(usersRepo.getByEmail).not.toHaveBeenCalled();
    });

    it('should return 200 for non-existent or Google OAuth accounts', async () => {
      usersRepo.getByEmail.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'If the email exists, a password reset link has been sent.' });
      expect(usersRepo.getByEmail).toHaveBeenCalledWith('nonexistent@example.com');
    });

    it('should resend confirmation email if the account is unconfirmed', async () => {
      const mockUser = { id: 1, email: 'unconfirmed@example.com', email_confirmed: false };
      const mockToken = { token: 'confirmation-token', tokenExpiration: new Date(Date.now() + 3600000) }; // 1 hour expiration
      usersRepo.getByEmail.mockResolvedValueOnce(mockUser);
      generateConfirmationToken.mockReturnValueOnce(mockToken);
      usersRepo.updateById.mockResolvedValueOnce();
      emailService.sendConfirmationEmail.mockResolvedValueOnce();

      const res = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: mockUser.email });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Your account is not confirmed. A new confirmation email has been sent.' });
      expect(usersRepo.getByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(usersRepo.updateById).toHaveBeenCalledWith(mockUser.id, {
        email_confirmation_token: mockToken.token,
        email_confirmation_token_expires: mockToken.tokenExpiration,
      });
      expect(emailService.sendConfirmationEmail).toHaveBeenCalledWith(mockUser.email, mockToken.token);
    });

    it('should send a password reset email for valid users', async () => {
      const mockUser = { id: 2, email: 'valid@example.com', email_confirmed: true, google_oauth: false };
      const mockToken = { token: 'reset-token', tokenExpiration: new Date(Date.now() + 3600000) }; // 1 hour expiration
      const mockResetLink = `${process.env.BASE_URL}/reset-password?token=${mockToken.token}`;

      usersRepo.getByEmail.mockResolvedValueOnce(mockUser);
      generateConfirmationToken.mockReturnValueOnce(mockToken);
      passwordResetTokensRepo.saveResetToken.mockResolvedValueOnce();
      emailService.sendEmail.mockResolvedValueOnce();

      const res = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: mockUser.email });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'If the email exists, a password reset link has been sent.' });
      expect(usersRepo.getByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(passwordResetTokensRepo.saveResetToken).toHaveBeenCalledWith({
        user_id: mockUser.id,
        reset_token: mockToken.token,
        expires_at: mockToken.tokenExpiration,
        created_at: expect.any(Date),
      });
      expect(emailService.sendEmail).toHaveBeenCalledWith({
        to: mockUser.email,
        subject: 'Password Reset Request',
        html: expect.stringContaining(mockResetLink),
      });
    });

    it('should return 500 if there is a server error', async () => {
      usersRepo.getByEmail.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: 'error@example.com' });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'Failed to process the password reset request.' });
      expect(usersRepo.getByEmail).toHaveBeenCalledWith('error@example.com');
    });
  });
});
