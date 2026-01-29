# 🔧 راهنمای رفع مشکلات دیتابیس

## 🔴 مشکل اصلی

وقتی فایل `SETUP-PRODUCTION.sql` را اجرا می‌کنید و سپس backend را راه‌اندازی می‌کنید، خطای زیر رخ می‌دهد:

```
Error in getMonthPeriod: Could not find stored procedure 'sp_GetMonthPeriod'.
```

### 🎯 علت مشکل

فایل `SETUP-PRODUCTION.sql` قبلی **تمام Stored Procedure ها و Function های لازم را نداشت**:

#### ❌ **Stored Procedures ناقص:**
- `sp_GetMonthPeriod` ❌
- `sp_GetYearMonthPeriods` ❌
- `sp_ValidatePeriodWithNeighbors` ❌
- `sp_AutoAdjustNeighborMonths` ❌

#### ❌ **Functions ناقص:**
- `fn_IsMonthEditable` ❌
- `fn_GetPeriodLength` ❌

#### ❌ **ستون‌های ناقص در جدول `MonthPeriodSettings`:**
- اگر جدول از قبل وجود داشت، ستون‌های `StartYear` و `EndYear` اضافه نمی‌شدند ❌

---

## ✅ راه حل

### روش 1: استفاده از فایل به‌روز شده (توصیه می‌شود)

فایل `SETUP-PRODUCTION.sql` اکنون **به‌روز شده** و تمام مشکلات رفع شده است:

```sql
-- فقط این فایل را اجرا کنید:
sqlcmd -S localhost -d UMD -i "SETUP-PRODUCTION.sql"
```

یا در SQL Server Management Studio (SSMS):
1. فایل `SETUP-PRODUCTION.sql` را باز کنید
2. F5 را بزنید تا اجرا شود

### روش 2: اگر قبلاً SETUP-PRODUCTION.sql را اجرا کرده‌اید

اگر فایل قدیمی را اجرا کرده‌اید، می‌توانید:

#### گزینه A: فایل را دوباره اجرا کنید
```sql
-- فایل جدید idempotent است و می‌توانید دوباره اجرا کنید
sqlcmd -S localhost -d UMD -i "SETUP-PRODUCTION.sql"
```

#### گزینه B: فقط missing objects را اضافه کنید
```sql
-- اجرای فایل تست و بررسی
sqlcmd -S localhost -d UMD -i "COMPLETE-SETUP-WITH-FIXES.sql"
```

---

## 📊 بررسی صحت نصب

بعد از اجرا، فایل `COMPLETE-SETUP-WITH-FIXES.sql` را اجرا کنید تا مطمئن شوید همه چیز درست نصب شده:

```sql
sqlcmd -S localhost -d UMD -i "COMPLETE-SETUP-WITH-FIXES.sql"
```

این فایل موارد زیر را بررسی می‌کند:
- ✅ وجود تمام جداول
- ✅ وجود تمام Stored Procedures
- ✅ وجود تمام Functions
- ✅ وجود ستون `role` در جدول `users`
- ✅ وجود ستون‌های `StartYear` و `EndYear` در `MonthPeriodSettings`
- ✅ تست اجرای Stored Procedures

---

## 🔍 بررسی جداول خالی - آیا برنامه با جداول خالی کار می‌کند؟

### ✅ جداول که می‌توانند خالی باشند:

1. **`users`** ✅
   - برنامه با جدول خالی کار می‌کند
   - فقط باید حداقل یک کاربر با `role = 'admin'` برای ورود به پنل ادمین داشته باشید

2. **`projects`** ✅
   - برنامه با جدول خالی کار می‌کند
   - پیام "No projects found for user" نمایش می‌دهد

3. **`groups`** ✅
   - برنامه با جدول خالی کار می‌کند

4. **`DailyDetails`** ✅
   - برنامه با جدول خالی کار می‌کند
   - لیست خالی برمی‌گرداند

5. **`MonthlyReports`** ✅
   - برنامه با جدول خالی کار می‌کند

6. **`MonthPeriodSettings`** ✅
   - **می‌تواند خالی باشد**
   - Stored Procedure ها بازه پیش‌فرض را محاسبه می‌کنند

### ⚠️ نکات مهم:

#### 1. جدول `users`
Controller ها این کد را دارند:
```javascript
if (result.recordset.length === 0) {
    return res.status(404).send('کاربر یافت نشد');
}
const user = result.recordset[0]; // ✅ ایمن است
```

#### 2. جدول `projects`
```javascript
// ✅ برنامه به درستی handle می‌کند
const result = await pool.request().query('SELECT * FROM projects');
res.json({ projects: result.recordset }); // لیست خالی برمی‌گرداند
```

#### 3. استفاده از `recordset[0]` بدون check
برخی controller ها ممکن است مستقیماً از `recordset[0]` استفاده کنند:
```javascript
// ⚠️ احتمال خطا اگر جدول خالی باشد
const total = countResult.recordset[0].total || 0; // ✅ با || 0 امن شده
```

---

## 🚀 مراحل راه‌اندازی کامل

