-- =============================================
-- خلاصه و راهنمای سریع نمونه‌های EOSDB
-- =============================================

/*
╔════════════════════════════════════════════════════════════════════════════╗
║                       🎯 خلاصه نمونه‌های EOSDB 🎯                          ║
╚════════════════════════════════════════════════════════════════════════════╝

📦 فایل‌های ایجاد شده:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  13-insert-advanced-test-data.sql
    📝 نمونه‌های پایه برای تست عمومی
    👥 کارمندان: 3001-3008 (8 نفر)
    📊 داده‌ها:
       • 26 دسترسی پروژه
       • 8 قرارداد کاری متنوع
       • 27 جزئیات روزانه
       • 65 وظیفه پروژه
       • 8 هزینه ماشین
       • 14 هزینه ورزشی
       • 10 گزارش ماهیانه
       • 5 بازه زمانی

2️⃣  14-insert-complex-scenarios.sql
    🔥 سناریوهای پیچیده و Edge Cases
    👥 کارمندان: 4001-4006 (6 نفر)
    🎬 سناریوها:
       • اضافه‌کاری سنگین (4001)
       • مرخصی بلند مدت (4002)
       • ماموریت برون شهری (4003)
       • Multi-tasking (4004)
       • تغییر قرارداد (4005)
       • دورکار منعطف (4006)

3️⃣  15-sample-queries.sql
    🔍 کوئری‌های آماده برای تست
    📈 10 کوئری تحلیلی:
       • محاسبه ساعات کاری
       • توزیع پروژه‌ها
       • هزینه‌های ماشین
       • وضعیت گزارش‌ها
       • تحلیل تأخیرات
       • و 5 مورد دیگر...

4️⃣  EOSDB-SAMPLES-README.md
    📚 مستندات کامل
    📖 شامل توضیحات تفصیلی همه نمونه‌ها

╔════════════════════════════════════════════════════════════════════════════╗
║                           🚀 شروع سریع                                     ║
╚════════════════════════════════════════════════════════════════════════════╝

📌 برای اجرای کامل همه نمونه‌ها:

-- مرحله 1: اجرا از SQL Server
USE EOSDB;
GO

-- مرحله 2: داده‌های پایه
:r 13-insert-advanced-test-data.sql

-- مرحله 3: سناریوهای پیچیده
:r 14-insert-complex-scenarios.sql

-- مرحله 4: تست کوئری‌ها
:r 15-sample-queries.sql


📌 یا از Command Line:

sqlcmd -S localhost -d EOSDB -i 13-insert-advanced-test-data.sql
sqlcmd -S localhost -d EOSDB -i 14-insert-complex-scenarios.sql
sqlcmd -S localhost -d EOSDB -i 15-sample-queries.sql


╔════════════════════════════════════════════════════════════════════════════╗
║                      🎯 نمونه‌های کاربردی                                 ║
╚════════════════════════════════════════════════════════════════════════════╝

🔸 نمونه 1: کارمند معمولی با کار منظم
   UserId: 3001
   قرارداد: تمام وقت (176 ساعت)
   ویژگی: حضور منظم، کار روی چند پروژه

🔸 نمونه 2: کارمند Part-time
   UserId: 3004
   قرارداد: نیمه وقت صبح (88 ساعت)
   ویژگی: 4 ساعت روزانه، پروژه‌های Frontend

🔸 نمونه 3: کارمند با اضافه کاری سنگین
   UserId: 4001
   قرارداد: تمام وقت
   ویژگی: شیفت شبانه، کار آخر هفته، 63 ساعت در هفته!

🔸 نمونه 4: کارمند با مرخصی
   UserId: 4002
   قرارداد: تمام وقت
   ویژگی: 10 روز مرخصی متوالی، بازگشت تدریجی

🔸 نمونه 5: کارمند ماموریتی
   UserId: 4003
   قرارداد: تمام وقت
   ویژگی: ماموریت 3 روزه اصفهان، 900 کیلومتر

🔸 نمونه 6: کارمند دورکار
   UserId: 4006
   قرارداد: دورکار (160 ساعت)
   ویژگی: ساعات کاری متغیر، شیفت شبانه


╔════════════════════════════════════════════════════════════════════════════╗
║                    📊 کوئری‌های پرکاربرد                                  ║
╚════════════════════════════════════════════════════════════════════════════╝

✅ مشاهده همه کارمندان نمونه:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

SELECT DISTINCT UserId 
FROM UserContractHours 
WHERE UserId >= 3001
ORDER BY UserId;

/*
✅ آمار کلی یک کارمند در یک ماه:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

SELECT 
    COUNT(*) AS TotalDays,
    COUNT(CASE WHEN LeaveType IS NULL THEN 1 END) AS WorkDays,
    COUNT(CASE WHEN LeaveType IS NOT NULL THEN 1 END) AS LeaveDays,
    SUM(CASE 
        WHEN ArrivalTime IS NOT NULL AND LeaveTime IS NOT NULL
        THEN DATEDIFF(MINUTE, CAST(ArrivalTime AS TIME), CAST(LeaveTime AS TIME))
        ELSE 0 
    END) / 60 AS TotalHours
FROM DailyDetails
WHERE UserId = 3001
    AND Date >= '2024-12-01'
    AND Date < '2025-01-01';

/*
✅ پروژه‌های یک کارمند:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

SELECT 
    ProjectId,
    COUNT(*) AS Tasks,
    SUM(Duration) / 60 AS TotalHours
FROM DailyProjectTasks
WHERE UserId = 3001
GROUP BY ProjectId
ORDER BY TotalHours DESC;

/*
✅ وضعیت گزارش‌های ماهیانه:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

SELECT 
    UserId,
    JalaliYear,
    JalaliMonth,
    TotalHours,
    Status,
    GeneralManagerStatus
FROM MonthlyReports
WHERE UserId >= 3001
ORDER BY JalaliYear DESC, JalaliMonth DESC, UserId;

/*
✅ کارمندان با بیشترین اضافه کاری:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

SELECT TOP 5
    dd.UserId,
    COUNT(DISTINCT dd.Date) AS WorkDays,
    SUM(DATEDIFF(MINUTE, 
        CAST(dd.ArrivalTime AS TIME), 
        CAST(dd.LeaveTime AS TIME)
    ) - ISNULL(dd.PersonalTime, 0)) / 60 AS TotalHours,
    uch.MinMonthlyHours AS RequiredHours,
    (SUM(DATEDIFF(MINUTE, 
        CAST(dd.ArrivalTime AS TIME), 
        CAST(dd.LeaveTime AS TIME)
    ) - ISNULL(dd.PersonalTime, 0)) / 60) - uch.MinMonthlyHours AS OvertimeHours
FROM DailyDetails dd
JOIN UserContractHours uch ON dd.UserId = uch.UserId
WHERE dd.UserId >= 3001
    AND dd.LeaveType IS NULL
    AND dd.ArrivalTime IS NOT NULL
    AND dd.LeaveTime IS NOT NULL
GROUP BY dd.UserId, uch.MinMonthlyHours
ORDER BY OvertimeHours DESC;

/*
✅ هزینه‌های ماشین به تفکیک کارمند:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

SELECT 
    UserId,
    COUNT(*) AS Trips,
    SUM(Kilometers) AS TotalKM,
    SUM(Cost) AS TotalCost,
    AVG(Cost) AS AvgCostPerTrip
FROM DailyPersonalCarCosts
WHERE UserId >= 3001
GROUP BY UserId
ORDER BY TotalCost DESC;


╔════════════════════════════════════════════════════════════════════════════╗
║                      🧹 پاک کردن نمونه‌ها                                 ║
╚════════════════════════════════════════════════════════════════════════════╝

⚠️  اگر می‌خواهید تمام نمونه‌ها را پاک کنید:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

-- پاک کردن کامل نمونه‌ها
/*
PRINT N'در حال پاک کردن نمونه‌ها...';

-- حذف به ترتیب وابستگی
DELETE FROM DailyProjectTasks WHERE UserId >= 3001;
PRINT N'✓ وظایف پروژه حذف شد';

DELETE FROM DailyPersonalCarCosts WHERE UserId >= 3001;
PRINT N'✓ هزینه‌های ماشین حذف شد';

DELETE FROM DailyDetails WHERE UserId >= 3001;
PRINT N'✓ جزئیات روزانه حذف شد';

DELETE FROM MonthlyGymCosts WHERE UserId >= 3001;
PRINT N'✓ هزینه‌های ورزش حذف شد';

DELETE FROM MonthlyReports WHERE UserId >= 3001;
PRINT N'✓ گزارش‌های ماهیانه حذف شد';

DELETE FROM UserProjectAccess WHERE UserId >= 3001;
PRINT N'✓ دسترسی‌های پروژه حذف شد';

DELETE FROM UserContractHours WHERE UserId >= 3001;
PRINT N'✓ قراردادهای کاری حذف شد';

DELETE FROM MonthPeriodSettings WHERE Year >= 1403;
PRINT N'✓ بازه‌های زمانی حذف شد';

PRINT N'✓✓✓ همه نمونه‌ها پاک شدند ✓✓✓';
*/


