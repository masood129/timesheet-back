-- =============================================
-- نمونه‌های کوئری و تست برای EOSDB
-- =============================================
-- این فایل شامل کوئری‌های آماده برای تست و استفاده از دیتابیس است
-- =============================================

USE EOSDB;
GO

PRINT N'========================================';
PRINT N'  کوئری‌های نمونه برای تست EOSDB';
PRINT N'========================================';
GO

-- =============================================
-- کوئری 1: گزارش ساعات کاری ماهیانه یک کارمند
-- =============================================
PRINT N'';
PRINT N'→ کوئری 1: محاسبه ساعات کاری ماهیانه کارمند 3001';
PRINT N'--------------------------------------------------';

-- محاسبه ساعات کاری یک ماه خاص
DECLARE @TargetUserId INT = 3001;
DECLARE @TargetYear INT = 2024;
DECLARE @TargetMonth INT = 12;

WITH WorkHours AS (
    SELECT 
        dd.UserId,
        dd.Date,
        dd.ArrivalTime,
        dd.LeaveTime,
        dd.PersonalTime,
        dd.LeaveType,
        -- محاسبه ساعات کاری (دقیقه)
        CASE 
            WHEN dd.LeaveType IS NOT NULL THEN 0  -- مرخصی
            WHEN dd.ArrivalTime IS NULL OR dd.LeaveTime IS NULL THEN 0
            ELSE DATEDIFF(MINUTE, 
                CAST(dd.ArrivalTime AS TIME), 
                CAST(dd.LeaveTime AS TIME)) - ISNULL(dd.PersonalTime, 0)
        END AS WorkMinutes
    FROM DailyDetails dd
    WHERE 
        dd.UserId = @TargetUserId
        AND YEAR(dd.Date) = @TargetYear
        AND MONTH(dd.Date) = @TargetMonth
)
SELECT 
    UserId,
    COUNT(*) AS TotalDays,
    COUNT(CASE WHEN LeaveType IS NOT NULL THEN 1 END) AS LeaveDays,
    COUNT(CASE WHEN LeaveType IS NULL THEN 1 END) AS WorkDays,
    SUM(WorkMinutes) AS TotalWorkMinutes,
    SUM(WorkMinutes) / 60 AS TotalWorkHours,
    SUM(WorkMinutes) % 60 AS ExtraMinutes,
    -- مقایسه با حداقل قرارداد
    (SELECT MinMonthlyHours FROM UserContractHours WHERE UserId = @TargetUserId) AS ContractMinHours,
    CASE 
        WHEN SUM(WorkMinutes) / 60 >= (SELECT MinMonthlyHours FROM UserContractHours WHERE UserId = @TargetUserId)
        THEN N'✓ شرایط قرارداد محقق شد'
        ELSE N'✗ کمبود ساعت'
    END AS ContractStatus
FROM WorkHours
GROUP BY UserId;
GO

-- =============================================
-- کوئری 2: گزارش پروژه‌های یک کارمند
-- =============================================
PRINT N'';
PRINT N'→ کوئری 2: توزیع زمان بین پروژه‌های مختلف';
PRINT N'--------------------------------------------------';

SELECT 
    dpt.UserId,
    dpt.ProjectId,
    COUNT(DISTINCT dpt.Date) AS DaysWorked,
    SUM(dpt.Duration) AS TotalMinutes,
    SUM(dpt.Duration) / 60 AS TotalHours,
    AVG(dpt.Duration) AS AvgMinutesPerDay,
    MIN(dpt.Duration) AS MinTaskDuration,
    MAX(dpt.Duration) AS MaxTaskDuration,
    COUNT(*) AS TaskCount
FROM DailyProjectTasks dpt
WHERE dpt.UserId IN (3001, 3002, 3003)
    AND dpt.Date >= '2024-12-01'
    AND dpt.Date < '2025-01-01'
GROUP BY dpt.UserId, dpt.ProjectId
ORDER BY dpt.UserId, TotalMinutes DESC;
GO

-- =============================================
-- کوئری 3: گزارش هزینه‌های ماشین ماهیانه
-- =============================================
PRINT N'';
PRINT N'→ کوئری 3: جمع هزینه‌های ماشین شخصی به تفکیک کارمند';
PRINT N'--------------------------------------------------';

