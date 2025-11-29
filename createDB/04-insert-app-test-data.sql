-- =============================================
-- درج داده‌های تستی برای جدول‌های برنامه Timesheet
-- =============================================
-- این اسکریپت برای INSERT داده‌های نمونه (تستی) در جدول‌های جدید برنامه است
-- شامل: Admins, UserProjectAccess, UserContractHours, DailyDetails, DailyProjectTasks,
--        DailyPersonalCarCosts, MonthlyGymCosts, MonthlyReports, MonthPeriodSettings
-- ⚠️ توجه: این داده‌ها فقط برای تست هستند
-- =============================================

USE UMD;
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
PRINT N'✓ 3 ادمین درج شد';

-- =============================================
-- INSERT داده‌های تستی برای جدول UserProjectAccess
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول UserProjectAccess...';
INSERT INTO UserProjectAccess (UserId, ProjectId)
VALUES
    -- کاربران گروه مهندسی نرم‌افزار
    (2001, 100), (2001, 106), (2001, 109),
    (2002, 100), (2002, 104), (2002, 108),
    (2003, 100), (2003, 103), (2003, 106),
    
    -- کاربران گروه مدیریت پروژه
    (2004, 100), (2004, 101), (2004, 102), (2004, 103),
    (2005, 104), (2005, 105), (2005, 106),
    
    -- کاربران گروه توسعه موبایل
    (2006, 101), (2006, 107),
    (2007, 101), (2007, 104),
    (2008, 101), (2008, 107), (2008, 108),
    
    -- کاربران گروه زیرساخت و DevOps
    (2009, 100), (2009, 101), (2009, 104),
    (2010, 103), (2010, 106), (2010, 109),
    
    -- کاربران گروه طراحی UI/UX
    (2011, 101), (2011, 102), (2011, 104), (2011, 107),
    (2012, 100), (2012, 102), (2012, 105);
GO
PRINT N'✓ دسترسی‌های پروژه درج شد';

-- =============================================
-- INSERT داده‌های تستی برای جدول UserContractHours
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول UserContractHours...';
INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours)
VALUES
    -- قرارداد تمام وقت (176 ساعت)
    (2001, '08:00:00', '17:00:00', 176),
    (2002, '08:00:00', '17:00:00', 176),
    (2003, '08:30:00', '17:30:00', 176),
    (2004, '08:00:00', '17:00:00', 176),
    (2005, '08:00:00', '17:00:00', 176),
    (2006, '09:00:00', '18:00:00', 176),
    
    -- قرارداد نیمه وقت (88 ساعت)
    (2007, '09:00:00', '13:00:00', 88),
    (2008, '14:00:00', '18:00:00', 88),
    
    -- قرارداد تمام وقت
    (2009, '08:00:00', '17:00:00', 176),
    (2010, '08:30:00', '17:30:00', 176),
    (2011, '09:00:00', '18:00:00', 176),
    (2012, '08:00:00', '17:00:00', 176);
GO
PRINT N'✓ قراردادهای کاری درج شد';

-- =============================================
-- INSERT داده‌های تستی برای جدول DailyDetails
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول DailyDetails...';
DECLARE @StartDate DATE = '2025-11-22';
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

-- نمونه مرخصی
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
VALUES (DATEADD(day, 3, @StartDate), 2004, NULL, NULL, NULL, N'مرخصی استحقاقی', NULL, NULL, N'استحقاقی');
GO
PRINT N'✓ جزئیات روزانه درج شد';

-- =============================================
-- INSERT داده‌های تستی برای جدول DailyProjectTasks
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول DailyProjectTasks...';
DECLARE @TaskDate DATE = '2025-11-22';
DECLARE @j INT = 0;

WHILE @j < 5
BEGIN
    INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
    VALUES
        (DATEADD(day, @j, @TaskDate), 2001, 100, 240, N'توسعه ماژول ورود و خروج'),
        (DATEADD(day, @j, @TaskDate), 2001, 106, 180, N'طراحی دیتابیس CRM'),
        (DATEADD(day, @j, @TaskDate), 2002, 100, 300, N'پیاده‌سازی API گزارش‌گیری'),
        (DATEADD(day, @j, @TaskDate), 2003, 103, 200, N'توسعه سیستم مدیریت موجودی'),
        (DATEADD(day, @j, @TaskDate), 2006, 101, 360, N'طراحی UI اپلیکیشن بانکداری'),
        (DATEADD(day, @j, @TaskDate), 2007, 104, 240, N'توسعه ماژول آزمون‌ها');
    
    SET @j = @j + 1;
END;
GO
PRINT N'✓ وظایف پروژه درج شد';

-- =============================================
-- INSERT داده‌های تستی برای جدول DailyPersonalCarCosts
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول DailyPersonalCarCosts...';
INSERT INTO DailyPersonalCarCosts (Date, UserId, ProjectId, Kilometers, Cost, Description)
VALUES
    ('2025-11-22', 2001, 100, 50, 500000, N'مأموریت جلسه با مشتری'),
    ('2025-11-23', 2002, 104, 30, 300000, N'بازدید سایت پروژه'),
    ('2025-11-24', 2006, 101, 80, 800000, N'حضور در بانک'),
    ('2025-11-25', 2003, 103, 40, 400000, N'مأموریت انبار');
