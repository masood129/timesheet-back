-- =============================================
-- Migration Script: Update Projects Table Structure
-- تاریخ: 2026-01-31
-- توضیحات: این اسکریپت ساختار جدول projects را با فیلدهای جدید بروزرسانی می‌کند
-- =============================================

USE [UMD];
GO

PRINT N'========================================';
PRINT N'شروع بروزرسانی ساختار جدول projects';
PRINT N'========================================';
GO

-- بررسی وجود جدول
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'projects')
BEGIN
    PRINT N'❌ خطا: جدول projects وجود ندارد!';
    RETURN;
END
GO

-- حذف ستون DirectAdminId در صورت وجود
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'DirectAdminId')
BEGIN
    ALTER TABLE projects DROP COLUMN DirectAdminId;
    PRINT N'✓ ستون DirectAdminId حذف شد';
END
ELSE
BEGIN
    PRINT N'○ ستون DirectAdminId وجود ندارد';
END
GO

-- اضافه کردن ستون FinanceCenterCost
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'FinanceCenterCost')
BEGIN
    ALTER TABLE projects ADD FinanceCenterCost INT NULL;
    PRINT N'✓ ستون FinanceCenterCost اضافه شد';
END
ELSE
BEGIN
    PRINT N'○ ستون FinanceCenterCost از قبل وجود دارد';
END
GO

-- اضافه کردن ستون BaseCenterCost
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'BaseCenterCost')
BEGIN
    ALTER TABLE projects ADD BaseCenterCost NVARCHAR(50) NULL;
    PRINT N'✓ ستون BaseCenterCost اضافه شد';
END
ELSE
BEGIN
    PRINT N'○ ستون BaseCenterCost از قبل وجود دارد';
END
GO

-- اضافه کردن ستون BLine
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'BLine')
BEGIN
    ALTER TABLE projects ADD BLine NVARCHAR(50) NULL;
    PRINT N'✓ ستون BLine اضافه شد';
END
ELSE
BEGIN
    PRINT N'○ ستون BLine از قبل وجود دارد';
END
GO

-- اضافه کردن ستون SystemType
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'SystemType')
BEGIN
    ALTER TABLE projects ADD SystemType NVARCHAR(50) NULL;
    PRINT N'✓ ستون SystemType اضافه شد';
END
ELSE
BEGIN
    PRINT N'○ ستون SystemType از قبل وجود دارد';
END
GO

-- اضافه کردن ستون ContractType
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'ContractType')
BEGIN
    ALTER TABLE projects ADD ContractType NVARCHAR(50) NULL;
    PRINT N'✓ ستون ContractType اضافه شد';
END
ELSE
BEGIN
    PRINT N'○ ستون ContractType از قبل وجود دارد';
END
GO

-- اضافه کردن ستون CenterType
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'CenterType')
BEGIN
    ALTER TABLE projects ADD CenterType NVARCHAR(50) NULL;
    PRINT N'✓ ستون CenterType اضافه شد';
END
ELSE
BEGIN
    PRINT N'○ ستون CenterType از قبل وجود دارد';
END
GO

-- بررسی و تغییر ستون projectName به nullable
IF EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('projects') 
    AND name = 'projectName' 
    AND is_nullable = 0
)
BEGIN
    ALTER TABLE projects ALTER COLUMN projectName NVARCHAR(50) NULL;
    PRINT N'✓ ستون projectName به nullable تغییر کرد';
END
ELSE
BEGIN
    PRINT N'○ ستون projectName قبلاً nullable است یا سایز درست دارد';
END
GO

-- اضافه کردن ستون IsActive در صورت عدم وجود
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('projects') AND name = 'IsActive')
BEGIN
    ALTER TABLE projects ADD IsActive BIT NOT NULL DEFAULT 1;
    PRINT N'✓ ستون IsActive اضافه شد';
END
ELSE
BEGIN
    PRINT N'○ ستون IsActive از قبل وجود دارد';
END
GO

PRINT N'';
PRINT N'========================================';
PRINT N'بروزرسانی ساختار جدول با موفقیت انجام شد';
PRINT N'========================================';
GO

-- نمایش ساختار نهایی جدول
PRINT N'';
PRINT N'ساختار نهایی جدول projects:';
GO

SELECT 
    COLUMN_NAME as 'نام ستون',
    DATA_TYPE as 'نوع داده',
    CHARACTER_MAXIMUM_LENGTH as 'حداکثر طول',
    IS_NULLABLE as 'Nullable',
    COLUMN_DEFAULT as 'مقدار پیش‌فرض'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'projects'
ORDER BY ORDINAL_POSITION;
GO

PRINT N'';
PRINT N'تعداد رکوردهای موجود در جدول:';
SELECT COUNT(*) as TotalProjects FROM projects;
GO
