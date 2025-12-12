-- =============================================
-- نمونه‌های پیشرفته: سناریوهای پیچیده و Edge Cases
-- =============================================
-- این فایل شامل سناریوهای پیچیده و موارد خاص است:
-- - اضافه‌کاری و شیفت‌های شبانه
-- - تداخل پروژه‌ها در یک روز
-- - مرخصی‌های بلند مدت
-- - ماموریت‌های چند روزه
-- - تغییرات در میانه دوره
-- =============================================

USE EOSDB;
GO

PRINT N'========================================';
PRINT N'نمونه‌های پیشرفته - سناریوهای پیچیده';
PRINT N'========================================';
GO

-- =============================================
-- سناریو 1: اضافه‌کاری شبانه و آخر هفته
-- =============================================
PRINT N'';
PRINT N'→ سناریو 1: شبیه‌سازی اضافه‌کاری برای دوره نهایی‌سازی پروژه...';

-- کارمند: 4001 - Developer
DELETE FROM UserContractHours WHERE UserId = 4001;
INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours)
VALUES (4001, '09:00:00', '18:00:00', 176);

-- هفته عادی
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
VALUES 
    ('2024-12-16', 4001, '09:00:00', '18:15:00', 60, N'روز عادی', 50000, 50000, NULL),
    ('2024-12-17', 4001, '09:05:00', '18:10:00', 55, N'روز عادی', 50000, 50000, NULL);

-- شروع Crunch Time - اضافه کاری سنگین
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
VALUES 
    ('2024-12-18', 4001, '08:30:00', '23:45:00', 90, N'اضافه کاری - دوره Release', 50000, 80000, NULL),
    ('2024-12-19', 4001, '09:00:00', '02:30:00', 120, N'شیفت شبانه - رفع باگ‌های Critical', 50000, 100000, NULL),
    ('2024-12-20', 4001, '12:00:00', '22:00:00', 60, N'کار روز آخر - Testing', 50000, 70000, NULL);

-- کار آخر هفته (شنبه)
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
VALUES 
    ('2024-12-21', 4001, '10:00:00', '18:00:00', 30, N'اضافه کاری آخر هفته - Deployment', 70000, 70000, NULL);

-- وظایف پروژه‌ای مرتبط
INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
VALUES
    ('2024-12-18', 4001, 100, 480, N'رفع باگ‌های Critical قبل از Release'),
    ('2024-12-18', 4001, 101, 240, N'Testing و QA'),
    
    ('2024-12-19', 4001, 100, 600, N'کار شبانه - Hotfix و Deployment'),
    ('2024-12-19', 4001, 101, 180, N'مانیتورینگ و رفع مشکلات'),
    
    ('2024-12-20', 4001, 100, 360, N'Testing نهایی'),
    ('2024-12-20', 4001, 101, 180, N'Documentation'),
    
    ('2024-12-21', 4001, 100, 420, N'Deployment Production - آخر هفته');
GO
PRINT N'✓ سناریو اضافه‌کاری سنگین (شبانه و آخر هفته) ایجاد شد';

-- =============================================
-- سناریو 2: مرخصی بلند مدت و بازگشت به کار
-- =============================================
PRINT N'';
PRINT N'→ سناریو 2: شبیه‌سازی مرخصی بلند مدت و دوره بازگشت...';

-- کارمند: 4002 - Senior Developer
DELETE FROM UserContractHours WHERE UserId = 4002;
INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours)
VALUES (4002, '08:00:00', '17:00:00', 176);

-- هفته اول: کار عادی
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
VALUES 
    ('2024-12-02', 4002, '08:05:00', '17:10:00', 45, N'کار عادی', 50000, 50000, NULL),
    ('2024-12-03', 4002, '08:00:00', '17:15:00', 50, N'کار عادی', 50000, 50000, NULL),
    ('2024-12-04', 4002, '08:10:00', '17:05:00', 45, N'کار عادی', 50000, 50000, NULL);

