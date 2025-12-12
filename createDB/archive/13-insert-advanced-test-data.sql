-- =============================================
-- نمونه‌های پیشرفته برای EOSDB
-- =============================================
-- این فایل شامل داده‌های نمونه کامل و واقع‌گرایانه برای تست سیستم است
-- تمام سناریوهای مختلف کاری، مرخصی، و گزارش‌دهی را پوشش می‌دهد
-- =============================================

USE EOSDB;
GO

PRINT N'========================================';
PRINT N'شروع درج نمونه‌های پیشرفته برای EOSDB';
PRINT N'========================================';
GO

-- =============================================
-- نمونه 1: دسترسی‌های پروژه برای تیم بزرگ
-- =============================================
PRINT N'';
PRINT N'→ نمونه 1: ایجاد دسترسی‌های پروژه برای تیم توسعه بزرگ...';

-- حذف دسترسی‌هایی که ممکن است قبلاً وجود داشته باشند
DELETE FROM UserProjectAccess WHERE UserId IN (3001, 3002, 3003, 3004, 3005, 3006);

-- کارکنان تیم Backend
INSERT INTO UserProjectAccess (UserId, ProjectId)
VALUES
    -- Backend Developer 1: دسترسی به 3 پروژه اصلی
    (3001, 100), (3001, 101), (3001, 102),
    
    -- Backend Developer 2: دسترسی به پروژه‌های API
    (3002, 100), (3002, 103), (3002, 104),
    
    -- Full-Stack Developer: همه پروژه‌ها
    (3003, 100), (3003, 101), (3003, 102), (3003, 103), (3003, 104), (3003, 105),
    
    -- Frontend Developer: پروژه‌های رابط کاربری
    (3004, 101), (3004, 105), (3004, 106),
    
    -- Mobile Developer: پروژه‌های موبایل
    (3005, 107), (3005, 108), (3005, 109),
    
    -- DevOps Engineer: پروژه‌های زیرساخت
    (3006, 100), (3006, 101), (3006, 102), (3006, 103);
GO
PRINT N'✓ 26 دسترسی پروژه برای 6 کارمند ایجاد شد';

-- =============================================
-- نمونه 2: قراردادهای کاری متنوع
-- =============================================
PRINT N'';
PRINT N'→ نمونه 2: تعریف قراردادهای کاری مختلف...';

-- حذف قراردادهایی که ممکن است قبلاً وجود داشته باشند
DELETE FROM UserContractHours WHERE UserId IN (3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008);

INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours)
VALUES
    -- قرارداد استاندارد تمام وقت (8 ساعت × 22 روز = 176 ساعت)
    (3001, '08:00:00', '17:00:00', 176),
    (3002, '08:30:00', '17:30:00', 176),
    
    -- Senior Developer با ساعت کاری منعطف
    (3003, '09:00:00', '18:00:00', 176),
    
    -- Part-time (4 ساعت × 22 روز = 88 ساعت)
    (3004, '09:00:00', '13:00:00', 88),
    (3005, '14:00:00', '18:00:00', 88),
    
    -- قرارداد پروژه‌ای (120 ساعت در ماه)
    (3006, '10:00:00', '16:00:00', 120),
    
    -- شیفت عصر (6 ساعت × 22 روز = 132 ساعت)
    (3007, '13:00:00', '19:00:00', 132),
    
    -- دورکار با حداقل ساعت (100 ساعت)
    (3008, NULL, '23:59:59', 100);
GO
PRINT N'✓ 8 نوع قرارداد مختلف ایجاد شد';

-- =============================================
-- نمونه 3: جزئیات روزانه با سناریوهای مختلف
-- =============================================
PRINT N'';
PRINT N'→ نمونه 3: ثبت جزئیات روزانه برای یک هفته کاری...';

DECLARE @WeekStartDate DATE = '2024-12-15'; -- دوشنبه
DECLARE @DayCounter INT = 0;

