-- =============================================
-- اسکریپت تست برای Endpoint بررسی وضعیت ارسال گزارش ماهیانه
-- =============================================

USE UMD;
GO

PRINT N'';
PRINT N'==================================================';
PRINT N'تست Endpoint: /monthly-reports/check-submitted/jalali/:year/:month';
PRINT N'==================================================';
PRINT N'';

-- =============================================
-- بخش 1: بررسی وجود جدول MonthlyReports
-- =============================================
PRINT N'→ بررسی وجود جدول MonthlyReports...';
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'MonthlyReports')
    PRINT N'  ✓ جدول MonthlyReports وجود دارد';
ELSE
BEGIN
    PRINT N'  ✗ خطا: جدول MonthlyReports وجود ندارد!';
    PRINT N'  → لطفا ابتدا اسکریپت SETUP-PRODUCTION.sql را اجرا کنید';
END
GO

-- =============================================
-- بخش 2: بررسی ساختار جدول
-- =============================================
PRINT N'';
PRINT N'→ بررسی ساختار جدول MonthlyReports...';
SELECT 
    COLUMN_NAME as [Column],
    DATA_TYPE as [Type],
    IS_NULLABLE as [Nullable]
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'MonthlyReports'
ORDER BY ORDINAL_POSITION;
GO

-- =============================================
-- بخش 3: بررسی Index‌ها
-- =============================================
PRINT N'';
PRINT N'→ بررسی Index‌های جدول MonthlyReports...';
SELECT 
    i.name AS [Index Name],
    COL_NAME(ic.object_id, ic.column_id) AS [Column Name]
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
WHERE i.object_id = OBJECT_ID('MonthlyReports')
ORDER BY i.name, ic.key_ordinal;
GO

-- =============================================
-- بخش 4: نمایش تعداد کل رکوردها
-- =============================================
PRINT N'';
PRINT N'→ تعداد کل رکوردهای MonthlyReports:';
SELECT COUNT(*) as [Total Records] FROM MonthlyReports;
GO

-- =============================================
-- بخش 5: نمایش رکوردهای موجود برای ماه‌های مختلف
-- =============================================
PRINT N'';
PRINT N'→ خلاصه گزارش‌های ماهیانه به تفکیک سال و ماه:';
SELECT 
    JalaliYear,
    JalaliMonth,
    COUNT(*) as [Report Count],
    COUNT(DISTINCT UserId) as [Unique Users],
    COUNT(CASE WHEN Status = 'draft' THEN 1 END) as [Draft],
    COUNT(CASE WHEN Status = 'submitted_to_group_manager' THEN 1 END) as [Submitted to GM],
    COUNT(CASE WHEN Status = 'submitted_to_general_manager' THEN 1 END) as [Submitted to GenM],
    COUNT(CASE WHEN Status = 'submitted_to_finance' THEN 1 END) as [Submitted to Finance],
    COUNT(CASE WHEN Status = 'approved' THEN 1 END) as [Approved]
FROM MonthlyReports
GROUP BY JalaliYear, JalaliMonth
ORDER BY JalaliYear DESC, JalaliMonth DESC;
GO

-- =============================================
-- بخش 6: تست Query مشابه Endpoint
-- =============================================
PRINT N'';
PRINT N'→ تست Query برای یک UserId نمونه...';

-- تعریف متغیرها
DECLARE @TestUserId INT;
DECLARE @TestJalaliYear INT = 1403;
DECLARE @TestJalaliMonth INT = 10;

-- پیدا کردن اولین UserId که در MonthlyReports وجود دارد
SELECT TOP 1 @TestUserId = UserId FROM MonthlyReports ORDER BY ReportId DESC;

IF @TestUserId IS NOT NULL
BEGIN
    PRINT N'  → UserId تست: ' + CAST(@TestUserId AS NVARCHAR(10));
    PRINT N'  → JalaliYear: ' + CAST(@TestJalaliYear AS NVARCHAR(10));
    PRINT N'  → JalaliMonth: ' + CAST(@TestJalaliMonth AS NVARCHAR(10));
    PRINT N'';
    
    -- اجرای Query مشابه Endpoint
    SELECT TOP 1 
        Status,
        UserId,
        JalaliYear,
        JalaliMonth,
        ReportId,
        TotalHours,
        GymCost
    FROM MonthlyReports 
    WHERE UserId = @TestUserId 
      AND JalaliYear = @TestJalaliYear 
      AND JalaliMonth = @TestJalaliMonth;
    
    IF @@ROWCOUNT = 0
    BEGIN
        PRINT N'  ⚠️ هیچ رکوردی برای این UserId و بازه زمانی یافت نشد';
        PRINT N'';
        PRINT N'  → نمایش آخرین گزارش این کاربر:';
        SELECT TOP 1
            Status,
            UserId,
            JalaliYear,
            JalaliMonth,
            ReportId
        FROM MonthlyReports 
        WHERE UserId = @TestUserId
        ORDER BY JalaliYear DESC, JalaliMonth DESC;
    END
    ELSE
        PRINT N'  ✓ Query با موفقیت اجرا شد';
