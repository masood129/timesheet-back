# 🚀 راهنمای سریع اجرا در SSMS

## ⚡ ساده‌ترین راه (توصیه می‌شود)

### برای محیط واقعی (Production):

```
1. باز کردن SSMS
2. File → Open → File
3. انتخاب: createDB/production/SETUP-PRODUCTION.sql
4. F5 (Execute)
```

**تمام!** ✅ همه 9 جدول ساخته می‌شود.

---

### برای محیط تستی (Testing):

دو فایل را به ترتیب اجرا کنید:

**گام 1: ساخت جداول**
```
File → Open → production/SETUP-PRODUCTION.sql
F5
```

**گام 2: داده‌های تستی**
```
File → Open → testing/simple-data.sql
F5
```

**تمام!** ✅ جداول + داده‌های تستی آماده است.

---

## 🔧 استفاده از SQLCMD Mode (پیشرفته)

اگر می‌خواهید از فایل `SETUP-TESTING.sql` استفاده کنید:

### گام 1: ویرایش فایل
فایل `testing/SETUP-TESTING.sql` را باز کنید و خطوط زیر را uncomment کنید:

```sql
-- قبل:
-- :r C:\Users\Masood\StudioProjects\timesheet-back\createDB\production\SETUP-PRODUCTION.sql

-- بعد:
:r C:\Users\Masood\StudioProjects\timesheet-back\createDB\production\SETUP-PRODUCTION.sql
```

همینطور برای `simple-data.sql`:
```sql
-- قبل:
-- :r C:\Users\Masood\StudioProjects\timesheet-back\createDB\testing\simple-data.sql

-- بعد:
:r C:\Users\Masood\StudioProjects\timesheet-back\createDB\testing\simple-data.sql
```

### گام 2: فعال کردن SQLCMD Mode
```
Query → SQLCMD Mode ✅
```

### گام 3: اجرا
```
F5
```

---

## 💡 نکات مهم

### ⚠️ خطای "Cannot find directory"
اگر این خطا را دیدید:
```
A fatal scripting error occurred.
Cannot find directory in the path specified for ":r" command.
```

**راه‌حل:**
1. از مسیر **مطلق** استفاده کنید (نه نسبی)
2. یا فایل‌ها را **جداگانه** اجرا کنید (توصیه می‌شود)

---

## 🎯 مثال کامل

### سناریو: نصب از صفر در محیط واقعی

```
1. باز کردن SSMS
2. اتصال به SQL Server
3. File → Open → File
4. رفتن به: 
   C:\Users\Masood\StudioProjects\timesheet-back\createDB\production\
5. انتخاب: SETUP-PRODUCTION.sql
6. F5
7. ✅ Done!
```

---

## 📱 از Command Line (جایگزین)

اگر ترجیح می‌دهید از Command Line استفاده کنید:

```powershell
# Production
cd C:\Users\Masood\StudioProjects\timesheet-back\createDB
sqlcmd -S localhost -d UMD -i production\SETUP-PRODUCTION.sql

# Testing
sqlcmd -S localhost -d UMD -i production\SETUP-PRODUCTION.sql
sqlcmd -S localhost -d UMD -i testing\simple-data.sql
```

---

## ✅ بررسی موفقیت

بعد از اجرا:

```sql
-- چک کردن جداول
SELECT name FROM sys.tables 
WHERE name IN (
    'Admins', 'UserContractHours', 'UserProjectAccess',
    'DailyDetails', 'DailyProjectTasks', 'MonthlyReports'
)
ORDER BY name;

-- باید 9 جدول نمایش دهد
```

---

**موفق باشید! 🎉**
