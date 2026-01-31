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
-- بخش 0: جداول پایه UMD (پیش‌نیاز برنامه)
-- =============================================
PRINT N'→ بررسی و ایجاد جداول پایه UMD...';

-- جدول users: اطلاعات کاربران
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        personalid INT PRIMARY KEY,
        farsifirstname NVARCHAR(100) NOT NULL,
        farsilastname NVARCHAR(100) NOT NULL,
        email NVARCHAR(256) NULL,
        id NVARCHAR(100) NOT NULL UNIQUE,
        directAdmin NVARCHAR(200) NULL,
        groups NVARCHAR(100) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        directAdminid INT NULL,
        groupid INT NULL,
        role NVARCHAR(50) NULL CHECK (role IN ('user', 'group_manager', 'general_manager', 'finance_manager', 'admin'))
    );
    
    CREATE INDEX IX_users_IsActive ON users(IsActive);
    CREATE INDEX IX_users_groupid ON users(groupid);
    CREATE INDEX IX_users_directAdminid ON users(directAdminid);
    CREATE INDEX IX_users_role ON users(role);
    
    PRINT N'✓ جدول users ایجاد شد (با محدودیت role)';
END
ELSE
BEGIN
    PRINT N'○ جدول users از قبل وجود دارد';
    
    -- بررسی و اضافه کردن ستون role اگر وجود ندارد
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'role')
    BEGIN
        PRINT N'→ اضافه کردن ستون role به جدول users...';
        ALTER TABLE users ADD role NVARCHAR(50) NULL;
        
        -- اضافه کردن CHECK constraint برای role
        ALTER TABLE users ADD CONSTRAINT CK_users_role 
            CHECK (role IN ('user', 'group_manager', 'general_manager', 'finance_manager', 'admin'));
        
        CREATE INDEX IX_users_role ON users(role);
        PRINT N'✓ ستون role با محدودیت‌های اعتبارسنجی اضافه شد';
    END
    ELSE
    BEGIN
        PRINT N'○ ستون role از قبل وجود دارد';
        
        -- بررسی وجود constraint و اضافه کردن در صورت نبود
        IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_users_role')
        BEGIN
            PRINT N'→ اضافه کردن محدودیت اعتبارسنجی برای role...';
            ALTER TABLE users ADD CONSTRAINT CK_users_role 
                CHECK (role IN ('user', 'group_manager', 'general_manager', 'finance_manager', 'admin'));
            PRINT N'✓ محدودیت اعتبارسنجی role اضافه شد';
        END
        ELSE
            PRINT N'○ محدودیت اعتبارسنجی role از قبل وجود دارد';
    END
END
GO

-- جدول projects: اطلاعات پروژه‌ها
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'projects')
BEGIN
    CREATE TABLE projects (
        id INT PRIMARY KEY,
        FinanceCenterCost INT NULL,
        projectName NVARCHAR(50) NULL,
        BaseCenterCost NVARCHAR(50) NULL,
        BLine NVARCHAR(50) NULL,
        SystemType NVARCHAR(50) NULL,
        ContractType NVARCHAR(50) NULL,
        CenterType NVARCHAR(50) NULL,
        IsActive BIT NOT NULL DEFAULT 1
    );
    
    PRINT N'✓ جدول projects ایجاد شد';
END
ELSE
    PRINT N'○ جدول projects از قبل وجود دارد';
GO

-- جدول groups: اطلاعات گروه‌ها
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'groups')
BEGIN
    CREATE TABLE groups (
        id INT PRIMARY KEY,
        groupname NVARCHAR(100) NOT NULL UNIQUE,
        managerID INT NOT NULL
    );
    
    CREATE INDEX IX_groups_managerID ON groups(managerID);
    
    PRINT N'✓ جدول groups ایجاد شد';
END
ELSE
    PRINT N'○ جدول groups از قبل وجود دارد';
GO

