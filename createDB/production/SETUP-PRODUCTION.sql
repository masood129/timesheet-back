-- =============================================
-- PRODUCTION - ساخت کامل دیتابیس Timesheet
-- =============================================
-- این فایل تمام جداول مورد نیاز برای محیط واقعی را ایجاد می‌کند
-- بدون هیچ داده تستی!
-- =============================================

USE UMD;
GO

PRINT N'';
PRINT N'========================================';
PRINT N'   ساخت جداول Timesheet - PRODUCTION';
PRINT N'========================================';
PRINT N'';

-- =============================================
-- بخش 1: جدول مدیران سیستم
-- =============================================
PRINT N'→ ایجاد جدول Admins...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Admins')
BEGIN
    CREATE TABLE Admins (
        AdminId INT PRIMARY KEY IDENTITY(1,1),
        Username NVARCHAR(100) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(256) NOT NULL,
        FullName NVARCHAR(200) NULL,
        Email NVARCHAR(256) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        LastLoginAt DATETIME NULL
    );
    
    CREATE INDEX IX_Admins_Username ON Admins(Username);
    CREATE INDEX IX_Admins_IsActive ON Admins(IsActive);
    
    PRINT N'✓ جدول Admins ایجاد شد';
END
ELSE
    PRINT N'○ جدول Admins از قبل وجود دارد';
GO

-- =============================================
-- بخش 2: قراردادهای کاری
-- =============================================
PRINT N'→ ایجاد جدول UserContractHours...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserContractHours')
BEGIN
    CREATE TABLE UserContractHours (
        UserId INT PRIMARY KEY,
        ContractArrivalTime NVARCHAR(8) NULL,
        ContractLeaveTime NVARCHAR(8) NOT NULL,
        MinMonthlyHours INT NOT NULL
    );
    
    PRINT N'✓ جدول UserContractHours ایجاد شد';
END
ELSE
    PRINT N'○ جدول UserContractHours از قبل وجود دارد';
GO

-- =============================================
-- بخش 3: دسترسی به پروژه‌ها
-- =============================================
PRINT N'→ ایجاد جدول UserProjectAccess...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserProjectAccess')
BEGIN
    CREATE TABLE UserProjectAccess (
        UserId INT NOT NULL,
        ProjectId INT NOT NULL,
        PRIMARY KEY (UserId, ProjectId)
    );
    
    CREATE INDEX IX_UserProjectAccess_UserId ON UserProjectAccess(UserId);
    CREATE INDEX IX_UserProjectAccess_ProjectId ON UserProjectAccess(ProjectId);
    
    PRINT N'✓ جدول UserProjectAccess ایجاد شد';
END
ELSE
    PRINT N'○ جدول UserProjectAccess از قبل وجود دارد';
GO

-- =============================================
-- بخش 4: جزئیات روزانه (حضور و غیاب)
-- =============================================
PRINT N'→ ایجاد جدول DailyDetails...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DailyDetails')
BEGIN
    CREATE TABLE DailyDetails (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Date DATE NOT NULL,
        UserId INT NOT NULL,
        ArrivalTime NVARCHAR(8) NULL,
        LeaveTime NVARCHAR(8) NULL,
        PersonalTime INT NULL,
        Description NVARCHAR(500) NULL,
        GoCost INT NULL,
        ReturnCost INT NULL,
        LeaveType NVARCHAR(50) NULL
    );
    
    CREATE INDEX IX_DailyDetails_Date_UserId ON DailyDetails(Date, UserId);
    CREATE INDEX IX_DailyDetails_UserId ON DailyDetails(UserId);
    CREATE INDEX IX_DailyDetails_Date ON DailyDetails(Date);
    
    PRINT N'✓ جدول DailyDetails ایجاد شد';
END
ELSE
    PRINT N'○ جدول DailyDetails از قبل وجود دارد';
GO

-- =============================================
-- بخش 5: وظایف پروژه‌ای روزانه
-- =============================================
PRINT N'→ ایجاد جدول DailyProjectTasks...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DailyProjectTasks')
BEGIN
    CREATE TABLE DailyProjectTasks (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Date DATE NOT NULL,
        UserId INT NOT NULL,
        ProjectId INT NOT NULL,
        Duration INT NOT NULL,
        Description NVARCHAR(500) NULL
    );
    
    CREATE INDEX IX_DailyProjectTasks_Date_UserId ON DailyProjectTasks(Date, UserId);
    CREATE INDEX IX_DailyProjectTasks_UserId ON DailyProjectTasks(UserId);
    CREATE INDEX IX_DailyProjectTasks_ProjectId ON DailyProjectTasks(ProjectId);
    
    PRINT N'✓ جدول DailyProjectTasks ایجاد شد';
