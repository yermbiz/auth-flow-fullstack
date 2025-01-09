const getDb = require('../../db/knex');
const db = getDb();

const cleanDatabase = async () => {
  await db('users').del(); 
  await db('policies').del();
  await db('password_reset_tokens').del();
  await db('refresh_tokens').del();
};

module.exports = async () => {
  console.log('Running global teardown...');
  try {
    await cleanDatabase(); // Clean the database
    await db.destroy(); // Close database connection
  } catch (e) {
    console.error('Error during global teardown:', e);
    process.exit(1); // Ensure the process stops on failure
  }
};
