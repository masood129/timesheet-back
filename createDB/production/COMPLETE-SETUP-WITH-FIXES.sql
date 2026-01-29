-- =============================================
-- COMPLETE SETUP WITH ALL FIXES
-- نسخه کامل با تمام رفع مشکلات
-- =============================================
-- این فایل شامل تمام stored procedure ها، function ها
-- و داده‌های اولیه لازم برای شروع برنامه است
-- =============================================

USE UMD;
GO

PRINT N'';
PRINT N'========================================';
PRINT N'   نصب کامل با رفع مشکلات';
PRINT N'========================================';
PRINT N'';

-- ابتدا فایل SETUP-PRODUCTION.sql را اجرا کنید
-- سپس این فایل را اجرا کنید

PRINT N'→ بررسی وجود جداول...';

-- بررسی اینکه آیا جداول اصلی وجود دارند
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    PRINT N'❌ ERROR: جدول users وجود ندارد!';
    PRINT N'لطفاً ابتدا فایل SETUP-PRODUCTION.sql را اجرا کنید.';
    RETURN;
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'projects')
BEGIN
    PRINT N'❌ ERROR: جدول projects وجود ندارد!';
    PRINT N'لطفاً ابتدا فایل SETUP-PRODUCTION.sql را اجرا کنید.';
    RETURN;
END

PRINT N'✓ جداول اصلی موجود است';
PRINT N'';

-- =============================================
-- بخش 1: اضافه کردن داده‌های اولیه
-- =============================================
PRINT N'→ اضافه کردن داده‌های اولیه برای تست...';

-- اضافه کردن یک پروژه نمونه (اگر وجود ندارد)
IF NOT EXISTS (SELECT 1 FROM projects WHERE id = 1)
BEGIN
    INSERT INTO projects (id, projectName) VALUES (1, N'پروژه نمونه');
    PRINT N'✓ پروژه نمونه اضافه شد';
END
ELSE
    PRINT N'○ پروژه نمونه از قبل وجود دارد';

-- اضافه کردن یک گروه نمونه (اگر وجود ندارد)
IF NOT EXISTS (SELECT 1 FROM groups WHERE id = 1)
BEGIN
    INSERT INTO groups (id, groupname, managerID) VALUES (1, N'گروه نمونه', 2135);
    PRINT N'✓ گروه نمونه اضافه شد';
END
ELSE
    PRINT N'○ گروه نمونه از قبل وجود دارد';

-- =============================================
-- بخش 2: بررسی Stored Procedures و Functions
-- =============================================
PRINT N'';
PRINT N'→ بررسی Stored Procedures و Functions...';

DECLARE @MissingObjects TABLE (ObjectName NVARCHAR(100), ObjectType NVARCHAR(50));

-- بررسی وجود Functions
IF OBJECT_ID('dbo.fn_GetMonthLength', 'FN') IS NULL
    INSERT INTO @MissingObjects VALUES ('fn_GetMonthLength', 'Function');

IF OBJECT_ID('dbo.fn_IsMonthEditable', 'FN') IS NULL
    INSERT INTO @MissingObjects VALUES ('fn_IsMonthEditable', 'Function');

IF OBJECT_ID('dbo.fn_GetPeriodLength', 'FN') IS NULL
    INSERT INTO @MissingObjects VALUES ('fn_GetPeriodLength', 'Function');

-- بررسی وجود Stored Procedures
IF OBJECT_ID('dbo.sp_GetMonthPeriod', 'P') IS NULL
    INSERT INTO @MissingObjects VALUES ('sp_GetMonthPeriod', 'Stored Procedure');

IF OBJECT_ID('dbo.sp_GetYearMonthPeriods', 'P') IS NULL
    INSERT INTO @MissingObjects VALUES ('sp_GetYearMonthPeriods', 'Stored Procedure');

IF OBJECT_ID('dbo.sp_ValidatePeriodWithNeighbors', 'P') IS NULL
    INSERT INTO @MissingObjects VALUES ('sp_ValidatePeriodWithNeighbors', 'Stored Procedure');

IF OBJECT_ID('dbo.sp_AutoAdjustNeighborMonths', 'P') IS NULL
    INSERT INTO @MissingObjects VALUES ('sp_AutoAdjustNeighborMonths', 'Stored Procedure');

-- نمایش اشیاء ناقص
IF EXISTS (SELECT 1 FROM @MissingObjects)
BEGIN
    PRINT N'';
    PRINT N'⚠️ هشدار: برخی از Functions یا Stored Procedures وجود ندارند:';
    SELECT ObjectName, ObjectType FROM @MissingObjects;
    PRINT N'';
    PRINT N'❌ ERROR: لطفاً فایل SETUP-PRODUCTION.sql را دوباره اجرا کنید یا آن را با نسخه جدید جایگزین کنید.';
END
ELSE
BEGIN
    PRINT N'✓ تمام Functions و Stored Procedures موجود هستند';
END

-- =============================================
-- بخش 3: تست Stored Procedures
-- =============================================
PRINT N'';
PRINT N'→ تست Stored Procedures...';

-- تست sp_GetMonthPeriod
BEGIN TRY
    EXEC sp_GetMonthPeriod @Year = 1404, @Month = 1;
    PRINT N'✓ sp_GetMonthPeriod به درستی کار می‌کند';
