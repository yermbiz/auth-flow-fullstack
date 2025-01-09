jest.mock('../../../db/knex', () => {
  const mockKnex = {
    transaction: jest.fn(),
    destroy: jest.fn(),
    // further methods if needed
  };
  return jest.fn(() => mockKnex); // Mock the function that returns the Knex instance
});

const getDb = require('../../../db/knex');
const knex = getDb();

const request = require('supertest');
const app = require('../../../server');
const usersRepo = require('../../../src/repositories/users');
const policiesRepo = require('../../../src/repositories/policies'); 

jest.mock('../../../src/repositories/users');
jest.mock('../../../src/repositories/policies');

describe('Smoke Test: API: Register', () => {
  let mockTransaction;
  
    beforeEach(() => {
      mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      knex.transaction.mockResolvedValue(mockTransaction);
    });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('POST /api/auth/register', () => {
    afterEach(() => {
      jest.clearAllMocks();
      jest.resetModules();
      jest.clearAllTimers();
      process.removeAllListeners();
    });
  
    it('should register a new user successfully', async () => {
      usersRepo.getByEmail.mockResolvedValue(null);
      usersRepo.getByNickname.mockResolvedValue(null);
      usersRepo.create.mockResolvedValue([{ id: 1 }]);
      policiesRepo.getLatestPolicies.mockResolvedValue([ {type: 'terms', version: 1}, {type: 'privacy', version: 1} ])
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          nickname: 'NewUser',
          password: 'ValidPassword1!',
          termsAccepted: true,
          privacyAccepted: true,
          agreedPolicyVersions: { terms: { version: 1 }, privacy: { version: 1 } },
        });
  
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Registration successful. Please check your email to confirm your account.');
      expect(usersRepo.getByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(usersRepo.create).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });
  
    it('should return an error if the email is already registered', async () => {
      usersRepo.getByEmail.mockResolvedValue({ id: 1, email_confirmed: true });
      policiesRepo.getLatestPolicies.mockResolvedValue([ {type: 'terms', version: 1}, {type: 'privacy', version: 1} ])
    
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existinguser@example.com',
          nickname: 'ExistingUser',
          password: 'ValidPassword1!',
          termsAccepted: true,
          privacyAccepted: true,
          agreedPolicyVersions: { terms: { version: 1 }, privacy: { version: 1 } },
        });
   
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User already exists.');
      expect(usersRepo.getByEmail).toHaveBeenCalledWith('existinguser@example.com');
      expect(usersRepo.create).not.toHaveBeenCalled();
    });
  
    it('should return a validation error for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          nickname: '',
          password: '',
          termsAccepted: true,
          privacyAccepted: true,
          agreedPolicyVersions: { terms: { version: 1 }, privacy: { version: 1 } },
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Nickname is required.');
      expect(usersRepo.getByEmail).not.toHaveBeenCalled();
      expect(usersRepo.create).not.toHaveBeenCalled();
    });
  });

  
});
