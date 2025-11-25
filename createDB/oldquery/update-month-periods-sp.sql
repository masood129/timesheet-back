-- =============================================
-- Update sp_GetYearMonthPeriods Stored Procedure
-- Fix: Check temp table for previous month's calculated period
-- =============================================

-- Drop existing procedure
IF OBJECT_ID('sp_GetYearMonthPeriods', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetYearMonthPeriods;
GO

-- Recreate with fix
CREATE PROCEDURE sp_GetYearMonthPeriods
    @Year INT
AS
BEGIN
    -- SET NOCOUNT ON;
    
    -- ایجاد جدول موقت برای نگهداری نتایج
    CREATE TABLE #MonthPeriods (
        Year INT,
        Month INT,
        StartDay INT,
        StartMonth INT,
        EndDay INT,
        EndMonth INT,
        IsCustom BIT  -- آیا تنظیم سفارشی است یا پیش‌فرض
    );
    
    -- پر کردن جدول برای تمام 12 ماه
    DECLARE @CurrentMonth INT = 1;
    DECLARE @StartDay INT, @StartMonth INT, @EndDay INT, @EndMonth INT, @IsCustom BIT;
    DECLARE @PrevMonth INT, @PrevYear INT, @PrevEndDay INT, @PrevEndMonth INT;
    
    WHILE @CurrentMonth <= 12
    BEGIN
        -- بررسی اینکه آیا تنظیم سفارشی وجود دارد
        IF EXISTS (SELECT 1 FROM MonthPeriodSettings WHERE Year = @Year AND Month = @CurrentMonth)
        BEGIN
            -- استفاده از تنظیم سفارشی
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
            -- محاسبه بازه پیش‌فرض
            SET @PrevMonth = CASE WHEN @CurrentMonth = 1 THEN 12 ELSE @CurrentMonth - 1 END;
            SET @PrevYear = CASE WHEN @CurrentMonth = 1 THEN @Year - 1 ELSE @Year END;
            
            -- ابتدا بررسی می‌کنیم که آیا ماه قبل در جدول موقت محاسبه شده است
            -- (برای ماه‌های همین سال که قبلاً در حلقه پردازش شده‌اند)
            IF @PrevYear = @Year AND EXISTS (SELECT 1 FROM #MonthPeriods WHERE Month = @PrevMonth)
            BEGIN
                -- استفاده از بازه محاسبه شده ماه قبل از جدول موقت
                SELECT @PrevEndDay = EndDay, @PrevEndMonth = EndMonth
                FROM #MonthPeriods
                WHERE Month = @PrevMonth;
                
                IF @PrevEndMonth = @CurrentMonth
                BEGIN
                    -- ماه قبل در همین ماه تمام شده
                    SET @StartDay = @PrevEndDay + 1;
                    SET @StartMonth = @CurrentMonth;
                END
                ELSE
                BEGIN
                    -- ماه قبل در ماه دیگری تمام شده
                    SET @StartDay = 1;
                    SET @StartMonth = @CurrentMonth;
                END
            END
            ELSE IF EXISTS (SELECT 1 FROM MonthPeriodSettings WHERE Year = @PrevYear AND Month = @PrevMonth)
            BEGIN
                -- ماه قبل تنظیم شده در دیتابیس (برای سال قبل)، شروع از X+1
                SELECT @PrevEndDay = EndDay, @PrevEndMonth = EndMonth
                FROM MonthPeriodSettings
                WHERE Year = @PrevYear AND Month = @PrevMonth;
                
                IF @PrevEndMonth = @CurrentMonth
                BEGIN
                    -- ماه قبل در همین ماه تمام شده
                    SET @StartDay = @PrevEndDay + 1;
                    SET @StartMonth = @CurrentMonth;
                END
                ELSE
                BEGIN
                    -- ماه قبل در ماه دیگری تمام شده
                    SET @StartDay = 1;
                    SET @StartMonth = @CurrentMonth;
                END
            END
            ELSE
            BEGIN
                -- ماه قبل تنظیم نشده، حالت عادی
                SET @StartDay = 1;
                SET @StartMonth = @CurrentMonth;
            END
            
            SET @EndDay = dbo.fn_GetMonthLength(@Year, @CurrentMonth);
            SET @EndMonth = @CurrentMonth;
            SET @IsCustom = 0;
        END
        
        -- اضافه کردن به جدول موقت
        INSERT INTO #MonthPeriods (Year, Month, StartDay, StartMonth, EndDay, EndMonth, IsCustom)
        VALUES (@Year, @CurrentMonth, @StartDay, @StartMonth, @EndDay, @EndMonth, @IsCustom);
        
        SET @CurrentMonth = @CurrentMonth + 1;
    END
    
    -- برگرداندن نتایج
    SELECT * FROM #MonthPeriods ORDER BY Month;
    
    -- پاک کردن جدول موقت
    DROP TABLE #MonthPeriods;
END;
GO

PRINT 'Stored procedure sp_GetYearMonthPeriods updated successfully!';
GO
