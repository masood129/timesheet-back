# راهنمای جامع راه‌اندازی دیتابیس UMD

این راهنما به شما کمک می‌کند تا دیتابیس UMD را برای برنامه timesheet به صورت کامل راه‌اندازی کنید.

> **📝 نکته:** فایل‌های قدیمی به پوشه `oldquery` منتقل شده‌اند.

## 📋 فهرست فایل‌های SQL

در پوشه `createDB` فایل‌های زیر ایجاد شده است:

| فایل | توضیحات | کاربرد |
|------|---------|--------|
| `00-drop-all-tables.sql` | حذف تمام جدول‌ها و اشیاء | **⚠️ فقط محیط تستی** |
| `01-create-umd-base-tables.sql` | ساخت جدول‌های پایه UMD | **فقط محیط تستی** |
| `02-create-app-tables.sql` | ساخت جدول‌های برنامه | **تستی و پروداکشن** |
| `03-insert-umd-test-data.sql` | درج داده‌های تستی UMD | **فقط محیط تستی** |
| `04-insert-app-test-data.sql` | درج داده‌های تستی برنامه | **فقط محیط تستی** |

---

## 🎯 سناریوهای مختلف راه‌اندازی

### سناریو 1️⃣: راه‌اندازی محیط تستی (بدون جدول‌های واقعی UMD)

اگر می‌خواهید یک محیط تستی کامل بسازید که جدول‌های UMD را هم شامل می‌شود:

```sql
-- اختیاری: در صورت نیاز به حذف جدول‌های قبلی
-- اجرا کنید: 00-drop-all-tables.sql

-- مرحله 1: ساخت جدول‌های پایه UMD
-- اجرا کنید: 01-create-umd-base-tables.sql

-- مرحله 2: ساخت جدول‌های برنامه
-- اجرا کنید: 02-create-app-tables.sql

-- مرحله 3: درج داده‌های تستی UMD
-- اجرا کنید: 03-insert-umd-test-data.sql

-- مرحله 4: درج داده‌های تستی برنامه
-- اجرا کنید: 04-insert-app-test-data.sql
```

**نتیجه:** یک دیتابیس تستی کامل با داده‌های نمونه آماده خواهد بود.

---

### سناریو 2️⃣: راه‌اندازی محیط پروداکشن (با جدول‌های واقعی UMD)

اگر در شبکه شما جدول‌های `users`, `groups`, `projects`, `groupManagers` از قبل موجود هستند:

```sql
-- مرحله 1: فقط ساخت جدول‌های برنامه
-- اجرا کنید: 02-create-app-tables.sql

-- مرحله 2: در صورت نیاز، داده‌های تستی
-- (اختیاری) اجرا کنید: 04-insert-app-test-data.sql
```

**توجه مهم:** 
- فایل `00-drop-all-tables.sql` را **هرگز اجرا نکنید** (داده‌های واقعی حذف می‌شوند)
- فایل `01-create-umd-base-tables.sql` را **اجرا نکنید** (این فقط برای تست است)
- فایل `03-insert-umd-test-data.sql` را **اجرا نکنید** (شما داده‌های واقعی دارید)

---

## 📊 ساختار جدول‌های ایجاد شده

### جدول‌های موجود در UMD (از قبل موجود):
- ✅ `users` - اطلاعات کاربران
- ✅ `groups` - اطلاعات گروه‌ها
- ✅ `projects` - اطلاعات پروژه‌ها
- ✅ `groupManagers` - اطلاعات مدیران گروه

### جدول‌های جدید برنامه (توسط کوئری 2 ساخته می‌شوند):
- 🆕 `Admins` - مدیران سیستم
- 🆕 `UserProjectAccess` - دسترسی کاربران به پروژه‌ها
- 🆕 `UserContractHours` - قراردادهای ساعت کاری
- 🆕 `DailyDetails` - جزئیات روزانه کاربران
- 🆕 `DailyProjectTasks` - وظایف پروژه روزانه
- 🆕 `DailyPersonalCarCosts` - هزینه‌های ماشین شخصی
- 🆕 `MonthlyGymCosts` - هزینه‌های ورزش ماهیانه
- 🆕 `MonthlyReports` - گزارش‌های ماهیانه
- 🆕 `MonthPeriodSettings` - تنظیمات بازه ماه‌ها

### Functionها و Stored Procedureها:
- 📌 `fn_GetMonthLength` - محاسبه تعداد روزهای یک ماه شمسی
- 📌 `fn_IsMonthEditable` - بررسی قابلیت ویرایش ماه
- 📌 `sp_GetMonthPeriod` - دریافت بازه یک ماه خاص
- 📌 `sp_GetYearMonthPeriods` - دریافت بازه تمام ماه‌های سال