GO
PRINT N'✓ هزینه‌های ماشین شخصی درج شد';

-- =============================================
-- INSERT داده‌های تستی برای جدول MonthlyGymCosts
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول MonthlyGymCosts...';
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
PRINT N'✓ هزینه‌های ورزش درج شد';

-- =============================================
-- INSERT داده‌های تستی برای جدول MonthlyReports
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول MonthlyReports...';
INSERT INTO MonthlyReports (UserId, Year, Month, JalaliYear, JalaliMonth, TotalHours, GymCost, Status, GroupId, GeneralManagerStatus, ManagerComment, FinanceComment, SubmittedAt, ApprovedAt)
VALUES
    -- گزارش‌های تایید شده
    (2001, 2025, 10, 1404, 8, 176, 1200000, 'approved', 1, 'approved_by_general_manager', N'عالی بود', N'تایید شد', '2025-11-01', '2025-11-05'),
    (2002, 2025, 10, 1404, 8, 180, 800000, 'approved', 1, 'approved_by_general_manager', N'خوب بود', N'تایید شد', '2025-11-01', '2025-11-05'),
    
    -- گزارش‌های در انتظار
    (2001, 2025, 11, 1404, 9, 170, 1200000, 'submitted_to_group_manager', 1, 'pending', NULL, NULL, '2025-11-22', NULL),
    (2002, 2025, 11, 1404, 9, 175, 800000, 'submitted_to_general_manager', 1, 'pending', N'بررسی شد', NULL, '2025-11-22', NULL),
    (2003, 2025, 11, 1404, 9, 168, 1000000, 'submitted_to_group_manager', 1, 'pending', NULL, NULL, '2025-11-23', NULL),
    
    -- گزارش پیش‌نویس
    (2006, 2025, 11, 1404, 9, 150, 1500000, 'draft', 3, 'pending', NULL, NULL, NULL, NULL);
GO
PRINT N'✓ گزارش‌های ماهیانه درج شد';

-- =============================================
-- INSERT داده‌های تستی برای جدول MonthPeriodSettings
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول MonthPeriodSettings...';
INSERT INTO MonthPeriodSettings (Year, Month, StartDay, StartMonth, StartYear, EndDay, EndMonth, EndYear)
VALUES
    (1404, 1, 1, 1, 1404, 5, 2, 1404),      -- فروردین: از 1 فروردین 1404 تا 5 اردیبهشت 1404
    (1404, 8, 1, 8, 1404, 30, 8, 1404),     -- آبان: عادی (1 تا 30 آبان 1404)
    (1404, 9, 24, 8, 1404, 30, 9, 1404);    -- آذر: از 24 آبان 1404 تا 30 آذر 1404
GO
PRINT N'✓ تنظیمات بازه ماه درج شد';

-- =============================================
-- تست Stored Procedures
-- =============================================
PRINT N'';
PRINT N'→ تست stored procedure...';
EXEC sp_GetMonthPeriod @Year = 1404, @Month = 10;

-- =============================================
-- خلاصه
-- =============================================
DECLARE @AdminCount INT, @ProjectAccessCount INT, @ContractCount INT, @DailyDetailCount INT;
DECLARE @TaskCount INT, @CarCostCount INT, @GymCostCount INT, @ReportCount INT, @PeriodCount INT;

SELECT @AdminCount = COUNT(*) FROM Admins;
SELECT @ProjectAccessCount = COUNT(*) FROM UserProjectAccess;
SELECT @ContractCount = COUNT(*) FROM UserContractHours;
SELECT @DailyDetailCount = COUNT(*) FROM DailyDetails;
SELECT @TaskCount = COUNT(*) FROM DailyProjectTasks;
SELECT @CarCostCount = COUNT(*) FROM DailyPersonalCarCosts;
SELECT @GymCostCount = COUNT(*) FROM MonthlyGymCosts;
SELECT @ReportCount = COUNT(*) FROM MonthlyReports;
SELECT @PeriodCount = COUNT(*) FROM MonthPeriodSettings;

PRINT N'';
PRINT N'========================================';
PRINT N'خلاصه داده‌های تستی برنامه:';
PRINT N'  • ادمین‌ها: ' + CAST(@AdminCount AS NVARCHAR(10));
PRINT N'  • دسترسی پروژه: ' + CAST(@ProjectAccessCount AS NVARCHAR(10));
PRINT N'  • قراردادها: ' + CAST(@ContractCount AS NVARCHAR(10));
PRINT N'  • جزئیات روزانه: ' + CAST(@DailyDetailCount AS NVARCHAR(10));
PRINT N'  • وظایف پروژه: ' + CAST(@TaskCount AS NVARCHAR(10));
PRINT N'  • هزینه ماشین: ' + CAST(@CarCostCount AS NVARCHAR(10));
PRINT N'  • هزینه ورزش: ' + CAST(@GymCostCount AS NVARCHAR(10));
PRINT N'  • گزارش‌های ماهیانه: ' + CAST(@ReportCount AS NVARCHAR(10));
PRINT N'  • بازه ماه‌ها: ' + CAST(@PeriodCount AS NVARCHAR(10));
PRINT N'========================================';
PRINT N'';
PRINT N'✓✓✓ دیتابیس آماده استفاده است! ✓✓✓';
GO
