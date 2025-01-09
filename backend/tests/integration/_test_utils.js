const getDb = require('../../db/knex');

const cleanDatabase = async (tableSeeds) => {
  for (const tableName of Object.keys(tableSeeds)) {
    await db(tableName).del();
  }
};

module.exports = {
  testDbBeforeAll: async (tableSeeds) => {
    await cleanDatabase();
    for (const [tableName, seedFn] of Object.entries(tableSeeds)) {
      if (seedFn) {
        await seedFn();
      }
    }
  },

  testDbAfterAll: async (tableSeeds) => {
    await cleanDatabase(tableSeeds);
    await db.destroy();
  },
};
