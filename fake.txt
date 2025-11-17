-- این اسکریپت باید در دیتابیس 'UMD' اجرا شود (که جدول‌های قدیمی شما در آن قرار دارند).
-- ابتدا جدول‌های قدیمی را بر اساس توصیف شما ایجاد می‌کنیم (اگر از قبل وجود دارند، می‌توانید DROP TABLE اضافه کنید یا نادیده بگیرید).
-- ساختار جدول‌ها دقیقاً بر اساس توضیح شما (از پیام اولیه) تعریف شده: users, projects, groups, groupManagers.
-- سپس دیتای فیک (نمونه) INSERT می‌کنیم برای تست.
-- این داده‌ها برای تست VIEWها در دیتابیس flutter مناسب هستند (بعد از اجرا، VIEWها در flutter داده‌ها را از اینجا می‌خوانند).
-- فرض بر این است که personalid, id و غیره INT هستند، اما می‌توانید انواع را تنظیم کنید اگر نیاز باشد.
-- IsActive به عنوان BIT (0/1) تعریف شده.

-- ایجاد جدول users
CREATE TABLE users (
    personalid INT PRIMARY KEY,  -- کد پرسنلی
    farsifirstname NVARCHAR(100) NOT NULL,  -- نام
    farsilastname NVARCHAR(100) NOT NULL,  -- نام خانوادگی
    email NVARCHAR(256) NULL,  -- ایمیل
    id NVARCHAR(100) NOT NULL UNIQUE,  -- یوزرنیم (id)
    directAdmin NVARCHAR(200) NULL,  -- نام نام خانوادگی مدیر مستقیم
    groups NVARCHAR(100) NULL,  -- نام گروه (این فیلد ممکن است redundant با groupid باشد، اما نگه داشته شده)
    IsActive BIT NOT NULL DEFAULT 1,  -- بیت فعال بودن
    directAdminid INT NULL,  -- کدپرسنلی مدیر گروه
    groupid INT NULL  -- کد گروه
);

-- ایجاد جدول projects
CREATE TABLE projects (
    id INT PRIMARY KEY,  -- کد پروژه
    projectName NVARCHAR(100) NOT NULL  -- نام پروژه
);

-- ایجاد جدول groups
CREATE TABLE groups (
    id INT PRIMARY KEY,  -- کد گروه
    groupname NVARCHAR(100) NOT NULL UNIQUE,  -- نام گروه
    managerID INT NOT NULL  -- کدپرسنلی مدیر گروه
);

-- ایجاد جدول groupManagers
CREATE TABLE groupManagers (
    personalId INT PRIMARY KEY,  -- کد پرسنلی مدیرگروه
    firstname NVARCHAR(100) NOT NULL,  -- نام
    lastname NVARCHAR(100) NOT NULL,  -- نام خانوادگی
    email NVARCHAR(256) NULL,  -- ایمیل
    groupname NVARCHAR(100) NOT NULL  -- نام گروه
);

-- حالا INSERT دیتای فیک (نمونه) برای تست
-- کاربران (users): 4 رکورد نمونه (2 کاربر عادی، 1 مدیر گروه، 1 مدیر کل فرضی)
INSERT INTO users (personalid, farsifirstname, farsilastname, email, id, directAdmin, groups, IsActive, directAdminid, groupid)
VALUES
    (1001, N'علی', N'احمدی', 'ali.ahmad@example.com', 'ali_ahmad', N'محمد محمدی', N'گروه مهندسی', 1, 1002, 1),
    (1002, N'محمد', N'محمدی', 'mohammad.mohammadi@example.com', 'mohammad_moh', N'ندارد', N'گروه مدیریت', 1, NULL, 2),
    (1003, N'فاطمه', N'رضایی', 'fateme.rezaei@example.com', 'fateme_rez', N'علی احمدی', N'گروه مهندسی', 1, 1001, 1),
    (1004, N'حسین', N'حسینی', 'hossein.hosseini@example.com', 'hossein_hos', N'محمد محمدی', N'گروه توسعه', 0, 1002, 3);  -- غیرفعال برای تست

-- پروژه‌ها (projects): 3 رکورد نمونه
INSERT INTO projects (id, projectName)
VALUES
    (2001, N'پروژه هوش مصنوعی'),
    (2002, N'پروژه وب اپ'),
    (2003, N'پروژه موبایل');

-- گروه‌ها (groups): 3 رکورد نمونه
INSERT INTO groups (id, groupname, managerID)
VALUES
    (1, N'گروه مهندسی', 1002),  -- مدیر: 1002
    (2, N'گروه مدیریت', 1002),
    (3, N'گروه توسعه', 1001);

-- مدیران گروه (groupManagers): 2 رکورد نمونه (مطابق با نقش مدیر گروه)
INSERT INTO groupManagers (personalId, firstname, lastname, email, groupname)
VALUES
    (1002, N'محمد', N'محمدی', 'mohammad.mohammadi@example.com', N'گروه مدیریت'),
    (1001, N'علی', N'احمدی', 'ali.ahmad@example.com', N'گروه مهندسی');

-- حالا برای تست: بعد از اجرا این اسکریپت در UMD، در دیتابیس flutter کوئری SELECT * FROM Users; را بزنید تا ببینید داده‌ها از UMD خوانده می‌شوند.
-- مثلاً در Users VIEW: UserId=personalid, Username=id, Role بر اساس حضور در groupManagers محاسبه می‌شود (برای 1001 و 1002 'group_manager'، برای دیگران 'user').
-- اگر نیاز به داده‌های بیشتر یا تنظیم دارید، جزئیات بدهید.