### 1️⃣ نصب دیتابیس
```bash
# نصب کامل جداول، stored procedures، و functions
sqlcmd -S localhost -d UMD -i "SETUP-PRODUCTION.sql"
```

### 2️⃣ بررسی نصب
```bash
# بررسی اینکه همه چیز درست نصب شده
sqlcmd -S localhost -d UMD -i "COMPLETE-SETUP-WITH-FIXES.sql"
```

### 3️⃣ اضافه کردن کاربر ادمین اول
```sql
-- اضافه کردن کاربر برای تست
INSERT INTO users (personalid, id, farsifirstname, farsilastname, email, role, IsActive)
VALUES (2135, 'admin', N'ادمین', N'سیستم', 'admin@test.com', 'admin', 1);

-- اضافه کردن پسورد در جدول Admins (bcrypt hash برای "admin123")
INSERT INTO Admins (Username, PasswordHash, FullName, Email, IsActive)
VALUES ('admin', '$2b$10$YourBcryptHashHere', N'ادمین سیستم', 'admin@test.com', 1);
```

### 4️⃣ اضافه کردن پروژه‌های نمونه (اختیاری)
```sql
-- اضافه کردن پروژه‌های نمونه
INSERT INTO projects (id, projectName) VALUES 
(1, N'پروژه الف'),
(2, N'پروژه ب'),
(3, N'پروژه ج');

-- اضافه کردن گروه نمونه
INSERT INTO groups (id, groupname, managerID) VALUES (1, N'گروه توسعه', 2135);

-- دسترسی کاربر به پروژه‌ها
INSERT INTO UserProjectAccess (UserId, ProjectId) VALUES 
(2135, 1),
(2135, 2),
(2135, 3);
```

### 5️⃣ راه‌اندازی Backend
```bash
cd timesheet-back
npm install
npm start
```

---

## 🐛 اشکال‌زدایی رایج

### خطا: "Could not find stored procedure"
**راه حل:**
```sql
-- بررسی وجود stored procedure
SELECT name FROM sys.procedures WHERE name LIKE 'sp_%';

-- اگر وجود ندارد، فایل SETUP-PRODUCTION.sql را دوباره اجرا کنید
```

### خطا: "Invalid column name 'StartYear'"
**راه حل:**
```sql
-- بررسی وجود ستون
SELECT name FROM sys.columns 
WHERE object_id = OBJECT_ID('MonthPeriodSettings');

-- اگر StartYear وجود ندارد:
ALTER TABLE MonthPeriodSettings ADD StartYear INT NULL;
UPDATE MonthPeriodSettings SET StartYear = Year WHERE StartYear IS NULL;
ALTER TABLE MonthPeriodSettings ALTER COLUMN StartYear INT NOT NULL;

-- همین کار را برای EndYear انجام دهید
ALTER TABLE MonthPeriodSettings ADD EndYear INT NULL;
UPDATE MonthPeriodSettings SET EndYear = Year WHERE EndYear IS NULL;
ALTER TABLE MonthPeriodSettings ALTER COLUMN EndYear INT NOT NULL;
```

### خطا: "Invalid column name 'role'"
**راه حل:**
```sql
-- اضافه کردن ستون role
ALTER TABLE users ADD role NVARCHAR(50) NULL;

-- اضافه کردن CHECK constraint
ALTER TABLE users ADD CONSTRAINT CK_users_role 
    CHECK (role IN ('user', 'group_manager', 'general_manager', 'finance_manager', 'admin'));

-- اضافه کردن INDEX
CREATE INDEX IX_users_role ON users(role);
```

---

## 📝 تغییرات اعمال شده در SETUP-PRODUCTION.sql

### ✅ Stored Procedures اضافه شده:
1. `sp_GetMonthPeriod` - دریافت بازه یک ماه خاص
2. `sp_GetYearMonthPeriods` - دریافت بازه تمام ماه‌های یک سال
3. `sp_ValidatePeriodWithNeighbors` - اعتبارسنجی بازه با ماه‌های مجاور
4. `sp_AutoAdjustNeighborMonths` - تنظیم خودکار ماه‌های مجاور

### ✅ Functions اضافه شده:
1. `fn_IsMonthEditable` - بررسی قابلیت ویرایش ماه
2. `fn_GetPeriodLength` - محاسبه طول بازه زمانی

### ✅ جدول `MonthPeriodSettings` بهبود یافت:
- اضافه شدن منطق برای ستون‌های `StartYear` و `EndYear` در بخش ELSE

---

## 🎯 نتیجه‌گیری

✅ **فایل SETUP-PRODUCTION.sql اکنون کامل است**
✅ **تمام Stored Procedures و Functions اضافه شده‌اند**
✅ **برنامه با جداول خالی به درستی کار می‌کند**
✅ **فایل idempotent است و می‌توان چندین بار اجرا کرد**

---

## 📞 پشتیبانی

اگر مشکلی داشتید:
1. فایل `COMPLETE-SETUP-WITH-FIXES.sql` را اجرا کنید
2. خروجی را بررسی کنید
3. در صورت وجود خطا، پیام خطا را بررسی کنید

**تاریخ آخرین به‌روزرسانی:** 29 ژانویه 2026