SELECT 
    dpcc.UserId,
    COUNT(DISTINCT dpcc.Date) AS TripDays,
    COUNT(*) AS TripCount,
    SUM(dpcc.Kilometers) AS TotalKilometers,
    SUM(dpcc.Cost) AS TotalCost,
    AVG(dpcc.Kilometers) AS AvgKilometersPerTrip,
    AVG(dpcc.Cost) AS AvgCostPerTrip,
    MIN(dpcc.Cost) AS MinCost,
    MAX(dpcc.Cost) AS MaxCost
FROM DailyPersonalCarCosts dpcc
WHERE dpcc.Date >= '2024-12-01' AND dpcc.Date < '2025-01-01'
GROUP BY dpcc.UserId
ORDER BY TotalCost DESC;
GO

-- =============================================
-- کوئری 4: گزارش وضعیت Monthly Reports
-- =============================================
PRINT N'';
PRINT N'→ کوئری 4: آمار گزارش‌های ماهیانه به تفکیک وضعیت';
PRINT N'--------------------------------------------------';

SELECT 
    Status,
    GeneralManagerStatus,
    COUNT(*) AS ReportCount,
    AVG(TotalHours) AS AvgHours,
    SUM(GymCost) AS TotalGymCost,
    COUNT(CASE WHEN ManagerComment IS NOT NULL THEN 1 END) AS WithManagerComment,
    COUNT(CASE WHEN FinanceComment IS NOT NULL THEN 1 END) AS WithFinanceComment
FROM MonthlyReports
WHERE JalaliYear = 1403
GROUP BY Status, GeneralManagerStatus
ORDER BY 
    CASE Status
        WHEN 'draft' THEN 1
        WHEN 'submitted_to_group_manager' THEN 2
        WHEN 'submitted_to_general_manager' THEN 3
        WHEN 'submitted_to_finance' THEN 4
        WHEN 'approved' THEN 5
    END;
GO

-- =============================================
-- کوئری 5: بررسی تأخیرات و زودتر رفتن‌ها
-- =============================================
PRINT N'';
PRINT N'→ کوئری 5: تحلیل زمان ورود و خروج نسبت به قرارداد';
PRINT N'--------------------------------------------------';

WITH AttendanceAnalysis AS (
    SELECT 
        dd.UserId,
        dd.Date,
        dd.ArrivalTime,
        dd.LeaveTime,
        uch.ContractArrivalTime,
        uch.ContractLeaveTime,
        -- محاسبه تأخیر (دقیقه)
        CASE 
            WHEN dd.ArrivalTime IS NULL THEN NULL
            WHEN uch.ContractArrivalTime IS NULL THEN 0
            WHEN CAST(dd.ArrivalTime AS TIME) > CAST(uch.ContractArrivalTime AS TIME)
            THEN DATEDIFF(MINUTE, CAST(uch.ContractArrivalTime AS TIME), CAST(dd.ArrivalTime AS TIME))
            ELSE 0
        END AS LateMinutes,
        -- محاسبه زودتر رفتن (دقیقه منفی = ماندن بیشتر)
        CASE 
            WHEN dd.LeaveTime IS NULL THEN NULL
            WHEN CAST(dd.LeaveTime AS TIME) < CAST(uch.ContractLeaveTime AS TIME)
            THEN DATEDIFF(MINUTE, CAST(dd.LeaveTime AS TIME), CAST(uch.ContractLeaveTime AS TIME))
            ELSE 0
        END AS EarlyLeaveMinutes
    FROM DailyDetails dd
    LEFT JOIN UserContractHours uch ON dd.UserId = uch.UserId
    WHERE dd.Date >= '2024-12-01' 
        AND dd.Date < '2025-01-01'
        AND dd.LeaveType IS NULL  -- فقط روزهای کاری
)
SELECT 
    UserId,
    COUNT(*) AS WorkDays,
    COUNT(CASE WHEN LateMinutes > 0 THEN 1 END) AS LateDays,
    SUM(LateMinutes) AS TotalLateMinutes,
    AVG(LateMinutes) AS AvgLateMinutes,
    MAX(LateMinutes) AS MaxLateMinutes,
    COUNT(CASE WHEN EarlyLeaveMinutes > 0 THEN 1 END) AS EarlyLeaveDays,
    SUM(EarlyLeaveMinutes) AS TotalEarlyMinutes
FROM AttendanceAnalysis
GROUP BY UserId
HAVING COUNT(CASE WHEN LateMinutes > 0 THEN 1 END) > 0  -- فقط کسانی که حداقل یک بار تأخیر داشته‌اند
ORDER BY TotalLateMinutes DESC;
GO

