-- =============================================
-- فایل 4: گزارش ماهیانه ساده
-- =============================================
-- این فایل یک گزارش ماهیانه نمونه برای یک کارمند ایجاد می‌کند
-- =============================================

USE UMD;
GO

PRINT N'→ ایجاد گزارش ماهیانه نمونه...';

-- حذف گزارش قبلی (اگر وجود دارد)
DELETE FROM MonthlyReports 
WHERE UserId = 2001 AND JalaliYear = 1403 AND JalaliMonth = 9;

-- ایجاد یک گزارش ماهیانه
INSERT INTO MonthlyReports (
    UserId, 
    Year, 
    Month, 
    JalaliYear, 
    JalaliMonth, 
    TotalHours, 
    GymCost, 
    Status, 
    GroupId, 
    GeneralManagerStatus,
    SubmittedAt
)
VALUES (
    2001,           -- کارمند 2001
    2024,           -- سال میلادی
    12,             -- ماه میلادی
    1403,           -- سال شمسی
    9,              -- آذر ماه
    176,            -- 176 ساعت کار
    1200000,        -- 1,200,000 تومان هزینه ورزش
    'draft',        -- وضعیت: پیش‌نویس
    1,              -- گروه 1
    'pending',      -- در انتظار تایید
    GETDATE()       -- تاریخ ثبت
);

PRINT N'✓ گزارش ماهیانه ایجاد شد';
PRINT N'  کارمند: 2001';
PRINT N'  دوره: آذر 1403';
PRINT N'  ساعات کار: 176';
PRINT N'  وضعیت: پیش‌نویس';

-- نمایش گزارش
SELECT 
    UserId,
    JalaliYear,
    JalaliMonth,
    TotalHours,
    GymCost,
    Status
FROM MonthlyReports
WHERE UserId = 2001 AND JalaliYear = 1403 AND JalaliMonth = 9;

GO
