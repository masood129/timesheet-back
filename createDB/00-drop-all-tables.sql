-- =============================================
-- کوئری حذف تمام جدول‌ها، Triggers، Functions و Stored Procedures
-- =============================================
-- ⚠️ هشدار: این اسکریپت تمام جدول‌ها و داده‌ها را حذف می‌کند
-- فقط در محیط تستی استفاده کنید!
-- =============================================

USE UMD;
GO

PRINT N'⚠️ در حال حذف تمام اشیاء دیتابیس...';
GO

-- =============================================
-- حذف Triggers
-- =============================================
IF OBJECT_ID('dbo.trg_MonthPeriodSettings_UpdatedAt', 'TR') IS NOT NULL
BEGIN
    DROP TRIGGER dbo.trg_MonthPeriodSettings_UpdatedAt;
    PRINT N'✓ Trigger: trg_MonthPeriodSettings_UpdatedAt حذف شد';
END
GO

-- =============================================
-- حذف Stored Procedures
-- =============================================
IF OBJECT_ID('dbo.sp_GetYearMonthPeriods', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_GetYearMonthPeriods;
    PRINT N'✓ Stored Procedure: sp_GetYearMonthPeriods حذف شد';
END
GO

IF OBJECT_ID('dbo.sp_GetMonthPeriod', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_GetMonthPeriod;
    PRINT N'✓ Stored Procedure: sp_GetMonthPeriod حذف شد';
END
GO

-- =============================================
-- حذف Functions
-- =============================================
IF OBJECT_ID('dbo.fn_IsMonthEditable', 'FN') IS NOT NULL
BEGIN
    DROP FUNCTION dbo.fn_IsMonthEditable;
    PRINT N'✓ Function: fn_IsMonthEditable حذف شد';
END
GO

IF OBJECT_ID('dbo.fn_GetMonthLength', 'FN') IS NOT NULL
BEGIN
    DROP FUNCTION dbo.fn_GetMonthLength;
    PRINT N'✓ Function: fn_GetMonthLength حذف شد';
END
GO

-- =============================================
-- حذف جدول‌های برنامه (به ترتیب وابستگی)
-- =============================================
IF OBJECT_ID('dbo.MonthlyReports', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.MonthlyReports;
    PRINT N'✓ جدول MonthlyReports حذف شد';
END
GO

IF OBJECT_ID('dbo.MonthlyGymCosts', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.MonthlyGymCosts;
    PRINT N'✓ جدول MonthlyGymCosts حذف شد';
END
GO

IF OBJECT_ID('dbo.DailyPersonalCarCosts', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.DailyPersonalCarCosts;
    PRINT N'✓ جدول DailyPersonalCarCosts حذف شد';
END
GO

IF OBJECT_ID('dbo.DailyProjectTasks', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.DailyProjectTasks;
    PRINT N'✓ جدول DailyProjectTasks حذف شد';
END
GO

IF OBJECT_ID('dbo.DailyDetails', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.DailyDetails;
    PRINT N'✓ جدول DailyDetails حذف شد';
END
GO

IF OBJECT_ID('dbo.UserContractHours', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.UserContractHours;
    PRINT N'✓ جدول UserContractHours حذف شد';
END
GO

IF OBJECT_ID('dbo.UserProjectAccess', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.UserProjectAccess;
    PRINT N'✓ جدول UserProjectAccess حذف شد';
END
GO

IF OBJECT_ID('dbo.MonthPeriodSettings', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.MonthPeriodSettings;
    PRINT N'✓ جدول MonthPeriodSettings حذف شد';
END
GO

IF OBJECT_ID('dbo.Admins', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.Admins;
    PRINT N'✓ جدول Admins حذف شد';
END
GO

-- =============================================
-- حذف جدول‌های پایه UMD (فقط برای محیط تستی)
-- =============================================
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.users;
    PRINT N'✓ جدول users حذف شد';
END
GO

IF OBJECT_ID('dbo.groupManagers', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.groupManagers;
    PRINT N'✓ جدول groupManagers حذف شد';
END
GO

IF OBJECT_ID('dbo.projects', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.projects;
    PRINT N'✓ جدول projects حذف شد';
END
GO

IF OBJECT_ID('dbo.groups', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.groups;
    PRINT N'✓ جدول groups حذف شد';
END
GO

-- =============================================
-- پیام نهایی
-- =============================================
PRINT N'';
PRINT N'========================================';
PRINT N'✓ تمام اشیاء دیتابیس با موفقیت حذف شدند';
PRINT N'========================================';
GO