-- =============================================
-- کوئری 6: تحلیل بازه زمانی ماه‌ها
-- =============================================
PRINT N'';
PRINT N'→ کوئری 6: نمایش بازه‌های تنظیم شده برای ماه‌ها';
PRINT N'--------------------------------------------------';

SELECT 
    Year,
    Month,
    CONCAT(StartYear, '/', StartMonth, '/', StartDay) AS StartDate,
    CONCAT(EndYear, '/', EndMonth, '/', EndDay) AS EndDate,
    -- محاسبه تعداد روزها (تقریبی)
    DATEDIFF(DAY, 
        DATEFROMPARTS(
            CASE WHEN StartMonth >= 10 THEN StartYear ELSE StartYear + 621 END,
            CASE 
                WHEN StartMonth = 10 THEN 12
                WHEN StartMonth = 11 THEN 1
                WHEN StartMonth = 12 THEN 2
                ELSE StartMonth + 2
            END,
            CASE WHEN StartDay > 28 THEN 28 ELSE StartDay END
        ),
        DATEFROMPARTS(
            CASE WHEN EndMonth >= 10 THEN EndYear ELSE EndYear + 621 END,
            CASE 
                WHEN EndMonth = 10 THEN 12
                WHEN EndMonth = 11 THEN 1
                WHEN EndMonth = 12 THEN 2
                ELSE EndMonth + 2
            END,
            CASE WHEN EndDay > 28 THEN 28 ELSE EndDay END
        )
    ) AS ApproxDays,
    CreatedAt,
    UpdatedAt
FROM MonthPeriodSettings
ORDER BY Year, Month;
GO

-- =============================================
-- کوئری 7: کارمندان با بیشترین اضافه کاری
-- =============================================
PRINT N'';
PRINT N'→ کوئری 7: رتبه‌بندی کارمندان بر اساس اضافه کاری';
PRINT N'--------------------------------------------------';

WITH Overtime AS (
    SELECT 
        dd.UserId,
        dd.Date,
        uch.MinMonthlyHours,
        -- ساعات کاری روزانه
        CASE 
            WHEN dd.LeaveType IS NOT NULL THEN 0
            WHEN dd.ArrivalTime IS NULL OR dd.LeaveTime IS NULL THEN 0
            ELSE DATEDIFF(MINUTE, 
                CAST(dd.ArrivalTime AS TIME), 
                CAST(dd.LeaveTime AS TIME)) - ISNULL(dd.PersonalTime, 0)
        END AS DailyMinutes,
        -- ساعات قراردادی روزانه (تقریبی: حداقل ماهانه / 22 روز)
        (uch.MinMonthlyHours * 60.0 / 22) AS ExpectedDailyMinutes
    FROM DailyDetails dd
    LEFT JOIN UserContractHours uch ON dd.UserId = uch.UserId
    WHERE dd.Date >= '2024-12-01' 
        AND dd.Date < '2025-01-01'
)
SELECT 
    UserId,
    COUNT(*) AS TotalDays,
    SUM(DailyMinutes) / 60 AS TotalHours,
    AVG(ExpectedDailyMinutes) / 60 AS ExpectedDailyHours,
    (SUM(DailyMinutes) - SUM(ExpectedDailyMinutes)) / 60 AS OvertimeHours,
    COUNT(CASE WHEN DailyMinutes > ExpectedDailyMinutes + 60 THEN 1 END) AS OvertimeDays
FROM Overtime
GROUP BY UserId
HAVING (SUM(DailyMinutes) - SUM(ExpectedDailyMinutes)) / 60 > 5  -- حداقل 5 ساعت اضافه کاری
ORDER BY OvertimeHours DESC;
GO

-- =============================================
-- کوئری 8: تحلیل پروژه‌ها - پربیننده‌ترین
-- =============================================
PRINT N'';
PRINT N'→ کوئری 8: پروژه‌ها با بیشترین تعداد کارمند و ساعت کار';
PRINT N'--------------------------------------------------';

SELECT 
    ProjectId,
    COUNT(DISTINCT UserId) AS UniqueWorkers,
    COUNT(DISTINCT Date) AS UniqueDays,
    COUNT(*) AS TotalTasks,
    SUM(Duration) / 60 AS TotalHours,
    AVG(Duration) AS AvgTaskDuration,
    MIN(Date) AS FirstWorkDate,
    MAX(Date) AS LastWorkDate
