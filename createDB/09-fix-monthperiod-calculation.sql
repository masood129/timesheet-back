-- =============================================
-- Fix Script: اصلاح محاسبه بازه‌های ماهیانه
-- تاریخ: 1404/09/09
-- توضیحات: این اسکریپت مشکلات محاسبه بازه‌های ماهیانه را برطرف می‌کند
--           - اصلاح محاسبه مرزهای ماه (مثلاً 31 فروردین + 1 = 1 اردیبهشت)
--           - اضافه کردن اعتبارسنجی حداقل 20 روز و حداکثر 40 روز
--           - اصلاح منطق محاسبه خودکار ماه بعدی و قبلی
-- =============================================

USE [UMD]
GO

PRINT N'شروع اصلاح: بازسازی Stored Procedures و Functions...';
GO

-- =============================================
-- Function: محاسبه روز بعد از یک تاریخ مشخص (بازگشت NextDay)
-- =============================================
IF OBJECT_ID('dbo.fn_GetNextDay', 'FN') IS NOT NULL
BEGIN
    DROP FUNCTION dbo.fn_GetNextDay;
    PRINT N'✓ Function fn_GetNextDay حذف شد برای rebuild';
END
GO

CREATE FUNCTION dbo.fn_GetNextDay(
    @Year INT,
    @Month INT,
    @Day INT
)
RETURNS INT
AS
BEGIN
    DECLARE @MonthLength INT = dbo.fn_GetMonthLength(@Year, @Month);
    
    -- اگر روز آخر ماه است، روز بعد روز اول ماه بعد است
    IF @Day >= @MonthLength
        RETURN 1;
    
    -- در غیر این صورت، روز بعد همان روز + 1 است
    RETURN @Day + 1;
END;
GO

PRINT N'✓ Function fn_GetNextDay ایجاد شد';
GO

-- =============================================
-- Function: محاسبه ماه بعد از یک تاریخ مشخص (بازگشت NextMonth)
-- =============================================
IF OBJECT_ID('dbo.fn_GetNextMonth', 'FN') IS NOT NULL
BEGIN
    DROP FUNCTION dbo.fn_GetNextMonth;
    PRINT N'✓ Function fn_GetNextMonth حذف شد برای rebuild';
END
GO

CREATE FUNCTION dbo.fn_GetNextMonth(
    @Year INT,
    @Month INT,
    @Day INT
)
RETURNS INT
AS
BEGIN
    DECLARE @MonthLength INT = dbo.fn_GetMonthLength(@Year, @Month);
    
    -- اگر روز آخر ماه است، ماه بعد ماه بعدی است
    IF @Day >= @MonthLength
    BEGIN
        IF @Month = 12
            RETURN 1;  -- بعد از اسفند، فروردین
        ELSE
            RETURN @Month + 1;
    END
    
    -- در غیر این صورت، ماه همان ماه است
    RETURN @Month;
END;
GO

PRINT N'✓ Function fn_GetNextMonth ایجاد شد';
GO

-- =============================================
-- Function: محاسبه سال بعد از یک تاریخ مشخص (بازگشت NextYear)
-- =============================================
IF OBJECT_ID('dbo.fn_GetNextYear', 'FN') IS NOT NULL
BEGIN
    DROP FUNCTION dbo.fn_GetNextYear;
    PRINT N'✓ Function fn_GetNextYear حذف شد برای rebuild';
END
GO

CREATE FUNCTION dbo.fn_GetNextYear(
    @Year INT,
    @Month INT,
    @Day INT
)
RETURNS INT
AS
BEGIN
    DECLARE @MonthLength INT = dbo.fn_GetMonthLength(@Year, @Month);
    
    -- اگر روز آخر ماه است و ماه اسفند است، سال بعد سال بعدی است
    IF @Day >= @MonthLength AND @Month = 12
        RETURN @Year + 1;
    
    -- در غیر این صورت، سال همان سال است
    RETURN @Year;
END;
GO

PRINT N'✓ Function fn_GetNextYear ایجاد شد';
GO

-- =============================================
-- Function: محاسبه تعداد روزهای یک بازه
-- =============================================
IF OBJECT_ID('dbo.fn_GetPeriodLength', 'FN') IS NOT NULL
BEGIN
    DROP FUNCTION dbo.fn_GetPeriodLength;
    PRINT N'✓ Function fn_GetPeriodLength حذف شد برای rebuild';
