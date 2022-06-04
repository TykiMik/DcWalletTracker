var winston = require('winston');
require('winston-daily-rotate-file');

var transport = new winston.transports.DailyRotateFile({
    filename: './logs/trackerlogs-%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
});

var logger = winston.createLogger({
    transports: [
        transport,
        new winston.transports.Console()
    ]
});

module.exports = logger;
