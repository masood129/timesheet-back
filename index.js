const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger.json');
const projectRoutes = require('./routes/project.routes');
const dailyDetailsRoutes = require('./routes/dailyDetails.routes');
const monthlyReportsRoutes = require('./routes/monthlyReports.routes');
const monthPeriodsRoutes = require('./routes/monthPeriods.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const userProjectAccessRoutes = require('./routes/userProjectAccess.routes');
const { getJalaliMonthRange } = require('./utils/dateConverter');
const eosRoutes = require('./routes/eos.routes');
const logger = require('./utils/logger.service');
const { requestLogger, errorLogger } = require('./middleware/logging.middleware');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Log application startup
logger.system.info('Application starting...', { port, nodeEnv: process.env.NODE_ENV });

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const { poolPromise } = require('./config/db.config');
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT 1 as healthy');
        
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: {
                connected: true,
                responseTime: 'OK'
            },
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                nodeVersion: process.version
            }
        };
        
        logger.system.info('Health check passed', healthStatus);
        res.json(healthStatus);
    } catch (err) {
        const errorStatus = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: {
                connected: false,
                error: err.message
            },
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                nodeVersion: process.version
            }
        };
        
        logger.errors.error('Health check failed', errorStatus);
        res.status(503).json(errorStatus);
    }
});

// Test endpoint for Jalali date conversion
app.get('/test/jalali/:year/:month', (req, res) => {
    const { year, month } = req.params;
    const jalaliYear = parseInt(year);
    const jalaliMonth = parseInt(month);

    if (isNaN(jalaliYear) || isNaN(jalaliMonth) || jalaliMonth < 1 || jalaliMonth > 12) {
        logger.api.warn('Invalid Jalali date requested', { year, month });
        return res.status(400).send('Invalid Jalali year or month');
    }

    try {
        const monthRange = getJalaliMonthRange(jalaliYear, jalaliMonth);
        res.json({
            jalaliYear,
            jalaliMonth,
            gregorianStart: monthRange.start.getFullYear(),
            gregorianEnd: monthRange.end.getMonth()
        });
    } catch (err) {
        logger.errors.error('Error in Jalali date conversion', { year, month, error: err.message });
        res.status(500).send(err.message);
    }
});

// Middleware برای اعتبارسنجی توکن JWT
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        logger.auth.warn('Authentication failed: No token provided', { 
            url: req.originalUrl,
            method: req.method,
            ip: req.ip
        });
        return res.status(401).send('Access denied: No token provided');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token || token.trim() === '') {
        logger.auth.warn('Authentication failed: Empty token', { url: req.originalUrl });
        return res.status(401).send('Access denied: Empty token');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Validate decoded token has required fields
        if (!decoded.userId || !decoded.role) {
            logger.auth.error('JWT token missing required fields', { 
                decoded,
                url: req.originalUrl 
            });
            return res.status(401).send('Access denied: Invalid token structure');
        }
        
        // Ensure userId is an integer
        const userId = typeof decoded.userId === 'string' 
            ? parseInt(decoded.userId, 10) 
            : decoded.userId;
        
        if (isNaN(userId)) {
            logger.auth.error('JWT token has invalid userId', { 
                userId: decoded.userId,
                url: req.originalUrl 
            });
            return res.status(401).send('Access denied: Invalid userId in token');
        }
        
        req.user = {
            userId: userId,
            role: decoded.role
        };
        
        logger.auth.info('User authenticated', { 
            userId: userId, 
            role: decoded.role,
            url: req.originalUrl 
        });
        next();
    } catch (err) {
        logger.auth.error('JWT verification error', { 
            error: err.message,
            name: err.name,
            url: req.originalUrl
        });
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).send('Access denied: Token expired');
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(401).send('Access denied: Invalid token format');
        }
        
        res.status(401).send('Access denied: Invalid token');
    }
};

// Middleware برای بررسی نقش ادمین
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        logger.auth.warn('Admin access denied', { userId: req.user.userId, role: req.user.role });
        return res.status(403).send('Access denied: Admin privileges required');
    }
    logger.auth.info('Admin access granted', { userId: req.user.userId });
    next();
};

// Apply middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
}));
app.use(express.json());

// Add logging middleware
app.use(requestLogger);

// Register routes
app.use('/auth', authRoutes);
app.use('/projects', authMiddleware, projectRoutes);
app.use('/daily-details', authMiddleware, dailyDetailsRoutes);
app.use('/monthly-reports', authMiddleware, monthlyReportsRoutes);
app.use('/month-periods', authMiddleware, monthPeriodsRoutes);
app.use('/users', authMiddleware, userRoutes);
app.use('/user-project-access', authMiddleware, userProjectAccessRoutes);
app.use('/admin', authMiddleware, adminMiddleware, adminRoutes);
app.use('/eos', authMiddleware, eosRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Error logging middleware (should be last)
app.use(errorLogger);

// Start server
app.listen(port, () => {
    logger.system.info(`Server running on http://localhost:${port}`);
    logger.system.info(`Swagger UI available at http://localhost:${port}/api-docs`);
    console.log(`🛩️️😶‍🌫️Server running on http://localhost:${port}🎶🎶`);
    console.log(`🍏🍊Swagger UI available at http://localhost:${port}/api-docs🍊🍏`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger.system.info('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.system.info('SIGINT signal received: closing HTTP server');
    process.exit(0);
});