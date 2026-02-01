const express = require('express');
const router = express.Router();
const monthlyReportsController = require('../controllers/monthlyReports');

/**
 * GET /month-periods/:year
 * Get all month periods for a specific year
 */
router.get('/:year', monthlyReportsController.getYearMonthPeriods);

/**
 * GET /month-periods/:year/:month
 * Get month period for a specific year and month
 */
router.get('/:year/:month', monthlyReportsController.getMonthPeriod);

module.exports = router;