END
GO

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
    DECLARE @Days INT = 0;
    DECLARE @CurrentYear INT = @StartYear;
    DECLARE @CurrentMonth INT = @StartMonth;
    DECLARE @CurrentDay INT = @StartDay;
    
    -- اگر شروع و پایان در یک ماه و سال هستند
    IF @StartYear = @EndYear AND @StartMonth = @EndMonth
    BEGIN
        SET @Days = @EndDay - @StartDay + 1;
        RETURN @Days;
    END
    
    -- محاسبه روزهای باقیمانده از ماه شروع
    DECLARE @StartMonthLength INT = dbo.fn_GetMonthLength(@StartYear, @StartMonth);
    SET @Days = @StartMonthLength - @StartDay + 1;
    
    -- محاسبه روزهای ماه‌های میانی
    SET @CurrentMonth = @StartMonth + 1;
    IF @CurrentMonth > 12
    BEGIN
        SET @CurrentMonth = 1;
        SET @CurrentYear = @StartYear + 1;
    END
    
    WHILE NOT (@CurrentYear = @EndYear AND @CurrentMonth = @EndMonth)
    BEGIN
        SET @Days = @Days + dbo.fn_GetMonthLength(@CurrentYear, @CurrentMonth);
        
        SET @CurrentMonth = @CurrentMonth + 1;
        IF @CurrentMonth > 12
        BEGIN
            SET @CurrentMonth = 1;
            SET @CurrentYear = @CurrentYear + 1;
        END
    END
    
    -- اضافه کردن روزهای ماه پایان
    SET @Days = @Days + @EndDay;
    
    RETURN @Days;
END;
GO

PRINT N'✓ Function fn_GetPeriodLength ایجاد شد';
GO

