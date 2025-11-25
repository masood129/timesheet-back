-- =============================================
-- کوئری 1: ساخت جدول‌های موجود در UMD برای محیط تستی
-- =============================================
-- این اسکریپت برای ایجاد جدول‌های users, projects, groups, groupManagers در محیط تستی است
-- این جدول‌ها در محیط واقعی از قبل موجود هستند و این فقط برای تست استفاده می‌شود
-- =============================================

USE UMD;
GO

-- بررسی و حذف جدول‌های قبلی در صورت وجود (فقط برای محیط تست)
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL
    DROP TABLE dbo.users;
IF OBJECT_ID('dbo.groupManagers', 'U') IS NOT NULL
    DROP TABLE dbo.groupManagers;
IF OBJECT_ID('dbo.projects', 'U') IS NOT NULL
    DROP TABLE dbo.projects;
IF OBJECT_ID('dbo.groups', 'U') IS NOT NULL
    DROP TABLE dbo.groups;
GO

-- =============================================
-- جدول users: اطلاعات کاربران
-- =============================================
CREATE TABLE users (
    personalid INT PRIMARY KEY,                      -- کد پرسنلی کاربر (کلید اصلی)
    farsifirstname NVARCHAR(100) NOT NULL,           -- نام فارسی
    farsilastname NVARCHAR(100) NOT NULL,            -- نام خانوادگی فارسی
    email NVARCHAR(256) NULL,                        -- ایمیل
    id NVARCHAR(100) NOT NULL UNIQUE,                -- یوزرنیم کاربر (مانند amir.shayei)
    directAdmin NVARCHAR(200) NULL,                  -- نام و نام خانوادگی مدیر مستقیم
    groups NVARCHAR(100) NULL,                       -- نام فارسی گروه کاربر
    IsActive BIT NOT NULL DEFAULT 1,                 -- وضعیت فعال بودن (0 یا 1)
    directAdminid INT NULL,                          -- کد پرسنلی مدیر کاربر
    groupid INT NULL                                 -- کد گروه کاربر
);
GO

-- ایندکس برای بهبود جستجو
CREATE INDEX IX_users_IsActive ON users(IsActive);
CREATE INDEX IX_users_groupid ON users(groupid);
CREATE INDEX IX_users_directAdminid ON users(directAdminid);
GO

-- =============================================
-- جدول projects: اطلاعات پروژه‌ها
-- =============================================
CREATE TABLE projects (
    id INT PRIMARY KEY,                              -- کد پروژه (کلید اصلی)
    projectName NVARCHAR(100) NOT NULL               -- نام فارسی پروژه
);
GO

-- =============================================
-- جدول groups: اطلاعات گروه‌ها
-- =============================================
CREATE TABLE groups (
    id INT PRIMARY KEY,                              -- کد گروه (کلید اصلی)
    groupname NVARCHAR(100) NOT NULL UNIQUE,         -- نام فارسی گروه
    managerID INT NOT NULL                           -- کد پرسنلی مدیر گروه
);
GO

-- ایندکس برای بهبود جستجو
CREATE INDEX IX_groups_managerID ON groups(managerID);
GO

-- =============================================
-- جدول groupManagers: اطلاعات مدیران گروه
-- =============================================
CREATE TABLE groupManagers (
    personalId INT PRIMARY KEY,                      -- کد پرسنلی مدیر گروه
    firstname NVARCHAR(100) NOT NULL,                -- نام فارسی
    lastname NVARCHAR(100) NOT NULL,                 -- نام خانوادگی فارسی
    email NVARCHAR(256) NULL,                        -- ایمیل
    groupname NVARCHAR(100) NOT NULL                 -- نام گروه
);
GO

-- =============================================
-- پیام موفقیت
-- =============================================
PRINT N'✓ جدول‌های users, projects, groups, groupManagers با موفقیت در دیتابیس UMD ایجاد شدند.';
PRINT N'✓ این جدول‌ها برای محیط تستی طراحی شده‌اند.';
PRINT N'✓ مرحله بعدی: اجرای کوئری 02-UMD-app-tables.sql برای ساخت جدول‌های برنامه';
GO
