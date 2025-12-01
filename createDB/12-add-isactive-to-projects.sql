-- =============================================
-- افزودن فیلد IsActive به جدول projects
-- =============================================
-- این اسکریپت فیلد IsActive را به جدول projects اضافه می‌کند
-- برای مدیریت وضعیت فعال/غیرفعال پروژه‌ها
-- =============================================

USE UMD;
GO

-- بررسی وجود فیلد قبل از افزودن
IF NOT EXISTS (
    SELECT * 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'projects') 
    AND name = 'IsActive'
)
BEGIN
    -- افزودن فیلد IsActive به جدول projects
    ALTER TABLE projects
    ADD IsActive BIT NOT NULL DEFAULT 1;
    
    PRINT N'✓ فیلد IsActive به جدول projects اضافه شد';
    PRINT N'  • مقدار پیش‌فرض: 1 (فعال)';
END
ELSE
BEGIN
    PRINT N'⚠ فیلد IsActive از قبل در جدول projects وجود دارد';
END
GO

-- ایجاد ایندکس برای بهبود جستجو
IF NOT EXISTS (
    SELECT * 
    FROM sys.indexes 
    WHERE name = 'IX_projects_IsActive' 
    AND object_id = OBJECT_ID(N'projects')
)
BEGIN
    CREATE INDEX IX_projects_IsActive ON projects(IsActive);
    PRINT N'✓ ایندکس IX_projects_IsActive ایجاد شد';
END
ELSE
BEGIN
    PRINT N'⚠ ایندکس IX_projects_IsActive از قبل وجود دارد';
END
GO

PRINT N'========================================';
PRINT N'✓ عملیات با موفقیت انجام شد';
PRINT N'========================================';
GO

