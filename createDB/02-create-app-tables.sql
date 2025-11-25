-- =============================================
-- ساخت جدول‌های برنامه Timesheet
-- =============================================
-- این اسکریپت تمام جدول‌های مورد نیاز برنامه را ایجاد می‌کند
-- شامل: Admins, UserProjectAccess, UserContractHours, DailyDetails, DailyProjectTasks,
--        DailyPersonalCarCosts, MonthlyGymCosts, MonthlyReports, MonthPeriodSettings
-- همچنین شامل Triggers, Functions و Stored Procedures
-- =============================================

USE UMD;
GO

-- =============================================
-- جدول Admins: مدیران سیستم
-- =============================================
CREATE TABLE Admins (
    AdminId INT PRIMARY KEY IDENTITY(1,1),           -- شناسه منحصر به فرد ادمین
    Username NVARCHAR(100) NOT NULL UNIQUE,          -- نام کاربری ادمین
    PasswordHash NVARCHAR(256) NOT NULL,             -- هش رمز عبور
    FullName NVARCHAR(200) NULL,                     -- نام کامل ادمین
    Email NVARCHAR(256) NULL,                        -- ایمیل
    IsActive BIT NOT NULL DEFAULT 1,                 -- وضعیت فعال بودن
    CreatedAt DATETIME DEFAULT GETDATE(),            -- تاریخ ایجاد
    LastLoginAt DATETIME NULL                        -- آخرین ورود
);
GO

CREATE INDEX IX_Admins_Username ON Admins(Username);
CREATE INDEX IX_Admins_IsActive ON Admins(IsActive);
GO

-- =============================================
-- جدول UserProjectAccess: دسترسی کاربران به پروژه‌ها
-- =============================================
CREATE TABLE UserProjectAccess (
    UserId INT NOT NULL,                             -- کد پرسنلی کاربر (از جدول users)
    ProjectId INT NOT NULL,                          -- کد پروژه (از جدول projects)
    PRIMARY KEY (UserId, ProjectId)
);
GO

CREATE INDEX IX_UserProjectAccess_UserId ON UserProjectAccess(UserId);
CREATE INDEX IX_UserProjectAccess_ProjectId ON UserProjectAccess(ProjectId);
GO

-- =============================================
-- جدول UserContractHours: قراردادهای ساعت کاری کاربران
-- =============================================
CREATE TABLE UserContractHours (
    UserId INT PRIMARY KEY,                          -- کد پرسنلی کاربر
    ContractArrivalTime NVARCHAR(8) NULL,            -- زمان ورود قراردادی (مثال: 08:00:00)
    ContractLeaveTime NVARCHAR(8) NOT NULL,          -- زمان خروج قراردادی (مثال: 17:00:00)
    MinMonthlyHours INT NOT NULL                     -- حداقل ساعات کاری ماهانه
);
GO

-- =============================================
-- جدول DailyDetails: جزئیات روزانه کاربران
-- =============================================
CREATE TABLE DailyDetails (
    Id INT PRIMARY KEY IDENTITY(1,1),                -- شناسه منحصر به فرد
    Date DATE NOT NULL,                              -- تاریخ
    UserId INT NOT NULL,                             -- کد پرسنلی کاربر
    ArrivalTime NVARCHAR(8) NULL,                    -- زمان ورود
    LeaveTime NVARCHAR(8) NULL,                      -- زمان خروج
    PersonalTime INT NULL,                           -- زمان شخصی (به دقیقه)
    Description NVARCHAR(500) NULL,                  -- توضیحات
    GoCost INT NULL,                                 -- هزینه رفت
    ReturnCost INT NULL,                             -- هزینه برگشت
    LeaveType NVARCHAR(50) NULL                      -- نوع مرخصی (مانند: مریضی، استحقاقی)
);
GO

CREATE INDEX IX_DailyDetails_Date_UserId ON DailyDetails(Date, UserId);
CREATE INDEX IX_DailyDetails_UserId ON DailyDetails(UserId);
CREATE INDEX IX_DailyDetails_Date ON DailyDetails(Date);
GO

-- =============================================
-- جدول DailyProjectTasks: وظایف پروژه روزانه
-- =============================================
CREATE TABLE DailyProjectTasks (
    Id INT PRIMARY KEY IDENTITY(1,1),                -- شناسه منحصر به فرد
    Date DATE NOT NULL,                              -- تاریخ
    UserId INT NOT NULL,                             -- کد پرسنلی کاربر
    ProjectId INT NOT NULL,                          -- کد پروژه
    Duration INT NOT NULL,                           -- مدت زمان (به دقیقه)
    Description NVARCHAR(500) NULL                   -- توضیحات کار انجام شده
);
GO