FROM DailyProjectTasks
WHERE Date >= '2024-12-01' AND Date < '2025-01-01'
GROUP BY ProjectId
ORDER BY TotalHours DESC;
GO

-- =============================================
-- کوئری 9: آمار مرخصی‌ها
-- =============================================
PRINT N'';
PRINT N'→ کوئری 9: تحلیل انواع مرخصی به تفکیک کارمند';
PRINT N'--------------------------------------------------';

SELECT 
    UserId,
    LeaveType,
    COUNT(*) AS LeaveDays,
    MIN(Date) AS FirstLeaveDate,
    MAX(Date) AS LastLeaveDate
FROM DailyDetails
WHERE LeaveType IS NOT NULL
    AND Date >= '2024-12-01'
    AND Date < '2025-01-01'
GROUP BY UserId, LeaveType
ORDER BY UserId, LeaveDays DESC;
GO

-- =============================================
-- کوئری 10: گزارش جامع یک کارمند
-- =============================================
PRINT N'';
PRINT N'→ کوئری 10: گزارش کامل برای یک کارمند در یک ماه';
PRINT N'--------------------------------------------------';

DECLARE @ReportUserId INT = 3001;
DECLARE @ReportMonth INT = 12;
DECLARE @ReportYear INT = 2024;

-- اطلاعات قرارداد
SELECT 
    N'اطلاعات قرارداد' AS Section,
    ContractArrivalTime,
    ContractLeaveTime,
    MinMonthlyHours
FROM UserContractHours
WHERE UserId = @ReportUserId;

-- خلاصه حضور
SELECT 
    N'خلاصه حضور' AS Section,
    COUNT(*) AS TotalRecords,
    COUNT(CASE WHEN LeaveType IS NULL THEN 1 END) AS WorkDays,
    COUNT(CASE WHEN LeaveType IS NOT NULL THEN 1 END) AS LeaveDays,
    SUM(CASE 
        WHEN LeaveType IS NULL AND ArrivalTime IS NOT NULL AND LeaveTime IS NOT NULL
        THEN DATEDIFF(MINUTE, CAST(ArrivalTime AS TIME), CAST(LeaveTime AS TIME)) - ISNULL(PersonalTime, 0)
        ELSE 0 
    END) / 60 AS TotalWorkHours,
    SUM(GoCost + ReturnCost) AS TotalTransportCost
FROM DailyDetails
WHERE UserId = @ReportUserId
    AND YEAR(Date) = @ReportYear
    AND MONTH(Date) = @ReportMonth;

-- توزیع پروژه‌ها
SELECT 
    N'توزیع پروژه‌ها' AS Section,
    ProjectId,
    COUNT(DISTINCT Date) AS DaysWorked,
    COUNT(*) AS Tasks,
    SUM(Duration) / 60 AS TotalHours
FROM DailyProjectTasks
WHERE UserId = @ReportUserId
    AND YEAR(Date) = @ReportYear
    AND MONTH(Date) = @ReportMonth
GROUP BY ProjectId
ORDER BY TotalHours DESC;

-- هزینه‌های ماشین
SELECT 
    N'هزینه‌های ماشین' AS Section,
    COUNT(*) AS Trips,
    SUM(Kilometers) AS TotalKM,
    SUM(Cost) AS TotalCost
FROM DailyPersonalCarCosts
WHERE UserId = @ReportUserId
    AND YEAR(Date) = @ReportYear
    AND MONTH(Date) = @ReportMonth;
GO

-- =============================================
-- خلاصه
-- =============================================
PRINT N'';
PRINT N'========================================';
PRINT N'✓ 10 کوئری نمونه برای تست و گزارش‌گیری';
PRINT N'========================================';
PRINT N'';
PRINT N'کوئری‌ها شامل:';
PRINT N'  1. محاسبه ساعات کاری ماهیانه';
PRINT N'  2. توزیع زمان بین پروژه‌ها';
PRINT N'  3. هزینه‌های ماشین شخصی';
PRINT N'  4. وضعیت گزارش‌های ماهیانه';
PRINT N'  5. تحلیل تأخیرات';
PRINT N'  6. بازه‌های زمانی ماه‌ها';
PRINT N'  7. رتبه‌بندی اضافه کاری';
PRINT N'  8. آمار پروژه‌ها';
PRINT N'  9. تحلیل مرخصی‌ها';
PRINT N'  10. گزارش جامع کارمند';
PRINT N'';
GO