/*
╔════════════════════════════════════════════════════════════════════════════╗
║                      📋 چک‌لیست تست                                       ║
╚════════════════════════════════════════════════════════════════════════════╝

پس از اجرای نمونه‌ها، این موارد را تست کنید:

✅ Backend API Testing:
   □ GET /api/users/{userId}/monthly-hours
   □ GET /api/users/{userId}/projects
   □ GET /api/reports/monthly
   □ POST /api/daily-details
   □ PUT /api/daily-details/{id}

✅ Frontend Testing:
   □ نمایش لیست کارمندان
   □ نمایش جدول حضور و غیاب
   □ نمودار توزیع پروژه‌ها
   □ گزارش ماهیانه
   □ فرم ثبت جزئیات روزانه

✅ Database Testing:
   □ Constraints
   □ Triggers
   □ Foreign Keys
   □ Stored Procedures
   □ Performance

✅ Business Logic:
   □ محاسبه ساعات کاری
   □ اعتبارسنجی مرخصی‌ها
   □ محاسبه اضافه کاری
   □ گردش کار تاییدیه‌ها


╔════════════════════════════════════════════════════════════════════════════╗
║                    🎓 یادگیری با مثال                                     ║
╚════════════════════════════════════════════════════════════════════════════╝

📚 سناریوهای واقعی برای یادگیری:

1️⃣  چگونه اضافه کاری محاسبه می‌شود؟
    → ببینید کارمند 4001

2️⃣  مرخصی بلند مدت چگونه مدیریت می‌شود؟
    → ببینید کارمند 4002

3️⃣  ماموریت برون شهری چطور ثبت می‌شود؟
    → ببینید کارمند 4003

4️⃣  کار روی چند پروژه همزمان چطور است؟
    → ببینید کارمند 3003 و 4004

5️⃣  قرارداد Part-time چه تفاوتی دارد؟
    → ببینید کارمند 3004

6️⃣  دورکار چگونه مدیریت می‌شود؟
    → ببینید کارمند 4006


╔════════════════════════════════════════════════════════════════════════════╗
║                        ⚙️ تنظیمات پیشرفته                                 ║
╚════════════════════════════════════════════════════════════════════════════╝

🔧 اضافه کردن کارمند جدید:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

-- قرارداد کاری
INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours)
VALUES (5001, '08:00:00', '17:00:00', 176);

-- دسترسی به پروژه‌ها
INSERT INTO UserProjectAccess (UserId, ProjectId)
VALUES (5001, 100), (5001, 101);

-- روز کاری
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost)
VALUES (GETDATE(), 5001, '08:05:00', '17:10:00', 45, N'روز عادی', 50000, 50000);

-- وظیفه پروژه
INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
VALUES (GETDATE(), 5001, 100, 240, N'توسعه Feature جدید');

/*
🔧 ایجاد بازه زمانی جدید:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

EXEC sp_GetMonthPeriod @Year = 1404, @Month = 3;

-- یا ایجاد سفارشی
INSERT INTO MonthPeriodSettings (Year, Month, StartDay, StartMonth, StartYear, EndDay, EndMonth, EndYear)
VALUES (1404, 3, 26, 2, 1404, 25, 3, 1404);


/*
╔════════════════════════════════════════════════════════════════════════════╗
║                      💡 نکات و ترفندها                                    ║
╚════════════════════════════════════════════════════════════════════════════╝

💡 نکته 1: استفاده از Transaction
   برای اجرای ایمن نمونه‌ها:
   
   BEGIN TRANSACTION;
   -- اجرای اسکریپت‌ها
   -- بررسی نتایج
   COMMIT;  -- یا ROLLBACK اگر مشکلی بود

💡 نکته 2: بررسی اطلاعات موجود
   قبل از اجرا، چک کنید UserID تکراری نداشته باشید:
   
   SELECT * FROM UserContractHours WHERE UserId BETWEEN 3001 AND 5000;

💡 نکته 3: Backup
   قبل از اجرا، حتماً Backup بگیرید:
   
   BACKUP DATABASE EOSDB TO DISK = 'C:\Backup\EOSDB_BeforeSamples.bak';

💡 نکته 4: Performance
   برای تست Performance با داده زیاد:
   - نمونه‌ها را چند بار با UserID های متفاوت اجرا کنید
   - از WHILE loop استفاده کنید


╔════════════════════════════════════════════════════════════════════════════╗
║                        📞 پشتیبانی                                        ║
╚════════════════════════════════════════════════════════════════════════════╝

❓ سوالات متداول:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Q: نمونه‌ها را در Production استفاده کنم؟
A: ❌ خیر! فقط Development و Testing

Q: چگونه نمونه‌های بیشتر اضافه کنم؟
A: از الگوی همین فایل‌ها استفاده کنید

Q: می‌توانم UserID ها را تغییر دهم؟
A: ✅ بله، اما مراقب تداخل با داده‌های واقعی باشید

Q: این نمونه‌ها با UMD چه تفاوتی دارند؟
A: نمونه‌های UMD برای جداول پایه (Users, Groups, Projects)
   نمونه‌های EOSDB برای جداول Timesheet


📧 تماس با ما:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Email: dev@company.ir
Slack: #timesheet-dev
تلگرام: @timesheet_support


╔════════════════════════════════════════════════════════════════════════════╗
║              🎉 موفق باشید! 🎉                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

این نمونه‌ها با ❤️ برای تیم توسعه Timesheet آماده شده‌اند.

نسخه: 1.0.0
تاریخ: 1403/09/22
توسعه‌دهنده: Timesheet Team

*/
