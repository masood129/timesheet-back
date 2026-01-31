-- =============================================
-- پروژه‌های تستی - با ساختار جدید
-- =============================================

USE UMD;
GO

PRINT N'→ ایجاد پروژه‌های تستی...';

-- حذف پروژه‌های تستی قبلی
DELETE FROM UserProjectAccess WHERE ProjectId BETWEEN 100 AND 110;
DELETE FROM DailyProjectTasks WHERE ProjectId BETWEEN 100 AND 110;
DELETE FROM DailyPersonalCarCosts WHERE ProjectId BETWEEN 100 AND 110;
DELETE FROM projects WHERE id BETWEEN 100 AND 110;

-- پروژه‌های تستی با فیلدهای جدید
INSERT INTO projects (id, projectName, FinanceCenterCost, BaseCenterCost, BLine, SystemType, ContractType, CenterType, IsActive)
VALUES
    -- پروژه کامل با تمام فیلدها
    (100, N'سیستم مدیریت تایم‌شیت', 75000, N'CC-1001', N'BL-100', N'نرم‌افزاری', N'پیمانی', N'مرکز فناوری اطلاعات', 1),
    
    -- پروژه با بعضی فیلدها
    (101, N'پورتال کارمندان', 60000, N'CC-1002', NULL, N'نرم‌افزاری', N'رسمی', N'مرکز توسعه', 1),
    
    -- پروژه ساده
    (102, N'اپلیکیشن موبایل', NULL, NULL, NULL, N'موبایل', N'قراردادی', NULL, 1),
    
    -- پروژه سخت‌افزاری
    (103, N'زیرساخت شبکه', 120000, N'CC-2001', N'BL-200', N'سخت‌افزاری', N'پیمانی', N'مرکز شبکه', 1),
    
    -- پروژه غیرفعال
    (104, N'پروژه قدیمی', 45000, N'CC-1003', NULL, N'نرم‌افزاری', N'پیمانی', N'مرکز توسعه', 0),
    
    -- پروژه‌های کوچک
    (105, N'پشتیبانی فنی', NULL, NULL, NULL, N'خدمات', N'رسمی', N'مرکز پشتیبانی', 1),
    (106, N'آموزش کاربران', NULL, NULL, NULL, N'آموزشی', N'قراردادی', NULL, 1);

PRINT N'✓ 7 پروژه تستی ایجاد شد';
PRINT N'  - پروژه 100: کامل با تمام فیلدها';
PRINT N'  - پروژه 101-103: با فیلدهای متفاوت';
PRINT N'  - پروژه 104: غیرفعال';
PRINT N'  - پروژه 105-106: پروژه‌های ساده';

-- نمایش پروژه‌های ساخته شده
PRINT N'';
PRINT N'پروژه‌های تستی:';
SELECT 
    id as 'کد',
    projectName as 'نام پروژه',
    SystemType as 'نوع سیستم',
    ContractType as 'نوع قرارداد',
    IsActive as 'فعال'
FROM projects
WHERE id BETWEEN 100 AND 110
ORDER BY id;

PRINT N'';
PRINT N'✓✓✓ پروژه‌های تستی آماده است ✓✓✓';
GO