WHILE @DayCounter < 5  -- 5 روز کاری
BEGIN
    DECLARE @CurrentDate DATE = DATEADD(day, @DayCounter, @WeekStartDate);
    
    INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
    VALUES
        -- کارمند منظم
        (@CurrentDate, 3001, '07:55:00', '17:15:00', 30, N'کار عادی - زمان شخصی: ناهار', 50000, 50000, NULL),
        
        -- کارمند با تأخیر
        (@CurrentDate, 3002, '09:15:00', '18:30:00', 45, N'تأخیر در رسیدن - جبران شد', 40000, 45000, NULL),
        
        -- Senior Developer با ساعات اضافه
        (@CurrentDate, 3003, '08:30:00', '20:00:00', 60, N'کار روی پروژه فوری + اضافه کاری', 60000, 70000, NULL),
        
        -- Part-time employee
        (@CurrentDate, 3004, '09:00:00', '13:10:00', 0, N'کار نیمه وقت عصر', 30000, 30000, NULL);
    
    SET @DayCounter = @DayCounter + 1;
END;

-- روز با مرخصی
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
VALUES 
    (DATEADD(day, 2, @WeekStartDate), 3005, NULL, NULL, NULL, N'مرخصی استحقاقی - امور شخصی', NULL, NULL, N'استحقاقی'),
    (DATEADD(day, 3, @WeekStartDate), 3006, NULL, NULL, NULL, N'مرخصی استعلاجی - سرماخوردگی', NULL, NULL, N'استعلاجی'),
    (DATEADD(day, 4, @WeekStartDate), 3007, '13:00:00', '16:30:00', NULL, N'مرخصی ساعتی - ملاقات پزشک', NULL, NULL, N'ساعتی');

-- روزهای دورکاری
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
VALUES 
    (DATEADD(day, 1, @WeekStartDate), 3008, '10:00:00', '18:30:00', 30, N'دورکاری - کار از منزل', 0, 0, NULL),
    (DATEADD(day, 2, @WeekStartDate), 3008, '09:30:00', '17:45:00', 20, N'دورکاری - کار از کافه', 0, 0, NULL);

GO
PRINT N'✓ 27 رکورد جزئیات روزانه با سناریوهای متنوع ایجاد شد';

-- =============================================
-- نمونه 4: وظایف پروژه‌های روزانه (تفصیلی)
-- =============================================
PRINT N'';
PRINT N'→ نمونه 4: ثبت وظایف پروژه‌ای با تقسیم زمان دقیق...';

DECLARE @TaskDate DATE = '2024-12-15';
DECLARE @TaskDay INT = 0;

WHILE @TaskDay < 5
BEGIN
    DECLARE @CurrentTaskDate DATE = DATEADD(day, @TaskDay, @TaskDate);
    
    INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
    VALUES
        -- Backend Developer 1 - تقسیم زمان بین 3 پروژه
        (@CurrentTaskDate, 3001, 100, 180, N'توسعه API احراز هویت - پیاده‌سازی JWT'),
        (@CurrentTaskDate, 3001, 101, 120, N'بهینه‌سازی کوئری‌های دیتابیس'),
        (@CurrentTaskDate, 3001, 102, 150, N'مستندسازی APIها - Swagger'),
        
        -- Backend Developer 2 - کار روی یک پروژه بزرگ
        (@CurrentTaskDate, 3002, 100, 240, N'طراحی معماری میکروسرویس‌ها'),
        (@CurrentTaskDate, 3002, 103, 180, N'پیاده‌سازی Redis برای کش'),
        
        -- Full-Stack Developer - چند پروژه همزمان
        (@CurrentTaskDate, 3003, 100, 150, N'رفع باگ‌های گزارش شده - Backend'),
        (@CurrentTaskDate, 3003, 101, 120, N'توسعه داشبورد مدیریت'),
        (@CurrentTaskDate, 3003, 105, 180, N'ادغام Frontend با API جدید'),
        (@CurrentTaskDate, 3003, 102, 90, N'Code Review و Refactoring'),
        
        -- Frontend Developer
        (@CurrentTaskDate, 3004, 101, 120, N'طراحی کامپوننت‌های React'),
        (@CurrentTaskDate, 3004, 105, 90, N'پیاده‌سازی Responsive Design'),
        
        -- Mobile Developer
        (@CurrentTaskDate, 3005, 107, 180, N'توسعه صفحه پروفایل در Flutter'),
        (@CurrentTaskDate, 3005, 108, 120, N'یکپارچه‌سازی با Push Notification');
    
    SET @TaskDay = @TaskDay + 1;
