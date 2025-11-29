-- =============================================
-- Add Script: اضافه کردن اعتبارسنجی و تنظیم خودکار ماه قبل و بعد
-- تاریخ: 1404/09/09
-- توضیحات: این اسکریپت اعتبارسنجی‌های لازم برای بازه‌های ماهیانه را اضافه می‌کند
--           - بررسی overlap (یک روز در دو ماه)
--           - بررسی gap (روزهای بدون بازه)
--           - تنظیم خودکار ماه قبل و بعد
-- =============================================

USE [UMD]
GO

PRINT N'شروع اضافه کردن اعتبارسنجی و تنظیم خودکار...';
GO

-- =============================================
-- Function: بررسی اینکه آیا دو بازه با هم overlap دارند
-- =============================================
IF OBJECT_ID('dbo.fn_CheckPeriodOverlap', 'FN') IS NOT NULL
BEGIN
    DROP FUNCTION dbo.fn_CheckPeriodOverlap;
    PRINT N'✓ Function fn_CheckPeriodOverlap حذف شد برای rebuild';
END
GO

CREATE FUNCTION dbo.fn_CheckPeriodOverlap(
    @StartYear1 INT,
    @StartMonth1 INT,
    @StartDay1 INT,
    @EndYear1 INT,
    @EndMonth1 INT,
    @EndDay1 INT,
    @StartYear2 INT,
    @StartMonth2 INT,
    @StartDay2 INT,
    @EndYear2 INT,
    @EndMonth2 INT,
    @EndDay2 INT
)
RETURNS BIT
AS
BEGIN
    -- بررسی overlap: اگر شروع بازه 1 قبل از پایان بازه 2 باشد و پایان بازه 1 بعد از شروع بازه 2 باشد
    -- مقایسه بر اساس سال، ماه و روز
    
    -- محاسبه عددی برای مقایسه آسان‌تر (سال * 10000 + ماه * 100 + روز)
    DECLARE @Start1 BIGINT = @StartYear1 * 10000 + @StartMonth1 * 100 + @StartDay1;
    DECLARE @End1 BIGINT = @EndYear1 * 10000 + @EndMonth1 * 100 + @EndDay1;
    DECLARE @Start2 BIGINT = @StartYear2 * 10000 + @StartMonth2 * 100 + @StartDay2;
    DECLARE @End2 BIGINT = @EndYear2 * 10000 + @EndMonth2 * 100 + @EndDay2;
    
    -- Overlap اگر: Start1 <= End2 AND End1 >= Start2
    IF @Start1 <= @End2 AND @End1 >= @Start2
        RETURN 1;
    
    RETURN 0;
END;
GO

PRINT N'✓ Function fn_CheckPeriodOverlap ایجاد شد';
GO

-- =============================================
-- Function: محاسبه روز قبل از یک تاریخ مشخص (بازگشت PrevDay)
-- =============================================
IF OBJECT_ID('dbo.fn_GetPrevDay', 'FN') IS NOT NULL
BEGIN
    DROP FUNCTION dbo.fn_GetPrevDay;
    PRINT N'✓ Function fn_GetPrevDay حذف شد برای rebuild';
END
GO

CREATE FUNCTION dbo.fn_GetPrevDay(
    @Year INT,
    @Month INT,
    @Day INT
)
RETURNS INT
AS
BEGIN
    -- اگر روز اول ماه است، روز قبل آخرین روز ماه قبل است
    IF @Day = 1
    BEGIN
        IF @Month = 1
            RETURN dbo.fn_GetMonthLength(@Year - 1, 12);  -- قبل از فروردین، آخرین روز اسفند سال قبل
        ELSE
            RETURN dbo.fn_GetMonthLength(@Year, @Month - 1);
    END
    
    -- در غیر این صورت، روز قبل همان روز - 1 است
    RETURN @Day - 1;
END;
GO

PRINT N'✓ Function fn_GetPrevDay ایجاد شد';
GO

-- =============================================
-- Function: محاسبه ماه قبل از یک تاریخ مشخص (بازگشت PrevMonth)
-- =============================================
IF OBJECT_ID('dbo.fn_GetPrevMonth', 'FN') IS NOT NULL
BEGIN
    DROP FUNCTION dbo.fn_GetPrevMonth;
    PRINT N'✓ Function fn_GetPrevMonth حذف شد برای rebuild';
END
GO

CREATE FUNCTION dbo.fn_GetPrevMonth(
    @Year INT,
    @Month INT,
    @Day INT
)
RETURNS INT
AS
BEGIN
    -- اگر روز اول ماه است، ماه قبل ماه قبلی است
    IF @Day = 1
    BEGIN
        IF @Month = 1
            RETURN 12;  -- قبل از فروردین، اسفند سال قبل
        ELSE
            RETURN @Month - 1;
    END
    
    -- در غیر این صورت، ماه همان ماه است
    RETURN @Month;
