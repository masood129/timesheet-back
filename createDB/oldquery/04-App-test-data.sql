-- =============================================
-- کوئری 4: ساخت دیتای تستی برای جدول‌های جدید برنامه
-- =============================================
-- این اسکریپت برای INSERT داده‌های نمونه (تستی) در جدول‌های جدید برنامه است
-- شامل: Admins, UserProjectAccess, UserContractHours, DailyDetails, DailyProjectTasks,
--        DailyPersonalCarCosts, MonthlyGymCosts, MonthlyReports, MonthPeriodSettings
-- =============================================

USE UMD;
GO

-- پاک کردن داده‌های قبلی (فقط برای تست)
DELETE FROM MonthlyReports;
DELETE FROM MonthlyGymCosts;
DELETE FROM DailyPersonalCarCosts;
DELETE FROM DailyProjectTasks;
DELETE FROM DailyDetails;
DELETE FROM UserContractHours;
DELETE FROM UserProjectAccess;
DELETE FROM MonthPeriodSettings;
DELETE FROM Admins;
GO

-- =============================================
-- INSERT داده‌های تستی برای جدول Admins
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول Admins...';
INSERT INTO Admins (Username, PasswordHash, FullName, Email, IsActive, CreatedAt, LastLoginAt)
VALUES
    ('admin', '$2b$10$XYZ123...hash...', N'مدیر اصلی سیستم', 'admin@company.ir', 1, GETDATE(), GETDATE()),
    ('finance_admin', '$2b$10$ABC456...hash...', N'مدیر امور مالی', 'finance@company.ir', 1, GETDATE(), GETDATE()),
    ('hr_admin', '$2b$10$DEF789...hash...', N'مدیر منابع انسانی', 'hr@company.ir', 1, GETDATE(), NULL);
GO
PRINT N'✓ 3 ادمین با موفقیت درج شد';

-- =============================================
-- INSERT داده‌های تستی برای جدول UserProjectAccess
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول UserProjectAccess...';
-- دسترسی کاربران به پروژه‌ها
INSERT INTO UserProjectAccess (UserId, ProjectId)
VALUES
    -- کاربران گروه مهندسی نرم‌افزار
    (2001, 100), (2001, 106), (2001, 109),  -- فاطمه حسینی
    (2002, 100), (2002, 104), (2002, 108),  -- حسین نوری
    (2003, 100), (2003, 103), (2003, 106),  -- زهرا عباسی
    
    -- کاربران گروه مدیریت پروژه
    (2004, 100), (2004, 101), (2004, 102), (2004, 103),  -- امیر شایعی
    (2005, 104), (2005, 105), (2005, 106),  -- مریم قاسمی
    
    -- کاربران گروه توسعه موبایل
    (2006, 101), (2006, 107),  -- مهدی جلالی
    (2007, 101), (2007, 104),  -- نازنین مرادی
    (2008, 101), (2008, 107), (2008, 108),  -- پیمان فتحی
    
    -- کاربران گروه زیرساخت و DevOps
    (2009, 100), (2009, 101), (2009, 104),  -- سمیرا باقری
    (2010, 103), (2010, 106), (2010, 109),  -- کامران صادقی
    
    -- کاربران گروه طراحی UI/UX
    (2011, 101), (2011, 102), (2011, 104), (2011, 107),  -- الهام موسوی
    (2012, 100), (2012, 102), (2012, 105);  -- بهزاد رحیمی
GO
PRINT N'✓ دسترسی‌های پروژه کاربران با موفقیت درج شد';