END;
GO
PRINT N'✓ 65 وظیفه پروژه‌ای برای 5 روز کاری ایجاد شد';

-- =============================================
-- نمونه 5: هزینه‌های ماشین شخصی
-- =============================================
PRINT N'';
PRINT N'→ نمونه 5: ثبت هزینه‌های ماشین شخصی برای ماموریت‌ها...';

DECLARE @CarCostDate DATE = '2024-12-01';
DECLARE @CarDay INT = 0;

INSERT INTO DailyPersonalCarCosts (Date, UserId, ProjectId, Kilometers, Cost, Description)
VALUES
    -- ماموریت‌های درون شهری
    ('2024-12-05', 3001, 100, 25, 750000, N'جلسه حضوری با مشتری - شمال شهر'),
    ('2024-12-06', 3001, 101, 30, 900000, N'بازدید از سایت پروژه - غرب تهران'),
    ('2024-12-10', 3002, 103, 40, 1200000, N'نصب و راه‌اندازی سرور - مرکز شهر'),
    ('2024-12-12', 3003, 100, 35, 1050000, N'Training کارکنان - دفتر مشتری'),
    
    -- ماموریت‌های برون شهری
    ('2024-12-08', 3006, 100, 200, 8000000, N'ماموریت کرج - نصب تجهیزات شبکه'),
    ('2024-12-15', 3006, 102, 150, 6000000, N'بازدید از کارخانه - قزوین'),
    
    -- ماموریت‌های کوتاه
    ('2024-12-18', 3004, 101, 15, 450000, N'دریافت تجهیزات - نزدیک دفتر'),
    ('2024-12-20', 3005, 107, 20, 600000, N'ملاقات با تیم طراحی');
GO
PRINT N'✓ 8 هزینه ماشین شخصی برای ماموریت‌های مختلف ثبت شد';

-- =============================================
-- نمونه 6: هزینه‌های ورزش ماهیانه
-- =============================================
PRINT N'';
PRINT N'→ نمونه 6: ثبت هزینه‌های ورزشی ماهیانه کارکنان...';

INSERT INTO MonthlyGymCosts (UserId, Year, Month, Cost, GymHours, Description)
VALUES
    -- سال 1403
    (3001, 1403, 10, 1500000, 20, N'باشگاه بدنسازی الیت - دی ماه'),
    (3001, 1403, 11, 1500000, 22, N'باشگاه بدنسازی الیت - بهمن ماه'),
    (3001, 1403, 12, 1500000, 18, N'باشگاه بدنسازی الیت - اسفند ماه'),
    
    (3002, 1403, 10, 1200000, 16, N'استخر اولمپیک - دی ماه'),
    (3002, 1403, 11, 1200000, 18, N'استخر اولمپیک - بهمن ماه'),
    (3002, 1403, 12, 1200000, 20, N'استخر اولمپیک - اسفند ماه'),
    
    (3003, 1403, 11, 2000000, 25, N'باشگاه CrossFit - بهمن ماه'),
    (3003, 1403, 12, 2000000, 24, N'باشگاه CrossFit - اسفند ماه'),
    
    -- سال 1404
    (3001, 1404, 1, 1500000, 20, N'باشگاه بدنسازی الیت - فروردین'),
    (3002, 1404, 1, 1200000, 17, N'استخر اولمپیک - فروردین'),
    (3003, 1404, 1, 2000000, 26, N'باشگاه CrossFit - فروردین'),
    
    (3004, 1404, 1, 800000, 12, N'یوگا و پیلاتس - فروردین'),
    (3005, 1404, 1, 1800000, 20, N'هنرهای رزمی MMA - فروردین'),
    (3006, 1404, 1, 1000000, 15, N'دویدن و آمادگی جسمانی - فروردین');
GO
PRINT N'✓ 14 رکورد هزینه ورزشی برای 6 کارمند در 4 ماه ثبت شد';