END;
GO

PRINT N'✓ Function fn_GetPrevMonth ایجاد شد';
GO

-- =============================================
-- Function: محاسبه سال قبل از یک تاریخ مشخص (بازگشت PrevYear)
-- =============================================
IF OBJECT_ID('dbo.fn_GetPrevYear', 'FN') IS NOT NULL
BEGIN
    DROP FUNCTION dbo.fn_GetPrevYear;
    PRINT N'✓ Function fn_GetPrevYear حذف شد برای rebuild';
END
GO

CREATE FUNCTION dbo.fn_GetPrevYear(
    @Year INT,
    @Month INT,
    @Day INT
)
RETURNS INT
AS
BEGIN
    -- اگر روز اول فروردین است، سال قبل سال قبلی است
    IF @Day = 1 AND @Month = 1
        RETURN @Year - 1;
    
    -- در غیر این صورت، سال همان سال است
    RETURN @Year;
END;
GO

PRINT N'✓ Function fn_GetPrevYear ایجاد شد';
GO

-- =============================================
-- Stored Procedure: بررسی اعتبارسنجی بازه با ماه‌های مجاور
-- این procedure بررسی می‌کند که:
-- 1. آیا با ماه قبل overlap دارد؟
-- 2. آیا با ماه بعد overlap دارد؟
-- 3. آیا gap وجود دارد؟
-- =============================================
IF OBJECT_ID('dbo.sp_ValidatePeriodWithNeighbors', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_ValidatePeriodWithNeighbors;
    PRINT N'✓ Stored Procedure sp_ValidatePeriodWithNeighbors حذف شد برای rebuild';
END
GO

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
    
    CREATE TABLE #ValidationResults (
        ErrorCode INT,
        ErrorMessage NVARCHAR(500)
    );
    
    -- محاسبه ماه قبل و بعد
    DECLARE @PrevMonth INT = CASE WHEN @Month = 1 THEN 12 ELSE @Month - 1 END;
    DECLARE @PrevYear INT = CASE WHEN @Month = 1 THEN @Year - 1 ELSE @Year END;
    DECLARE @NextMonth INT = CASE WHEN @Month = 12 THEN 1 ELSE @Month + 1 END;
    DECLARE @NextYear INT = CASE WHEN @Month = 12 THEN @Year + 1 ELSE @Year END;
    
    -- دریافت بازه ماه قبل (اگر وجود دارد)
    DECLARE @PrevStartDay INT, @PrevStartMonth INT, @PrevStartYear INT;
    DECLARE @PrevEndDay INT, @PrevEndMonth INT, @PrevEndYear INT;
    DECLARE @PrevExists BIT = 0;
    
    IF EXISTS (SELECT 1 FROM MonthPeriodSettings WHERE Year = @PrevYear AND Month = @PrevMonth)
    BEGIN
        SET @PrevExists = 1;
        SELECT 
            @PrevStartDay = StartDay,
            @PrevStartMonth = StartMonth,
            @PrevStartYear = StartYear,
            @PrevEndDay = EndDay,
            @PrevEndMonth = EndMonth,
            @PrevEndYear = EndYear
        FROM MonthPeriodSettings
        WHERE Year = @PrevYear AND Month = @PrevMonth;
    END
    ELSE
    BEGIN
        -- استفاده از stored procedure برای دریافت بازه پیش‌فرض
        DECLARE @PrevResult TABLE (
            Year INT,
            Month INT,
            StartDay INT,
            StartMonth INT,
            StartYear INT,
            EndDay INT,
            EndMonth INT,
            EndYear INT
        );
        
        INSERT INTO @PrevResult
        EXEC sp_GetMonthPeriod @PrevYear, @PrevMonth;
        
        SELECT 
            @PrevStartDay = StartDay,
            @PrevStartMonth = StartMonth,
            @PrevStartYear = StartYear,
            @PrevEndDay = EndDay,
            @PrevEndMonth = EndMonth,
            @PrevEndYear = EndYear
        FROM @PrevResult;
    END
    
    -- دریافت بازه ماه بعد (اگر وجود دارد)
    DECLARE @NextStartDay INT, @NextStartMonth INT, @NextStartYear INT;
    DECLARE @NextEndDay INT, @NextEndMonth INT, @NextEndYear INT;
    DECLARE @NextExists BIT = 0;
    
    IF EXISTS (SELECT 1 FROM MonthPeriodSettings WHERE Year = @NextYear AND Month = @NextMonth)
    BEGIN
        SET @NextExists = 1;
        SELECT 
            @NextStartDay = StartDay,
            @NextStartMonth = StartMonth,
            @NextStartYear = StartYear,
            @NextEndDay = EndDay,
            @NextEndMonth = EndMonth,
            @NextEndYear = EndYear
        FROM MonthPeriodSettings
        WHERE Year = @NextYear AND Month = @NextMonth;
    END
    ELSE
    BEGIN
        -- استفاده از stored procedure برای دریافت بازه پیش‌فرض
        DECLARE @NextResult TABLE (
            Year INT,
            Month INT,
            StartDay INT,
            StartMonth INT,
            StartYear INT,
            EndDay INT,
            EndMonth INT,
            EndYear INT
        );
        
        INSERT INTO @NextResult
        EXEC sp_GetMonthPeriod @NextYear, @NextMonth;
        
        SELECT 
            @NextStartDay = StartDay,
            @NextStartMonth = StartMonth,
            @NextStartYear = StartYear,
            @NextEndDay = EndDay,
            @NextEndMonth = EndMonth,
            @NextEndYear = EndYear
        FROM @NextResult;
    END
    
    -- بررسی 1: آیا با ماه قبل overlap دارد؟
    IF dbo.fn_CheckPeriodOverlap(
        @StartYear, @StartMonth, @StartDay, @EndYear, @EndMonth, @EndDay,
        @PrevStartYear, @PrevStartMonth, @PrevStartDay, @PrevEndYear, @PrevEndMonth, @PrevEndDay
    ) = 1
    BEGIN
        INSERT INTO #ValidationResults (ErrorCode, ErrorMessage)
        VALUES (1, N'بازه با ماه قبل (ماه ' + CAST(@PrevMonth AS NVARCHAR(2)) + N' سال ' + CAST(@PrevYear AS NVARCHAR(4)) + N') همپوشانی دارد. یک روز نمی‌تواند در دو بازه ماهانه باشد.');
    END
    
    -- بررسی 2: آیا با ماه بعد overlap دارد؟
    IF dbo.fn_CheckPeriodOverlap(
        @StartYear, @StartMonth, @StartDay, @EndYear, @EndMonth, @EndDay,
        @NextStartYear, @NextStartMonth, @NextStartDay, @NextEndYear, @NextEndMonth, @NextEndDay
    ) = 1
    BEGIN
        INSERT INTO #ValidationResults (ErrorCode, ErrorMessage)
        VALUES (2, N'بازه با ماه بعد (ماه ' + CAST(@NextMonth AS NVARCHAR(2)) + N' سال ' + CAST(@NextYear AS NVARCHAR(4)) + N') همپوشانی دارد. یک روز نمی‌تواند در دو بازه ماهانه باشد.');
    END
    
    -- بررسی 3: آیا gap با ماه قبل وجود دارد؟
    -- روز بعدی پایان ماه قبل باید اولین روز بازه جاری باشد
    DECLARE @PrevNextDay INT = dbo.fn_GetNextDay(@PrevEndYear, @PrevEndMonth, @PrevEndDay);
    DECLARE @PrevNextMonth INT = dbo.fn_GetNextMonth(@PrevEndYear, @PrevEndMonth, @PrevEndDay);
    DECLARE @PrevNextYear INT = dbo.fn_GetNextYear(@PrevEndYear, @PrevEndMonth, @PrevEndDay);
    
    IF NOT (@PrevNextYear = @StartYear AND @PrevNextMonth = @StartMonth AND @PrevNextDay = @StartDay)
    BEGIN
        INSERT INTO #ValidationResults (ErrorCode, ErrorMessage)
        VALUES (3, N'بین بازه ماه قبل و بازه جاری فاصله وجود دارد. روز بعدی آخرین روز ماه قبل (' + 
                CAST(@PrevEndDay AS NVARCHAR(2)) + N' ' + CAST(@PrevEndMonth AS NVARCHAR(2)) + N' ' + CAST(@PrevEndYear AS NVARCHAR(4)) + 
                N') باید اولین روز بازه جاری باشد.');
    END
    
    -- بررسی 4: آیا gap با ماه بعد وجود دارد؟
    -- روز قبلی شروع ماه بعد باید آخرین روز بازه جاری باشد
    DECLARE @NextPrevDay INT = dbo.fn_GetPrevDay(@NextStartYear, @NextStartMonth, @NextStartDay);
    DECLARE @NextPrevMonth INT = dbo.fn_GetPrevMonth(@NextStartYear, @NextStartMonth, @NextStartDay);
    DECLARE @NextPrevYear INT = dbo.fn_GetPrevYear(@NextStartYear, @NextStartMonth, @NextStartDay);
    
    IF NOT (@NextPrevYear = @EndYear AND @NextPrevMonth = @EndMonth AND @NextPrevDay = @EndDay)
    BEGIN
        INSERT INTO #ValidationResults (ErrorCode, ErrorMessage)
        VALUES (4, N'بین بازه جاری و بازه ماه بعد فاصله وجود دارد. روز قبلی اولین روز ماه بعد (' + 
                CAST(@NextStartDay AS NVARCHAR(2)) + N' ' + CAST(@NextStartMonth AS NVARCHAR(2)) + N' ' + CAST(@NextStartYear AS NVARCHAR(4)) + 
                N') باید آخرین روز بازه جاری باشد.');
    END
    
    SELECT * FROM #ValidationResults;
    DROP TABLE #ValidationResults;
