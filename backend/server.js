const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const logger = require('./src/utils/logger');
const { transports } = require('winston');
const { loadEnvironment } = require('./envLoader');
const getDb = require('./db/knex');

loadEnvironment();
logger.info(`Environment loaded: ${process.env.NODE_ENV}`);

if (process.env.NODE_ENV === 'test' || process.env.CYPRESS === 'true') {
  logger.clear();
  logger.add(new transports.Console({ silent: process.env.TEST_LOGS_SILENT }));
} else if (process.env.NODE_ENV === 'development') {
  logger.clear();
  logger.add(new transports.Console({ silent: false }));
} else {
  logger.clear();
  logger.add(new transports.Console({ silent: true }));
}


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGIN : '*',
  })
);
app.use(express.json());

// Set Content-Type globally
app.use((req, res, next) => {
  res.header('Content-Type', 'application/json');
  next();
});

// Logging incoming requests
app.use((req, res, next) => {
  logger.info(`Incoming Request: Method=${req.method}, URL=${req.url}, IP=${req.ip}`);
  next();
});

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  app.use((req, res, next) => {
    logger.debug(`Request Headers: ${JSON.stringify(req.headers)}`);
    logger.debug(`Request Body: ${JSON.stringify(req.body)}`);
    next();
  });
} else if (process.env.NODE_ENV === 'production') {
  app.use(
    morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
  app.use((req, res, next) => {
    logger.info(`Method: ${req.method}, URL: ${req.url}, IP: ${req.ip}`);
    res.on('finish', () => {
      if (res.statusCode >= 400) {
        logger.error(`Error on ${req.method} ${req.url}: Status ${res.statusCode}`);
      }
    });
    next();
  });
}

// Test-only routes for database preparation
if (process.env.NODE_ENV === 'test') {
  const db = getDb();

  // Clear database route
  app.post('/api/test/clear', async (req, res) => {
    try {
      await db.raw('TRUNCATE users, policies, password_reset_tokens, refresh_tokens RESTART IDENTITY CASCADE;');
      logger.info('Test database cleared. Tables truncated: users, policies, password_reset_tokens, refresh_tokens.');
      res.sendStatus(200);
    } catch (error) {
      logger.error('Error clearing test database:', error);
      res.status(500).json({ error: 'Failed to clear database' });
    }
  });

  // Seed database route
  app.post('/api/test/seed', async (req, res) => {
    try {
      const { users, policies } = req.body;

      if (users && users.length > 0) {
        logger.debug(`Seeding users: ${users.length} records`);
        const hashedUsers = await Promise.all(
          users.map(async ({ password, ...rest }) => ({
            ...rest,
            password_hash: await bcrypt.hash(password, 10), 
          }))
        );
        await db('users').insert(hashedUsers);
        logger.info(`Inserted ${users.length} users into the database.`);
      }

      if (policies && policies.length > 0) {
        logger.debug(`Seeding policies: ${policies.length} records`);
        await db('policies').insert(policies);
        logger.info(`Inserted ${policies.length} policies into the database.`);
      }

      logger.info('Test database seeded with provided data.');
      res.sendStatus(200);
    } catch (error) {
      logger.error('Error seeding test database:', error);
      res.status(500).json({ error: 'Failed to seed database' });
    }
  });
}

// Application Routes Logging
app.use('/api', (req, res, next) => {
  logger.info(`API Route Accessed: ${req.url}`);
  next();
});

// Application Routes
app.use('/api', require('./src/routes'));

// Health Check
app.get('/', (req, res) => {
  res.send({ message: 'Server is running' });
  logger.debug('GET / called');
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
  logger.warn(`404 - Not Found: ${req.method} ${req.url}`);
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`500 - Server Error: ${err.message}\nStack: ${err.stack}\nRequest: ${req.method} ${req.url}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Export app for testing
module.exports = app;

// Start the server (only if not in test mode or explicitly for Cypress)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
} else if (process.env.CYPRESS === 'true') {
  const server = app.listen(PORT, () => {
    logger.info(`Cypress Test server running on port ${PORT}`);
  });

  process.on('SIGTERM', () => {
    logger.info('Cypress Test server is shutting down.');
    server.close(() => {
      logger.info('Cypress Test server closed gracefully.');
      process.exit(0);
    });
  });
}
