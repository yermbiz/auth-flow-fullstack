const logger = require('../src/utils/logger');
let db;

module.exports = () => {
  if (!db) {
    const knex = require('knex');
    const knexConfig = require('../knexfile');
    const environment = process.env.NODE_ENV || 'development';
    try {
      db = knex(knexConfig[environment]);

      if (process.env.KNEX_DEBUG === 'true' || environment === 'development') {
        db.on('query', (query) => {
          logger.debug(`[Knex] Executing query: ${query.sql}`);
        });
        db.on('query-error', (error, query) => {
          logger.error(`[Knex] Query error: ${error.message}`);
          logger.error(`[Knex] Failed query: ${query.sql}`);
        });
        db.on('query-response', () => {
          logger.debug('[Knex] Query completed successfully');
        });
      }
    } catch (error) {
      logger.error('Failed to initialize Knex:', { error: error.message });
      throw error;
    }
  }

  return db;
};
