-- =============================================
-- Dashboard Settings Table Creation
-- =============================================
-- این جدول تنظیمات سفارشی داشبورد را برای هر کاربر ذخیره می‌کند

USE [UMD];
GO

-- بررسی وجود جدول و حذف آن در صورت وجود (فقط برای توسعه)
IF OBJECT_ID('DashboardSettings', 'U') IS NOT NULL
BEGIN
    DROP TABLE DashboardSettings;
    PRINT 'جدول DashboardSettings حذف شد.';
END
GO

-- ایجاد جدول DashboardSettings
CREATE TABLE DashboardSettings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    settings_data NVARCHAR(MAX) NOT NULL,
    last_modified DATETIME DEFAULT GETDATE(),
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_DashboardSettings_User FOREIGN KEY (user_id) 
        REFERENCES users(personalid)
        ON DELETE CASCADE,
    CONSTRAINT UQ_DashboardSettings_User UNIQUE (user_id)
);
GO

-- ایجاد ایندکس برای بهبود عملکرد
CREATE NONCLUSTERED INDEX IX_DashboardSettings_UserId 
ON DashboardSettings(user_id);
GO

-- افزودن توضیحات به جدول و ستون‌ها
EXEC sys.sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'جدول ذخیره تنظیمات سفارشی داشبورد برای هر کاربر', 
    @level0type = N'SCHEMA', @level0name = 'dbo',
    @level1type = N'TABLE',  @level1name = 'DashboardSettings';
GO

EXEC sys.sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'شناسه یکتای تنظیمات', 
    @level0type = N'SCHEMA', @level0name = 'dbo',
    @level1type = N'TABLE',  @level1name = 'DashboardSettings',
    @level2type = N'COLUMN', @level2name = 'id';
GO

EXEC sys.sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'شناسه کاربر', 
    @level0type = N'SCHEMA', @level0name = 'dbo',
    @level1type = N'TABLE',  @level1name = 'DashboardSettings',
    @level2type = N'COLUMN', @level2name = 'user_id';
GO

EXEC sys.sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'تنظیمات داشبورد به فرمت JSON', 
    @level0type = N'SCHEMA', @level0name = 'dbo',
    @level1type = N'TABLE',  @level1name = 'DashboardSettings',
    @level2type = N'COLUMN', @level2name = 'settings_data';
GO

EXEC sys.sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'تاریخ آخرین تغییر', 
    @level0type = N'SCHEMA', @level0name = 'dbo',
    @level1type = N'TABLE',  @level1name = 'DashboardSettings',
    @level2type = N'COLUMN', @level2name = 'last_modified';
GO

EXEC sys.sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'تاریخ ایجاد', 
    @level0type = N'SCHEMA', @level0name = 'dbo',
    @level1type = N'TABLE',  @level1name = 'DashboardSettings',
    @level2type = N'COLUMN', @level2name = 'created_at';
GO

PRINT 'جدول DashboardSettings با موفقیت ایجاد شد.';
GO

-- نمایش ساختار جدول
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('DashboardSettings')
ORDER BY c.column_id;
GO