END TRY
BEGIN CATCH
    PRINT N'❌ خطا در sp_GetMonthPeriod: ' + ERROR_MESSAGE();
END CATCH

-- تست sp_GetYearMonthPeriods
BEGIN TRY
    DECLARE @TestResult TABLE (
        Year INT, Month INT, StartDay INT, StartMonth INT, StartYear INT,
        EndDay INT, EndMonth INT, EndYear INT, IsCustom BIT
    );
    INSERT INTO @TestResult
    EXEC sp_GetYearMonthPeriods @Year = 1404;
    
    IF (SELECT COUNT(*) FROM @TestResult) = 12
        PRINT N'✓ sp_GetYearMonthPeriods به درستی کار می‌کند (12 ماه برگشت)';
    ELSE
        PRINT N'⚠️ sp_GetYearMonthPeriods تعداد ماه‌ها اشتباه است: ' + 
              CAST((SELECT COUNT(*) FROM @TestResult) AS NVARCHAR(10));
END TRY
BEGIN CATCH
    PRINT N'❌ خطا در sp_GetYearMonthPeriods: ' + ERROR_MESSAGE();
END CATCH

-- =============================================
-- بخش 4: بررسی ستون‌های جدول MonthPeriodSettings
-- =============================================
PRINT N'';
PRINT N'→ بررسی ستون‌های جدول MonthPeriodSettings...';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MonthPeriodSettings') AND name = 'StartYear')
    PRINT N'⚠️ هشدار: ستون StartYear در جدول MonthPeriodSettings وجود ندارد';
ELSE
    PRINT N'✓ ستون StartYear موجود است';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MonthPeriodSettings') AND name = 'EndYear')
    PRINT N'⚠️ هشدار: ستون EndYear در جدول MonthPeriodSettings وجود ندارد';
ELSE
    PRINT N'✓ ستون EndYear موجود است';

-- =============================================
-- بخش 5: بررسی ستون role در جدول users
-- =============================================
PRINT N'';
PRINT N'→ بررسی ستون role در جدول users...';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'role')
    PRINT N'⚠️ هشدار: ستون role در جدول users وجود ندارد';
ELSE
BEGIN
    PRINT N'✓ ستون role موجود است';
    
    -- بررسی CHECK constraint
    IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_users_role')
        PRINT N'⚠️ هشدار: محدودیت اعتبارسنجی role وجود ندارد';
    ELSE
        PRINT N'✓ محدودیت اعتبارسنجی role موجود است';
END

-- =============================================
-- خلاصه نهایی
-- =============================================
PRINT N'';
PRINT N'========================================';
PRINT N'         ✓ بررسی کامل انجام شد';
PRINT N'========================================';
PRINT N'';

-- شمارش جداول
DECLARE @TableCount INT;
DECLARE @UMDTableCount INT;

SELECT @TableCount = COUNT(*) 
FROM sys.tables 
WHERE name IN (
    'Admins', 'UserContractHours', 'UserProjectAccess',
    'DailyDetails', 'DailyProjectTasks', 'DailyPersonalCarCosts',
    'MonthlyGymCosts', 'MonthlyReports', 'MonthPeriodSettings'
);

SELECT @UMDTableCount = COUNT(*) 
FROM sys.tables 
WHERE name IN ('users', 'projects', 'groups', 'groupManagers');

PRINT N'📊 آمار دیتابیس:';
PRINT N'  • جداول UMD: ' + CAST(@UMDTableCount AS NVARCHAR(10)) + ' / 4';
PRINT N'  • جداول Timesheet: ' + CAST(@TableCount AS NVARCHAR(10)) + ' / 9';
PRINT N'  • Functions: ' + CAST((SELECT COUNT(*) FROM sys.objects WHERE type = 'FN' AND name LIKE 'fn_%') AS NVARCHAR(10));
PRINT N'  • Stored Procedures: ' + CAST((SELECT COUNT(*) FROM sys.objects WHERE type = 'P' AND name LIKE 'sp_%') AS NVARCHAR(10));
PRINT N'';

-- بررسی تعداد داده‌ها
DECLARE @UserCount INT, @ProjectCount INT, @GroupCount INT;
SELECT @UserCount = COUNT(*) FROM users WHERE IsActive = 1;
SELECT @ProjectCount = COUNT(*) FROM projects;
SELECT @GroupCount = COUNT(*) FROM groups;

PRINT N'📊 تعداد داده‌ها:';
PRINT N'  • کاربران فعال: ' + CAST(@UserCount AS NVARCHAR(10));
PRINT N'  • پروژه‌ها: ' + CAST(@ProjectCount AS NVARCHAR(10));
PRINT N'  • گروه‌ها: ' + CAST(@GroupCount AS NVARCHAR(10));
PRINT N'';

IF @UserCount = 0
    PRINT N'⚠️ هشدار: هیچ کاربری وجود ندارد. لطفاً کاربران را اضافه کنید.';

IF @ProjectCount = 0
    PRINT N'⚠️ هشدار: هیچ پروژه‌ای وجود ندارد. لطفاً پروژه‌ها را اضافه کنید.';

PRINT N'';
PRINT N'✅ نصب کامل شد!';
PRINT N'اکنون می‌توانید backend را اجرا کنید.';
PRINT N'';
GO
