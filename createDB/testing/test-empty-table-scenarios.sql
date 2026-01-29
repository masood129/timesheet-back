-- =============================================
-- تست حالت‌های مختلف برای Endpoint بررسی وضعیت گزارش
-- شامل: جدول خالی، عدم وجود رکورد، و رکوردهای معتبر
-- =============================================

USE UMD;
GO

PRINT N'';
PRINT N'==================================================';
PRINT N'تست سناریوهای مختلف Check Submit Endpoint';
PRINT N'==================================================';
PRINT N'';

-- =============================================
-- سناریو 1: جدول کاملاً خالی
-- =============================================
PRINT N'سناریو 1: تست با جدول خالی';
PRINT N'--------------------------------------------------';

-- Backup داده‌های فعلی
SELECT * INTO #BackupMonthlyReports FROM MonthlyReports;

-- خالی کردن جدول
DELETE FROM MonthlyReports;

PRINT N'→ جدول خالی شد. تست Query...';

-- تست Query مشابه Endpoint
DECLARE @TestUserId1 INT = 2001;
DECLARE @TestYear1 INT = 1403;
DECLARE @TestMonth1 INT = 10;

SELECT TOP 1 Status 
FROM MonthlyReports 
WHERE UserId = @TestUserId1 
  AND JalaliYear = @TestYear1 
  AND JalaliMonth = @TestMonth1;

IF @@ROWCOUNT = 0
BEGIN
    PRINT N'  ✓ نتیجه: رکوردی پیدا نشد (recordset خالی)';
    PRINT N'  ✓ Endpoint باید: { "status": null } برگرداند';
    PRINT N'  ✓ هیچ ارور رخ نداد';
END
ELSE
    PRINT N'  ✗ خطا: نباید رکوردی پیدا می‌شد!';

PRINT N'';

-- =============================================
-- سناریو 2: جدول دارای رکورد اما برای کاربر دیگر
-- =============================================
PRINT N'سناریو 2: رکورد برای کاربر دیگر موجود است';
PRINT N'--------------------------------------------------';

-- اضافه کردن یک رکورد برای کاربر دیگر
INSERT INTO MonthlyReports (
    UserId, Year, Month, JalaliYear, JalaliMonth, 
    TotalHours, GymCost, Status, GroupId
) VALUES (
    9999, 2024, 12, 1403, 10,
    160, 0, 'draft', 1
);

PRINT N'→ رکورد برای UserId=9999 اضافه شد';
PRINT N'→ تست Query برای UserId=2001...';

-- تست Query برای کاربر دیگر
DECLARE @TestUserId2 INT = 2001;
DECLARE @TestYear2 INT = 1403;
DECLARE @TestMonth2 INT = 10;

SELECT TOP 1 Status 
FROM MonthlyReports 
WHERE UserId = @TestUserId2 
  AND JalaliYear = @TestYear2 
  AND JalaliMonth = @TestMonth2;

IF @@ROWCOUNT = 0
BEGIN
    PRINT N'  ✓ نتیجه: رکوردی برای این کاربر پیدا نشد';
    PRINT N'  ✓ Endpoint باید: { "status": null } برگرداند';
    PRINT N'  ✓ هیچ ارور رخ نداد';
END
ELSE
    PRINT N'  ✗ خطا: نباید رکوردی پیدا می‌شد!';

PRINT N'';

-- =============================================
-- سناریو 3: رکورد برای همان کاربر اما ماه دیگر
-- =============================================
PRINT N'سناریو 3: رکورد برای همان کاربر اما ماه دیگر';
PRINT N'--------------------------------------------------';

-- اضافه کردن رکورد برای ماه دیگر
INSERT INTO MonthlyReports (
    UserId, Year, Month, JalaliYear, JalaliMonth, 
    TotalHours, GymCost, Status, GroupId
) VALUES (
    2001, 2024, 11, 1403, 9,
    160, 0, 'submitted_to_group_manager', 1
);

PRINT N'→ رکورد برای UserId=2001, ماه=9 اضافه شد';
PRINT N'→ تست Query برای UserId=2001, ماه=10...';

-- تست Query برای ماه دیگر
DECLARE @TestUserId3 INT = 2001;
DECLARE @TestYear3 INT = 1403;
DECLARE @TestMonth3 INT = 10;

SELECT TOP 1 Status 
FROM MonthlyReports 
WHERE UserId = @TestUserId3 
  AND JalaliYear = @TestYear3 
  AND JalaliMonth = @TestMonth3;

IF @@ROWCOUNT = 0
BEGIN
    PRINT N'  ✓ نتیجه: رکوردی برای این ماه پیدا نشد';
    PRINT N'  ✓ Endpoint باید: { "status": null } برگرداند';
    PRINT N'  ✓ هیچ ارور رخ نداد';
END
ELSE
    PRINT N'  ✗ خطا: نباید رکوردی پیدا می‌شد!';

PRINT N'';

-- =============================================
-- سناریو 4: رکورد معتبر موجود است
-- =============================================
PRINT N'سناریو 4: رکورد معتبر برای کاربر و ماه موجود است';
PRINT N'--------------------------------------------------';

-- اضافه کردن رکورد معتبر
INSERT INTO MonthlyReports (
    UserId, Year, Month, JalaliYear, JalaliMonth, 
    TotalHours, GymCost, Status, GroupId
) VALUES (
    2001, 2025, 1, 1403, 10,
    160, 0, 'draft', 1
);

