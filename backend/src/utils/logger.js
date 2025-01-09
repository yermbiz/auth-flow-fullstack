const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;
const DailyRotateFile = require('winston-daily-rotate-file');

const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

const transportsList = [];

// console.log on
transportsList.push(
  new transports.Console({
    format: combine(
      colorize(), // in color
      logFormat
    ),
    silent: process.env.TEST_LOGS_SILENT && process.env.NODE_ENV === 'test', // Switch off logs in tests only when TEST_LOGS_SILENT is set to true
  })
);

// log into file only in production
if (process.env.NODE_ENV === 'production') {
  transportsList.push(
    new DailyRotateFile({
      filename: 'logs/%DATE%-combined.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m', // max file size (20 MB), TODO set as env var
      maxFiles: '14d', // store for the last 14 days, TODO set as env var
      level: 'info', // log level
    })
  );
}

// Logger will act at the info level in prod
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: transportsList,
});

// Logging unhandled exceptions only in production
if (process.env.NODE_ENV === 'production') {
  logger.exceptions.handle(
    new DailyRotateFile({
      filename: 'logs/%DATE%-exceptions.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    })
  );
}

module.exports = logger;