END
ELSE
    PRINT N'○ جدول DailyProjectTasks از قبل وجود دارد';
GO

-- =============================================
-- بخش 6: هزینه‌های ماشین شخصی
-- =============================================
PRINT N'→ ایجاد جدول DailyPersonalCarCosts...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DailyPersonalCarCosts')
BEGIN
    CREATE TABLE DailyPersonalCarCosts (
        Date DATE NOT NULL,
        UserId INT NOT NULL,
        ProjectId INT NOT NULL,
        Kilometers INT NULL,
        Cost INT NULL,
        Description NVARCHAR(MAX) NULL,
        PRIMARY KEY (Date, UserId, ProjectId)
    );
    
    CREATE INDEX IX_DailyPersonalCarCosts_UserId ON DailyPersonalCarCosts(UserId);
    CREATE INDEX IX_DailyPersonalCarCosts_ProjectId ON DailyPersonalCarCosts(ProjectId);
    
    PRINT N'✓ جدول DailyPersonalCarCosts ایجاد شد';
END
ELSE
    PRINT N'○ جدول DailyPersonalCarCosts از قبل وجود دارد';
GO

-- =============================================
-- بخش 7: هزینه‌های ورزش ماهیانه
-- =============================================
PRINT N'→ ایجاد جدول MonthlyGymCosts...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MonthlyGymCosts')
BEGIN
    CREATE TABLE MonthlyGymCosts (
        Id INT PRIMARY KEY IDENTITY(1,1),
        UserId INT NOT NULL,
        Year INT NOT NULL,
        Month INT NOT NULL CHECK (Month BETWEEN 1 AND 12),
        Cost INT NOT NULL,
        GymHours INT NULL,
        Description NVARCHAR(500) NULL
    );
    
    CREATE INDEX IX_MonthlyGymCosts_UserId ON MonthlyGymCosts(UserId);
    CREATE INDEX IX_MonthlyGymCosts_Year_Month ON MonthlyGymCosts(Year, Month);
    
    PRINT N'✓ جدول MonthlyGymCosts ایجاد شد';
END
ELSE
    PRINT N'○ جدول MonthlyGymCosts از قبل وجود دارد';
GO

-- =============================================
-- بخش 8: گزارش‌های ماهیانه
-- =============================================
PRINT N'→ ایجاد جدول MonthlyReports...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MonthlyReports')
BEGIN
    CREATE TABLE MonthlyReports (
        ReportId INT PRIMARY KEY IDENTITY(1,1),
        UserId INT NOT NULL,
        Year INT NOT NULL,
        Month INT NOT NULL CHECK (Month BETWEEN 1 AND 12),
        JalaliYear INT NOT NULL,
        JalaliMonth INT NOT NULL CHECK (JalaliMonth BETWEEN 1 AND 12),
        TotalHours INT NOT NULL,
        GymCost INT NOT NULL,
        Status NVARCHAR(50) NOT NULL CHECK (Status IN (
            'draft',
            'submitted_to_group_manager',
            'submitted_to_general_manager',
            'submitted_to_finance',
            'approved'
        )),
        GroupId INT NULL,
        GeneralManagerStatus NVARCHAR(50) NULL DEFAULT 'pending' CHECK (GeneralManagerStatus IN (
            'pending',
            'approved_by_general_manager'
        )),
        ManagerComment NVARCHAR(500) NULL,
        FinanceComment NVARCHAR(500) NULL,
        SubmittedAt DATETIME NULL,
        ApprovedAt DATETIME NULL
    );
    
    CREATE INDEX IX_MonthlyReports_UserId ON MonthlyReports(UserId);
    CREATE INDEX IX_MonthlyReports_Year_Month ON MonthlyReports(Year, Month);
    CREATE INDEX IX_MonthlyReports_JalaliYear_JalaliMonth ON MonthlyReports(JalaliYear, JalaliMonth);
    CREATE INDEX IX_MonthlyReports_Status ON MonthlyReports(Status);
    CREATE INDEX IX_MonthlyReports_GroupId ON MonthlyReports(GroupId);
    
    PRINT N'✓ جدول MonthlyReports ایجاد شد';
END
ELSE
    PRINT N'○ جدول MonthlyReports از قبل وجود دارد';
GO

