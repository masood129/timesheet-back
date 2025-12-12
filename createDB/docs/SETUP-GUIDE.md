# 🚀 راهنمای کامل راه‌اندازی دیتابیس Timesheet

## 📁 ساختار پوشه‌ها

```
createDB/
├── production/          ✅ فایل‌های محیط واقعی
│   └── SETUP-PRODUCTION.sql
│
├── testing/            🧪 فایل‌های محیط تستی
│   ├── SETUP-TESTING.sql
│   └── simple-data.sql
│
├── archive/            📦 فایل‌های قدیمی
│   └── (فایل‌های 01-15)
│
└── docs/               📚 مستندات
    ├── database-overview.html
    └── راهنماها
```

---

## 🎯 محیط واقعی (Production)

### روش 1: SQL Server Management Studio (توصیه می‌شود)

1. **باز کردن SSMS**
2. **اتصال به SQL Server**
3. **باز کردن فایل:**
   ```
   createDB/production/SETUP-PRODUCTION.sql
   ```
4. **اجرا (F5 یا Execute)**

### روش 2: Command Line

```powershell
cd C:\Users\Masood\StudioProjects\timesheet-back\createDB\production

sqlcmd -S localhost -d UMD -i SETUP-PRODUCTION.sql
```

### روش 3: از PowerShell با یک دستور

```powershell
Invoke-Sqlcmd -ServerInstance "localhost" -Database "UMD" -InputFile "C:\Users\Masood\StudioProjects\timesheet-back\createDB\production\SETUP-PRODUCTION.sql"
```

---

## 🧪 محیط تستی (Testing)

### گام 1: ساخت جداول + داده‌های تستی

```powershell
cd C:\Users\Masood\StudioProjects\timesheet-back\createDB\testing

sqlcmd -S localhost -d UMD -i SETUP-TESTING.sql
```

یا در SSMS:
```sql
USE UMD;
GO
:r C:\Users\Masood\StudioProjects\timesheet-back\createDB\testing\SETUP-TESTING.sql
```

---

## ✅ بررسی نتیجه

بعد از اجرا، این کوئری‌ها را اجرا کنید:

```sql
-- بررسی جداول ایجاد شده
SELECT name 
FROM sys.tables 
WHERE name IN (
    'Admins', 'UserContractHours', 'UserProjectAccess',
    'DailyDetails', 'DailyProjectTasks', 'DailyPersonalCarCosts',
    'MonthlyGymCosts', 'MonthlyReports', 'MonthPeriodSettings'
)
ORDER BY name;

-- بررسی تعداد رکوردها (برای Testing)
SELECT 
    'UserContractHours' AS TableName, COUNT(*) AS RecordCount FROM UserContractHours
UNION ALL
SELECT 'UserProjectAccess', COUNT(*) FROM UserProjectAccess
UNION ALL
SELECT 'DailyDetails', COUNT(*) FROM DailyDetails
UNION ALL
SELECT 'DailyProjectTasks', COUNT(*) FROM DailyProjectTasks
UNION ALL
SELECT 'MonthlyReports', COUNT(*) FROM MonthlyReports;
```

---

## 🔄 اجرای مجدد

### پاک کردن همه داده‌ها (DANGER!)

```sql
-- حذف تمام داده‌ها (بدون حذف جداول)
TRUNCATE TABLE DailyProjectTasks;
TRUNCATE TABLE DailyPersonalCarCosts;
DELETE FROM DailyDetails;
DELETE FROM MonthlyGymCosts;
DELETE FROM MonthlyReports;
DELETE FROM UserProjectAccess;
DELETE FROM UserContractHours;
DELETE FROM MonthPeriodSettings;
DELETE FROM Admins;
```

### حذف کامل جداول

```sql
-- حذف جداول (برای شروع از صفر)
DROP TABLE IF EXISTS DailyProjectTasks;
DROP TABLE IF EXISTS DailyPersonalCarCosts;
DROP TABLE IF EXISTS DailyDetails;
DROP TABLE IF EXISTS MonthlyGymCosts;
DROP TABLE IF EXISTS MonthlyReports;
DROP TABLE IF EXISTS UserProjectAccess;
DROP TABLE IF EXISTS UserContractHours;
DROP TABLE IF EXISTS MonthPeriodSettings;
DROP TABLE IF EXISTS Admins;

-- سپس دوباره SETUP-PRODUCTION.sql را اجرا کنید
```

