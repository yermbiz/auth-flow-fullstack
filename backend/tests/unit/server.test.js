const request = require('supertest');
const app = require('../../server');

test('GET / responds with "Server is running"', async () => {
  const res = await request(app).get('/');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ message: 'Server is running' });
});