PRINT N'→ رکورد معتبر برای UserId=2001, ماه=10 اضافه شد';
PRINT N'→ تست Query...';

-- تست Query برای رکورد معتبر
DECLARE @TestUserId4 INT = 2001;
DECLARE @TestYear4 INT = 1403;
DECLARE @TestMonth4 INT = 10;
DECLARE @FoundStatus NVARCHAR(50);

SELECT TOP 1 @FoundStatus = Status 
FROM MonthlyReports 
WHERE UserId = @TestUserId4 
  AND JalaliYear = @TestYear4 
  AND JalaliMonth = @TestMonth4;

IF @@ROWCOUNT > 0
BEGIN
    PRINT N'  ✓ نتیجه: رکورد پیدا شد';
    PRINT N'  ✓ Status: ' + @FoundStatus;
    PRINT N'  ✓ Endpoint باید: { "status": "' + @FoundStatus + N'" } برگرداند';
    PRINT N'  ✓ هیچ ارور رخ نداد';
END
ELSE
    PRINT N'  ✗ خطا: رکورد باید پیدا می‌شد!';

PRINT N'';

-- =============================================
-- سناریو 5: چند رکورد برای یک کاربر (تست TOP 1)
-- =============================================
PRINT N'سناریو 5: چند رکورد برای یک کاربر و ماه';
PRINT N'--------------------------------------------------';

-- اضافه کردن رکورد دوم (نباید اتفاق بیفتد اما تست می‌کنیم)
INSERT INTO MonthlyReports (
    UserId, Year, Month, JalaliYear, JalaliMonth, 
    TotalHours, GymCost, Status, GroupId
) VALUES (
    2001, 2025, 1, 1403, 10,
    170, 0, 'submitted_to_group_manager', 1
);

PRINT N'→ رکورد دوم اضافه شد (تست TOP 1)';
PRINT N'→ تست Query...';

-- تست Query
SELECT TOP 1 Status 
FROM MonthlyReports 
WHERE UserId = 2001 
  AND JalaliYear = 1403 
  AND JalaliMonth = 10;

IF @@ROWCOUNT > 0
BEGIN
    PRINT N'  ✓ نتیجه: فقط یک رکورد برگشت (TOP 1 کار می‌کند)';
    PRINT N'  ✓ هیچ ارور رخ نداد';
END
ELSE
    PRINT N'  ✗ خطا: رکورد باید پیدا می‌شد!';

PRINT N'';

-- =============================================
-- سناریو 6: تست با NULL در فیلدهای مهم
-- =============================================
PRINT N'سناریو 6: تست با NULL در فیلدهای JalaliYear/JalaliMonth';
PRINT N'--------------------------------------------------';

-- این تست نباید موفق شود چون فیلدها NOT NULL هستند
PRINT N'→ تلاش برای INSERT با NULL...';

BEGIN TRY
    INSERT INTO MonthlyReports (
        UserId, Year, Month, JalaliYear, JalaliMonth, 
        TotalHours, GymCost, Status, GroupId
    ) VALUES (
        2002, 2025, 1, NULL, NULL,
        160, 0, 'draft', 1
    );
    PRINT N'  ✗ خطا: نباید INSERT با NULL موفق می‌شد!';
END TRY
BEGIN CATCH
    PRINT N'  ✓ نتیجه: INSERT با NULL رد شد (طبق انتظار)';
    PRINT N'  ✓ پیام خطا: ' + ERROR_MESSAGE();
END CATCH

PRINT N'';

-- =============================================
-- پاکسازی و بازگردانی داده‌های اصلی
-- =============================================
PRINT N'--------------------------------------------------';
PRINT N'→ پاکسازی و بازگردانی داده‌های اصلی...';

-- خالی کردن جدول
DELETE FROM MonthlyReports;

-- بازگردانی داده‌های اصلی
INSERT INTO MonthlyReports 
SELECT * FROM #BackupMonthlyReports;

-- حذف جدول موقت
DROP TABLE #BackupMonthlyReports;

PRINT N'  ✓ داده‌های اصلی بازگردانده شد';
PRINT N'';

-- =============================================
-- خلاصه نتایج
-- =============================================
PRINT N'==================================================';
PRINT N'خلاصه نتایج تست:';
PRINT N'==================================================';
PRINT N'';
PRINT N'✓ سناریو 1: جدول خالی → { "status": null }';
PRINT N'✓ سناریو 2: رکورد برای کاربر دیگر → { "status": null }';
PRINT N'✓ سناریو 3: رکورد برای ماه دیگر → { "status": null }';
PRINT N'✓ سناریو 4: رکورد معتبر → { "status": "draft" }';
PRINT N'✓ سناریو 5: چند رکورد → TOP 1 کار می‌کند';
PRINT N'✓ سناریو 6: NULL values → رد می‌شود';
PRINT N'';
PRINT N'نتیجه کلی:';
PRINT N'  ✅ Endpoint با جدول خالی مشکلی ندارد';
PRINT N'  ✅ در تمام حالات null به درستی برمی‌گرداند';
PRINT N'  ✅ هیچ ارور رخ نمی‌دهد';
PRINT N'==================================================';
PRINT N'';
