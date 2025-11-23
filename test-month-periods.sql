-- =============================================
-- Test Script for Month Period Settings
-- اسکریپت تست برای بررسی صحت عملکرد
-- =============================================

USE flutter;
-- GO حذف شد تا متغیرها در scope باقی بمانند

PRINT '========================================';
PRINT 'شروع تست سیستم مدیریت بازه ماه‌ها';
PRINT '========================================';
PRINT '';

-- Test 1: تست function محاسبه طول ماه
PRINT 'Test 1: تست fn_GetMonthLength';
PRINT '-----------------------------------';
PRINT 'فروردین (ماه 1): ' + CAST(dbo.fn_GetMonthLength(1404, 1) AS VARCHAR) + ' روز (انتظار: 31)';
PRINT 'مهر (ماه 7): ' + CAST(dbo.fn_GetMonthLength(1404, 7) AS VARCHAR) + ' روز (انتظار: 30)';
PRINT 'اسفند سال عادی (1403): ' + CAST(dbo.fn_GetMonthLength(1403, 12) AS VARCHAR) + ' روز (انتظار: 29)';
PRINT 'اسفند سال کبیسه (1404): ' + CAST(dbo.fn_GetMonthLength(1404, 12) AS VARCHAR) + ' روز (انتظار: 30)';
PRINT '';

-- Test 2: تست function بررسی قابل ویرایش بودن ماه
PRINT 'Test 2: تست fn_IsMonthEditable';
PRINT '-----------------------------------';
DECLARE @CurrentYear INT = 1404;
DECLARE @CurrentMonth INT = 8; -- فرض: ماه جاری آبان است

PRINT 'ماه آینده (9): ' + CAST(dbo.fn_IsMonthEditable(1404, 9, @CurrentYear, @CurrentMonth) AS VARCHAR) + ' (انتظار: 1)';
PRINT 'ماه جاری (8): ' + CAST(dbo.fn_IsMonthEditable(1404, 8, @CurrentYear, @CurrentMonth) AS VARCHAR) + ' (انتظار: 1)';
PRINT 'ماه گذشته (7): ' + CAST(dbo.fn_IsMonthEditable(1404, 7, @CurrentYear, @CurrentMonth) AS VARCHAR) + ' (انتظار: 0)';
PRINT 'سال آینده: ' + CAST(dbo.fn_IsMonthEditable(1405, 1, @CurrentYear, @CurrentMonth) AS VARCHAR) + ' (انتظار: 1)';
PRINT '';

-- Test 3: تست بازه پیش‌فرض (بدون تنظیم)
PRINT 'Test 3: بازه پیش‌فرض فروردین بدون تنظیم';
PRINT '-----------------------------------';
EXEC sp_GetMonthPeriod @Year = 1404, @Month = 1;
PRINT 'انتظار: 1 فروردین تا 31 فروردین';
PRINT '';

-- Test 4: ایجاد یک تنظیم سفارشی
PRINT 'Test 4: ایجاد تنظیم سفارشی برای فروردین';
PRINT '-----------------------------------';
DELETE FROM MonthPeriodSettings WHERE Year = 1404; -- پاک کردن تست‌های قبلی
INSERT INTO MonthPeriodSettings (Year, Month, StartDay, StartMonth, EndDay, EndMonth)
VALUES (1404, 1, 1, 1, 5, 2);
PRINT 'فروردین 1404 از 1 فروردین تا 5 اردیبهشت ثبت شد';
PRINT '';

-- Test 5: بازه فروردین بعد از تنظیم
PRINT 'Test 5: بازه فروردین بعد از تنظیم';
PRINT '-----------------------------------';
EXEC sp_GetMonthPeriod @Year = 1404, @Month = 1;
PRINT 'انتظار: 1 فروردین تا 5 اردیبهشت';
PRINT '';

-- Test 6: بازه اردیبهشت (باید از 6 اردیبهشت شروع شود)
PRINT 'Test 6: بازه پیش‌فرض اردیبهشت (ماه قبل تنظیم شده)';
PRINT '-----------------------------------';
EXEC sp_GetMonthPeriod @Year = 1404, @Month = 2;
PRINT 'انتظار: 6 اردیبهشت تا 31 اردیبهشت (X+1 منطق)';
PRINT '';

-- Test 7: بازه خرداد (ماه قبل تنظیم نشده، باید عادی باشد)
PRINT 'Test 7: بازه پیش‌فرض خرداد (ماه قبل تنظیم نشده)';
PRINT '-----------------------------------';
EXEC sp_GetMonthPeriod @Year = 1404, @Month = 3;
PRINT 'انتظار: 1 خرداد تا 31 خرداد (حالت عادی)';
PRINT '';

-- Test 8: دریافت تمام ماه‌های سال
PRINT 'Test 8: دریافت تمام بازه‌های سال 1404';
PRINT '-----------------------------------';
EXEC sp_GetYearMonthPeriods @Year = 1404;
PRINT 'انتظار: 12 ماه با IsCustom=1 برای فروردین و IsCustom=0 برای بقیه';
PRINT '';

-- Test 9: تنظیم چند ماه متوالی
PRINT 'Test 9: تست زنجیره‌ای ماه‌های متوالی';
PRINT '-----------------------------------';
DELETE FROM MonthPeriodSettings WHERE Year = 1404;
INSERT INTO MonthPeriodSettings (Year, Month, StartDay, StartMonth, EndDay, EndMonth)
VALUES 
    (1404, 1, 1, 1, 10, 2),      -- فروردین تا 10 اردیبهشت
    (1404, 2, 11, 2, 15, 3);     -- اردیبهشت از 11 اردیبهشت تا 15 خرداد

EXEC sp_GetMonthPeriod @Year = 1404, @Month = 3;
PRINT 'انتظار خرداد: از 16 خرداد تا 31 خرداد';
PRINT '';

-- Test 10: تست trigger برای UpdatedAt
PRINT 'Test 10: تست trigger بروزرسانی UpdatedAt';
PRINT '-----------------------------------';
WAITFOR DELAY '00:00:02';  -- صبر 2 ثانیه
UPDATE MonthPeriodSettings 
SET EndDay = 11 
WHERE Year = 1404 AND Month = 1;

SELECT 
    'فروردین UpdatedAt: ' + CONVERT(VARCHAR, UpdatedAt, 120) AS Result,
    CASE 
        WHEN UpdatedAt > CreatedAt THEN 'PASS - trigger کار کرد'
        ELSE 'FAIL - trigger کار نکرد'
    END AS Status
FROM MonthPeriodSettings 
WHERE Year = 1404 AND Month = 1;
PRINT '';

-- Clean up
PRINT '========================================';
PRINT 'پاک‌سازی داده‌های تست';
PRINT '========================================';
DELETE FROM MonthPeriodSettings WHERE Year = 1404;
PRINT 'تمام تست‌ها کامل شد!';
PRINT '';
