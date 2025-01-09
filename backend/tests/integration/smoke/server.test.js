
const request = require('supertest');
const app = require('../../../server');

describe('Smoke Test: Server', () => {
  test('GET / responds with server status', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'Server is running' });  // Убедитесь, что текст совпадает с вашим эндпоинтом
  });
});
