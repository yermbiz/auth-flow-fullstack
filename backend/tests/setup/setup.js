const getDb = require('../../db/knex');
const db = getDb();

const cleanDatabase = async () => {
  await db('users').del(); 
  await db('policies').del();
  await db('password_reset_tokens').del();
  await db('refresh_tokens').del();
};

module.exports = async () => {
  console.log('Running global setup...');
  try {
    await db.migrate.latest(); // Apply migrations
    await cleanDatabase(); // Clean the database
    // await db.seed.run(); // Load seeds if necessary
  } catch (e) {
    console.error('Error during global setup:', e);
    process.exit(1); // Ensure the process stops on failure
  }
};
