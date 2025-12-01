-- =============================================
-- افزودن فیلدهای IsActive و DirectAdminId به جدول projects
-- =============================================
-- این اسکریپت فیلدهای IsActive و DirectAdminId را به جدول projects اضافه می‌کند
-- برای مدیریت وضعیت فعال/غیرفعال و مدیر مستقیم پروژه‌ها
-- =============================================

USE UMD;
GO

-- بررسی وجود فیلد IsActive قبل از افزودن
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

-- بررسی وجود فیلد DirectAdminId قبل از افزودن
IF NOT EXISTS (
    SELECT * 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'projects') 
    AND name = 'DirectAdminId'
)
BEGIN
    -- افزودن فیلد DirectAdminId به جدول projects
    ALTER TABLE projects
    ADD DirectAdminId INT NULL;
    
    PRINT N'✓ فیلد DirectAdminId به جدول projects اضافه شد';
    PRINT N'  • نوع: INT NULL (اختیاری)';
END
ELSE
BEGIN
    PRINT N'⚠ فیلد DirectAdminId از قبل در جدول projects وجود دارد';
END
GO

-- ایجاد ایندکس برای بهبود جستجو بر اساس IsActive
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

-- ایجاد ایندکس برای بهبود جستجو بر اساس DirectAdminId
IF NOT EXISTS (
    SELECT * 
    FROM sys.indexes 
    WHERE name = 'IX_projects_DirectAdminId' 
    AND object_id = OBJECT_ID(N'projects')
)
BEGIN
    CREATE INDEX IX_projects_DirectAdminId ON projects(DirectAdminId);
    PRINT N'✓ ایندکس IX_projects_DirectAdminId ایجاد شد';
END
ELSE
BEGIN
    PRINT N'⚠ ایندکس IX_projects_DirectAdminId از قبل وجود دارد';
END
GO

PRINT N'========================================';
PRINT N'✓ عملیات با موفقیت انجام شد';
PRINT N'========================================';
GO