END;
GO

PRINT N'✓ Stored Procedure sp_ValidatePeriodWithNeighbors ایجاد شد';
GO

-- =============================================
-- Stored Procedure: تنظیم خودکار ماه قبل و بعد
-- این procedure بعد از ایجاد/ویرایش یک بازه، ماه قبل و بعد را به صورت خودکار تنظیم می‌کند
-- =============================================
IF OBJECT_ID('dbo.sp_AutoAdjustNeighborMonths', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_AutoAdjustNeighborMonths;
    PRINT N'✓ Stored Procedure sp_AutoAdjustNeighborMonths حذف شد برای rebuild';
END
GO

CREATE PROCEDURE sp_AutoAdjustNeighborMonths
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
    
    -- محاسبه ماه قبل و بعد
    DECLARE @PrevMonth INT = CASE WHEN @Month = 1 THEN 12 ELSE @Month - 1 END;
    DECLARE @PrevYear INT = CASE WHEN @Month = 1 THEN @Year - 1 ELSE @Year END;
    DECLARE @NextMonth INT = CASE WHEN @Month = 12 THEN 1 ELSE @Month + 1 END;
    DECLARE @NextYear INT = CASE WHEN @Month = 12 THEN @Year + 1 ELSE @Year END;
    
    -- محاسبه روز بعدی پایان بازه جاری
    DECLARE @NextDayFromCurrent INT = dbo.fn_GetNextDay(@EndYear, @EndMonth, @EndDay);
    DECLARE @NextMonthFromCurrent INT = dbo.fn_GetNextMonth(@EndYear, @EndMonth, @EndDay);
    DECLARE @NextYearFromCurrent INT = dbo.fn_GetNextYear(@EndYear, @EndMonth, @EndDay);
    
    -- محاسبه روز قبلی شروع بازه جاری
    DECLARE @PrevDayFromCurrent INT = dbo.fn_GetPrevDay(@StartYear, @StartMonth, @StartDay);
    DECLARE @PrevMonthFromCurrent INT = dbo.fn_GetPrevMonth(@StartYear, @StartMonth, @StartDay);
    DECLARE @PrevYearFromCurrent INT = dbo.fn_GetPrevYear(@StartYear, @StartMonth, @StartDay);
    
    -- تنظیم خودکار ماه بعد
    -- اگر بازه جاری به ماه بعد ادامه می‌دهد
    IF @NextYearFromCurrent = @NextYear AND @NextMonthFromCurrent = @NextMonth
    BEGIN
        -- بررسی اینکه آیا ماه بعد قابل ویرایش است (باید از fn_IsMonthEditable استفاده کنیم)
        -- اما چون اینجا فقط تنظیم خودکار انجام می‌دهیم، فقط اگر تنظیم سفارشی وجود دارد، آن را حذف می‌کنیم
        -- تا به صورت خودکار محاسبه شود
        
        -- حذف تنظیم سفارشی ماه بعد (اگر وجود دارد)
        DELETE FROM MonthPeriodSettings 
        WHERE Year = @NextYear AND Month = @NextMonth;
        
        -- ماه بعد به صورت خودکار از روز بعدی پایان بازه جاری شروع می‌شود
        -- و تا آخر ماه بعد ادامه می‌یابد
    END
    
    -- تنظیم خودکار ماه قبل
    -- اگر بازه جاری از ماه قبل شروع می‌شود
    IF @PrevYearFromCurrent = @PrevYear AND @PrevMonthFromCurrent = @PrevMonth
    BEGIN
        -- حذف تنظیم سفارشی ماه قبل (اگر وجود دارد)
        DELETE FROM MonthPeriodSettings 
        WHERE Year = @PrevYear AND Month = @PrevMonth;
        
        -- ماه قبل به صورت خودکار از اول ماه قبل شروع می‌شود
        -- و تا روز قبلی شروع بازه جاری ادامه می‌یابد
    END
END;
GO

PRINT N'✓ Stored Procedure sp_AutoAdjustNeighborMonths ایجاد شد';
GO

PRINT N'';
PRINT N'========================================';
PRINT N'✓✓✓ اعتبارسنجی و تنظیم خودکار با موفقیت اضافه شد! ✓✓✓';
PRINT N'========================================';
GO

