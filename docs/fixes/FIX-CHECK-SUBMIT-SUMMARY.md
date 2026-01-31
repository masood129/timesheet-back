# خلاصه تغییرات و رفع مشکل Check Submit Endpoint

تاریخ: ۲۹ ژانویه ۲۰۲۶ (۹ بهمن ۱۴۰۴)

## مشکل اصلی

Endpoint `/monthly-reports/check-submitted/jalali/:year/:month` در محیط واقعی (Production) خطا داشت.

---

## تغییرات اعمال شده

### 1. فایل: `controllers/monthlyReports/reportRetrievalController.js`

#### تابع `checkSubmittedJalali`
**تغییرات:**
- ✅ اضافه کردن بررسی وجود `req.user` و `req.user.userId`
- ✅ اضافه کردن لاگ‌های جامع برای Debug
- ✅ بهبود پیام‌های خطا با جزئیات بیشتر
- ✅ اضافه کردن لاگ برای Query Parameters و Results

```javascript
// Before:
const userId = req.user.userId; // می‌توانست خطا دهد

// After:
if (!req.user || !req.user.userId) {
    console.error('checkSubmittedJalali: req.user or req.user.userId is undefined');
    return res.status(401).send('Unauthorized: Invalid user session');
}
const userId = req.user.userId;
```

#### تابع `getReportIdsJalali`
**تغییرات مشابه:**
- ✅ بررسی وجود `req.user`, `req.user.userId`, و `req.user.role`
- ✅ لاگ‌های جامع
- ✅ پیام‌های خطای بهتر

#### تابع `getGroupReportsJalali`
**تغییرات مشابه:**
- ✅ Validation و Error Handling بهبود یافته
- ✅ لاگ‌گذاری کامل

---

### 2. فایل: `index.js`

#### بهبود `authMiddleware`
**تغییرات:**
- ✅ بررسی Empty Token
- ✅ Validation دقیق‌تر فیلدهای JWT (userId و role)
- ✅ تبدیل خودکار userId از String به Integer
- ✅ پیام‌های خطای دقیق‌تر (Token Expired, Invalid Format, etc.)
- ✅ لاگ‌های بهتر با اطلاعات بیشتر

```javascript
// اضافه شده:
if (!decoded.userId || !decoded.role) {
    return res.status(401).send('Access denied: Invalid token structure');
}

const userId = typeof decoded.userId === 'string' 
    ? parseInt(decoded.userId, 10) 
    : decoded.userId;

if (isNaN(userId)) {
    return res.status(401).send('Access denied: Invalid userId in token');
}
```

#### اضافه کردن Health Check Endpoint
**آدرس:** `GET /health`

**Response در حالت سالم:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-29T...",
  "database": {
    "connected": true,
    "responseTime": "OK"
  },
  "server": {
    "uptime": 1234.56,
    "memory": {...},
    "nodeVersion": "v18.x.x"
  }
}
```

**Response در حالت خطا:**
```json
{
  "status": "unhealthy",
  "timestamp": "2026-01-29T...",
  "database": {
    "connected": false,
    "error": "Connection failed"
  },
  ...
}
```

---

### 3. فایل‌های مستندات

#### [TEST-CHECK-SUBMIT-ENDPOINT.md](../testing/TEST-CHECK-SUBMIT-ENDPOINT.md)
راهنمای جامع برای:
- تشخیص مشکلات
- بررسی JWT Token
- بررسی Database
- تست با Postman/cURL
- راه حل‌های پیشنهادی

#### `createDB/testing/test-check-submitted-endpoint.sql`
اسکریپت SQL جامع برای تست دیتابیس:
- بررسی وجود جدول MonthlyReports
- بررسی ساختار و Index‌ها
- تست Query مشابه Endpoint
- بررسی NULL Values
- تست Performance

---

## مشکلات احتمالی که رفع شدند

### 1. مشکل `req.user` Undefined
**علت:** اگر JWT Token نامعتبر یا منقضی باشد، `req.user` undefined می‌شود.
**رفع شد با:** اضافه کردن Validation در همه توابع

### 2. مشکل Type Conversion
**علت:** اگر `userId` در JWT به صورت String باشد، در SQL Query مشکل ایجاد می‌کند.
**رفع شد با:** تبدیل خودکار String به Integer در authMiddleware

### 3. مشکل لاگ‌گذاری ناکافی
**علت:** در صورت بروز خطا، اطلاعات کافی برای Debug وجود نداشت.
**رفع شد با:** اضافه کردن لاگ‌های جامع با Stack Trace و Parameters

### 4. مشکل پیام‌های خطای عمومی
**علت:** پیام 'Server error' اطلاعات کافی نمی‌داد.
**رفع شد با:** نمایش پیام خطای دقیق در Response

---

## چگونه تست کنیم؟

### 1. تست Health Check
```bash
curl http://localhost:3000/health
```

### 2. تست Check Submit Endpoint
```bash
curl -X GET "http://localhost:3000/monthly-reports/check-submitted/jalali/1403/10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. تست Database
```sql
-- در SQL Server Management Studio اجرا کنید:
USE UMD;
GO
-- سپس اسکریپت test-check-submitted-endpoint.sql را اجرا کنید
```

