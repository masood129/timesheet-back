-- =============================================
-- اضافه کردن ستون Role به جدول users
-- =============================================
-- این اسکریپت ستون role را به جدول users اضافه می‌کند
-- و مقادیر آن را بر اساس جدول groupManagers تنظیم می‌کند
-- =============================================

USE UMD;
GO

-- بررسی اینکه ستون قبلاً وجود دارد یا نه
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'role'
)
BEGIN
    -- اضافه کردن ستون role
    ALTER TABLE users
    ADD role NVARCHAR(50) NULL;
    
    PRINT N'✓ ستون role به جدول users اضافه شد';
END
ELSE
BEGIN
    PRINT N'⚠ ستون role قبلاً موجود است';
END
GO

-- تنظیم مقادیر role برای کاربران موجود
UPDATE u
SET u.role = CASE 
    WHEN gm.personalId IS NOT NULL THEN 'group_manager'
    ELSE 'user'
END
FROM users u
LEFT JOIN groupManagers gm ON u.personalid = gm.personalId;

PRINT N'✓ مقادیر role برای ' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + N' کاربر تنظیم شد';
GO

-- ایجاد ایندکس برای بهبود عملکرد
IF NOT EXISTS (
    SELECT 1 
    FROM sys.indexes 
    WHERE name = 'IX_users_role' 
    AND object_id = OBJECT_ID('users')
)
BEGIN
    CREATE INDEX IX_users_role ON users(role);
    PRINT N'✓ ایندکس IX_users_role ایجاد شد';
END
GO

-- نمایش خلاصه
PRINT N'';
PRINT N'========================================';
PRINT N'خلاصه کاربران بر اساس نقش:';
PRINT N'========================================';

SELECT 
    role as نقش,
    COUNT(*) as تعداد
FROM users
WHERE IsActive = 1
GROUP BY role;

PRINT N'';
PRINT N'✓ اسکریپت با موفقیت اجرا شد';
GO