-- =============================================
-- نمونه 7: گزارش‌های ماهیانه با وضعیت‌های مختلف
-- =============================================
PRINT N'';
PRINT N'→ نمونه 7: ایجاد گزارش‌های ماهیانه با جریان‌های کاری مختلف...';

INSERT INTO MonthlyReports (
    UserId, Year, Month, JalaliYear, JalaliMonth, 
    TotalHours, GymCost, Status, GroupId, 
    GeneralManagerStatus, ManagerComment, FinanceComment, 
    SubmittedAt, ApprovedAt
)
VALUES
    -- گزارش‌های تکمیل شده و تایید شده (دی ماه 1403)
    (3001, 2025, 1, 1403, 10, 180, 1500000, 'approved', 1, 
     'approved_by_general_manager', N'عملکرد عالی، کیفیت کد بالا', N'تایید شده - واریز شد', 
     '2025-01-25', '2025-02-01'),
    
    (3002, 2025, 1, 1403, 10, 176, 1200000, 'approved', 1, 
     'approved_by_general_manager', N'به موقع و با کیفیت', N'تایید شده - واریز شد', 
     '2025-01-25', '2025-02-01'),
    
    (3003, 2025, 1, 1403, 10, 195, 2000000, 'approved', 1, 
     'approved_by_general_manager', N'اضافه کاری قابل توجه، کار فوق‌العاده', N'تایید شده با پاداش - واریز شد', 
     '2025-01-26', '2025-02-02'),
    
    -- گزارش‌های بهمن ماه - در مراحل مختلف تایید
    (3001, 2025, 2, 1403, 11, 176, 1500000, 'submitted_to_finance', 1, 
     'approved_by_general_manager', N'خوب بود', NULL, 
     '2025-02-25', NULL),
    
    (3002, 2025, 2, 1403, 11, 170, 1200000, 'submitted_to_general_manager', 1, 
     'pending', N'تعداد ساعات کمتر از معمول - توضیح بدهید', NULL, 
     '2025-02-25', NULL),
    
    (3003, 2025, 2, 1403, 11, 188, 2000000, 'submitted_to_finance', 1, 
     'approved_by_general_manager', N'عالی', NULL, 
     '2025-02-26', NULL),
    
    (3004, 2025, 2, 1403, 11, 90, 800000, 'submitted_to_group_manager', 2, 
     'pending', NULL, NULL, 
     '2025-02-24', NULL),
    
    -- گزارش‌های اسفند ماه - در مراحل اولیه
    (3001, 2025, 3, 1403, 12, 175, 1500000, 'submitted_to_group_manager', 1, 
     'pending', NULL, NULL, 
     '2025-03-20', NULL),
    
    (3005, 2025, 3, 1403, 12, 85, 1800000, 'draft', 3, 
     'pending', NULL, NULL, 
     NULL, NULL),
    
    (3006, 2025, 3, 1403, 12, 125, 1000000, 'draft', 4, 
     'pending', NULL, NULL, 
     NULL, NULL);
GO
PRINT N'✓ 10 گزارش ماهیانه با وضعیت‌های مختلف (draft, در حال بررسی, تایید شده) ایجاد شد';

-- =============================================
-- نمونه 8: تنظیمات بازه زمانی ماه‌ها (سفارشی)
-- =============================================
PRINT N'';
PRINT N'→ نمونه 8: تعریف بازه‌های سفارشی برای ماه‌ها...';

-- بازه‌های سفارشی برای سال 1403
INSERT INTO MonthPeriodSettings (Year, Month, StartDay, StartMonth, StartYear, EndDay, EndMonth, EndYear, CreatedAt, UpdatedAt)
VALUES
    -- دی ماه: از 26 آذر تا 25 دی
    (1403, 10, 26, 9, 1403, 25, 10, 1403, GETDATE(), GETDATE()),
    
    -- بهمن ماه: از 26 دی تا 25 بهمن
    (1403, 11, 26, 10, 1403, 25, 11, 1403, GETDATE(), GETDATE()),
    
    -- اسفند ماه: از 26 بهمن تا 25 اسفند (یا 30 اسفند برای سال عادی)
    (1403, 12, 26, 11, 1403, 29, 12, 1403, GETDATE(), GETDATE());