### 4. بررسی لاگ‌ها
بعد از فراخوانی Endpoint، لاگ‌های زیر باید نمایش داده شوند:

**موفقیت:**
```
User authenticated { userId: 123, role: 'user', url: '/monthly-reports/check-submitted/jalali/1403/10' }
checkSubmittedJalali: Query params { userId: 123, jalaliYear: 1403, jalaliMonth: 10 }
checkSubmittedJalali: Query result { status: 'draft', recordCount: 1 }
```

**خطا:**
```
checkSubmittedJalali: req.user or req.user.userId is undefined
// یا
Error in GET /monthly-reports/check-submitted/jalali/:year/:month: { message: '...', stack: '...', ... }
```

---

## مراحل Deploy در Production

### 1. Commit Changes
```bash
cd c:\Users\2135\IdeaProjects\timesheet-back
git add .
git commit -m "Fix: Add validation, logging and health check for monthly reports endpoints

- Add req.user validation in reportRetrievalController
- Improve authMiddleware with better error handling
- Add health check endpoint for monitoring
- Add comprehensive logging for debugging
- Add test scripts and documentation"
git push origin fBranch
```

### 2. Deploy در Server
```bash
# در سرور Production
cd /path/to/timesheet-back
git pull origin fBranch
npm install  # اگر dependency جدیدی اضافه شده باشد
```

### 3. Restart Server
```bash
# با PM2
pm2 restart timesheet-back

# یا با systemctl
sudo systemctl restart timesheet-back

# یا به صورت دستی
node index.js
```

### 4. Verify Deployment
```bash
# تست Health Check
curl http://your-production-server:3000/health

# بررسی لاگ‌ها
pm2 logs timesheet-back
# یا
tail -f /path/to/logs/error.log
```

---

## نکات مهم

### 1. بررسی JWT_SECRET
مطمئن شوید که `JWT_SECRET` در `.env` فایل Production همان مقداری است که برای ایجاد Token‌ها استفاده شده:

```env
JWT_SECRET=your_jwt_secret_key_here
```

### 2. بررسی Database Connection
اگر `/health` endpoint خطا می‌دهد، بررسی کنید:
- SQL Server در حال اجرا است
- Port 1433 باز است
- Firewall مسدود نکرده
- User/Password در `.env` صحیح است

### 3. بررسی CORS
اگر از Frontend خطا CORS دریافت می‌کنید:
```javascript
// در index.js بررسی کنید:
app.use(cors({
    origin: '*',  // یا آدرس دقیق Frontend را بنویسید
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
}));
```

---

## خطاهای رایج و راه حل

### خطا: "Unauthorized: Invalid user session"
**علت:** JWT Token نامعتبر یا منقضی شده
**راه حل:**
1. لاگ‌های authMiddleware را بررسی کنید
2. Token را در jwt.io بررسی کنید
3. مطمئن شوید JWT_SECRET صحیح است

### خطا: "Server error: Invalid object name 'MonthlyReports'"
**علت:** جدول MonthlyReports در Database ایجاد نشده
**راه حل:**
1. اسکریپت `createDB/production/SETUP-PRODUCTION.sql` را اجرا کنید
2. از طریق SQL بررسی کنید: `SELECT * FROM sys.tables WHERE name = 'MonthlyReports'`

### خطا: "Database connection failed"
**علت:** اتصال به SQL Server برقرار نیست
**راه حل:**
1. `/health` endpoint را بررسی کنید
2. `.env` فایل را بررسی کنید
3. SQL Server را Restart کنید

---

## نتیجه‌گیری

با این تغییرات، Endpoint `/monthly-reports/check-submitted/jalali/:year/:month` باید به درستی کار کند و در صورت بروز خطا، لاگ‌های جامعی برای تشخیص مشکل در دسترس است.

### چک لیست نهایی:
- ✅ Validation برای req.user اضافه شد
- ✅ لاگ‌گذاری جامع اضافه شد
- ✅ authMiddleware بهبود یافت
- ✅ Health Check Endpoint اضافه شد
- ✅ مستندات تست ایجاد شد
- ✅ اسکریپت تست SQL ایجاد شد
- ✅ **رفتار با جدول خالی بررسی و تأیید شد**

### رفتار با جدول خالی:
کد به درستی حالت جدول خالی یا عدم وجود رکورد را مدیریت می‌کند:

```javascript
const status = result.recordset.length > 0 ? result.recordset[0].Status : null;
// اگر جدول خالی باشد → recordset = []
// اگر رکوردی پیدا نشود → recordset = []
// در هر دو حالت → status = null ✓
```

**Response:**
- جدول خالی یا رکورد پیدا نشد: `{ "status": null }` با HTTP 200
- رکورد موجود است: `{ "status": "draft" }` با HTTP 200
- خطای سرور: پیام خطا با HTTP 500

**برای جزئیات بیشتر:** [EMPTY-TABLE-BEHAVIOR.md](../database/EMPTY-TABLE-BEHAVIOR.md) را مطالعه کنید.

---

اگر بعد از این تغییرات همچنان مشکل دارید، لطفاً:
1. لاگ‌های دقیق خطا را بررسی کنید
2. اسکریپت تست SQL را اجرا کنید (`test-empty-table-scenarios.sql`)
3. Health Check را بررسی کنید
