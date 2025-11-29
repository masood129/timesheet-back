const express = require('express');
const router = express.Router();
const monthPeriodsController = require('../controllers/monthlyReports/monthPeriodsController');

/**
 * GET /month-periods/:year
 * Get all month periods for a specific year
 */
router.get('/:year', monthPeriodsController.getYearMonthPeriods);

/**
 * GET /month-periods/:year/:month
 * Get month period for a specific year and month
 */
router.get('/:year/:month', monthPeriodsController.getMonthPeriod);

module.exports = router;

