const express = require('express');
const router = express.Router();
const dailyDetailsController = require('../controllers/dailyDetails');

router.get('/jalali/month/:year/:month', dailyDetailsController.getJalaliMonthlyDetails);
router.get('/range', dailyDetailsController.getRangeDetails);
router.get('/:date', dailyDetailsController.getDailyDetails);
router.get('/month/:year/:month', dailyDetailsController.getMonthlyDetails);
router.get('/user/:userId/jalali/month/:year/:month', dailyDetailsController.getUserJalaliMonthlyDetails);
router.get('/user/:userId/jalali/month/:year/:month/export-excel', dailyDetailsController.exportUserJalaliMonthlyToExcel);
router.post('/', dailyDetailsController.createOrUpdateDailyDetails);

module.exports = router;