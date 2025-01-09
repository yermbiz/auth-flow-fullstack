const getDb = require('../../../db/knex');
const db = getDb();

describe('Smoke Test: Database', () => {
  test('Database connection works', async () => {
    const result = await db.raw('SELECT 1+1 AS result');
    expect(result.rows[0].result).toBe(2); 
  });

  afterAll(async () => {
    await db.destroy(); 
  });
});