-- مرخصی 10 روزه (ازدواج + ماه عسل)
DECLARE @LeaveCounter INT = 0;
WHILE @LeaveCounter < 10
BEGIN
    INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
    VALUES (DATEADD(day, @LeaveCounter + 5, '2024-12-02'), 4002, NULL, NULL, NULL, 
            N'مرخصی ازدواج + ماه عسل', NULL, NULL, N'استحقاقی');
    SET @LeaveCounter = @LeaveCounter + 1;
END;

-- بازگشت به کار با ساعات کمتر (دوره انتقال)
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
VALUES 
    ('2024-12-16', 4002, '09:00:00', '16:00:00', 30, N'بازگشت به کار - نیمه وقت', 40000, 40000, NULL),
    ('2024-12-17', 4002, '08:30:00', '16:30:00', 45, N'بازگشت تدریجی', 45000, 45000, NULL),
    ('2024-12-18', 4002, '08:00:00', '17:00:00', 50, N'بازگشت کامل به برنامه عادی', 50000, 50000, NULL);
GO
PRINT N'✓ سناریو مرخصی بلند مدت و بازگشت تدریجی ایجاد شد';

-- =============================================
-- سناریو 3: ماموریت چند روزه برون شهری
-- =============================================
PRINT N'';
PRINT N'→ سناریو 3: ماموریت 3 روزه برون شهری با هزینه‌های متعدد...';

-- کارمند: 4003 - DevOps Engineer
DELETE FROM UserContractHours WHERE UserId = 4003;
INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours)
VALUES (4003, '08:00:00', '17:00:00', 176);

-- ماموریت اصفهان - نصب و راه‌اندازی دیتاسنتر
-- روز 1: مسافرت
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
VALUES ('2024-12-10', 4003, '06:00:00', '22:00:00', 240, N'ماموریت اصفهان - روز اول: مسافرت', 0, 0, NULL);

INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
VALUES 
    ('2024-12-10', 4003, 100, 300, N'بررسی اولیه سایت و آماده‌سازی'),
    ('2024-12-10', 4003, 102, 180, N'نصب تجهیزات شبکه');

-- روز 2: کار اصلی
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
VALUES ('2024-12-11', 4003, '08:00:00', '23:00:00', 90, N'ماموریت اصفهان - روز دوم: نصب و پیکربندی', 0, 0, NULL);

INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
VALUES 
    ('2024-12-11', 4003, 100, 480, N'نصب سرورها و Storage'),
    ('2024-12-11', 4003, 102, 360, N'پیکربندی شبکه و Firewall');

-- روز 3: تست و بازگشت
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
VALUES ('2024-12-12', 4003, '08:00:00', '20:00:00', 180, N'ماموریت اصفهان - روز سوم: تست و بازگشت', 0, 0, NULL);

INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
VALUES 
    ('2024-12-12', 4003, 100, 300, N'Testing و مانیتورینگ'),
    ('2024-12-12', 4003, 102, 180, N'آموزش به تیم محلی');

-- هزینه‌های ماشین برای ماموریت
INSERT INTO DailyPersonalCarCosts (Date, UserId, ProjectId, Kilometers, Cost, Description)
VALUES
    ('2024-12-10', 4003, 100, 450, 15000000, N'مسافرت رفت اصفهان - شامل سوخت و عوارض'),
    ('2024-12-11', 4003, 100, 50, 1500000, N'رفت و آمد داخل شهر اصفهان'),
    ('2024-12-12', 4003, 100, 450, 15000000, N'مسافرت برگشت به تهران');
GO
PRINT N'✓ سناریو ماموریت 3 روزه برون شهری با جزئیات کامل ایجاد شد';

-- =============================================
-- سناریو 4: کار روی چندین پروژه در یک روز
-- =============================================
PRINT N'';
PRINT N'→ سناریو 4: تقسیم زمان بین 5 پروژه در یک روز...';

-- کارمند: 4004 - Full-Stack Developer
DELETE FROM UserContractHours WHERE UserId = 4004;
INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours)
VALUES (4004, '09:00:00', '18:00:00', 176);

INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
VALUES ('2024-12-15', 4004, '08:45:00', '19:30:00', 60, N'روز شلوغ - کار روی چندین پروژه', 50000, 50000, NULL);

