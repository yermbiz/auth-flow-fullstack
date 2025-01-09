const request = require('supertest');
const app = require('../../../server');
const policiesRepo = require('../../../src/repositories/policies');

jest.mock('../../../src/repositories/policies');

describe('Smoke Test: Get latest policies (/api/policies/latest)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/policies/latest', () => {
    it('should return the latest policies successfully', async () => {
      const mockPolicies = [
        { type: 'terms', version: 2, updated_at: '2023-01-01T00:00:00.000Z' },
        { type: 'privacy', version: 3, updated_at: '2023-01-01T00:00:00.000Z' },
      ];

      policiesRepo.getLatestPolicies.mockResolvedValueOnce(mockPolicies);

      const res = await request(app).get('/api/policies/latest').send();

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        {
          type: 'terms',
          version: 2,
          updated_at: '2023-01-01T00:00:00.000Z',
          content_url: '/policies/terms-2',
        },
        {
          type: 'privacy',
          version: 3,
          updated_at: '2023-01-01T00:00:00.000Z',
          content_url: '/policies/privacy-3',
        },
      ]);
      expect(policiesRepo.getLatestPolicies).toHaveBeenCalledTimes(1);
    });

    it('should return 500 if fetching policies fails', async () => {
      policiesRepo.getLatestPolicies.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app).get('/api/policies/latest').send();

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to fetch policy versions' });
      expect(policiesRepo.getLatestPolicies).toHaveBeenCalledTimes(1);
    });
  });
});