-- =============================================
-- بخش 9: تنظیمات بازه زمانی ماه‌ها
-- =============================================
PRINT N'→ ایجاد جدول MonthPeriodSettings...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MonthPeriodSettings')
BEGIN
    CREATE TABLE MonthPeriodSettings (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Year INT NOT NULL,
        Month INT NOT NULL CHECK (Month BETWEEN 1 AND 12),
        StartDay INT NOT NULL,
        StartMonth INT NOT NULL CHECK (StartMonth BETWEEN 1 AND 12),
        StartYear INT NOT NULL,
        EndDay INT NOT NULL,
        EndMonth INT NOT NULL CHECK (EndMonth BETWEEN 1 AND 12),
        EndYear INT NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT UQ_MonthPeriod UNIQUE(Year, Month)
    );
    
    CREATE INDEX IX_MonthPeriodSettings_Year_Month ON MonthPeriodSettings(Year, Month);
    
    PRINT N'✓ جدول MonthPeriodSettings ایجاد شد';
END
ELSE
    PRINT N'○ جدول MonthPeriodSettings از قبل وجود دارد';
GO

-- =============================================
-- بخش 10: توابع و Stored Procedures
-- =============================================
PRINT N'→ ایجاد توابع و Stored Procedures...';

-- Function: محاسبه تعداد روزهای ماه
IF OBJECT_ID('dbo.fn_GetMonthLength', 'FN') IS NULL
BEGIN
    EXEC('
    CREATE FUNCTION dbo.fn_GetMonthLength(@Year INT, @Month INT)
    RETURNS INT
    AS
    BEGIN
        DECLARE @Length INT;
        
        IF @Month <= 6
            SET @Length = 31;
        ELSE IF @Month <= 11
            SET @Length = 30;
        ELSE
        BEGIN
            DECLARE @YearInCycle INT = @Year % 33;
            IF @YearInCycle IN (1, 5, 9, 13, 17, 22, 26, 30)
                SET @Length = 30;
            ELSE
                SET @Length = 29;
        END
        
        RETURN @Length;
    END;
    ');
    PRINT N'✓ Function fn_GetMonthLength ایجاد شد';
END
ELSE
    PRINT N'○ Function fn_GetMonthLength از قبل وجود دارد';
GO

-- Trigger: به‌روزرسانی UpdatedAt
IF OBJECT_ID('trg_MonthPeriodSettings_UpdatedAt', 'TR') IS NULL
BEGIN
    EXEC('
    CREATE TRIGGER trg_MonthPeriodSettings_UpdatedAt
    ON MonthPeriodSettings
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        
        UPDATE MonthPeriodSettings
        SET UpdatedAt = GETDATE()
        FROM MonthPeriodSettings mps
        INNER JOIN inserted i ON mps.Id = i.Id;
    END;
    ');
    PRINT N'✓ Trigger trg_MonthPeriodSettings_UpdatedAt ایجاد شد';
END
ELSE
    PRINT N'○ Trigger از قبل وجود دارد';
GO

-- =============================================
-- خلاصه نهایی
-- =============================================
PRINT N'';
PRINT N'========================================';
PRINT N'         ✓ اتمام موفقیت‌آمیز';
PRINT N'========================================';
PRINT N'';

-- شمارش جداول
DECLARE @TableCount INT;
SELECT @TableCount = COUNT(*) 
FROM sys.tables 
WHERE name IN (
    'Admins', 'UserContractHours', 'UserProjectAccess',
    'DailyDetails', 'DailyProjectTasks', 'DailyPersonalCarCosts',
    'MonthlyGymCosts', 'MonthlyReports', 'MonthPeriodSettings'
);

PRINT N'📊 تعداد جداول ایجاد شده: ' + CAST(@TableCount AS NVARCHAR(10));
PRINT N'';
PRINT N'جداول ایجاد شده:';
PRINT N'  ✓ Admins';
PRINT N'  ✓ UserContractHours';
PRINT N'  ✓ UserProjectAccess';
PRINT N'  ✓ DailyDetails';
PRINT N'  ✓ DailyProjectTasks';
PRINT N'  ✓ DailyPersonalCarCosts';
PRINT N'  ✓ MonthlyGymCosts';
PRINT N'  ✓ MonthlyReports';
PRINT N'  ✓ MonthPeriodSettings';
PRINT N'';
PRINT N'⚠️ نکته: هیچ داده تستی وارد نشده است';
PRINT N'';
PRINT N'مراحل بعدی:';
PRINT N'  1. اضافه کردن ادمین اول';
PRINT N'  2. تعریف قراردادهای کاری';
PRINT N'  3. تعریف دسترسی‌های پروژه';
PRINT N'';
GO
