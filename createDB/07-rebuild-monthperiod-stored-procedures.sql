-- =============================================
-- Rebuild Script: بازسازی Stored Procedures مربوط به MonthPeriodSettings
-- تاریخ: 1404/09/09
-- توضیحات: این اسکریپت Stored Procedures را بعد از migration بازسازی می‌کند
-- =============================================

USE [UMD]
GO

PRINT N'شروع rebuild: بازسازی Stored Procedures...';
GO

-- =============================================
-- Stored Procedure: دریافت بازه یک ماه خاص
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
        -- شروع از روز بعدی پایان ماه قبل
        DECLARE @PrevEndDay INT, @PrevEndMonth INT, @PrevEndYear INT;
        SELECT @PrevEndDay = EndDay, @PrevEndMonth = EndMonth, @PrevEndYear = EndYear
        FROM MonthPeriodSettings
        WHERE Year = @PrevYear AND Month = @PrevMonth;
        
        -- محاسبه StartYear و StartMonth
        DECLARE @CalcStartYear INT, @CalcStartMonth INT;
        IF @PrevEndMonth = 12
        BEGIN
            -- اگر پایان ماه قبل در اسفند است، شروع از فروردین سال بعد
            SET @CalcStartYear = @PrevEndYear + 1;
            SET @CalcStartMonth = 1;
        END
        ELSE
        BEGIN
            -- در غیر این صورت، ماه بعدی همان سال
            SET @CalcStartYear = @PrevEndYear;
            SET @CalcStartMonth = @PrevEndMonth + 1;
        END
        
        -- اگر محاسبه شده با ماه درخواستی مطابقت دارد
        IF @CalcStartYear = @Year AND @CalcStartMonth = @Month
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
-- Stored Procedure: دریافت تمام بازه‌های یک سال
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
                
                -- محاسبه StartYear و StartMonth بر اساس پایان ماه قبل
                IF @PrevEndMonth = 12
                BEGIN
                    -- اگر پایان در اسفند است، شروع از فروردین سال بعد
                    SET @StartYear = @PrevEndYear + 1;
                    SET @StartMonth = 1;
                END
                ELSE
                BEGIN
                    SET @StartYear = @PrevEndYear;
                    SET @StartMonth = @PrevEndMonth + 1;
                END
                
                -- بررسی تطابق با ماه جاری
                IF @StartYear = @Year AND @StartMonth = @CurrentMonth
                BEGIN
                    SET @StartDay = @PrevEndDay + 1;
                END
                ELSE
                BEGIN
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
                
                -- محاسبه StartYear و StartMonth بر اساس پایان ماه قبل
                IF @PrevEndMonth = 12
                BEGIN
                    SET @StartYear = @PrevEndYear + 1;
                    SET @StartMonth = 1;
                END
                ELSE
                BEGIN
                    SET @StartYear = @PrevEndYear;
                    SET @StartMonth = @PrevEndMonth + 1;
                END
                
                -- بررسی تطابق با ماه جاری
                IF @StartYear = @Year AND @StartMonth = @CurrentMonth
                BEGIN
                    SET @StartDay = @PrevEndDay + 1;
                END
                ELSE
                BEGIN
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
PRINT N'✓✓✓ Stored Procedures با موفقیت بازسازی شدند! ✓✓✓';
PRINT N'========================================';
GO

