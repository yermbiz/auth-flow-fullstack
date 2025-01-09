const request = require('supertest');
const app = require('../../server'); 
const getDb = require('../../db/knex');
const db = getDb();

const seedPolicies = async () => {
  await db('policies').insert([
    {
      id: 1,
      type: 'terms',
      version: 1,
      content: 'Terms content v1',
      effective_date: new Date('2025-01-01T23:00:00.000Z'), // Use Date to ensure correct timestamp handling
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 2,
      type: 'privacy',
      version: 1,
      content: 'Privacy content v1',
      effective_date: new Date('2025-01-01T23:00:00.000Z'),
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
};

const cleanDatabase = async () => {
  await db('policies').del();
};

describe('Integration Test: /api/policies', () => {
  beforeAll(async () => {
    await cleanDatabase();
    await seedPolicies();
  });

  afterAll(async () => {
    await cleanDatabase();
    await db.destroy();
  });

  describe('GET /api/policies/latest', () => {
    it('should return the latest policies', async () => {
      const res = await request(app).get('/api/policies/latest');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        {
          type: 'privacy',
          version: '1',
          content: 'Privacy content v1',
          content_url: '/policies/privacy-1',
          effective_date: '2025-01-01T23:00:00.000Z',
        },{
          type: 'terms',
          version: '1',
          content: 'Terms content v1',
          content_url: '/policies/terms-1',
          effective_date: '2025-01-01T23:00:00.000Z',
        },
        
      ]);
    });
  });

  describe('GET /api/policies/:type/:version', () => {
    it('should return the specified policy', async () => {
      const res = await request(app).get('/api/policies/terms/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: 1,
        type: 'terms',
        version: '1',
        content: 'Terms content v1',
        effective_date: '2025-01-01T23:00:00.000Z',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it('should return 404 if the policy is not found', async () => {
      const res = await request(app).get('/api/policies/unknown/999');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Policy not found' });
    });  
  });
});