-- جدول groupManagers: اطلاعات مدیران گروه
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'groupManagers')
BEGIN
    CREATE TABLE groupManagers (
        personalId INT PRIMARY KEY,
        firstname NVARCHAR(100) NOT NULL,
        lastname NVARCHAR(100) NOT NULL,
        email NVARCHAR(256) NULL,
        groupname NVARCHAR(100) NOT NULL
    );
    
    PRINT N'✓ جدول groupManagers ایجاد شد';
END
ELSE
    PRINT N'○ جدول groupManagers از قبل وجود دارد';
GO

PRINT N'✓ جداول پایه UMD آماده است';
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
BEGIN
    PRINT N'○ جدول MonthPeriodSettings از قبل وجود دارد';
    
    -- بررسی و اضافه کردن ستون StartYear اگر وجود ندارد
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MonthPeriodSettings') AND name = 'StartYear')
    BEGIN
        PRINT N'→ اضافه کردن ستون StartYear به جدول MonthPeriodSettings...';
        ALTER TABLE MonthPeriodSettings ADD StartYear INT NULL;
        -- بروزرسانی مقادیر NULL به Year
        UPDATE MonthPeriodSettings SET StartYear = Year WHERE StartYear IS NULL;
        -- تبدیل به NOT NULL
        ALTER TABLE MonthPeriodSettings ALTER COLUMN StartYear INT NOT NULL;
        PRINT N'✓ ستون StartYear اضافه شد';
    END
    ELSE
        PRINT N'○ ستون StartYear از قبل وجود دارد';
    
    -- بررسی و اضافه کردن ستون EndYear اگر وجود ندارد
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MonthPeriodSettings') AND name = 'EndYear')
    BEGIN
        PRINT N'→ اضافه کردن ستون EndYear به جدول MonthPeriodSettings...';
        ALTER TABLE MonthPeriodSettings ADD EndYear INT NULL;
        -- بروزرسانی مقادیر NULL به Year
        UPDATE MonthPeriodSettings SET EndYear = Year WHERE EndYear IS NULL;
        -- تبدیل به NOT NULL
        ALTER TABLE MonthPeriodSettings ALTER COLUMN EndYear INT NOT NULL;
        PRINT N'✓ ستون EndYear اضافه شد';
    END
    ELSE
        PRINT N'○ ستون EndYear از قبل وجود دارد';
END
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

