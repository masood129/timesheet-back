-- =============================================
-- Migration Script: اضافه کردن StartYear و EndYear به MonthPeriodSettings
-- تاریخ: 1404/09/09
-- توضیحات: این اسکریپت فیلدهای StartYear و EndYear را به جدول MonthPeriodSettings اضافه می‌کند
--           تا بتوان بازه‌های سال‌شکن را پشتیبانی کرد (مثل اسفند سال 1403 تا فروردین سال 1404)
-- =============================================

USE [TimesheetDB]
GO

PRINT N'شروع migration: اضافه کردن StartYear و EndYear...';
GO

-- بررسی وجود فیلدها قبل از اضافه کردن
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.MonthPeriodSettings') 
    AND name = 'StartYear'
)
BEGIN
    -- اضافه کردن فیلد StartYear با مقدار پیش‌فرض Year فعلی
    ALTER TABLE MonthPeriodSettings
    ADD StartYear INT NULL;
    
    -- پر کردن مقادیر موجود با Year فعلی
    UPDATE MonthPeriodSettings
    SET StartYear = Year
    WHERE StartYear IS NULL;
    
    -- تبدیل به NOT NULL
    ALTER TABLE MonthPeriodSettings
    ALTER COLUMN StartYear INT NOT NULL;
    
    PRINT N'✓ فیلد StartYear اضافه شد';
END
ELSE
BEGIN
    PRINT N'⚠ فیلد StartYear از قبل وجود دارد';
END
GO

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.MonthPeriodSettings') 
    AND name = 'EndYear'
)
BEGIN
    -- اضافه کردن فیلد EndYear با مقدار پیش‌فرض Year فعلی
    ALTER TABLE MonthPeriodSettings
    ADD EndYear INT NULL;
    
    -- محاسبه EndYear بر اساس StartMonth و EndMonth
    -- اگر EndMonth < StartMonth یا (EndMonth = StartMonth و EndDay < StartDay) یا
    -- اگر EndMonth = 1 و StartMonth = 12، پس EndYear = Year + 1
    -- در غیر این صورت EndYear = Year
    UPDATE MonthPeriodSettings
    SET EndYear = CASE 
        WHEN (StartMonth = 12 AND EndMonth = 1) THEN Year + 1
        WHEN (EndMonth < StartMonth) THEN Year + 1
        WHEN (EndMonth = StartMonth AND EndDay < StartDay) THEN Year + 1
        ELSE Year
    END
    WHERE EndYear IS NULL;
    
    -- تبدیل به NOT NULL
    ALTER TABLE MonthPeriodSettings
    ALTER COLUMN EndYear INT NOT NULL;
    
    PRINT N'✓ فیلد EndYear اضافه شد';
END
ELSE
BEGIN
    PRINT N'⚠ فیلد EndYear از قبل وجود دارد';
END
GO

-- بررسی وجود Stored Procedures و drop کردن آنها برای rebuild
IF OBJECT_ID('dbo.sp_GetMonthPeriod', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_GetMonthPeriod;
    PRINT N'✓ Stored Procedure sp_GetMonthPeriod حذف شد برای rebuild';
END
GO

IF OBJECT_ID('dbo.sp_GetYearMonthPeriods', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_GetYearMonthPeriods;
    PRINT N'✓ Stored Procedure sp_GetYearMonthPeriods حذف شد برای rebuild';
END
GO

PRINT N'✓ Migration با موفقیت انجام شد!';
PRINT N'توجه: باید Stored Procedures را مجدداً ایجاد کنید.';
GO