-- =============================================
-- INSERT داده‌های تستی برای جدول UserContractHours
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول UserContractHours...';
-- قراردادهای ساعت کاری کاربران
INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours)
VALUES
    -- قرارداد تمام وقت (176 ساعت در ماه)
    (2001, '08:00:00', '17:00:00', 176),
    (2002, '08:00:00', '17:00:00', 176),
    (2003, '08:30:00', '17:30:00', 176),
    (2004, '08:00:00', '17:00:00', 176),
    (2005, '08:00:00', '17:00:00', 176),
    (2006, '09:00:00', '18:00:00', 176),
    
    -- قرارداد نیمه وقت (88 ساعت در ماه)
    (2007, '09:00:00', '13:00:00', 88),
    (2008, '14:00:00', '18:00:00', 88),
    
    -- قرارداد تمام وقت
    (2009, '08:00:00', '17:00:00', 176),
    (2010, '08:30:00', '17:30:00', 176),
    (2011, '09:00:00', '18:00:00', 176),
    (2012, '08:00:00', '17:00:00', 176);
GO
PRINT N'✓ قراردادهای ساعت کاری با موفقیت درج شد';

-- =============================================
-- INSERT داده‌های تستی برای جدول DailyDetails
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول DailyDetails...';
-- جزئیات روزانه برای یک هفته نمونه (از 1404/09/01 تا 1404/09/07)
DECLARE @StartDate DATE = '2025-11-22';  -- مثال: 1404/09/01
DECLARE @i INT = 0;

WHILE @i < 7
BEGIN
    INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
    VALUES
        (DATEADD(day, @i, @StartDate), 2001, '08:05:00', '17:10:00', 30, N'کار عادی', 50000, 50000, NULL),
        (DATEADD(day, @i, @StartDate), 2002, '08:10:00', '17:05:00', 15, N'کار عادی', 40000, 40000, NULL),
        (DATEADD(day, @i, @StartDate), 2003, '08:35:00', '17:25:00', 20, N'کار عادی', 45000, 45000, NULL),
        (DATEADD(day, @i, @StartDate), 2006, '09:05:00', '18:15:00', 45, N'کار عادی', 60000, 60000, NULL);
    
    SET @i = @i + 1;
END;

-- یک نمونه مرخصی
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
VALUES
    (DATEADD(day, 3, @StartDate), 2004, NULL, NULL, NULL, N'مرخصی استحقاقی', NULL, NULL, N'استحقاقی');
GO
PRINT N'✓ جزئیات روزانه با موفقیت درج شد';

-- =============================================
-- INSERT داده‌های تستی برای جدول DailyProjectTasks
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول DailyProjectTasks...';
-- وظایف پروژه روزانه
DECLARE @TaskDate DATE = '2025-11-22';
DECLARE @j INT = 0;

WHILE @j < 5
BEGIN
    INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
    VALUES
        (DATEADD(day, @j, @TaskDate), 2001, 100, 240, N'توسعه ماژول ورود و خروج کاربران'),
        (DATEADD(day, @j, @TaskDate), 2001, 106, 180, N'طراحی دیتابیس CRM'),
        (DATEADD(day, @j, @TaskDate), 2002, 100, 300, N'پیاده‌سازی API گزارش‌گیری'),
        (DATEADD(day, @j, @TaskDate), 2003, 103, 200, N'توسعه سیستم مدیریت موجودی'),
        (DATEADD(day, @j, @TaskDate), 2006, 101, 360, N'طراحی رابط کاربری اپلیکیشن بانکداری'),
        (DATEADD(day, @j, @TaskDate), 2007, 104, 240, N'توسعه ماژول آزمون‌ها');
    
    SET @j = @j + 1;
END;
GO
PRINT N'✓ وظایف پروژه روزانه با موفقیت درج شد';

-- =============================================
-- INSERT داده‌های تستی برای جدول DailyPersonalCarCosts
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول DailyPersonalCarCosts...';
-- هزینه‌های ماشین شخصی
INSERT INTO DailyPersonalCarCosts (Date, UserId, ProjectId, Kilometers, Cost, Description)
VALUES
    ('2025-11-22', 2001, 100, 50, 500000, N'مأموریت جلسه با مشتری'),
    ('2025-11-23', 2002, 104, 30, 300000, N'بازدید سایت پروژه'),
    ('2025-11-24', 2006, 101, 80, 800000, N'حضور در محل بانک برای جلسه هماهنگی'),
    ('2025-11-25', 2003, 103, 40, 400000, N'مأموریت انبار مرکزی');
