-- =============================================
-- TESTING - ساخت جداول + داده‌های تستی کامل
-- =============================================
-- این فایل تمام جداول و داده‌های تستی را ایجاد می‌کند
-- =============================================

USE UMD;
GO

PRINT N'';
PRINT N'========================================';
PRINT N'   ساخت جداول + داده تستی - TESTING';
PRINT N'========================================';
PRINT N'';

PRINT N'→ مرحله 1: ایجاد جداول...';
PRINT N'   ابتدا SETUP-PRODUCTION.sql را از پوشه production اجرا کنید';
PRINT N'';

PRINT N'→ مرحله 2: بروزرسانی ساختار پروژه‌ها...';
PRINT N'   فایل MIGRATE-PROJECT-STRUCTURE-TEST.sql را اجرا کنید';
PRINT N'   یا به صورت دستی:';
-- :r MIGRATE-PROJECT-STRUCTURE-TEST.sql
PRINT N'';

PRINT N'→ مرحله 3: ایجاد پروژه‌های تستی...';
-- :r simple-projects.sql
PRINT N'   فایل simple-projects.sql را اجرا کنید';
PRINT N'';

PRINT N'→ مرحله 4: وارد کردن داده‌های تستی...';
-- :r simple-data.sql
PRINT N'   فایل simple-data.sql را اجرا کنید';
PRINT N'';

PRINT N'========================================';
PRINT N'نکته: برای اجرای خودکار همه فایل‌ها:';
PRINT N'';
PRINT N'  1. SETUP-PRODUCTION.sql';
PRINT N'  2. MIGRATE-PROJECT-STRUCTURE-TEST.sql';
PRINT N'  3. simple-projects.sql';
PRINT N'  4. simple-data.sql';
PRINT N'========================================';
GO
