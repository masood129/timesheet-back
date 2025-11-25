-- =============================================
-- درج داده‌های تستی برای جدول‌های پایه UMD
-- =============================================
-- این اسکریپت برای INSERT داده‌های نمونه (تستی) در جدول‌های موجود UMD است
-- شامل: users, projects, groups, groupManagers
-- ⚠️ توجه: این داده‌ها فقط برای تست هستند
-- =============================================

USE UMD;
GO

-- =============================================
-- INSERT داده‌های تستی برای جدول groups
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول groups...';
INSERT INTO groups (id, groupname, managerID)
VALUES
    (1, N'گروه مهندسی نرم‌افزار', 1002),
    (2, N'گروه مدیریت پروژه', 1002),
    (3, N'گروه توسعه موبایل', 1001),
    (4, N'گروه زیرساخت و DevOps', 1005),
    (5, N'گروه طراحی UI/UX', 1003);
GO
PRINT N'✓ 5 گروه درج شد';

-- =============================================
-- INSERT داده‌های تستی برای جدول groupManagers
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول groupManagers...';
INSERT INTO groupManagers (personalId, firstname, lastname, email, groupname)
VALUES
    (1001, N'علی', N'احمدی', 'ali.ahmadi@company.ir', N'گروه توسعه موبایل'),
    (1002, N'محمد', N'محمدی', 'mohammad.mohammadi@company.ir', N'گروه مهندسی نرم‌افزار'),
    (1003, N'سارا', N'رضایی', 'sara.rezaei@company.ir', N'گروه طراحی UI/UX'),
    (1005, N'رضا', N'کریمی', 'reza.karimi@company.ir', N'گروه زیرساخت و DevOps');
GO
PRINT N'✓ 4 مدیر گروه درج شد';

-- =============================================
-- INSERT داده‌های تستی برای جدول users
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول users...';
INSERT INTO users (personalid, farsifirstname, farsilastname, email, id, directAdmin, groups, IsActive, directAdminid, groupid)
VALUES
    -- مدیران گروه
    (1001, N'علی', N'احمدی', 'ali.ahmadi@company.ir', 'ali.ahmadi', N'ندارد', N'گروه توسعه موبایل', 1, NULL, 3),
    (1002, N'محمد', N'محمدی', 'mohammad.mohammadi@company.ir', 'mohammad.mohammadi', N'ندارد', N'گروه مهندسی نرم‌افزار', 1, NULL, 1),
    (1003, N'سارا', N'رضایی', 'sara.rezaei@company.ir', 'sara.rezaei', N'ندارد', N'گروه طراحی UI/UX', 1, NULL, 5),
    (1005, N'رضا', N'کریمی', 'reza.karimi@company.ir', 'reza.karimi', N'ندارد', N'گروه زیرساخت و DevOps', 1, NULL, 4),
    
    -- کاربران عادی - گروه مهندسی نرم‌افزار
    (2001, N'فاطمه', N'حسینی', 'fateme.hosseini@company.ir', 'fateme.hosseini', N'محمد محمدی', N'گروه مهندسی نرم‌افزار', 1, 1002, 1),
    (2002, N'حسین', N'نوری', 'hossein.nouri@company.ir', 'hossein.nouri', N'محمد محمدی', N'گروه مهندسی نرم‌افزار', 1, 1002, 1),
    (2003, N'زهرا', N'عباسی', 'zahra.abbasi@company.ir', 'zahra.abbasi', N'محمد محمدی', N'گروه مهندسی نرم‌افزار', 1, 1002, 1),
    
    -- کاربران عادی - گروه مدیریت پروژه
    (2004, N'امیر', N'شایعی', 'amir.shayei@company.ir', 'amir.shayei', N'محمد محمدی', N'گروه مدیریت پروژه', 1, 1002, 2),
    (2005, N'مریم', N'قاسمی', 'maryam.ghasemi@company.ir', 'maryam.ghasemi', N'محمد محمدی', N'گروه مدیریت پروژه', 1, 1002, 2),
    
    -- کاربران عادی - گروه توسعه موبایل
    (2006, N'مهدی', N'جلالی', 'mehdi.jalali@company.ir', 'mehdi.jalali', N'علی احمدی', N'گروه توسعه موبایل', 1, 1001, 3),
    (2007, N'نازنین', N'مرادی', 'nazanin.moradi@company.ir', 'nazanin.moradi', N'علی احمدی', N'گروه توسعه موبایل', 1, 1001, 3),
    (2008, N'پیمان', N'فتحی', 'peyman.fathi@company.ir', 'peyman.fathi', N'علی احمدی', N'گروه توسعه موبایل', 1, 1001, 3),
    
    -- کاربران عادی - گروه زیرساخت و DevOps
    (2009, N'سمیرا', N'باقری', 'samira.bagheri@company.ir', 'samira.bagheri', N'رضا کریمی', N'گروه زیرساخت و DevOps', 1, 1005, 4),
    (2010, N'کامران', N'صادقی', 'kamran.sadeghi@company.ir', 'kamran.sadeghi', N'رضا کریمی', N'گروه زیرساخت و DevOps', 1, 1005, 4),
    
    -- کاربران عادی - گروه طراحی UI/UX
    (2011, N'الهام', N'موسوی', 'elham.mousavi@company.ir', 'elham.mousavi', N'سارا رضایی', N'گروه طراحی UI/UX', 1, 1003, 5),
    (2012, N'بهزاد', N'رحیمی', 'behzad.rahimi@company.ir', 'behzad.rahimi', N'سارا رضایی', N'گروه طراحی UI/UX', 1, 1003, 5),
    
    -- کاربر غیرفعال (برای تست)
    (2013, N'جواد', N'احمدزاده', 'javad.ahmadzadeh@company.ir', 'javad.ahmadzadeh', N'محمد محمدی', N'گروه مهندسی نرم‌افزار', 0, 1002, 1);