CREATE INDEX IX_DailyProjectTasks_Date_UserId ON DailyProjectTasks(Date, UserId);
CREATE INDEX IX_DailyProjectTasks_UserId ON DailyProjectTasks(UserId);
CREATE INDEX IX_DailyProjectTasks_ProjectId ON DailyProjectTasks(ProjectId);
GO

-- =============================================
-- جدول DailyPersonalCarCosts: هزینه‌های ماشین شخصی روزانه
-- =============================================
CREATE TABLE DailyPersonalCarCosts (
    Date DATE NOT NULL,                              -- تاریخ
    UserId INT NOT NULL,                             -- کد پرسنلی کاربر
    ProjectId INT NOT NULL,                          -- کد پروژه
    Kilometers INT NULL,                             -- کیلومتر طی شده
    Cost INT NULL,                                   -- هزینه
    Description NVARCHAR(MAX) NULL,                  -- توضیحات
    PRIMARY KEY (Date, UserId, ProjectId)
);
GO

CREATE INDEX IX_DailyPersonalCarCosts_UserId ON DailyPersonalCarCosts(UserId);
CREATE INDEX IX_DailyPersonalCarCosts_ProjectId ON DailyPersonalCarCosts(ProjectId);
GO

-- =============================================
-- جدول MonthlyGymCosts: هزینه‌های ورزش ماهیانه
-- =============================================
CREATE TABLE MonthlyGymCosts (
    Id INT PRIMARY KEY IDENTITY(1,1),                -- شناسه منحصر به فرد
    UserId INT NOT NULL,                             -- کد پرسنلی کاربر
    Year INT NOT NULL,                               -- سال شمسی
    Month INT NOT NULL CHECK (Month BETWEEN 1 AND 12), -- ماه شمسی (1-12)
    Cost INT NOT NULL,                               -- هزینه ورزش
    GymHours INT NULL,                               -- تعداد ساعات ورزش در ماه
    Description NVARCHAR(500) NULL                   -- توضیحات
);
GO

CREATE INDEX IX_MonthlyGymCosts_UserId ON MonthlyGymCosts(UserId);
CREATE INDEX IX_MonthlyGymCosts_Year_Month ON MonthlyGymCosts(Year, Month);
GO

-- =============================================
-- جدول MonthlyReports: گزارش‌های ماهیانه
-- =============================================
CREATE TABLE MonthlyReports (
    ReportId INT PRIMARY KEY IDENTITY(1,1),          -- شناسه منحصر به فرد گزارش
    UserId INT NOT NULL,                             -- کد پرسنلی کاربر
    Year INT NOT NULL,                               -- سال میلادی
    Month INT NOT NULL CHECK (Month BETWEEN 1 AND 12), -- ماه میلادی (1-12)
    JalaliYear INT NOT NULL,                         -- سال شمسی
    JalaliMonth INT NOT NULL CHECK (JalaliMonth BETWEEN 1 AND 12), -- ماه شمسی (1-12)
    TotalHours INT NOT NULL,                         -- مجموع ساعات کاری
    GymCost INT NOT NULL,                            -- هزینه ورزش
    Status NVARCHAR(50) NOT NULL CHECK (Status IN (
        'draft',                                     -- پیش‌نویس
        'submitted_to_group_manager',                -- ارسال شده به مدیر گروه
        'submitted_to_general_manager',              -- ارسال شده به مدیر کل
        'submitted_to_finance',                      -- ارسال شده به امور مالی
        'approved'                                   -- تایید شده
    )),
    GroupId INT NULL,                                -- کد گروه کاربر
    GeneralManagerStatus NVARCHAR(50) NULL DEFAULT 'pending' CHECK (GeneralManagerStatus IN (
        'pending',                                   -- در انتظار
        'approved_by_general_manager'                -- تایید شده توسط مدیر کل
    )),
    ManagerComment NVARCHAR(500) NULL,               -- نظر مدیر گروه
    FinanceComment NVARCHAR(500) NULL,               -- نظر امور مالی
    SubmittedAt DATETIME NULL,                       -- تاریخ ارسال
    ApprovedAt DATETIME NULL                         -- تاریخ تایید
);
GO

CREATE INDEX IX_MonthlyReports_UserId ON MonthlyReports(UserId);
CREATE INDEX IX_MonthlyReports_Year_Month ON MonthlyReports(Year, Month);
CREATE INDEX IX_MonthlyReports_JalaliYear_JalaliMonth ON MonthlyReports(JalaliYear, JalaliMonth);
CREATE INDEX IX_MonthlyReports_Status ON MonthlyReports(Status);
CREATE INDEX IX_MonthlyReports_GroupId ON MonthlyReports(GroupId);
GO

