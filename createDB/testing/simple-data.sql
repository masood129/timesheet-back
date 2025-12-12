-- =============================================
-- داده‌های تستی ساده - برای محیط Testing
-- =============================================

USE UMD;
GO

PRINT N'→ درج داده‌های تستی ساده...';

-- حذف داده‌های قبلی
DELETE FROM DailyProjectTasks WHERE UserId BETWEEN 2001 AND 2005;
DELETE FROM DailyPersonalCarCosts WHERE UserId BETWEEN 2001 AND 2005;
DELETE FROM DailyDetails WHERE UserId BETWEEN 2001 AND 2005;
DELETE FROM MonthlyGymCosts WHERE UserId BETWEEN 2001 AND 2005;
DELETE FROM MonthlyReports WHERE UserId BETWEEN 2001 AND 2005;
DELETE FROM UserProjectAccess WHERE UserId BETWEEN 2001 AND 2005;
DELETE FROM UserContractHours WHERE UserId BETWEEN 2001 AND 2005;

-- قراردادهای کاری
INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours)
VALUES
    (2001, '08:00:00', '17:00:00', 176),
    (2002, '09:00:00', '18:00:00', 176),
    (2003, '08:00:00', '12:00:00', 88),
    (2004, '14:00:00', '18:00:00', 88),
    (2005, NULL, '23:59:59', 120);

PRINT N'✓ 5 قرارداد کاری';

-- دسترسی‌های پروژه
INSERT INTO UserProjectAccess (UserId, ProjectId)
VALUES
    (2001, 100), (2001, 101),
    (2002, 100), (2002, 102), (2002, 103),
    (2003, 101),
    (2004, 104), (2004, 105),
    (2005, 106);

PRINT N'✓ دسترسی‌های پروژه';

-- جزئیات روزانه (3 روز)
DECLARE @d DATE = DATEADD(day, -2, GETDATE());

INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost)
VALUES
    (@d, 2001, '08:05:00', '17:10:00', 45, N'روز 1', 50000, 50000),
    (@d, 2002, '09:10:00', '18:05:00', 50, N'روز 1', 40000, 40000),
    (DATEADD(day,1,@d), 2001, '08:00:00', '17:15:00', 50, N'روز 2', 50000, 50000),
    (DATEADD(day,1,@d), 2003, '08:00:00', '12:10:00', 10, N'روز 2', 30000, 30000),
    (DATEADD(day,2,@d), 2002, '09:00:00', '18:10:00', 45, N'روز 3', 40000, 40000);

PRINT N'✓ 5 رکورد حضور و غیاب';

-- وظایف پروژه
INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
VALUES
    (@d, 2001, 100, 240, N'توسعه API'),
    (@d, 2001, 101, 180, N'رفع باگ'),
    (DATEADD(day,1,@d), 2001, 100, 270, N'Feature جدید'),
    (DATEADD(day,1,@d), 2003, 101, 180, N'طراحی UI'),
    (DATEADD(day,2,@d), 2002, 102, 300, N'Testing');

PRINT N'✓ 5 وظیفه پروژه';

-- گزارش ماهیانه
INSERT INTO MonthlyReports (UserId, Year, Month, JalaliYear, JalaliMonth, TotalHours, GymCost, Status, GroupId, GeneralManagerStatus, SubmittedAt)
VALUES (2001, 2024, 12, 1403, 9, 176, 1200000, 'draft', 1, 'pending', GETDATE());

PRINT N'✓ 1 گزارش ماهیانه';

-- هزینه‌های ورزش
INSERT INTO MonthlyGymCosts (UserId, Year, Month, Cost, GymHours, Description)
VALUES 
    (2001, 1403, 9, 1200000, 20, N'باشگاه'),
    (2002, 1403, 9, 800000, 15, N'استخر');

PRINT N'✓ 2 هزینه ورزش';

PRINT N'';
PRINT N'✓✓✓ داده‌های تستی آماده است ✓✓✓';
GO