-- Function: بررسی قابلیت ویرایش ماه
IF OBJECT_ID('dbo.fn_IsMonthEditable', 'FN') IS NULL
BEGIN
    EXEC('
    CREATE FUNCTION dbo.fn_IsMonthEditable(
        @Year INT,
        @Month INT,
        @CurrentJalaliYear INT,
        @CurrentJalaliMonth INT
    )
    RETURNS BIT
    AS
    BEGIN
        DECLARE @IsEditable BIT = 0;
        
        IF @Year > @CurrentJalaliYear
            SET @IsEditable = 1;
        ELSE IF @Year = @CurrentJalaliYear AND @Month >= @CurrentJalaliMonth
            SET @IsEditable = 1;
        
        RETURN @IsEditable;
    END;
    ');
    PRINT N'✓ Function fn_IsMonthEditable ایجاد شد';
END
ELSE
    PRINT N'○ Function fn_IsMonthEditable از قبل وجود دارد';
GO

-- Function: محاسبه طول بازه زمانی
IF OBJECT_ID('dbo.fn_GetPeriodLength', 'FN') IS NULL
BEGIN
    EXEC('
    CREATE FUNCTION dbo.fn_GetPeriodLength(
        @StartYear INT,
        @StartMonth INT,
        @StartDay INT,
        @EndYear INT,
        @EndMonth INT,
        @EndDay INT
    )
    RETURNS INT
    AS
    BEGIN
        DECLARE @TotalDays INT = 0;
        DECLARE @CurrentYear INT = @StartYear;
        DECLARE @CurrentMonth INT = @StartMonth;
        
        -- محاسبه تعداد روزها از تاریخ شروع تا پایان
        WHILE (@CurrentYear < @EndYear) OR (@CurrentYear = @EndYear AND @CurrentMonth <= @EndMonth)
        BEGIN
            IF @CurrentYear = @StartYear AND @CurrentMonth = @StartMonth
                SET @TotalDays = @TotalDays + (dbo.fn_GetMonthLength(@CurrentYear, @CurrentMonth) - @StartDay + 1);
            ELSE IF @CurrentYear = @EndYear AND @CurrentMonth = @EndMonth
                SET @TotalDays = @TotalDays + @EndDay;
            ELSE
                SET @TotalDays = @TotalDays + dbo.fn_GetMonthLength(@CurrentYear, @CurrentMonth);
            
            SET @CurrentMonth = @CurrentMonth + 1;
            IF @CurrentMonth > 12
            BEGIN
                SET @CurrentMonth = 1;
                SET @CurrentYear = @CurrentYear + 1;
            END
        END
        
        RETURN @TotalDays;
    END;
    ');
    PRINT N'✓ Function fn_GetPeriodLength ایجاد شد';
END
ELSE
    PRINT N'○ Function fn_GetPeriodLength از قبل وجود دارد';
GO

-- Stored Procedure: دریافت بازه یک ماه خاص
IF OBJECT_ID('dbo.sp_GetMonthPeriod', 'P') IS NULL
BEGIN
    EXEC('
    CREATE PROCEDURE sp_GetMonthPeriod
        @Year INT,
        @Month INT
    AS
    BEGIN
        SET NOCOUNT ON;
        
        IF EXISTS (SELECT 1 FROM MonthPeriodSettings WHERE Year = @Year AND Month = @Month)
        BEGIN
            SELECT 
                Year,
                Month,
                StartDay, 
                StartMonth,
                StartYear,
                EndDay, 
                EndMonth,
                EndYear
            FROM MonthPeriodSettings
            WHERE Year = @Year AND Month = @Month;
            RETURN;
        END
        
        DECLARE @PrevMonth INT = CASE WHEN @Month = 1 THEN 12 ELSE @Month - 1 END;
        DECLARE @PrevYear INT = CASE WHEN @Month = 1 THEN @Year - 1 ELSE @Year END;
        
        IF EXISTS (SELECT 1 FROM MonthPeriodSettings WHERE Year = @PrevYear AND Month = @PrevMonth)
        BEGIN
            DECLARE @PrevEndDay INT, @PrevEndMonth INT, @PrevEndYear INT;
            SELECT @PrevEndDay = EndDay, @PrevEndMonth = EndMonth, @PrevEndYear = EndYear
            FROM MonthPeriodSettings
            WHERE Year = @PrevYear AND Month = @PrevMonth;
            
            IF @PrevEndMonth = @Month AND @PrevEndYear = @Year
            BEGIN
                SELECT 
                    @Year AS Year,
                    @Month AS Month,
                    @PrevEndDay + 1 AS StartDay,
                    @Month AS StartMonth,
                    @Year AS StartYear,
                    dbo.fn_GetMonthLength(@Year, @Month) AS EndDay,
                    @Month AS EndMonth,
                    @Year AS EndYear;
            END
            ELSE
            BEGIN
                SELECT 
                    @Year AS Year,
                    @Month AS Month,
                    1 AS StartDay,
                    @Month AS StartMonth,
                    @Year AS StartYear,
                    dbo.fn_GetMonthLength(@Year, @Month) AS EndDay,
                    @Month AS EndMonth,
                    @Year AS EndYear;
            END
        END
        ELSE
        BEGIN
            SELECT 
                @Year AS Year,
                @Month AS Month,
                1 AS StartDay,
                @Month AS StartMonth,
                @Year AS StartYear,
                dbo.fn_GetMonthLength(@Year, @Month) AS EndDay,
                @Month AS EndMonth,
                @Year AS EndYear;
        END
    END;
    ');
    PRINT N'✓ Stored Procedure sp_GetMonthPeriod ایجاد شد';
END
ELSE
    PRINT N'○ Stored Procedure sp_GetMonthPeriod از قبل وجود دارد';
GO

-- Stored Procedure: دریافت تمام بازه‌های یک سال
IF OBJECT_ID('dbo.sp_GetYearMonthPeriods', 'P') IS NULL
BEGIN
    EXEC('
    CREATE PROCEDURE sp_GetYearMonthPeriods
        @Year INT
    AS
    BEGIN
        SET NOCOUNT ON;
        
        CREATE TABLE #MonthPeriods (
            Year INT,
            Month INT,
            StartDay INT,
            StartMonth INT,
            StartYear INT,
            EndDay INT,
            EndMonth INT,
            EndYear INT,
            IsCustom BIT
        );
        
        DECLARE @CurrentMonth INT = 1;
        DECLARE @StartDay INT, @StartMonth INT, @StartYear INT;
        DECLARE @EndDay INT, @EndMonth INT, @EndYear INT, @IsCustom BIT;
        DECLARE @PrevMonth INT, @PrevYear INT, @PrevEndDay INT, @PrevEndMonth INT, @PrevEndYear INT;
        
        WHILE @CurrentMonth <= 12
        BEGIN
            IF EXISTS (SELECT 1 FROM MonthPeriodSettings WHERE Year = @Year AND Month = @CurrentMonth)
            BEGIN
                SELECT 
                    @StartDay = StartDay,
                    @StartMonth = StartMonth,
                    @StartYear = StartYear,
                    @EndDay = EndDay,
                    @EndMonth = EndMonth,
                    @EndYear = EndYear
                FROM MonthPeriodSettings
                WHERE Year = @Year AND Month = @CurrentMonth;
                
                SET @IsCustom = 1;
            END
            ELSE
            BEGIN
                SET @PrevMonth = CASE WHEN @CurrentMonth = 1 THEN 12 ELSE @CurrentMonth - 1 END;
                SET @PrevYear = CASE WHEN @CurrentMonth = 1 THEN @Year - 1 ELSE @Year END;
                
                IF @PrevYear = @Year AND EXISTS (SELECT 1 FROM #MonthPeriods WHERE Month = @PrevMonth)
                BEGIN
                    SELECT @PrevEndDay = EndDay, @PrevEndMonth = EndMonth, @PrevEndYear = EndYear
                    FROM #MonthPeriods
                    WHERE Month = @PrevMonth;
                    
                    IF @PrevEndMonth = @CurrentMonth AND @PrevEndYear = @Year
                    BEGIN
                        SET @StartDay = @PrevEndDay + 1;
                        SET @StartMonth = @CurrentMonth;
                        SET @StartYear = @Year;
                    END
                    ELSE
                    BEGIN
                        SET @StartDay = 1;
                        SET @StartMonth = @CurrentMonth;
                        SET @StartYear = @Year;
                    END
                END
                ELSE IF EXISTS (SELECT 1 FROM MonthPeriodSettings WHERE Year = @PrevYear AND Month = @PrevMonth)
                BEGIN
                    SELECT @PrevEndDay = EndDay, @PrevEndMonth = EndMonth, @PrevEndYear = EndYear
                    FROM MonthPeriodSettings
                    WHERE Year = @PrevYear AND Month = @PrevMonth;
                    
                    IF @PrevEndMonth = @CurrentMonth AND @PrevEndYear = @Year
                    BEGIN
                        SET @StartDay = @PrevEndDay + 1;
                        SET @StartMonth = @CurrentMonth;
                        SET @StartYear = @Year;
                    END
                    ELSE
                    BEGIN
                        SET @StartDay = 1;
                        SET @StartMonth = @CurrentMonth;
                        SET @StartYear = @Year;
                    END
                END
                ELSE
                BEGIN
                    SET @StartDay = 1;
                    SET @StartMonth = @CurrentMonth;
                    SET @StartYear = @Year;
                END
                
                SET @EndDay = dbo.fn_GetMonthLength(@Year, @CurrentMonth);
                SET @EndMonth = @CurrentMonth;
                SET @EndYear = @Year;
                SET @IsCustom = 0;
            END
            
            INSERT INTO #MonthPeriods (Year, Month, StartDay, StartMonth, StartYear, EndDay, EndMonth, EndYear, IsCustom)
            VALUES (@Year, @CurrentMonth, @StartDay, @StartMonth, @StartYear, @EndDay, @EndMonth, @EndYear, @IsCustom);
            
            SET @CurrentMonth = @CurrentMonth + 1;
        END
        
        SELECT * FROM #MonthPeriods ORDER BY Month;
        DROP TABLE #MonthPeriods;
    END;
    ');
    PRINT N'✓ Stored Procedure sp_GetYearMonthPeriods ایجاد شد';
END
ELSE
    PRINT N'○ Stored Procedure sp_GetYearMonthPeriods از قبل وجود دارد';
GO

-- Stored Procedure: اعتبارسنجی بازه با ماه‌های مجاور
IF OBJECT_ID('dbo.sp_ValidatePeriodWithNeighbors', 'P') IS NULL
BEGIN
    EXEC('
    CREATE PROCEDURE sp_ValidatePeriodWithNeighbors
        @Year INT,
        @Month INT,
        @StartDay INT,
        @StartMonth INT,
        @StartYear INT,
        @EndDay INT,
        @EndMonth INT,
        @EndYear INT
    AS
    BEGIN
        SET NOCOUNT ON;
        
        -- بررسی overlap یا gap با ماه قبل
        DECLARE @PrevMonth INT = CASE WHEN @Month = 1 THEN 12 ELSE @Month - 1 END;
        DECLARE @PrevYear INT = CASE WHEN @Month = 1 THEN @Year - 1 ELSE @Year END;
        
        IF EXISTS (SELECT 1 FROM MonthPeriodSettings WHERE Year = @PrevYear AND Month = @PrevMonth AND Year != @Year OR Month != @Month)
        BEGIN
            DECLARE @PrevEndDay INT, @PrevEndMonth INT, @PrevEndYear INT;
            SELECT @PrevEndDay = EndDay, @PrevEndMonth = EndMonth, @PrevEndYear = EndYear
            FROM MonthPeriodSettings
            WHERE Year = @PrevYear AND Month = @PrevMonth;
            
            -- بررسی اینکه آیا gap وجود دارد
            IF (@StartYear > @PrevEndYear) OR 
               (@StartYear = @PrevEndYear AND @StartMonth > @PrevEndMonth) OR
               (@StartYear = @PrevEndYear AND @StartMonth = @PrevEndMonth AND @StartDay > @PrevEndDay + 1)
            BEGIN
                SELECT ''شکاف زمانی بین ماه جاری و ماه قبل وجود دارد'' AS ErrorMessage;
                RETURN;
            END
            
            -- بررسی اینکه آیا overlap وجود دارد
            IF (@StartYear < @PrevEndYear) OR
               (@StartYear = @PrevEndYear AND @StartMonth < @PrevEndMonth) OR
               (@StartYear = @PrevEndYear AND @StartMonth = @PrevEndMonth AND @StartDay <= @PrevEndDay)
            BEGIN
                SELECT ''تداخل زمانی با ماه قبل وجود دارد'' AS ErrorMessage;
                RETURN;
            END
        END
        
        -- بررسی overlap یا gap با ماه بعد
        DECLARE @NextMonth INT = CASE WHEN @Month = 12 THEN 1 ELSE @Month + 1 END;
        DECLARE @NextYear INT = CASE WHEN @Month = 12 THEN @Year + 1 ELSE @Year END;
        
        IF EXISTS (SELECT 1 FROM MonthPeriodSettings WHERE Year = @NextYear AND Month = @NextMonth AND Year != @Year OR Month != @Month)
        BEGIN
            DECLARE @NextStartDay INT, @NextStartMonth INT, @NextStartYear INT;
            SELECT @NextStartDay = StartDay, @NextStartMonth = StartMonth, @NextStartYear = StartYear
            FROM MonthPeriodSettings
            WHERE Year = @NextYear AND Month = @NextMonth;
            
            -- بررسی اینکه آیا gap وجود دارد
            IF (@NextStartYear > @EndYear) OR
               (@NextStartYear = @EndYear AND @NextStartMonth > @EndMonth) OR
               (@NextStartYear = @EndYear AND @NextStartMonth = @EndMonth AND @NextStartDay > @EndDay + 1)
            BEGIN
                SELECT ''شکاف زمانی بین ماه جاری و ماه بعد وجود دارد'' AS ErrorMessage;
                RETURN;
            END
            
            -- بررسی اینکه آیا overlap وجود دارد
            IF (@NextStartYear < @EndYear) OR
               (@NextStartYear = @EndYear AND @NextStartMonth < @EndMonth) OR
               (@NextStartYear = @EndYear AND @NextStartMonth = @EndMonth AND @NextStartDay <= @EndDay)
            BEGIN
                SELECT ''تداخل زمانی با ماه بعد وجود دارد'' AS ErrorMessage;
                RETURN;
            END
        END
    END;
    ');
    PRINT N'✓ Stored Procedure sp_ValidatePeriodWithNeighbors ایجاد شد';
END
ELSE
    PRINT N'○ Stored Procedure sp_ValidatePeriodWithNeighbors از قبل وجود دارد';
GO

-- Stored Procedure: تنظیم خودکار ماه‌های مجاور
IF OBJECT_ID('dbo.sp_AutoAdjustNeighborMonths', 'P') IS NULL
BEGIN
    EXEC('
    CREATE PROCEDURE sp_AutoAdjustNeighborMonths
        @Year INT,
        @Month INT,
        @StartDay INT,
        @StartMonth INT,
        @StartYear INT,
        @EndDay INT,
        @EndMonth INT,
        @EndYear INT,
        @CurrentJalaliYear INT,
        @CurrentJalaliMonth INT
    AS
    BEGIN
        SET NOCOUNT ON;
        
        -- این stored procedure می‌تواند منطق تنظیم خودکار ماه‌های قبل و بعد را پیاده‌سازی کند
        -- فعلاً خالی است و می‌توان آن را در آینده توسعه داد
        
        PRINT ''Auto-adjustment of neighbor months completed (placeholder)'';
    END;
    ');
    PRINT N'✓ Stored Procedure sp_AutoAdjustNeighborMonths ایجاد شد';
END
ELSE
    PRINT N'○ Stored Procedure sp_AutoAdjustNeighborMonths از قبل وجود دارد';
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
DECLARE @UMDTableCount INT;

-- شمارش جداول Timesheet
SELECT @TableCount = COUNT(*) 
FROM sys.tables 
WHERE name IN (
    'Admins', 'UserContractHours', 'UserProjectAccess',
    'DailyDetails', 'DailyProjectTasks', 'DailyPersonalCarCosts',
    'MonthlyGymCosts', 'MonthlyReports', 'MonthPeriodSettings'
);

-- شمارش جداول UMD
SELECT @UMDTableCount = COUNT(*) 
FROM sys.tables 
WHERE name IN ('users', 'projects', 'groups', 'groupManagers');

PRINT N'📊 تعداد کل جداول: ' + CAST((@TableCount + @UMDTableCount) AS NVARCHAR(10));
PRINT N'  • جداول UMD: ' + CAST(@UMDTableCount AS NVARCHAR(10));
PRINT N'  • جداول Timesheet: ' + CAST(@TableCount AS NVARCHAR(10));
PRINT N'';
PRINT N'جداول UMD (پایه):';
PRINT N'  ✓ users (با ستون role)';
PRINT N'  ✓ projects';
PRINT N'  ✓ groups';
PRINT N'  ✓ groupManagers';
PRINT N'';
PRINT N'جداول Timesheet:';
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
PRINT N'  1. اضافه کردن کاربران و تنظیم role آن‌ها';
PRINT N'  2. اضافه کردن ادمین اول';
PRINT N'  3. تعریف پروژه‌ها و گروه‌ها';
PRINT N'  4. تعریف قراردادهای کاری';
PRINT N'  5. تعریف دسترسی‌های پروژه';
PRINT N'';
GO