-- =============================================
-- جدول MonthPeriodSettings: تنظیمات بازه زمانی ماه‌ها
-- =============================================
CREATE TABLE MonthPeriodSettings (
    Id INT PRIMARY KEY IDENTITY(1,1),                -- شناسه منحصر به فرد
    Year INT NOT NULL,                               -- سال شمسی (مثل 1404)
    Month INT NOT NULL CHECK (Month BETWEEN 1 AND 12), -- ماه شمسی (1-12)
    StartDay INT NOT NULL,                           -- روز شروع (مثلاً 1)
    StartMonth INT NOT NULL CHECK (StartMonth BETWEEN 1 AND 12), -- ماه شروع
    EndDay INT NOT NULL,                             -- روز پایان (مثلاً 5)
    EndMonth INT NOT NULL CHECK (EndMonth BETWEEN 1 AND 12), -- ماه پایان
    CreatedAt DATETIME DEFAULT GETDATE(),            -- تاریخ ایجاد
    UpdatedAt DATETIME DEFAULT GETDATE(),            -- تاریخ بروزرسانی
    CONSTRAINT UQ_MonthPeriod UNIQUE(Year, Month)    -- هر سال فقط یک بازه برای هر ماه
);
GO

CREATE INDEX IX_MonthPeriodSettings_Year_Month ON MonthPeriodSettings(Year, Month);
GO

-- =============================================
-- Function: محاسبه تعداد روزهای یک ماه شمسی
-- =============================================
CREATE FUNCTION dbo.fn_GetMonthLength(@Year INT, @Month INT)
RETURNS INT
AS
BEGIN
    DECLARE @Length INT;
    
    -- ماه‌های 1 تا 6: 31 روز
    IF @Month <= 6
        SET @Length = 31;
    -- ماه‌های 7 تا 11: 30 روز
    ELSE IF @Month <= 11
        SET @Length = 30;
    -- اسفند: بررسی سال کبیسه
    ELSE
    BEGIN
        -- الگوریتم ساده برای سال کبیسه شمسی (چرخه 33 ساله)
        DECLARE @YearInCycle INT = @Year % 33;
        IF @YearInCycle IN (1, 5, 9, 13, 17, 22, 26, 30)
            SET @Length = 30;
        ELSE
            SET @Length = 29;
    END
    
    RETURN @Length;
END;
GO

-- =============================================
-- Function: اعتبارسنجی اینکه آیا ماه برای ویرایش مجاز است
-- =============================================
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
    
    -- اگر سال درخواستی بزرگتر از سال جاری است، قابل ویرایش است
    IF @Year > @CurrentJalaliYear
        SET @IsEditable = 1;
    -- اگر سال برابر است، ماه باید بزرگتر یا مساوی ماه جاری باشد
    ELSE IF @Year = @CurrentJalaliYear AND @Month >= @CurrentJalaliMonth
        SET @IsEditable = 1;
    
    RETURN @IsEditable;
END;
GO

-- =============================================
-- Stored Procedure: دریافت بازه یک ماه خاص
-- =============================================
CREATE PROCEDURE sp_GetMonthPeriod
    @Year INT,
    @Month INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- اگر تنظیمی وجود داشت، برگردان
    IF EXISTS (SELECT 1 FROM MonthPeriodSettings WHERE Year = @Year AND Month = @Month)
    BEGIN
        SELECT 
            Year,
            Month,
            StartDay, 
            StartMonth, 
            EndDay, 
            EndMonth
        FROM MonthPeriodSettings
        WHERE Year = @Year AND Month = @Month;
        RETURN;
    END
    
    -- محاسبه بازه پیش‌فرض
    DECLARE @PrevMonth INT = CASE WHEN @Month = 1 THEN 12 ELSE @Month - 1 END;
    DECLARE @PrevYear INT = CASE WHEN @Month = 1 THEN @Year - 1 ELSE @Year END;
    
    IF EXISTS (SELECT 1 FROM MonthPeriodSettings WHERE Year = @PrevYear AND Month = @PrevMonth)
    BEGIN
        -- شروع از روز بعدی پایان ماه قبل
        DECLARE @PrevEndDay INT, @PrevEndMonth INT;
        SELECT @PrevEndDay = EndDay, @PrevEndMonth = EndMonth
        FROM MonthPeriodSettings
        WHERE Year = @PrevYear AND Month = @PrevMonth;
        
        IF @PrevEndMonth = @Month
        BEGIN
            SELECT 
                @Year AS Year,
                @Month AS Month,
                @PrevEndDay + 1 AS StartDay,
                @Month AS StartMonth,
                dbo.fn_GetMonthLength(@Year, @Month) AS EndDay,
                @Month AS EndMonth;
        END
        ELSE
        BEGIN
            SELECT 
                @Year AS Year,
                @Month AS Month,
                1 AS StartDay,
                @Month AS StartMonth,
                dbo.fn_GetMonthLength(@Year, @Month) AS EndDay,
                @Month AS EndMonth;
        END
    END
    ELSE
    BEGIN
        -- حالت پیش‌فرض: از اول تا آخر ماه
        SELECT 
            @Year AS Year,
            @Month AS Month,
            1 AS StartDay,
            @Month AS StartMonth,
            dbo.fn_GetMonthLength(@Year, @Month) AS EndDay,
            @Month AS EndMonth;
    END
