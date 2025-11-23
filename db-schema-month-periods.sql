-- =============================================
-- Month Period Settings Schema
-- ایجاد جدول و stored procedures برای مدیریت بازه زمانی ماه‌های شمسی
-- =============================================

-- جدول ذخیره تنظیمات بازه ماه‌ها
CREATE TABLE MonthPeriodSettings (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Year INT NOT NULL,              -- سال شمسی (مثل 1404)
    Month INT NOT NULL CHECK (Month BETWEEN 1 AND 12),  -- ماه شمسی (1-12)
    StartDay INT NOT NULL,          -- روز شروع (مثلاً 1)
    StartMonth INT NOT NULL CHECK (StartMonth BETWEEN 1 AND 12),  -- ماه شروع (مثلاً 1 برای فروردین)
    EndDay INT NOT NULL,            -- روز پایان (مثلاً 5)
    EndMonth INT NOT NULL CHECK (EndMonth BETWEEN 1 AND 12),      -- ماه پایان (مثلاً 2 برای اردیبهشت)
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_MonthPeriod UNIQUE(Year, Month)  -- هر سال فقط یک بازه برای هر ماه
);
GO

-- ایندکس برای بهبود عملکرد
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
        -- سال‌های کبیسه در چرخه 33 ساله: 1، 5، 9، 13، 17، 22، 26، 30
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
-- Stored Procedure: دریافت بازه یک ماه خاص
-- اگر تنظیمی وجود ندارد، بازه پیش‌فرض محاسبه می‌شود
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
    -- بررسی آیا ماه قبل تنظیمی دارد
    DECLARE @PrevMonth INT = CASE WHEN @Month = 1 THEN 12 ELSE @Month - 1 END;
    DECLARE @PrevYear INT = CASE WHEN @Month = 1 THEN @Year - 1 ELSE @Year END;
    
    IF EXISTS (SELECT 1 FROM MonthPeriodSettings WHERE Year = @PrevYear AND Month = @PrevMonth)
    BEGIN
        -- شروع از روز بعدی (X+1) پایان ماه قبل
        DECLARE @PrevEndDay INT, @PrevEndMonth INT;
        SELECT @PrevEndDay = EndDay, @PrevEndMonth = EndMonth
        FROM MonthPeriodSettings
        WHERE Year = @PrevYear AND Month = @PrevMonth;
        
        -- اگر ماه قبل در همین ماه تمام شد، از روز بعد شروع کن
        IF @PrevEndMonth = @Month
        BEGIN
            SELECT 
                @Year AS Year,
                @Month AS Month,
                @PrevEndDay + 1 AS StartDay,  -- X+1
                @Month AS StartMonth,
                dbo.fn_GetMonthLength(@Year, @Month) AS EndDay,
                @Month AS EndMonth;
        END
        ELSE
        BEGIN
            -- ماه قبل در ماه دیگری تمام شده، پس این ماه شروع عادی دارد
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
        -- ماه قبل تنظیم نشده، پس این ماه هم حالت عادی: از اول تا آخر
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
-- برای ماه‌هایی که تنظیم نشده‌اند، بازه پیش‌فرض برمی‌گرداند
-- =============================================
CREATE PROCEDURE sp_GetYearMonthPeriods
    @Year INT
AS
BEGIN
    SET NOCOUNT ON;
    
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

-- =============================================
-- Function: اعتبارسنجی اینکه آیا ماه برای ویرایش مجاز است
-- فقط ماه جاری و ماه‌های آینده قابل تنظیم هستند
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
-- Test Queries (برای بررسی صحت عملکرد)
-- =============================================

-- مثال 1: تنظیم فروردین 1404 از 1 فروردین تا 5 اردیبهشت
-- INSERT INTO MonthPeriodSettings (Year, Month, StartDay, StartMonth, EndDay, EndMonth)
-- VALUES (1404, 1, 1, 1, 5, 2);

-- مثال 2: دریافت بازه اردیبهشت (باید از 6 اردیبهشت شروع شود)
-- EXEC sp_GetMonthPeriod @Year = 1404, @Month = 2;

-- مثال 3: دریافت بازه خرداد (باید از 1 خرداد شروع شود چون اردیبهشت تنظیم نشده)
-- EXEC sp_GetMonthPeriod @Year = 1404, @Month = 3;

-- مثال 4: دریافت تمام ماه‌های سال 1404
-- EXEC sp_GetYearMonthPeriods @Year = 1404;

-- مثال 5: بررسی اینکه آیا ماه قابل ویرایش است
-- SELECT dbo.fn_IsMonthEditable(1404, 6, 1404, 5);  -- باید 1 برگرداند (ماه آینده)
-- SELECT dbo.fn_IsMonthEditable(1404, 4, 1404, 5);  -- باید 0 برگرداند (ماه گذشته)