---

## 📊 مراحل بعد از نصب (Production)

### 1. ایجاد اولین ادمین

```sql
-- تولید PasswordHash (از bcrypt در برنامه استفاده کنید)
INSERT INTO Admins (Username, PasswordHash, FullName, Email, IsActive)
VALUES (
    'admin',
    '$2b$10$YourHashedPasswordHere',
    N'مدیر اصلی',
    'admin@company.ir',
    1
);
```

### 2. تعریف قراردادهای کاری

```sql
-- مثال: قرارداد برای کارمند با UserId = 1001
INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours)
VALUES (1001, '08:00:00', '17:00:00', 176);
```

### 3. تعریف دسترسی‌های پروژه

```sql
-- مثال: کارمند 1001 دسترسی به پروژه‌های 100 و 101
INSERT INTO UserProjectAccess (UserId, ProjectId)
VALUES 
    (1001, 100),
    (1001, 101);
```

---

## 🆘 رفع مشکلات

### مشکل: "Database 'UMD' does not exist"

**راه‌حل:**
```sql
CREATE DATABASE UMD;
GO
```

### مشکل: "Table already exists"

**راه‌حل:**  
فایل `SETUP-PRODUCTION.sql` خودش چک می‌کند. اگر جدول وجود دارد، پیام هشدار می‌دهد و ادامه می‌دهد.

### مشکل: "Permission denied"

**راه‌حل:**  
با یک کاربر admin به SQL Server متصل شوید.

### مشکل: خطای Foreign Key

**راه‌حل:**  
ابتدا مطمئن شوید جداول پایه UMD (Users, Groups, Projects) وجود دارند.

---

## 🎯 سناریوهای مختلف

### سناریو 1: شروع کاملاً از صفر

```powershell
# 1. ساخت دیتابیس
sqlcmd -S localhost -Q "CREATE DATABASE UMD"

# 2. ساخت جداول پایه (اگر ندارید)
# اجرای 01-create-umd-base-tables.sql

# 3. ساخت جداول Timesheet
cd createDB/production
sqlcmd -S localhost -d UMD -i SETUP-PRODUCTION.sql
```

### سناریو 2: محیط تستی برای توسعه

```powershell
cd createDB/testing
sqlcmd -S localhost -d UMD -i SETUP-TESTING.sql
```

### سناریو 3: انتقال از محیط تستی به واقعی

```sql
-- 1. در محیط واقعی، فقط جداول را بسازید
:r production/SETUP-PRODUCTION.sql

-- 2. داده‌های واقعی را از منابع خود وارد کنید
-- (نه از testing)
```

---

## 📱 Backup و Restore

### Backup قبل از تغییرات

```sql
BACKUP DATABASE UMD 
TO DISK = 'C:\Backup\UMD_Before_Timesheet.bak'
WITH FORMAT;
```

### Restore در صورت مشکل

```sql
USE master;
GO

RESTORE DATABASE UMD 
FROM DISK = 'C:\Backup\UMD_Before_Timesheet.bak'
WITH REPLACE;
```

---

## 🔐 نکات امنیتی (Production)

1. ✅ **هرگز** از داده‌های تستی در Production استفاده نکنید
2. ✅ Password های Admin را با bcrypt hash کنید
3. ✅ قبل از هر تغییر، Backup بگیرید
4. ✅ دسترسی‌های دیتابیس را محدود کنید
5. ✅ لاگ‌های SQL Server را مانیتور کنید

---

## 📞 پشتیبانی

مشکلی پیش آمد؟

1. 📖 **مستندات:** `docs/database-overview.html` را باز کنید
2. 🔍 **لاگ‌ها:** خروجی sqlcmd را بررسی کنید
3. 📧 **تماس:** dev@company.ir

---

## 🎉 موفق باشید!

با اجرای **یک فایل** `SETUP-PRODUCTION.sql`، تمام جداول آماده است! 🚀
