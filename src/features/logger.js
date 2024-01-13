const winston = require('winston');

const defaultLevel = process.env.LOG_LEVEL || 'info';

const logger = winston.createLogger({
    level: defaultLevel,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.colorize({all: true}),
    ),
    transports: [
        new winston.transports.File({filename: 'logs-error/error.log', level: 'error'}),
        new winston.transports.File({filename: 'logs-error/combined.log'}),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
        ),
    }));
}

module.exports = logger;