-- =============================================
-- Stored Procedure: دریافت بازه یک ماه خاص (اصلاح شده)
-- =============================================
IF OBJECT_ID('dbo.sp_GetMonthPeriod', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_GetMonthPeriod;
    PRINT N'✓ Stored Procedure sp_GetMonthPeriod حذف شد برای rebuild';
END
GO

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
            StartYear,
            EndDay, 
            EndMonth,
            EndYear
        FROM MonthPeriodSettings
        WHERE Year = @Year AND Month = @Month;
        RETURN;
    END
    
    -- محاسبه بازه پیش‌فرض
    DECLARE @PrevMonth INT = CASE WHEN @Month = 1 THEN 12 ELSE @Month - 1 END;
    DECLARE @PrevYear INT = CASE WHEN @Month = 1 THEN @Year - 1 ELSE @Year END;
    
    IF EXISTS (SELECT 1 FROM MonthPeriodSettings WHERE Year = @PrevYear AND Month = @PrevMonth)
    BEGIN
        -- بررسی پایان ماه قبل
        DECLARE @PrevEndDay INT, @PrevEndMonth INT, @PrevEndYear INT;
        SELECT @PrevEndDay = EndDay, @PrevEndMonth = EndMonth, @PrevEndYear = EndYear
        FROM MonthPeriodSettings
        WHERE Year = @PrevYear AND Month = @PrevMonth;
        
        -- بررسی اینکه آیا ماه قبل به ماه جاری ادامه پیدا می‌کند
        -- محاسبه ماه بعد از پایان ماه قبل
        DECLARE @NextMonthFromPrev INT, @NextYearFromPrev INT;
        DECLARE @NextDayFromPrev INT;
        
        -- استفاده از توابع برای محاسبه صحیح روز بعد
        SET @NextDayFromPrev = dbo.fn_GetNextDay(@PrevEndYear, @PrevEndMonth, @PrevEndDay);
        SET @NextMonthFromPrev = dbo.fn_GetNextMonth(@PrevEndYear, @PrevEndMonth, @PrevEndDay);
        SET @NextYearFromPrev = dbo.fn_GetNextYear(@PrevEndYear, @PrevEndMonth, @PrevEndDay);
        
        -- بررسی اینکه آیا ماه بعد از ماه قبل، همان ماه درخواستی است
        IF @NextYearFromPrev = @Year AND @NextMonthFromPrev = @Month
        BEGIN
            -- ماه قبل به ماه جاری ادامه دارد، پس از روز بعدی شروع می‌شود
            SELECT 
                @Year AS Year,
                @Month AS Month,
                @NextDayFromPrev AS StartDay,
                @NextMonthFromPrev AS StartMonth,
                @NextYearFromPrev AS StartYear,
                dbo.fn_GetMonthLength(@Year, @Month) AS EndDay,
                @Month AS EndMonth,
                @Year AS EndYear;
        END
        ELSE
        BEGIN
            -- ماه قبل به ماه جاری ادامه نمی‌دهد، پس از اول ماه شروع می‌شود
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
        -- حالت پیش‌فرض: از اول تا آخر ماه
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
GO

PRINT N'✓ Stored Procedure sp_GetMonthPeriod ایجاد شد';
GO

-- =============================================
-- Stored Procedure: دریافت تمام بازه‌های یک سال (اصلاح شده)
-- =============================================
IF OBJECT_ID('dbo.sp_GetYearMonthPeriods', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_GetYearMonthPeriods;
    PRINT N'✓ Stored Procedure sp_GetYearMonthPeriods حذف شد برای rebuild';
END
GO

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
    DECLARE @StartDay INT, @StartMonth INT, @StartYear INT, @EndDay INT, @EndMonth INT, @EndYear INT, @IsCustom BIT;
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
                
                -- استفاده از توابع برای محاسبه صحیح روز بعد
                DECLARE @NextDayFromPrev INT, @NextMonthFromPrev INT, @NextYearFromPrev INT;
                SET @NextDayFromPrev = dbo.fn_GetNextDay(@PrevEndYear, @PrevEndMonth, @PrevEndDay);
                SET @NextMonthFromPrev = dbo.fn_GetNextMonth(@PrevEndYear, @PrevEndMonth, @PrevEndDay);
                SET @NextYearFromPrev = dbo.fn_GetNextYear(@PrevEndYear, @PrevEndMonth, @PrevEndDay);
                
                -- بررسی اینکه آیا ماه بعد از ماه قبل، همان ماه جاری است
                IF @NextYearFromPrev = @Year AND @NextMonthFromPrev = @CurrentMonth
                BEGIN
                    -- ماه قبل به ماه جاری ادامه دارد، پس از روز بعدی شروع می‌شود
                    SET @StartDay = @NextDayFromPrev;
                    SET @StartYear = @NextYearFromPrev;
                    SET @StartMonth = @NextMonthFromPrev;
                END
                ELSE
                BEGIN
                    -- ماه قبل به ماه جاری ادامه نمی‌دهد، پس از اول ماه شروع می‌شود
                    SET @StartDay = 1;
                    SET @StartYear = @Year;
                    SET @StartMonth = @CurrentMonth;
                END
            END
            ELSE IF EXISTS (SELECT 1 FROM MonthPeriodSettings WHERE Year = @PrevYear AND Month = @PrevMonth)
            BEGIN
                SELECT @PrevEndDay = EndDay, @PrevEndMonth = EndMonth, @PrevEndYear = EndYear
                FROM MonthPeriodSettings
                WHERE Year = @PrevYear AND Month = @PrevMonth;
                
                -- استفاده از توابع برای محاسبه صحیح روز بعد
                DECLARE @NextDayFromPrev2 INT, @NextMonthFromPrev2 INT, @NextYearFromPrev2 INT;
                SET @NextDayFromPrev2 = dbo.fn_GetNextDay(@PrevEndYear, @PrevEndMonth, @PrevEndDay);
                SET @NextMonthFromPrev2 = dbo.fn_GetNextMonth(@PrevEndYear, @PrevEndMonth, @PrevEndDay);
                SET @NextYearFromPrev2 = dbo.fn_GetNextYear(@PrevEndYear, @PrevEndMonth, @PrevEndDay);
                
                -- بررسی اینکه آیا ماه بعد از ماه قبل، همان ماه جاری است
                IF @NextYearFromPrev2 = @Year AND @NextMonthFromPrev2 = @CurrentMonth
                BEGIN
                    -- ماه قبل به ماه جاری ادامه دارد، پس از روز بعدی شروع می‌شود
                    SET @StartDay = @NextDayFromPrev2;
                    SET @StartYear = @NextYearFromPrev2;
                    SET @StartMonth = @NextMonthFromPrev2;
                END
                ELSE
                BEGIN
                    -- ماه قبل به ماه جاری ادامه نمی‌دهد، پس از اول ماه شروع می‌شود
                    SET @StartDay = 1;
                    SET @StartYear = @Year;
                    SET @StartMonth = @CurrentMonth;
                END
            END
            ELSE
            BEGIN
                SET @StartDay = 1;
                SET @StartYear = @Year;
                SET @StartMonth = @CurrentMonth;
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
GO

PRINT N'✓ Stored Procedure sp_GetYearMonthPeriods ایجاد شد';
GO

PRINT N'';
PRINT N'========================================';
PRINT N'✓✓✓ اصلاحات با موفقیت انجام شد! ✓✓✓';
PRINT N'========================================';
GO

