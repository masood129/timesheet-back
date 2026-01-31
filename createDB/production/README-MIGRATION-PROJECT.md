# راهنمای مایگریشن ساختار جدول Projects

## تغییرات ساختار جدول

ساختار جدول `projects` به شکل زیر تغییر کرده است:

### فیلدهای حذف شده:
- ❌ `DirectAdminId` (INT, NULL) - مدیر مستقیم پروژه

### فیلدهای جدید اضافه شده:
- ✅ `FinanceCenterCost` (INT, NULL) - هزینه مرکز مالی
- ✅ `BaseCenterCost` (NVARCHAR(50), NULL) - هزینه مرکز پایه  
- ✅ `BLine` (NVARCHAR(50), NULL) - BLine
- ✅ `SystemType` (NVARCHAR(50), NULL) - نوع سیستم
- ✅ `ContractType` (NVARCHAR(50), NULL) - نوع قرارداد
- ✅ `CenterType` (NVARCHAR(50), NULL) - نوع مرکز

### فیلدهای تغییر یافته:
- 🔄 `projectName` (NVARCHAR(50), NULL) - قبلاً NVARCHAR(100) و NOT NULL بود

### فیلدهای بدون تغییر:
- ⚪ `id` (INT, PRIMARY KEY) - کد پروژه
- ⚪ `IsActive` (BIT, NOT NULL) - وضعیت فعال/غیرفعال

## نحوه اجرای Migration

### روش 1: اجرای مستقیم در SQL Server Management Studio

1. فایل `MIGRATE-PROJECT-STRUCTURE.sql` را باز کنید
2. اتصال به دیتابیس `UMD` را برقرار کنید
3. کل اسکریپت را اجرا کنید (F5)
4. پیام‌های موفقیت را بررسی کنید

### روش 2: اجرا از طریق Command Line

```bash
sqlcmd -S localhost -d UMD -i MIGRATE-PROJECT-STRUCTURE.sql
```

## بررسی قبل از اجرا

قبل از اجرای migration، موارد زیر را بررسی کنید:

1. **پشتیبان‌گیری**: حتماً از دیتابیس backup بگیرید
   ```sql
   BACKUP DATABASE [UMD] TO DISK = 'C:\Backup\UMD_Before_Migration.bak'
   ```

2. **بررسی رکوردها**: تعداد رکوردهای فعلی را چک کنید
   ```sql
   SELECT COUNT(*) FROM projects;
   ```

3. **بررسی استفاده از DirectAdminId**: ببینید آیا از این فیلد استفاده می‌شود
   ```sql
   SELECT COUNT(*) FROM projects WHERE DirectAdminId IS NOT NULL;
   ```

## تغییرات لازم در کد

بعد از اجرای migration، تغییرات زیر در کد اعمال شده است:

### Backend (Node.js)

✅ **فایل‌های بروزرسانی شده:**
- `controllers/admin/projectManagementController.js` - کوئری‌های SELECT, INSERT, UPDATE
- `routes/project.routes.js` - API endpoints برای CRUD

### Frontend (Flutter)

✅ **فایل‌های بروزرسانی شده:**
- `lib/data/models/models.dart` - مدل Project
- `lib/controllers/project_controller.dart` - کنترلر مدیریت پروژه
- `lib/views/widgets/project_dialog.dart` - فرم ایجاد/ویرایش پروژه
- `lib/views/pages/projects_page.dart` - صفحه نمایش لیست پروژه‌ها

## تست بعد از Migration

بعد از اجرای migration، موارد زیر را تست کنید:

1. **ایجاد پروژه جدید** با فیلدهای جدید
2. **ویرایش پروژه موجود** و اضافه کردن اطلاعات جدید
3. **مشاهده لیست پروژه‌ها** در admin panel
4. **جستجو در پروژه‌ها**

## Rollback (برگشت به حالت قبل)

اگر نیاز به برگشت داشتید:

```sql
-- حذف فیلدهای جدید
ALTER TABLE projects DROP COLUMN FinanceCenterCost;
ALTER TABLE projects DROP COLUMN BaseCenterCost;
ALTER TABLE projects DROP COLUMN BLine;
ALTER TABLE projects DROP COLUMN SystemType;
ALTER TABLE projects DROP COLUMN ContractType;
ALTER TABLE projects DROP COLUMN CenterType;

-- اضافه کردن فیلد قدیمی
ALTER TABLE projects ADD DirectAdminId INT NULL;

-- برگرداندن projectName به NOT NULL
ALTER TABLE projects ALTER COLUMN projectName NVARCHAR(100) NOT NULL;
```

## سوالات متداول

### Q: آیا داده‌های قبلی از بین می‌روند؟
A: خیر، فقط فیلد `DirectAdminId` حذف می‌شود. باقی داده‌ها حفظ می‌شوند.

### Q: آیا نیاز به توقف سرویس است؟
A: بهتر است در زمان کم‌کاربری migration را اجرا کنید، اما الزامی نیست.

### Q: چقدر زمان می‌برد؟
A: معمولاً کمتر از 1 دقیقه، بسته به تعداد رکوردها.

## پشتیبانی

در صورت مشکل:
1. پیام‌های خطا را بررسی کنید
2. از backup استفاده کنید تا دیتابیس را restore کنید
3. لاگ‌های اجرا را بررسی کنید

---

**تاریخ ایجاد:** 2026-01-31  
**نسخه:** 1.0
