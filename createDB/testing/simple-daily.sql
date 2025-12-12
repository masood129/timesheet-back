-- =============================================
-- فایل 3: جزئیات روزانه ساده
-- =============================================
-- این فایل جزئیات روزانه برای 3 روز کاری ایجاد می‌کند
-- =============================================

USE UMD;
GO

PRINT N'→ ثبت جزئیات روزانه...';

-- تاریخ شروع (امروز یا یک تاریخ خاص)
DECLARE @StartDate DATE = '2024-12-16';

-- حذف داده‌های قبلی
DELETE FROM DailyDetails 
WHERE UserId IN (2001, 2002, 2003, 2004, 2005) 
AND Date >= @StartDate;

DELETE FROM DailyProjectTasks 
WHERE UserId IN (2001, 2002, 2003, 2004, 2005) 
AND Date >= @StartDate;

-- روز 1
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost)
VALUES
    (@StartDate, 2001, '08:05:00', '17:10:00', 45, N'کار عادی', 50000, 50000),
    (@StartDate, 2002, '09:10:00', '18:05:00', 50, N'کار عادی', 40000, 40000),
    (@StartDate, 2003, '08:00:00', '12:10:00', 10, N'نیمه وقت', 30000, 30000);

-- وظایف پروژه روز 1
INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
VALUES
    (@StartDate, 2001, 100, 240, N'توسعه API'),
    (@StartDate, 2001, 101, 180, N'رفع باگ'),
    (@StartDate, 2002, 100, 300, N'بهینه‌سازی'),
    (@StartDate, 2003, 101, 180, N'طراحی UI');

-- روز 2
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost)
VALUES
    (DATEADD(day, 1, @StartDate), 2001, '08:00:00', '17:15:00', 50, N'کار عادی', 50000, 50000),
    (DATEADD(day, 1, @StartDate), 2002, '09:00:00', '18:10:00', 45, N'کار عادی', 40000, 40000),
    (DATEADD(day, 1, @StartDate), 2004, '14:05:00', '18:00:00', 5, N'نیمه وقت عصر', 30000, 30000);

-- وظایف پروژه روز 2
INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
VALUES
    (DATEADD(day, 1, @StartDate), 2001, 100, 270, N'توسعه Feature جدید'),
    (DATEADD(day, 1, @StartDate), 2001, 101, 150, N'Testing'),
    (DATEADD(day, 1, @StartDate), 2002, 102, 240, N'مستندسازی'),
    (DATEADD(day, 1, @StartDate), 2004, 104, 180, N'کار روی Dashboard');

-- روز 3
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost)
VALUES
    (DATEADD(day, 2, @StartDate), 2001, '08:10:00', '17:05:00', 40, N'کار عادی', 50000, 50000),
    (DATEADD(day, 2, @StartDate), 2005, '10:00:00', '16:30:00', 30, N'دورکار', 0, 0);

-- وظایف پروژه روز 3
INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
VALUES
    (DATEADD(day, 2, @StartDate), 2001, 100, 300, N'Code Review'),
    (DATEADD(day, 2, @StartDate), 2001, 101, 120, N'Meeting'),
    (DATEADD(day, 2, @StartDate), 2005, 106, 300, N'توسعه Remote');

PRINT N'✓ جزئیات 3 روز کاری ثبت شد';
PRINT N'  تاریخ شروع: ' + CONVERT(NVARCHAR(10), @StartDate, 120);
PRINT N'  تعداد رکوردها: 8 (DailyDetails) + 10 (DailyProjectTasks)';
GO
