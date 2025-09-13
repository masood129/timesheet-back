require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Swagger
const swaggerDocument = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'docs', 'swagger.json'), 'utf8')
);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/daily-details', require('./routes/dailyDetails.routes'));
app.use('/api/monthly-reports', require('./routes/monthlyReports.routes'));
app.use('/api/projects', require('./routes/project.routes'));

// Health check
app.get('/', (req, res) => {
    res.send('✅ API is running...');
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