---

## 🔧 نحوه اجرای فایل‌ها

### روش 1: از طریق SQL Server Management Studio (SSMS)

```text
1. SSMS را باز کنید
2. به سرور دیتابیس خود متصل شوید
3. File → Open → File را انتخاب کنید
4. فایل SQL مورد نظر را باز کنید
5. دکمه Execute (F5) را بزنید
```

### روش 2: از طریق sqlcmd (Command Line)

```bash
# مثال برای اجرای کوئری 2
sqlcmd -S localhost -d UMD -i "02-create-app-tables.sql"

# با احراز هویت Windows
sqlcmd -S localhost -d UMD -E -i "02-create-app-tables.sql"

# با username و password
sqlcmd -S localhost -d UMD -U sa -P YourPassword -i "02-create-app-tables.sql"
```

---

## ✅ بررسی موفقیت‌آمیز بودن نصب

بعد از اجرای کوئری‌ها، این دستورات را اجرا کنید تا مطمئن شوید همه چیز درست کار می‌کند:

```sql
-- بررسی تعداد جدول‌ها
SELECT COUNT(*) AS تعداد_جدول_ها
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE';

-- لیست تمام جدول‌ها
SELECT TABLE_NAME AS نام_جدول
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- بررسی Stored Procedures
SELECT ROUTINE_NAME AS نام_SP
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_TYPE = 'PROCEDURE';

-- بررسی Functions
SELECT ROUTINE_NAME AS نام_Function
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_TYPE = 'FUNCTION';

-- تست یک stored procedure
EXEC sp_GetMonthPeriod @Year = 1404, @Month = 9;
```

---

## 📝 توضیحات تکمیلی

### مدیریت بازه ماه‌ها

سیستم به طور خودکار بازه‌های ماه‌ها را محاسبه می‌کند. اما شما می‌توانید برای هر ماه، بازه سفارشی تعریف کنید از طریق پنل ادمین.

برای دریافت بازه یک ماه خاص:
```sql
EXEC sp_GetMonthPeriod @Year = 1404, @Month = 2;
```

برای دریافت تمام بازه‌های یک سال:
```sql
EXEC sp_GetYearMonthPeriods @Year = 1404;
```

### وضعیت‌های گزارش ماهیانه

گزارش‌های ماهیانه می‌توانند این وضعیت‌ها را داشته باشند:

1. `draft` - پیش‌نویس
2. `submitted_to_group_manager` - ارسال شده به مدیر گروه
3. `submitted_to_general_manager` - ارسال شده به مدیر کل
4. `submitted_to_finance` - ارسال شده به امور مالی
5. `approved` - تایید شده

---

## ⚠️ نکات مهم

### برای محیط تستی:
- ✅ اگر لازم است، ابتدا فایل 00 را اجرا کنید (حذف جدول‌های قبلی)
- ✅ فایل‌های 01، 02، 03، 04 را به ترتیب اجرا کنید
- ✅ داده‌های تستی کامل دارید

### برای محیط پروداکشن:
- ❌ **هرگز** فایل 00 را اجرا نکنید (خطرناک!)
- ❌ فایل‌های 01 و 03 را اجرا **نکنید** (جدول‌های UMD دارید)
- ✅ فقط فایل 02 را اجرا کنید
- ⚠️ اگر نیاز به تست دارید، می‌توانید فایل 04 را اجرا کنید

### امنیت:
- 🔐 حتما PasswordHash واقعی برای ادمین‌ها استفاده کنید
- 🔐 در محیط پروداکشن، داده‌های تستی را حذف کنید

---

## 🆘 رفع مشکلات رایج

### خطا: "There is already an object named 'users' in the database"
**راه حل:** این جدول از قبل موجود است. در محیط پروداکشن فایل 01 را اجرا نکنید. اگر می‌خواهید از نو بسازید، ابتدا فایل 00 را اجرا کنید.

### خطا: "Invalid object name 'users'"
**راه حل:** ابتدا باید جدول users را بسازید (فایل 01-create-umd-base-tables.sql برای تست یا جدول واقعی شما).

### داده‌های تستی نمایش داده نمی‌شوند
**راه حل:** مطمئن شوید که فایل‌های 03 و 04 را اجرا کرده‌اید.

---

## 📞 پشتیبانی

در صورت بروز هرگونه مشکل، پیام‌های خروجی SQL Server را بخوانید. هر کوئری پیام‌های راهنما دارد که به شما می‌گوید در چه مرحله‌ای هستید.

---

**تاریخ ایجاد:** 1404/09/05  
**نسخه:** 1.0.0