GO
PRINT N'✓ 17 کاربر درج شد (16 فعال + 1 غیرفعال)';

-- =============================================
-- INSERT داده‌های تستی برای جدول projects
-- =============================================
PRINT N'→ درج داده‌های تستی در جدول projects...';
INSERT INTO projects (id, projectName)
VALUES
    (100, N'پروژه سیستم مدیریت تایم‌شیت'),
    (101, N'پروژه اپلیکیشن موبایل بانکداری'),
    (102, N'پروژه وب‌سایت فروشگاهی'),
    (103, N'پروژه سیستم مدیریت انبار'),
    (104, N'پروژه پلتفرم یادگیری آنلاین'),
    (105, N'پروژه داشبورد تحلیل داده'),
    (106, N'پروژه سیستم CRM'),
    (107, N'پروژه اپلیکیشن رزرو هتل'),
    (108, N'پروژه چت‌بات هوش مصنوعی'),
    (109, N'پروژه سیستم مدیریت دارایی');
GO
PRINT N'✓ 10 پروژه درج شد';

-- =============================================
-- خلاصه
-- =============================================
PRINT N'';
PRINT N'========================================';
PRINT N'خلاصه داده‌های تستی:';
PRINT N'  • گروه‌ها: ' + CAST((SELECT COUNT(*) FROM groups) AS NVARCHAR(10));
PRINT N'  • مدیران گروه: ' + CAST((SELECT COUNT(*) FROM groupManagers) AS NVARCHAR(10));
PRINT N'  • کاربران فعال: ' + CAST((SELECT COUNT(*) FROM users WHERE IsActive = 1) AS NVARCHAR(10));
PRINT N'  • پروژه‌ها: ' + CAST((SELECT COUNT(*) FROM projects) AS NVARCHAR(10));
PRINT N'========================================';
PRINT N'';
PRINT N'مرحله بعدی: اجرای 04-insert-app-test-data.sql';
GO
