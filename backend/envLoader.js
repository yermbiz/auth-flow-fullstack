const dotenv = require('dotenv'); 
const logger = require('./src/utils/logger');

function loadEnvironment(env = process.env.NODE_ENV || 'development') {
  const envConfig = dotenv.config({ path: `.env.${env}` }).parsed;

  if (envConfig) {
    for (const key in envConfig) {
      process.env[key] = envConfig[key];
    }
    logger.info(`Using environment: ${env} | loaded from file .env.${env}`);
  } else {
    logger.info('No .env found - using globally defined env vars')
  }  
}

module.exports = { loadEnvironment };