-- بازه‌های سفارشی برای سال 1404
INSERT INTO MonthPeriodSettings (Year, Month, StartDay, StartMonth, StartYear, EndDay, EndMonth, EndYear, CreatedAt, UpdatedAt)
VALUES
    -- فروردین: از 26 اسفند 1403 تا 25 فروردین 1404 (سال‌شکن)
    (1404, 1, 26, 12, 1403, 25, 1, 1404, GETDATE(), GETDATE()),
    
    -- اردیبهشت: از 26 فروردین تا 25 اردیبهشت
    (1404, 2, 26, 1, 1404, 25, 2, 1404, GETDATE(), GETDATE());
GO
PRINT N'✓ 5 بازه زمانی سفارشی برای ماه‌های مختلف تعریف شد';

-- =============================================
-- نمایش آمار نهایی
-- =============================================
PRINT N'';
PRINT N'========================================';
PRINT N'     آمار داده‌های ایجاد شده';
PRINT N'========================================';

DECLARE 
    @TotalProjectAccess INT,
    @TotalContracts INT,
    @TotalDailyDetails INT,
    @TotalProjectTasks INT,
    @TotalCarCosts INT,
    @TotalGymCosts INT,
    @TotalMonthlyReports INT,
    @TotalPeriodSettings INT;

SELECT @TotalProjectAccess = COUNT(*) FROM UserProjectAccess WHERE UserId >= 3001;
SELECT @TotalContracts = COUNT(*) FROM UserContractHours WHERE UserId >= 3001;
SELECT @TotalDailyDetails = COUNT(*) FROM DailyDetails WHERE UserId >= 3001;
SELECT @TotalProjectTasks = COUNT(*) FROM DailyProjectTasks WHERE UserId >= 3001;
SELECT @TotalCarCosts = COUNT(*) FROM DailyPersonalCarCosts WHERE UserId >= 3001;
SELECT @TotalGymCosts = COUNT(*) FROM MonthlyGymCosts WHERE UserId >= 3001;
SELECT @TotalMonthlyReports = COUNT(*) FROM MonthlyReports WHERE UserId >= 3001;
SELECT @TotalPeriodSettings = COUNT(*) FROM MonthPeriodSettings WHERE Year >= 1403;

PRINT N'➤ دسترسی‌های پروژه: ' + CAST(@TotalProjectAccess AS NVARCHAR(10));
PRINT N'➤ قراردادهای کاری: ' + CAST(@TotalContracts AS NVARCHAR(10));
PRINT N'➤ جزئیات روزانه: ' + CAST(@TotalDailyDetails AS NVARCHAR(10));
PRINT N'➤ وظایف پروژه: ' + CAST(@TotalProjectTasks AS NVARCHAR(10));
PRINT N'➤ هزینه‌های ماشین: ' + CAST(@TotalCarCosts AS NVARCHAR(10));
PRINT N'➤ هزینه‌های ورزش: ' + CAST(@TotalGymCosts AS NVARCHAR(10));
PRINT N'➤ گزارش‌های ماهیانه: ' + CAST(@TotalMonthlyReports AS NVARCHAR(10));
PRINT N'➤ تنظیمات بازه زمانی: ' + CAST(@TotalPeriodSettings AS NVARCHAR(10));

PRINT N'========================================';
PRINT N'✓✓✓ همه نمونه‌ها با موفقیت ایجاد شدند ✓✓✓';
PRINT N'========================================';
GO

-- =============================================
-- نمایش نمونه‌ای از داده‌های ایجاد شده
-- =============================================
PRINT N'';
PRINT N'نمونه‌ای از داده‌های ایجاد شده:';
PRINT N'----------------------------------------';

-- نمایش گزارش‌های ماهیانه
SELECT TOP 3
    mr.UserId,
    mr.JalaliYear,
    mr.JalaliMonth,
    mr.TotalHours,
    mr.GymCost,
    mr.Status,
    mr.GeneralManagerStatus,
    mr.ManagerComment
FROM MonthlyReports mr
WHERE mr.UserId >= 3001
ORDER BY mr.SubmittedAt DESC;

PRINT N'----------------------------------------';
GO
