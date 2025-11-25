const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, category, ...meta }) => {
        let msg = `${timestamp} [${level}] [${category || 'SYSTEM'}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Create transport for each category
const createCategoryTransport = (category) => {
    return new DailyRotateFile({
        filename: path.join(logsDir, `${category}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        format: logFormat,
        level: 'info'
    });
};

// Categories
const categories = ['auth', 'database', 'api', 'errors', 'admin', 'reports', 'system'];

// Create base logger
const baseLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // Combined log for all categories
        new DailyRotateFile({
            filename: path.join(logsDir, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            level: 'info'
        }),
        // Error log
        new DailyRotateFile({
            filename: path.join(logsDir, 'errors-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            level: 'error'
        })
    ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    baseLogger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Create category-specific loggers
const loggers = {};
categories.forEach(category => {
    loggers[category] = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.json()
        ),
        defaultMeta: { category },
        transports: [
            createCategoryTransport(category)
        ]
    });

    // Add console in development
    if (process.env.NODE_ENV !== 'production') {
        loggers[category].add(new winston.transports.Console({
            format: consoleFormat
        }));
    }
});

// Helper function to sanitize sensitive data
const sanitize = (data) => {
    if (!data) return data;
    const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'api_key'];
    const sanitized = { ...data };

    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '***REDACTED***';
        }
    });

    return sanitized;
};

// Logger interface
const logger = {
    // Authentication logs
    auth: {
        info: (message, meta = {}) => loggers.auth.info(message, sanitize(meta)),
        warn: (message, meta = {}) => loggers.auth.warn(message, sanitize(meta)),
        error: (message, meta = {}) => loggers.auth.error(message, sanitize(meta))
    },

    // Database logs
    database: {
        info: (message, meta = {}) => loggers.database.info(message, meta),
        warn: (message, meta = {}) => loggers.database.warn(message, meta),
        error: (message, meta = {}) => loggers.database.error(message, meta)
    },

    // API request logs
    api: {
        info: (message, meta = {}) => loggers.api.info(message, sanitize(meta)),
        warn: (message, meta = {}) => loggers.api.warn(message, sanitize(meta)),
        error: (message, meta = {}) => loggers.api.error(message, sanitize(meta))
    },

    // Error logs
    errors: {
        info: (message, meta = {}) => loggers.errors.info(message, meta),
        warn: (message, meta = {}) => loggers.errors.warn(message, meta),
        error: (message, meta = {}) => loggers.errors.error(message, meta)
    },

    // Admin action logs
    admin: {
        info: (message, meta = {}) => loggers.admin.info(message, meta),
        warn: (message, meta = {}) => loggers.admin.warn(message, meta),
        error: (message, meta = {}) => loggers.admin.error(message, meta)
    },

    // Report logs
    reports: {
        info: (message, meta = {}) => loggers.reports.info(message, meta),
        warn: (message, meta = {}) => loggers.reports.warn(message, meta),
        error: (message, meta = {}) => loggers.reports.error(message, meta)
    },

    // System logs
    system: {
        info: (message, meta = {}) => loggers.system.info(message, meta),
        warn: (message, meta = {}) => loggers.system.warn(message, meta),
        error: (message, meta = {}) => loggers.system.error(message, meta)
    }
};

module.exports = logger;