END
ELSE
BEGIN
    PRINT N'  ⚠️ هیچ رکوردی در جدول MonthlyReports وجود ندارد';
    PRINT N'  → برای تست، ابتدا یک گزارش ایجاد کنید';
END
GO

-- =============================================
-- بخش 7: بررسی NULL Values
-- =============================================
PRINT N'';
PRINT N'→ بررسی وجود NULL values در فیلدهای مهم...';

DECLARE @NullJalaliYear INT;
DECLARE @NullJalaliMonth INT;
DECLARE @NullUserId INT;
DECLARE @NullStatus INT;

SELECT 
    @NullJalaliYear = COUNT(CASE WHEN JalaliYear IS NULL THEN 1 END),
    @NullJalaliMonth = COUNT(CASE WHEN JalaliMonth IS NULL THEN 1 END),
    @NullUserId = COUNT(CASE WHEN UserId IS NULL THEN 1 END),
    @NullStatus = COUNT(CASE WHEN Status IS NULL THEN 1 END)
FROM MonthlyReports;

IF @NullJalaliYear > 0 OR @NullJalaliMonth > 0 OR @NullUserId > 0 OR @NullStatus > 0
BEGIN
    PRINT N'  ✗ مشکل: فیلدهای NULL یافت شد:';
    IF @NullJalaliYear > 0
        PRINT N'    - JalaliYear: ' + CAST(@NullJalaliYear AS NVARCHAR(10)) + N' رکورد';
    IF @NullJalaliMonth > 0
        PRINT N'    - JalaliMonth: ' + CAST(@NullJalaliMonth AS NVARCHAR(10)) + N' رکورد';
    IF @NullUserId > 0
        PRINT N'    - UserId: ' + CAST(@NullUserId AS NVARCHAR(10)) + N' رکورد';
    IF @NullStatus > 0
        PRINT N'    - Status: ' + CAST(@NullStatus AS NVARCHAR(10)) + N' رکورد';
END
ELSE
    PRINT N'  ✓ تمام فیلدهای مهم مقداردهی شده‌اند';
GO

-- =============================================
-- بخش 8: بررسی Type های Status
-- =============================================
PRINT N'';
PRINT N'→ بررسی مقادیر مجاز Status...';
SELECT DISTINCT Status, COUNT(*) as [Count]
FROM MonthlyReports
GROUP BY Status
ORDER BY Status;
GO

-- =============================================
-- بخش 9: بررسی کاربران موجود در جدول users
-- =============================================
PRINT N'';
PRINT N'→ بررسی تعداد کاربران فعال در جدول users...';
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    SELECT COUNT(*) as [Total Active Users]
    FROM users
    WHERE IsActive = 1;
    
    PRINT N'';
    PRINT N'→ نمایش 5 کاربر اول:';
    SELECT TOP 5
        personalid as UserId,
        id as Username,
        role as Role
    FROM users
    WHERE IsActive = 1
    ORDER BY personalid;
END
ELSE
    PRINT N'  ⚠️ جدول users یافت نشد';
GO

-- =============================================
-- بخش 10: تست اتصال و Performance
-- =============================================
PRINT N'';
PRINT N'→ تست Performance Query...';

DECLARE @StartTime DATETIME = GETDATE();
DECLARE @TestUserId2 INT = 2001;
DECLARE @TestYear INT = 1403;
DECLARE @TestMonth INT = 10;

-- اجرای Query 100 بار برای تست Performance
DECLARE @Counter INT = 0;
WHILE @Counter < 100
BEGIN
    SELECT TOP 1 Status 
    FROM MonthlyReports 
    WHERE UserId = @TestUserId2 
      AND JalaliYear = @TestYear 
      AND JalaliMonth = @TestMonth;
    
    SET @Counter = @Counter + 1;
END

DECLARE @EndTime DATETIME = GETDATE();
DECLARE @Duration INT = DATEDIFF(MILLISECOND, @StartTime, @EndTime);

PRINT N'  ✓ اجرای 100 Query در ' + CAST(@Duration AS NVARCHAR(10)) + N' میلی‌ثانیه';
PRINT N'  → میانگین: ' + CAST(@Duration / 100.0 AS NVARCHAR(10)) + N' میلی‌ثانیه در هر Query';

IF @Duration / 100.0 > 100
    PRINT N'  ⚠️ هشدار: Performance پایین است. بررسی Index‌ها را انجام دهید';
ELSE
    PRINT N'  ✓ Performance مناسب است';
GO

-- =============================================
-- نتیجه‌گیری
-- =============================================
PRINT N'';
PRINT N'==================================================';
PRINT N'نتیجه تست:';
PRINT N'==================================================';
PRINT N'اگر تمام بخش‌ها با موفقیت اجرا شدند، پایگاه داده';
PRINT N'آماده است و مشکل احتمالاً در سمت Backend یا Frontend است.';
PRINT N'';
PRINT N'برای بررسی بیشتر:';
PRINT N'1. لاگ‌های Backend را بررسی کنید';
PRINT N'2. JWT Token را بررسی کنید';
PRINT N'3. فایل .env را در Production بررسی کنید';
PRINT N'==================================================';
PRINT N'';
