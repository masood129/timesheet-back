const express = require('express');
const router = express.Router();
const retrievalController = require('../controllers/dailyDetails/retrievalController');
const crudController = require('../controllers/dailyDetails/crudController');

router.get('/jalali/month/:year/:month', retrievalController.getJalaliMonthlyDetails);
router.get('/range', retrievalController.getRangeDetails);
router.get('/:date', retrievalController.getDailyDetails);
router.get('/month/:year/:month', retrievalController.getMonthlyDetails);
router.get('/user/:userId/jalali/month/:year/:month', retrievalController.getUserJalaliMonthlyDetails);
router.get('/user/:userId/jalali/month/:year/:month/export-excel', retrievalController.exportUserJalaliMonthlyToExcel);
router.post('/', crudController.createOrUpdateDailyDetails);

module.exports = router;