END;
GO

-- =============================================
-- Stored Procedure: دریافت تمام بازه‌های یک سال
-- =============================================
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
        EndDay INT,
        EndMonth INT,
        IsCustom BIT
    );
    
    DECLARE @CurrentMonth INT = 1;
    DECLARE @StartDay INT, @StartMonth INT, @EndDay INT, @EndMonth INT, @IsCustom BIT;
    DECLARE @PrevMonth INT, @PrevYear INT, @PrevEndDay INT, @PrevEndMonth INT;
    
    WHILE @CurrentMonth <= 12
    BEGIN
        IF EXISTS (SELECT 1 FROM MonthPeriodSettings WHERE Year = @Year AND Month = @CurrentMonth)
        BEGIN
            SELECT 
                @StartDay = StartDay,
                @StartMonth = StartMonth,
                @EndDay = EndDay,
                @EndMonth = EndMonth
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
                SELECT @PrevEndDay = EndDay, @PrevEndMonth = EndMonth
                FROM #MonthPeriods
                WHERE Month = @PrevMonth;
                
                IF @PrevEndMonth = @CurrentMonth
                BEGIN
                    SET @StartDay = @PrevEndDay + 1;
                    SET @StartMonth = @CurrentMonth;
                END
                ELSE
                BEGIN
                    SET @StartDay = 1;
                    SET @StartMonth = @CurrentMonth;
                END
            END
            ELSE IF EXISTS (SELECT 1 FROM MonthPeriodSettings WHERE Year = @PrevYear AND Month = @PrevMonth)
            BEGIN
                SELECT @PrevEndDay = EndDay, @PrevEndMonth = EndMonth
                FROM MonthPeriodSettings
                WHERE Year = @PrevYear AND Month = @PrevMonth;
                
                IF @PrevEndMonth = @CurrentMonth
                BEGIN
                    SET @StartDay = @PrevEndDay + 1;
                    SET @StartMonth = @CurrentMonth;
                END
                ELSE
                BEGIN
                    SET @StartDay = 1;
                    SET @StartMonth = @CurrentMonth;
                END
            END
            ELSE
            BEGIN
                SET @StartDay = 1;
                SET @StartMonth = @CurrentMonth;
            END
            
            SET @EndDay = dbo.fn_GetMonthLength(@Year, @CurrentMonth);
            SET @EndMonth = @CurrentMonth;
            SET @IsCustom = 0;
        END
        
        INSERT INTO #MonthPeriods (Year, Month, StartDay, StartMonth, EndDay, EndMonth, IsCustom)
        VALUES (@Year, @CurrentMonth, @StartDay, @StartMonth, @EndDay, @EndMonth, @IsCustom);
        
        SET @CurrentMonth = @CurrentMonth + 1;
    END
    
    SELECT * FROM #MonthPeriods ORDER BY Month;
    DROP TABLE #MonthPeriods;
END;
GO

-- =============================================
-- Trigger: به‌روزرسانی خودکار UpdatedAt
-- =============================================
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
GO

-- =============================================
-- پیام موفقیت
-- =============================================
PRINT N'========================================';
PRINT N'✓ تمام جدول‌های برنامه با موفقیت ایجاد شدند:';
PRINT N'  • Admins';
PRINT N'  • UserProjectAccess';
PRINT N'  • UserContractHours';
PRINT N'  • DailyDetails';
PRINT N'  • DailyProjectTasks';
PRINT N'  • DailyPersonalCarCosts';
PRINT N'  • MonthlyGymCosts';
PRINT N'  • MonthlyReports';
PRINT N'  • MonthPeriodSettings';
PRINT N'';
PRINT N'✓ Functions و Stored Procedures نیز ایجاد شدند.';
PRINT N'========================================';
PRINT N'';
PRINT N'مرحله بعدی:';
PRINT N'  • محیط تستی: اجرای 03-insert-umd-test-data.sql';
PRINT N'  • محیط پروداکشن: آماده استفاده';
GO