GO
PRINT N'✓ هزینه‌های ماشین شخصی با موفقیت درج شد';

-- =============================================
-- INSERT داده‌های تستی برای جدول MonthlyGymCosts
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول MonthlyGymCosts...';
-- هزینه‌های ورزش ماهیانه
INSERT INTO MonthlyGymCosts (UserId, Year, Month, Cost, GymHours, Description)
VALUES
    (2001, 1404, 8, 1200000, 20, N'باشگاه بدنسازی'),
    (2001, 1404, 9, 1200000, 18, N'باشگاه بدنسازی'),
    (2002, 1404, 8, 800000, 12, N'استخر شنا'),
    (2002, 1404, 9, 800000, 14, N'استخر شنا'),
    (2003, 1404, 9, 1000000, 16, N'یوگا و پیلاتس'),
    (2006, 1404, 8, 1500000, 24, N'باشگاه ورزش‌های رزمی'),
    (2006, 1404, 9, 1500000, 22, N'باشگاه ورزش‌های رزمی');
GO
PRINT N'✓ هزینه‌های ورزش ماهیانه با موفقیت درج شد';

-- =============================================
-- INSERT داده‌های تستی برای جدول MonthlyReports
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول MonthlyReports...';
-- گزارش‌های ماهیانه
INSERT INTO MonthlyReports (UserId, Year, Month, JalaliYear, JalaliMonth, TotalHours, GymCost, Status, GroupId, GeneralManagerStatus, ManagerComment, FinanceComment, SubmittedAt, ApprovedAt)
VALUES
    -- گزارش‌های تایید شده ماه 8
    (2001, 2025, 10, 1404, 8, 176, 1200000, 'approved', 1, 'approved_by_general_manager', N'کار عالی بود', N'تایید شد', '2025-11-01', '2025-11-05'),
    (2002, 2025, 10, 1404, 8, 180, 800000, 'approved', 1, 'approved_by_general_manager', N'خوب بود', N'تایید شد', '2025-11-01', '2025-11-05'),
    
    -- گزارش‌های در انتظار تایید ماه 9
    (2001, 2025, 11, 1404, 9, 170, 1200000, 'submitted_to_group_manager', 1, 'pending', NULL, NULL, '2025-11-22', NULL),
    (2002, 2025, 11, 1404, 9, 175, 800000, 'submitted_to_general_manager', 1, 'pending', N'بررسی شد، نیاز به تایید مدیر کل', NULL, '2025-11-22', NULL),
    (2003, 2025, 11, 1404, 9, 168, 1000000, 'submitted_to_group_manager', 1, 'pending', NULL, NULL, '2025-11-23', NULL),
    
    -- گزارش پیش‌نویس
    (2006, 2025, 11, 1404, 9, 150, 1500000, 'draft', 3, 'pending', NULL, NULL, NULL, NULL);
GO
PRINT N'✓ گزارش‌های ماهیانه با موفقیت درج شد';

-- =============================================
-- INSERT داده‌های تستی برای جدول MonthPeriodSettings
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول MonthPeriodSettings...';
-- تنظیمات بازه ماه‌های شمسی
INSERT INTO MonthPeriodSettings (Year, Month, StartDay, StartMonth, EndDay, EndMonth, CreatedAt, UpdatedAt)
VALUES
    -- فروردین 1404: از 1 فروردین تا 5 اردیبهشت
    (1404, 1, 1, 1, 5, 2, GETDATE(), GETDATE()),
    
    -- آبان 1404: از 1 آبان تا 30 آبان (عادی)
    (1404, 8, 1, 8, 30, 8, GETDATE(), GETDATE()),
    
    -- آذر 1404: از 24 آبان تا آخر آذر (سفارشی - overlap با آبان)
    (1404, 9, 24, 8, 30, 9, GETDATE(), GETDATE());
