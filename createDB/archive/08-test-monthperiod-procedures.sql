-- =============================================
-- Test Script: تست Stored Procedures مربوط به MonthPeriodSettings
-- =============================================

USE [UMD]
GO

PRINT N'شروع تست Stored Procedures...';
GO

-- بررسی وجود Stored Procedures
IF OBJECT_ID('dbo.sp_GetMonthPeriod', 'P') IS NULL
BEGIN
    PRINT N'❌ خطا: Stored Procedure sp_GetMonthPeriod وجود ندارد!';
    PRINT N'⚠️  لطفاً فایل 07-rebuild-monthperiod-stored-procedures.sql را اجرا کنید.';
END
ELSE
BEGIN
    PRINT N'✓ Stored Procedure sp_GetMonthPeriod موجود است';
END
GO

IF OBJECT_ID('dbo.sp_GetYearMonthPeriods', 'P') IS NULL
BEGIN
    PRINT N'❌ خطا: Stored Procedure sp_GetYearMonthPeriods وجود ندارد!';
    PRINT N'⚠️  لطفاً فایل 07-rebuild-monthperiod-stored-procedures.sql را اجرا کنید.';
END
ELSE
BEGIN
    PRINT N'✓ Stored Procedure sp_GetYearMonthPeriods موجود است';
END
GO

-- تست دریافت بازه یک ماه
PRINT N'';
PRINT N'→ تست sp_GetMonthPeriod برای سال 1404، ماه 9...';
EXEC sp_GetMonthPeriod @Year = 1404, @Month = 9;
GO

-- تست دریافت تمام بازه‌های یک سال
PRINT N'';
PRINT N'→ تست sp_GetYearMonthPeriods برای سال 1404...';
EXEC sp_GetYearMonthPeriods @Year = 1404;
GO

PRINT N'';
PRINT N'✓✓✓ تست Stored Procedures انجام شد! ✓✓✓';
GO

