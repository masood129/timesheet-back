# Controllers Structure

این پوشه شامل تمام کنترلرهای پروژه است که به صورت منظم و پوشه‌بندی شده سازماندهی شده‌اند.

## ساختار پوشه‌بندی

### 📁 `/auth`
کنترلرهای مربوط به احراز هویت
- `auth.controller.js` - Login و Login-as
- `index.js` - Export های مرکزی

### 📁 `/users`
کنترلرهای مربوط به مدیریت کاربران
- `users.controller.js` - دریافت subordinates و users by direct admin
- `index.js` - Export های مرکزی

### 📁 `/projects`
کنترلرهای مربوط به مدیریت پروژه‌ها
- `projects.controller.js` - CRUD عملیات پروژه
- `index.js` - Export های مرکزی

### 📁 `/userProjectAccess`
کنترلرهای مربوط به دسترسی کاربران به پروژه‌ها
- `userProjectAccess.controller.js` - مدیریت دسترسی‌های پروژه
- `index.js` - Export های مرکزی

### 📁 `/eos`
کنترلرهای مربوط به سیستم EOS
- `eos.controller.js` - دریافت time records از EOS
- `index.js` - Export های مرکزی

### 📁 `/dailyDetails`
کنترلرهای مربوط به جزئیات روزانه
- `daily.controller.js` - عملیات روزانه
- `monthly.controller.js` - عملیات ماهانه
- `range.controller.js` - عملیات بازه زمانی
- `user.controller.js` - عملیات کاربر (export و ...)
- `crudController.js` - ایجاد/ویرایش جزئیات روزانه
- `index.js` - Export های مرکزی (جایگزین retrievalController قدیمی)

### 📁 `/monthlyReports`
کنترلرهای مربوط به گزارش‌های ماهانه
- `draftController.js` - مدیریت draft ها
- `approvalController.js` - فرآیند تایید
- `gymCostController.js` - هزینه‌های باشگاه
- `reportRetrievalController.js` - دریافت گزارش‌ها
- `managerReportController.js` - گزارش‌های مدیر
- `monthPeriodsController.js` - دوره‌های ماهانه
- `index.js` - Export های مرکزی

### 📁 `/admin`
کنترلرهای مربوط به پنل ادمین
- `userManagementController.js` - مدیریت کاربران
- `projectManagementController.js` - مدیریت پروژه‌ها
- `groupManagementController.js` - مدیریت گروه‌ها
- `reportManagementController.js` - مدیریت گزارش‌ها
- `systemConfigController.js` - تنظیمات سیستم
- `monthPeriodSettingsController.js` - تنظیمات دوره ماهانه
- `logs.controller.js` - مدیریت لاگ‌ها
- `dashboardSettingsController.js` - تنظیمات داشبورد
- `index.js` - Export های مرکزی

## نحوه استفاده

### در Routes:
```javascript
// ❌ روش قدیمی (مستقیم از controller)
const authController = require('../controllers/auth/auth.controller');

// ✅ روش جدید (از طریق index)
const authController = require('../controllers/auth');
```

### مثال:
```javascript
// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

router.post('/login', authController.login);
router.post('/login-as', authController.loginAs);

module.exports = router;
```

## مزایای این ساختار:

1. **سازماندهی بهتر**: همه کنترلرهای مرتبط در یک پوشه
2. **پیدا کردن آسان**: ساختار منطقی و قابل فهم
3. **Import آسان**: استفاده از index.js برای export مرکزی
4. **مقیاس‌پذیری**: افزودن کنترلر جدید به راحتی
5. **تمیز بودن کد**: جدا سازی واضح بین لایه‌ها

## قوانین:

- هر پوشه باید یک `index.js` داشته باشد
- نام فایل‌های controller با `.controller.js` تمام شود
- همه export ها از طریق `index.js` انجام شود
- Route ها فقط از `index.js` استفاده کنند، نه مستقیم از controller
