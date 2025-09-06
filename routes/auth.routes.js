const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// ورود
router.post('/login', authController.login);

// پروفایل کاربر
router.get('/profile', authMiddleware, authController.profile);

module.exports = router;
