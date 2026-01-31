# راهنمای بررسی و رفع مشکل Endpoint برای Check Submit

## مشکلات شناسایی شده و رفع شده

### 1. **عدم بررسی وجود `req.user`**
**مشکل:** اگر JWT token نامعتبر باشد یا authentication middleware به درستی کار نکند، `req.user` ممکن است `undefined` باشد و دسترسی به `req.user.userId` باعث خطا می‌شود.

**رفع شده:** اضافه کردن بررسی برای `req.user` قبل از استفاده:
```javascript
if (!req.user || !req.user.userId) {
    console.error('checkSubmittedJalali: req.user or req.user.userId is undefined');
    return res.status(401).send('Unauthorized: Invalid user session');
}
```

### 2. **عدم لاگ کافی برای Debug**
**مشکل:** در صورت بروز خطا، اطلاعات کافی برای تشخیص مشکل در لاگ ثبت نمی‌شود.

**رفع شده:** اضافه کردن لاگ‌های جامع:
```javascript
console.log('checkSubmittedJalali: Query params', { userId, jalaliYear: jy, jalaliMonth: jm });
console.error('Error in GET /monthly-reports/check-submitted/jalali/:year/:month:', {
    message: err.message,
    stack: err.stack,
    userId,
    year: jy,
    month: jm
});
```

### 3. **پیام خطای عمومی**
**مشکل:** پیام خطای 'Server error' اطلاعات کافی برای تشخیص مشکل نمی‌دهد.

**رفع شده:** نمایش جزئیات خطا در پاسخ:
```javascript
res.status(500).send(`Server error: ${err.message}`);
```

---

## چک لیست بررسی در محیط واقعی

### 1. بررسی JWT Token
```bash
# در ابتدا مطمئن شوید که JWT token معتبر است
# Token را از Local Storage یا Application Storage برنامه فلاتر بردارید
# و در سایت https://jwt.io بررسی کنید
```

### 2. بررسی دیتابیس
برای بررسی اینکه آیا جدول MonthlyReports در Production وجود دارد:

```sql
-- بررسی وجود جدول
SELECT * FROM sys.tables WHERE name = 'MonthlyReports';

-- بررسی ساختار جدول
EXEC sp_help 'MonthlyReports';

-- بررسی داده‌های موجود برای یک کاربر خاص
SELECT * FROM MonthlyReports 
WHERE UserId = @YourUserId 
  AND JalaliYear = @Year 
  AND JalaliMonth = @Month;
```

### 3. بررسی Connection String
مطمئن شوید که فایل `.env` در سرور Production تنظیمات صحیح دیتابیس را دارد:

```env
DB_USER=sa
DB_PASSWORD=YourProductionPassword
DB_SERVER=YourProductionServer
DB_DATABASE=UMD
DB_PORT=1433
JWT_SECRET=your_jwt_secret_key_here
```

### 4. بررسی لاگ‌های سرور
بعد از اعمال تغییرات، لاگ‌های زیر را بررسی کنید:

```bash
# در سرور Node.js خود، لاگ‌ها را مشاهده کنید
# باید این لاگ‌ها را ببینید:

# در صورت موفقیت:
# checkSubmittedJalali: Query params { userId: 123, jalaliYear: 1403, jalaliMonth: 10 }
# checkSubmittedJalali: Query result { status: 'draft', recordCount: 1 }

# در صورت خطا:
# Error in GET /monthly-reports/check-submitted/jalali/:year/:month: { message: '...', stack: '...', ... }
```

### 5. تست با Postman یا cURL

```bash
# Test endpoint with cURL
curl -X GET "http://your-server:3000/monthly-reports/check-submitted/jalali/1403/10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Expected Response (Success):
# { "status": "draft" }  // or null if no report exists

# Expected Response (Error - if token is invalid):
# Unauthorized: Invalid user session
```

---

## احتمال‌های دیگر برای خطا

### 1. **مشکل در اتصال به دیتابیس**
اگر دیتابیس در دسترس نباشد یا connection pool مشکل داشته باشد:
- بررسی کنید سرور SQL Server در حال اجرا باشد
- بررسی کنید Port 1433 باز باشد
- بررسی کنید Firewall مانع اتصال نشود

### 2. **مشکل در Authentication Middleware**
اگر `authMiddleware` در `index.js` به درستی کار نکند:
- بررسی کنید JWT_SECRET در .env صحیح باشد
- بررسی کنید Token در Header به صورت `Bearer TOKEN` ارسال شود

### 3. **مشکل در فیلدهای دیتابیس**
اگر فیلدهای JalaliYear یا JalaliMonth NULL باشند:
```sql
-- بررسی NULL values
SELECT * FROM MonthlyReports 
WHERE JalaliYear IS NULL OR JalaliMonth IS NULL;
```

### 4. **مشکل در Type Conversion**
اگر UserId از نوع STRING در JWT باشد:
```javascript
// در index.js، authMiddleware را بررسی کنید:
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = {
    userId: parseInt(decoded.userId), // مطمئن شوید INT است
    role: decoded.role
};
```

---

## راه حل‌های پیشنهادی

### راه حل 1: افزودن Middleware برای Check User
اضافه کردن یک middleware جداگانه برای بررسی req.user:

```javascript
// در index.js یا یک فایل جداگانه
const ensureUserExists = (req, res, next) => {
    if (!req.user || !req.user.userId) {
        console.error('ensureUserExists: req.user is invalid', { 
            user: req.user,
            path: req.path 
        });
        return res.status(401).send('Unauthorized: Invalid user session');
    }
    next();
};

// در routes
app.use('/monthly-reports', authMiddleware, ensureUserExists, monthlyReportsRoutes);
```

### راه حل 2: استفاده از Try-Catch در Pool Connection
```javascript
const pool = await poolPromise.catch(err => {
    console.error('Database connection error:', err);
    return res.status(503).send('Database connection failed');
});
```

### راه حل 3: افزودن Health Check Endpoint
```javascript
// در index.js
app.get('/health', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request().query('SELECT 1');
        res.json({ status: 'healthy', database: 'connected' });
    } catch (err) {
        res.status(503).json({ 
            status: 'unhealthy', 
            database: 'disconnected',
            error: err.message 
        });
    }
});
```

---

## مراحل اجرا در محیط واقعی

1. **Commit و Push کردن تغییرات:**
```bash
cd c:\Users\2135\IdeaProjects\timesheet-back
git add .
git commit -m "Fix: Add validation and logging for check-submitted endpoint"
git push origin fBranch
```

2. **Deploy کردن در سرور Production:**
   - کد جدید را در سرور Pull کنید
   - سرور Node.js را Restart کنید

3. **تست کردن Endpoint:**
   - از طریق برنامه فلاتر تست کنید
   - لاگ‌های سرور را بررسی کنید

4. **در صورت بروز خطا:**
   - لاگ‌های Console را بررسی کنید
   - Query دیتابیس را مستقیم اجرا کنید
   - Connection String را بررسی کنید

---

## نتیجه‌گیری

با اعمال این تغییرات:
1. ✅ خطاهای مربوط به `req.user === undefined` رفع شده
2. ✅ لاگ‌های جامع برای تشخیص مشکل اضافه شده
3. ✅ پیام‌های خطای بهتر برای کمک به Debug

اگر بعد از این تغییرات هنوز مشکل دارید، لاگ‌های خطا را بررسی کنید تا مشکل دقیق مشخص شود.
