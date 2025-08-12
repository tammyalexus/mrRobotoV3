const winston = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define custom levels to ensure debug is below info
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue'
  }
};

// Add colors to Winston
winston.addColors(customLevels.colors);

// Format for log entries
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// Create a Winston logger with custom levels
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'debug',
  format: logFormat,
  transports: [
    // Daily rotating file
    new winston.transports.DailyRotateFile({
      dirname: logsDir,
      filename: '%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '5m',
      maxFiles: 30
    })
  ],
  exitOnError: false
});

// If we're in a test environment, don't log to files
if (process.env.NODE_ENV === 'test') {
  logger.transports.forEach((transport) => {
    if (transport instanceof winston.transports.File || 
        transport instanceof winston.transports.DailyRotateFile) {
      transport.silent = true;
    }
  });
}

module.exports = {
  logger
};