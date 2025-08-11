const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger.json');
const projectRoutes = require('./routes/project.routes');
const dailyDetailsRoutes = require('./routes/dailyDetails.routes');
const monthlyReportsRoutes = require('./routes/monthlyReports.routes');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
  console.log(`Query parameters: ${JSON.stringify(req.query)}`);
  console.log(`Route parameters: ${JSON.stringify(req.params)}`);
  next();
});

app.use('/projects', projectRoutes);
app.use('/daily-details', dailyDetailsRoutes);
app.use('/monthly-reports', monthlyReportsRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
});