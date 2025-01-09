const request = require('supertest');
const app = require('../../server');

test('GET /api/ping responds with Pong', async () => {
  const res = await request(app).get('/api/ping');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ message: 'Pong' });
});
