const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger.json');
const projectRoutes = require('./routes/project.routes');
const dailyDetailsRoutes = require('./routes/dailyDetails.routes');
const monthlyReportsRoutes = require('./routes/monthlyReports.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const { getJalaliMonthRange } = require('./utils/dateConverter');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;


app.get('/test/jalali/:year/:month', (req, res) => {
    const { year, month } = req.params;
    const jalaliYear = parseInt(year);
    const jalaliMonth = parseInt(month);

    if (isNaN(jalaliYear) || isNaN(jalaliMonth) || jalaliMonth < 1 || jalaliMonth > 12) {
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
        res.status(500).send(err.message);
    }
});


// Middleware برای اعتبارسنجی توکن JWT
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).send('Access denied: No token provided');
    }

    const token = authHeader.replace('Bearer ', '');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };
        next();
        console.log('Decoded user:', req.user);
    } catch (err) {
        console.error('JWT verification error:', err.message);
        res.status(401).send('Access denied: Invalid token');
    }
};

// Middleware برای بررسی نقش ادمین
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send('Access denied: Admin privileges required');
    }
    next();
};

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
}));
app.use(express.json());

// لاگ‌گیری درخواست‌ها
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
    console.log(`Query parameters: ${JSON.stringify(req.query)}`);
    console.log(`Route parameters: ${JSON.stringify(req.params)}`);
    next();
});


app.use('/auth', authRoutes);
app.use('/projects', authMiddleware, projectRoutes);
app.use('/daily-details', authMiddleware, dailyDetailsRoutes);
app.use('/monthly-reports', authMiddleware, monthlyReportsRoutes);
app.use('/users', authMiddleware, userRoutes);
app.use('/admin', authMiddleware, adminMiddleware, adminRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, () => {
    console.log(`🛩️️😶‍🌫️Server running on http://localhost:${port}🎶🎶`);
    console.log(`🍏🍊Swagger UI available at http://localhost:${port}/api-docs🍊🍏`);
});