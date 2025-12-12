-- =============================================
-- فایل 5: هزینه‌های ساده
-- =============================================
-- این فایل هزینه‌های ماشین و ورزش نمونه ایجاد می‌کند
-- =============================================

USE UMD;
GO

PRINT N'→ ثبت هزینه‌های نمونه...';

-- تاریخ نمونه
DECLARE @SampleDate DATE = '2024-12-16';

-- حذف هزینه‌های قبلی
DELETE FROM DailyPersonalCarCosts 
WHERE UserId IN (2001, 2002) AND Date >= @SampleDate;

DELETE FROM MonthlyGymCosts 
WHERE UserId IN (2001, 2002) AND Year = 1403 AND Month = 9;

-- هزینه‌های ماشین
INSERT INTO DailyPersonalCarCosts (Date, UserId, ProjectId, Kilometers, Cost, Description)
VALUES
    (@SampleDate, 2001, 100, 30, 900000, N'جلسه با مشتری'),
    (DATEADD(day, 1, @SampleDate), 2002, 102, 50, 1500000, N'بازدید از سایت پروژه');

PRINT N'✓ 2 هزینه ماشین ثبت شد';

-- هزینه‌های ورزش ماهیانه
INSERT INTO MonthlyGymCosts (UserId, Year, Month, Cost, GymHours, Description)
VALUES
    (2001, 1403, 9, 1200000, 20, N'باشگاه بدنسازی - آذر'),
    (2002, 1403, 9, 800000, 15, N'استخر - آذر');

PRINT N'✓ 2 هزینه ورزش ثبت شد';
PRINT N'  کارمند 2001: 1,200,000 تومان (20 ساعت)';
PRINT N'  کارمند 2002: 800,000 تومان (15 ساعت)';

GO