-- تقسیم دقیق زمان بین پروژه‌ها
INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
VALUES
    -- صبح: Daily Standup و Emails
    ('2024-12-15', 4004, 100, 30, N'Daily Standup Meeting'),
    ('2024-12-15', 4004, 100, 90, N'رفع باگ Critical در Production'),
    
    -- میان صبح
    ('2024-12-15', 4004, 101, 120, N'توسعه Feature جدید - Frontend'),
    
    -- قبل از ناهار
    ('2024-12-15', 4004, 102, 60, N'Code Review برای Team Member'),
    
    -- بعد از ناهار
    ('2024-12-15', 4004, 103, 90, N'ادغام API جدید - Backend'),
    ('2024-12-15', 4004, 103, 90, N'نوشتن Unit Tests'),
    
    -- بعدازظهر
    ('2024-12-15', 4004, 104, 120, N'جلسه با مشتری و دمو'),
    
    -- عصر
    ('2024-12-15', 4004, 105, 90, N'Refactoring کد قدیمی'),
    
    -- اضافه کاری
    ('2024-12-15', 4004, 100, 60, N'آماده‌سازی Deployment فردا');
GO
PRINT N'✓ سناریو تقسیم دقیق زمان بین 5 پروژه ایجاد شد';

-- =============================================
-- سناریو 5: تغییر نوع قرارداد در میانه ماه
-- =============================================
PRINT N'';
PRINT N'→ سناریو 5: تغییر از Part-time به Full-time در میانه ماه...';

-- کارمند: 4005 - Junior Developer
-- قرارداد اولیه: Part-time
DELETE FROM UserContractHours WHERE UserId = 4005;
INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours)
VALUES (4005, '09:00:00', '13:00:00', 88);  -- شروع با Part-time

-- 10 روز اول: Part-time (4 ساعت در روز)
DECLARE @DayNum INT = 1;
WHILE @DayNum <= 10
BEGIN
    INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
    VALUES (
        DATEADD(day, @DayNum, '2024-12-01'),
        4005,
        '09:00:00',
        '13:15:00',
        15,
        N'کار Part-time - 4 ساعت',
        30000,
        30000,
        NULL
    );
    
    INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
    VALUES 
        (DATEADD(day, @DayNum, '2024-12-01'), 4005, 106, 210, N'یادگیری و کارهای ساده');
    
    SET @DayNum = @DayNum + 1;
END;

-- تغییر قرارداد (در واقع باید قرارداد جدید باشد ولی برای سادگی Update می‌کنیم)
UPDATE UserContractHours 
SET ContractArrivalTime = '08:00:00', 
    ContractLeaveTime = '17:00:00', 
    MinMonthlyHours = 176 
WHERE UserId = 4005;

-- 12 روز بعد: Full-time (8 ساعت در روز)
SET @DayNum = 11;
WHILE @DayNum <= 22
BEGIN
    INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
    VALUES (
        DATEADD(day, @DayNum, '2024-12-01'),
        4005,
        '08:00:00',
        '17:10:00',
        45,
        N'کار Full-time - 8 ساعت',
        50000,
        50000,
        NULL
    );
    
    INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
    VALUES 
        (DATEADD(day, @DayNum, '2024-12-01'), 4005, 106, 240, N'Features اصلی پروژه'),
        (DATEADD(day, @DayNum, '2024-12-01'), 4005, 107, 180, N'یادگیری تکنولوژی جدید');
    
    SET @DayNum = @DayNum + 1;
END;
GO
PRINT N'✓ سناریو تغییر از Part-time به Full-time ایجاد شد';

-- =============================================
-- سناریو 6: کار دورکار با ساعات نامنظم
-- =============================================
PRINT N'';
PRINT N'→ سناریو 6: کارمند دورکار با ساعات کاری منعطف...';

-- کارمند: 4006 - Remote Developer
DELETE FROM UserContractHours WHERE UserId = 4006;
INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours)
VALUES (4006, NULL, '23:59:59', 160);  -- فقط حداقل ساعت مهم است

