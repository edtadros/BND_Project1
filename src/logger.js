// src/logger.js
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',  // Log only if info.level is less than or equal to this level
    format: winston.format.json(),  // Use JSON format
    defaultMeta: { service: 'blockchain-app-service' },  // Default metadata
    transports: [
        // Write all logs error (and below) to `error.log`.
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        // Write to all logs with level `info` and below to `combined.log`
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

// If we're not in production then also log to the `console`
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),  // Use simple format
    }));

// Hendle Uncaught Exceptions and Rejections
logger.exceptions.handle(
    new winston.transports.File({ filename: 'exceptions.log' })
);

process.on('unhandledRejection', (ex) => {
    throw ex;
});

}

module.exports = logger;