GO
PRINT N'✓ تنظیمات بازه ماه‌ها با موفقیت درج شد';

-- =============================================
-- تست stored procedures
-- =============================================
PRINT N'';
PRINT N'→ تست stored procedure برای دریافت بازه دی ماه...';
EXEC sp_GetMonthPeriod @Year = 1404, @Month = 10;

PRINT N'';
PRINT N'→ تست stored procedure برای دریافت تمام ماه‌های سال 1404...';
EXEC sp_GetYearMonthPeriods @Year = 1404;

-- =============================================
-- نمایش خلاصه داده‌های ایجاد شده
-- =============================================
PRINT N'';
PRINT N'========================================';
PRINT N'خلاصه داده‌های تستی جدول‌های برنامه:';
PRINT N'========================================';
PRINT N'✓ تعداد ادمین‌ها: ' + CAST((SELECT COUNT(*) FROM Admins) AS NVARCHAR(10));
PRINT N'✓ تعداد دسترسی‌های پروژه: ' + CAST((SELECT COUNT(*) FROM UserProjectAccess) AS NVARCHAR(10));
PRINT N'✓ تعداد قراردادهای کاری: ' + CAST((SELECT COUNT(*) FROM UserContractHours) AS NVARCHAR(10));
PRINT N'✓ تعداد جزئیات روزانه: ' + CAST((SELECT COUNT(*) FROM DailyDetails) AS NVARCHAR(10));
PRINT N'✓ تعداد وظایف پروژه روزانه: ' + CAST((SELECT COUNT(*) FROM DailyProjectTasks) AS NVARCHAR(10));
PRINT N'✓ تعداد هزینه‌های ماشین شخصی: ' + CAST((SELECT COUNT(*) FROM DailyPersonalCarCosts) AS NVARCHAR(10));
PRINT N'✓ تعداد هزینه‌های ورزش ماهیانه: ' + CAST((SELECT COUNT(*) FROM MonthlyGymCosts) AS NVARCHAR(10));
PRINT N'✓ تعداد گزارش‌های ماهیانه: ' + CAST((SELECT COUNT(*) FROM MonthlyReports) AS NVARCHAR(10));
PRINT N'✓ تعداد تنظیمات بازه ماه: ' + CAST((SELECT COUNT(*) FROM MonthPeriodSettings) AS NVARCHAR(10));
PRINT N'========================================';
PRINT N'';
PRINT N'✓✓✓ تمام داده‌های تستی با موفقیت ایجاد شدند ✓✓✓';
PRINT N'';
PRINT N'دیتابیس UMD شما آماده استفاده است!';
PRINT N'می‌توانید اپلیکیشن را راه‌اندازی کنید.';
GO

-- =============================================
-- کوئری‌های تست برای بررسی داده‌ها
-- =============================================
-- -- بررسی گزارش‌های ماهیانه به تفکیک وضعیت
-- SELECT Status, COUNT(*) AS تعداد
-- FROM MonthlyReports
-- GROUP BY Status;
-- 
-- -- بررسی کاربرانی که در هفته اخیر حضور داشتند
-- SELECT DISTINCT u.farsifirstname + ' ' + u.farsilastname AS نام_کامل
-- FROM DailyDetails dd
-- INNER JOIN users u ON dd.UserId = u.personalid
-- WHERE dd.Date >= DATEADD(day, -7, GETDATE());
-- 
-- -- بررسی پروژه‌هایی که بیشترین زمان صرف شده‌اند
-- SELECT p.projectName, SUM(dpt.Duration) AS کل_دقیقه
-- FROM DailyProjectTasks dpt
-- INNER JOIN projects p ON dpt.ProjectId = p.id
-- GROUP BY p.projectName
-- ORDER BY کل_دقیقه DESC;
