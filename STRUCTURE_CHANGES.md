# تغییرات ساختار پروژه

## خلاصه تغییرات

ساختار کنترلرها و route های پروژه به طور کامل بازسازماندهی شده است تا خوانایی، نگهداری و مقیاس‌پذیری بهتری داشته باشد.

## کنترلرهای جدید ایجاد شده

### 1. Auth Controllers
- ✅ `controllers/auth/auth.controller.js`
- ✅ `controllers/auth/index.js`

کد authentication از `routes/auth.routes.js` به کنترلر جدا منتقل شد.

### 2. Users Controllers
- ✅ `controllers/users/users.controller.js`
- ✅ `controllers/users/index.js`

کد user management از `routes/user.routes.js` به کنترلر جدا منتقل شد.

### 3. Projects Controllers
- ✅ `controllers/projects/projects.controller.js`
- ✅ `controllers/projects/index.js`

کد project management از `routes/project.routes.js` به کنترلر جدا منتقل شد.

### 4. UserProjectAccess Controllers
- ✅ `controllers/userProjectAccess/userProjectAccess.controller.js`
- ✅ `controllers/userProjectAccess/index.js`

کد user-project access از `routes/userProjectAccess.routes.js` به کنترلر جدا منتقل شد.

### 5. EOS Controllers
- ✅ `controllers/eos/eos.controller.js`
- ✅ `controllers/eos/index.js`

فایل `eosController.js` به پوشه جدا منتقل شد.

## Index files ایجاد شده

### 1. Daily Details
- ✅ `controllers/dailyDetails/index.js`
- ❌ حذف: `controllers/dailyDetails/retrievalController.js`

فایل `retrievalController.js` به `index.js` تبدیل شد و `crudController` نیز به آن اضافه شد.

### 2. Monthly Reports
- ✅ `controllers/monthlyReports/index.js`

تمام کنترلرهای monthly reports از یک index مرکزی export می‌شوند.

### 3. Admin
- ✅ `controllers/admin/index.js`

تمام کنترلرهای admin از یک index مرکزی export می‌شوند.

## Route های به‌روزرسانی شده

تمام route های زیر به‌روزرسانی شدند تا از index.js استفاده کنند:

1. ✅ `routes/auth.routes.js`
2. ✅ `routes/user.routes.js`
3. ✅ `routes/project.routes.js`
4. ✅ `routes/userProjectAccess.routes.js`
5. ✅ `routes/eos.routes.js`
6. ✅ `routes/dailyDetails.routes.js`
7. ✅ `routes/monthlyReports.routes.js`
8. ✅ `routes/monthPeriods.routes.js`
9. ✅ `routes/admin.routes.js`
10. ✅ `routes/logs.routes.js`

## فایل‌های حذف شده

- ❌ `controllers/eosController.js` → منتقل شد به `controllers/eos/eos.controller.js`
- ❌ `controllers/dailyDetails/retrievalController.js` → تبدیل شد به `controllers/dailyDetails/index.js`

## ساختار قبل و بعد

### قبل:
```
controllers/
  ├── eosController.js
  ├── admin/
  │   ├── userManagementController.js
  │   ├── projectManagementController.js
  │   └── ...
  ├── dailyDetails/
  │   ├── retrievalController.js
  │   ├── crudController.js
  │   └── ...
  └── monthlyReports/
      ├── draftController.js
      └── ...

routes/
  ├── auth.routes.js (logic مستقیم در route)
  ├── user.routes.js (logic مستقیم در route)
  └── ...
```

### بعد:
```
controllers/
  ├── auth/
  │   ├── auth.controller.js
  │   └── index.js
  ├── users/
  │   ├── users.controller.js
  │   └── index.js
  ├── projects/
  │   ├── projects.controller.js
  │   └── index.js
  ├── userProjectAccess/
  │   ├── userProjectAccess.controller.js
  │   └── index.js
  ├── eos/
  │   ├── eos.controller.js
  │   └── index.js
  ├── admin/
  │   ├── userManagementController.js
  │   ├── ...
  │   └── index.js
  ├── dailyDetails/
  │   ├── daily.controller.js
  │   ├── monthly.controller.js
  │   ├── crudController.js
  │   ├── ...
  │   └── index.js
  └── monthlyReports/
      ├── draftController.js
      ├── ...
      └── index.js

routes/
  ├── auth.routes.js (استفاده از controllers/auth)
  ├── user.routes.js (استفاده از controllers/users)
  └── ...
```

## مزایای تغییرات

1. **سازماندهی بهتر**: همه کنترلرهای مرتبط در یک پوشه
2. **پیدا کردن آسان‌تر**: ساختار منطقی و قابل فهم
3. **Import ساده‌تر**: استفاده از index.js
4. **جدا سازی واضح**: business logic از routes جدا شد
5. **مقیاس‌پذیری بهتر**: افزودن feature جدید راحت‌تر است
6. **نگهداری آسان‌تر**: کد تمیزتر و قابل فهم‌تر

## نکات مهم

- تمام route ها با ساختار جدید سازگار هستند
- هیچ تغییری در API endpoint ها ایجاد نشده
- تمام functionality ها حفظ شده‌اند
- فقط ساختار internal تغییر کرده است

## چگونه استفاده کنیم؟

### در Routes:
```javascript
// قبل
const controller1 = require('../controllers/folder/file1.controller');
const controller2 = require('../controllers/folder/file2.controller');

// بعد
const controllers = require('../controllers/folder');
// یا
const { method1, method2 } = require('../controllers/folder');
```

### مثال کامل:
```javascript
// routes/dailyDetails.routes.js
const express = require('express');
const router = express.Router();
const dailyDetailsController = require('../controllers/dailyDetails');

router.get('/jalali/month/:year/:month', dailyDetailsController.getJalaliMonthlyDetails);
router.post('/', dailyDetailsController.createOrUpdateDailyDetails);

module.exports = router;
```
