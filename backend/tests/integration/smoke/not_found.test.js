const request = require('supertest');
const app = require('../../../server');

describe('Smoke Test: 404 Handling', () => {
  test('GET /nonexistent returns 404', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.statusCode).toBe(404);
  });
});
