const request = require('supertest');
const app = require('../../../server');
const policiesRepo = require('../../../src/repositories/policies');

jest.mock('../../../src/repositories/policies');

describe('Smoke Test: Get policy by type and version (/api/:type/:version)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/policies/:type/:version', () => {
    it('should return the requested policy successfully', async () => {
      const mockPolicy = {
        type: 'terms',
        version: 2,
        content: 'Terms and conditions content here',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      policiesRepo.getByTypeAndVersion.mockResolvedValueOnce(mockPolicy);

      const res = await request(app).get('/api/policies/terms/2').send();

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockPolicy);
      expect(policiesRepo.getByTypeAndVersion).toHaveBeenCalledWith('terms', '2');
    });

    it('should return 404 if the requested policy is not found', async () => {
      policiesRepo.getByTypeAndVersion.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/policies/privacy/99').send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Policy not found' });
      expect(policiesRepo.getByTypeAndVersion).toHaveBeenCalledWith('privacy', '99');
    });

    it('should return 500 if fetching the policy fails', async () => {
      policiesRepo.getByTypeAndVersion.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app).get('/api/policies/terms/1').send();

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Failed to fetch policy content' });
      expect(policiesRepo.getByTypeAndVersion).toHaveBeenCalledWith('terms', '1');
    });
  });
});