-- ساعات کاری متغیر در هفته
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType)
VALUES 
    -- شروع دیر، تمام دیر
    ('2024-12-16', 4006, '11:30:00', '20:45:00', 90, N'دورکار - ساعت شروع دیر', 0, 0, NULL),
    
    -- صبح زود شروع
    ('2024-12-17', 4006, '06:00:00', '15:30:00', 75, N'دورکار - صبح زود', 0, 0, NULL),
    
    -- کار در دو نوبت
    ('2024-12-18', 4006, '08:00:00', '12:00:00', 0, N'دورکار - نوبت اول', 0, 0, NULL),
    ('2024-12-18', 4006, '16:00:00', '21:00:00', 0, N'دورکار - نوبت دوم', 0, 0, NULL),
    
    -- روز معمولی
    ('2024-12-19', 4006, '09:00:00', '18:30:00', 60, N'دورکار - برنامه عادی', 0, 0, NULL),
    
    -- شب‌کاری
    ('2024-12-20', 4006, '20:00:00', '04:00:00', 120, N'دورکار - شیفت شب', 0, 0, NULL);

-- وظایف پروژه
INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
VALUES
    ('2024-12-16', 4006, 108, 360, N'توسعه Backend API'),
    ('2024-12-17', 4006, 108, 390, N'Debugging و Testing'),
    ('2024-12-18', 4006, 108, 210, N'Code Review - صبح'),
    ('2024-12-18', 4006, 109, 240, N'Feature جدید - عصر'),
    ('2024-12-19', 4006, 108, 300, N'Refactoring'),
    ('2024-12-20', 4006, 109, 300, N'کار شبانه روی Integration');
GO
PRINT N'✓ سناریو دورکار با ساعات نامنظم ایجاد شد';

-- =============================================
-- نمایش خلاصه سناریوها
-- =============================================
PRINT N'';
PRINT N'========================================';
PRINT N'   خلاصه سناریوهای ایجاد شده';
PRINT N'========================================';
PRINT N'';
PRINT N'✓ سناریو 1: اضافه‌کاری سنگین و شیفت شبانه';
PRINT N'  → کارمند 4001: 5 روز کاری + شنبه با جمعاً 63 ساعت';
PRINT N'';
PRINT N'✓ سناریو 2: مرخصی بلند مدت';
PRINT N'  → کارمند 4002: 10 روز مرخصی + بازگشت تدریجی';
PRINT N'';
PRINT N'✓ سناریو 3: ماموریت برون شهری';
PRINT N'  → کارمند 4003: 3 روز اصفهان با 900 کیلومتر';
PRINT N'';
PRINT N'✓ سناریو 4: Multi-tasking';
PRINT N'  → کارمند 4004: 9 تسک در 5 پروژه مختلف در یک روز';
PRINT N'';
PRINT N'✓ سناریو 5: تغییر قرارداد';
PRINT N'  → کارمند 4005: Part-time → Full-time';
PRINT N'';
PRINT N'✓ سناریو 6: دورکار منعطف';
PRINT N'  → کارمند 4006: 5 روز با ساعات کاری متغیر';
PRINT N'========================================';

-- نمایش آمار
DECLARE @Details4000s INT, @Tasks4000s INT, @Cars4000s INT;
SELECT @Details4000s = COUNT(*) FROM DailyDetails WHERE UserId >= 4001 AND UserId < 5000;
SELECT @Tasks4000s = COUNT(*) FROM DailyProjectTasks WHERE UserId >= 4001 AND UserId < 5000;
SELECT @Cars4000s = COUNT(*) FROM DailyPersonalCarCosts WHERE UserId >= 4001 AND UserId < 5000;

PRINT N'';
PRINT N'آمار داده‌های ایجاد شده:';
PRINT N'  • جزئیات روزانه: ' + CAST(@Details4000s AS NVARCHAR(10));
PRINT N'  • وظایف پروژه: ' + CAST(@Tasks4000s AS NVARCHAR(10));
PRINT N'  • هزینه‌های ماشین: ' + CAST(@Cars4000s AS NVARCHAR(10));
PRINT N'';
PRINT N'✓✓✓ همه سناریوها با موفقیت ایجاد شدند ✓✓✓';
GO
