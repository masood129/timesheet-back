const logger = require('../utils/logger.service');

/**
 * Middleware to log all HTTP requests
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Helper to format IP as IPv4
    const formatIp = (ip) => {
        if (!ip) return ip;
        if (ip === '::1') return '127.0.0.1';
        if (ip.startsWith('::ffff:')) return ip.substring(7);
        return ip;
    };

    // Log the incoming request
    const requestLog = {
        method: req.method,
        url: req.originalUrl,
        ip: formatIp(req.ip || req.connection.remoteAddress),
        userAgent: req.get('user-agent'),
        userId: req.user ? req.user.userId : null,
        role: req.user ? req.user.role : null
    };

    logger.api.info(`Incoming request: ${req.method} ${req.originalUrl}`, requestLog);

    // Capture the original res.send function
    const originalSend = res.send;

    // Override res.send to log the response
    res.send = function (data) {
        const duration = Date.now() - startTime;

        const responseLog = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userId: req.user ? req.user.userId : null
        };

        if (res.statusCode >= 400) {
            logger.api.error(`Response error: ${req.method} ${req.originalUrl}`, responseLog);
        } else {
            logger.api.info(`Response: ${req.method} ${req.originalUrl}`, responseLog);
        }

        // Call the original send function
        originalSend.call(this, data);
    };

    next();
};

/**
 * Middleware to log errors
 */
const errorLogger = (err, req, res, next) => {
    const errorLog = {
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        userId: req.user ? req.user.userId : null,
        body: req.body,
        params: req.params,
        query: req.query
    };

    logger.errors.error(`Unhandled error: ${err.message}`, errorLog);

    next(err);
};

module.exports = {
    requestLogger,
    errorLogger
};
