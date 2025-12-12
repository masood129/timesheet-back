# راهنمای سریع استفاده از فایل‌های ساده

## 🎯 فایل‌های ساده برای محیط واقعی

این فایل‌ها برای استفاده آسان در محیط واقعی (Production) طراحی شده‌اند.

---

## 📁 فایل‌های موجود

### 1. `simple-contracts.sql` ⏰
**قراردادهای کاری**
- 5 کارمند نمونه
- انواع قرارداد: تمام وقت، نیمه وقت، دورکار
- کوتاه و ساده

### 2. `simple-access.sql` 🔑
**دسترسی به پروژه‌ها**
- تعریف دسترسی کارمندان
- ارتباط کاربر-پروژه
- فقط 10 رکورد

### 3. `simple-daily.sql` 📅
**جزئیات روزانه**
- 3 روز کاری
- حضور و غیاب
- وظایف پروژه
- 18 رکورد کل

### 4. `simple-monthly.sql` 📊
**گزارش ماهیانه**
- یک گزارش نمونه
- آماده برای تست
- قابل تکرار

### 5. `simple-costs.sql` 💰
**هزینه‌ها**
- هزینه ماشین
- هزینه ورزش
- نمونه‌های واقعی

---

## 🚀 نحوه استفاده

### گام 1: اجرای ترتیبی

```sql
-- در SQL Server Management Studio
USE UMD;
GO

-- 1. ابتدا قراردادها
:r simple-contracts.sql

-- 2. سپس دسترسی‌ها
:r simple-access.sql

-- 3. جزئیات روزانه
:r simple-daily.sql

-- 4. گزارش ماهیانه
:r simple-monthly.sql

-- 5. هزینه‌ها (اختیاری)
:r simple-costs.sql
```

### گام 2: از Command Line

```bash
cd createDB

sqlcmd -S localhost -d UMD -i simple-contracts.sql
sqlcmd -S localhost -d UMD -i simple-access.sql
sqlcmd -S localhost -d UMD -i simple-daily.sql
sqlcmd -S localhost -d UMD -i simple-monthly.sql
sqlcmd -S localhost -d UMD -i simple-costs.sql
```

---

## ✅ بررسی نتیجه

بعد از اجرا، این کوئری‌ها را اجرا کنید:

```sql
-- بررسی قراردادها
SELECT * FROM UserContractHours WHERE UserId BETWEEN 2001 AND 2005;

-- بررسی دسترسی‌ها
SELECT * FROM UserProjectAccess WHERE UserId BETWEEN 2001 AND 2005;

-- بررسی جزئیات روزانه
SELECT UserId, Date, ArrivalTime, LeaveTime 
FROM DailyDetails 
WHERE UserId BETWEEN 2001 AND 2005 
ORDER BY Date DESC;

-- بررسی وظایف
SELECT UserId, Date, ProjectId, Duration 
FROM DailyProjectTasks 
WHERE UserId BETWEEN 2001 AND 2005;

-- بررسی گزارش‌ها
SELECT * FROM MonthlyReports WHERE UserId = 2001;
```

---

## 🔄 اجرای مجدد

اگر می‌خواهید دوباره اجرا کنید:

```sql
-- همه فایل‌ها داده‌های قبلی را پاک می‌کنند
-- پس می‌توانید دوباره اجرا کنید بدون نگرانی

-- یا می‌توانید دستی پاک کنید:
DELETE FROM DailyProjectTasks WHERE UserId BETWEEN 2001 AND 2005;
DELETE FROM DailyDetails WHERE UserId BETWEEN 2001 AND 2005;
DELETE FROM MonthlyReports WHERE UserId BETWEEN 2001 AND 2005;
DELETE FROM MonthlyGymCosts WHERE UserId BETWEEN 2001 AND 2005;
DELETE FROM DailyPersonalCarCosts WHERE UserId BETWEEN 2001 AND 2005;
DELETE FROM UserProjectAccess WHERE UserId BETWEEN 2001 AND 2005;
DELETE FROM UserContractHours WHERE UserId BETWEEN 2001 AND 2005;
```

---

## 📝 سفارشی‌سازی

### تغییر UserID ها

در هر فایل، می‌توانید UserID ها را تغییر دهید:

```sql
-- قبل:
VALUES (2001, ...

-- بعد (با UserID واقعی خودتان):
VALUES (1234, ...
```

### تغییر تاریخ‌ها

```sql
-- در simple-daily.sql:
DECLARE @StartDate DATE = '2024-12-16';  -- تاریخ دلخواه
```

### تغییر پروژه‌ها

```sql
-- در simple-access.sql:
VALUES
    (2001, 500),  -- ProjectId دلخواه
    (2001, 501);
```

---

## ⚠️ نکات مهم

1. ✅ این فایل‌ها **ایمن** هستند (داده‌های قبلی را پاک می‌کنند)
2. ✅ اندازه کوچک: هر فایل کمتر از 100 خط
3. ✅ قابل فهم و ویرایش آسان
4. ✅ برای محیط واقعی مناسب‌تر از فایل‌های بزرگ

---

## 🎯 یک مثال کامل

```sql
-- یک سناریوی کامل:

-- 1. ایجاد قرارداد برای کارمند جدید
INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours)
VALUES (3001, '09:00:00', '17:00:00', 160);

-- 2. دسترسی به پروژه‌ها
INSERT INTO UserProjectAccess (UserId, ProjectId)
VALUES (3001, 100), (3001, 101);

-- 3. ثبت یک روز کاری
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost)
VALUES (GETDATE(), 3001, '09:05:00', '17:10:00', 45, N'روز اول کاری', 50000, 50000);

-- 4. ثبت وظایف
INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
VALUES 
    (GETDATE(), 3001, 100, 240, N'یادگیری سیستم'),
    (GETDATE(), 3001, 101, 180, N'کار اولیه');
```

---

## 📞 پشتیبانی

سوال دارید؟
- فایل `database-overview.html` را باز کنید
- یا `EOSDB-SAMPLES-README.md` را مطالعه کنید

---

**موفق باشید! 🎉**
