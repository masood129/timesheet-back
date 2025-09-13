const express = require('express');
const router = express.Router();
const dailyDetailsController = require('../controllers/dailyDetails.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// ثبت جزئیات روزانه
router.post('/', authMiddleware, dailyDetailsController.createDailyDetail);

// دریافت جزئیات ماهانه (بر اساس تقویم شمسی)
router.get('/jalali/:year/:month', authMiddleware, dailyDetailsController.getDailyDetailsByMonth);

// دریافت روز خاص
router.get('/:date', authMiddleware, dailyDetailsController.getDailyDetailByDate);

// بروزرسانی روز خاص
router.put('/:date', authMiddleware, dailyDetailsController.updateDailyDetail);

module.exports = router;