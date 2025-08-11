const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger.json');
const projectRoutes = require('./routes/project.routes');
const dailyDetailsRoutes = require('./routes/dailyDetails.routes');
const monthlyReportsRoutes = require('./routes/monthlyReports.routes');
const authRoutes = require('./routes/auth.routes');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

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
    } catch (err) {
        console.error('JWT verification error:', err.message);
        res.status(401).send('Access denied: Invalid token');
    }
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

// مسیرهای API
app.use('/auth', authRoutes);
app.use('/projects', authMiddleware, projectRoutes);
app.use('/daily-details', authMiddleware, dailyDetailsRoutes);
app.use('/monthly-reports', authMiddleware, monthlyReportsRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
});