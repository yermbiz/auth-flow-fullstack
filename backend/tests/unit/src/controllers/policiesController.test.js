const request = require('supertest');
const app = require('../../../../server');
const policiesRepo = require('../../../../src/repositories/policies');

jest.mock('../../../../src/repositories/policies', () => ({
  getLatestPolicies: jest.fn(),
  getByTypeAndVersion: jest.fn(),
}));

describe('Policies Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('getLatestPolicies', () => {
    it('should return the latest policies with content URLs', async () => {
      const mockPolicies = [
        { type: 'terms', version: 1 },
        { type: 'privacy', version: 1 },
      ];

      policiesRepo.getLatestPolicies.mockResolvedValue(mockPolicies);

      const res = await request(app).get('/api/policies/latest');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        { type: 'terms', version: 1, content_url: '/policies/terms-1' },
        { type: 'privacy', version: 1, content_url: '/policies/privacy-1' },
      ]);
      expect(policiesRepo.getLatestPolicies).toHaveBeenCalledTimes(1);
    });

    it('should return a 500 error if fetching policies fails', async () => {
      policiesRepo.getLatestPolicies.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/api/policies/latest');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch policy versions');
      expect(policiesRepo.getLatestPolicies).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPolicyByTypeAndVersion', () => {
    it('should return the policy for a given type and version', async () => {
      const mockPolicy = { type: 'terms', version: 1, content: 'Terms content' };

      policiesRepo.getByTypeAndVersion.mockResolvedValue(mockPolicy);

      const res = await request(app).get('/api/policies/terms/1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockPolicy);
      expect(policiesRepo.getByTypeAndVersion).toHaveBeenCalledWith('terms', '1');
    });

    it('should return a 404 error if the policy is not found', async () => {
      policiesRepo.getByTypeAndVersion.mockResolvedValue(null);

      const res = await request(app).get('/api/policies/terms/99');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Policy not found');
      expect(policiesRepo.getByTypeAndVersion).toHaveBeenCalledWith('terms', '99');
    });

    it('should return a 500 error if fetching policy fails', async () => {
      policiesRepo.getByTypeAndVersion.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/api/policies/terms/1');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch policy content');
      expect(policiesRepo.getByTypeAndVersion).toHaveBeenCalledWith('terms', '1');
    });
  });
});
