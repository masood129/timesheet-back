-- این اسکریپت باید در دیتابیس 'flutter' اجرا شود (که برنامه شما از آن استفاده می‌کند).
-- فرض بر این است که دیتابیس 'UMD' روی همان instance SQL Server وجود دارد و دسترسی لازم (SELECT, INSERT, UPDATE, DELETE) از flutter به UMD داده شده است.
-- اگر دسترسی وجود ندارد، ابتدا با GRANT یا Linked Server تنظیم کنید (مثلاً: EXEC sp_addlinkedserver 'UMD'; اما اینجا ساده نگه می‌داریم).
-- VIEWها با نام‌های دقیق جدول‌های اسکیمای اصلی (مثل Users, Groups) ایجاد می‌شوند تا برنامه بدون تغییر کار کند.
-- این VIEWها داده‌ها را از جدول‌های قدیمی در UMD می‌خوانند و به فرمت مورد نیاز مپ می‌کنند (بر اساس ساختار فایل db-schema.sql.txt، اما PasswordHash حذف شده).
-- جدول‌های فیزیکی دیگر (مثل DailyDetails, MonthlyReports و غیره) را همان‌طور فیزیکی در flutter می‌سازیم، چون داده‌ای در UMD ندارند.
-- FOREIGN KEYها به VIEWها اشاره می‌کنند (در SQL Server مجاز است، اما برای عملیات نوشتاری، تریگرها مدیریت می‌کنند).
-- ستون PasswordHash از VIEW Users حذف شده (طبق درخواست).
-- برای عملیات INSERT/UPDATE/DELETE روی VIEWها، INSTEAD OF triggers اضافه شده تا عملیات به جدول‌های زیرین در UMD هدایت شوند.
-- نام دیتابیس‌ها (flutter و UMD) و نام جدول‌های قدیمی (users, groups, projects, groupManagers) بدون تغییر نگه داشته شده.
-- ساختار ستون‌ها بر اساس فایل db-schema.sql.txt است، اما فقط ستون‌های ضروری در VIEWها مپ شده (فیلدهای اضافی در جداول قدیمی حفظ می‌شوند اما در VIEW نمایش داده نمی‌شوند مگر نیاز).

-- ابتدا جدول‌های فیزیکی اسکیمای اصلی که VIEW نیستند (بدون تغییرات، بر اساس db-schema.sql.txt)
CREATE TABLE UserProjectAccess (
                                   UserId INT NOT NULL,
                                   ProjectId INT NOT NULL,
                                   PRIMARY KEY (UserId, ProjectId),
                                   FOREIGN KEY (UserId) REFERENCES Users(UserId),  -- به VIEW Users اشاره می‌کند
                                   FOREIGN KEY (ProjectId) REFERENCES Projects(Id)
);

CREATE TABLE UserContractHours (
                                   UserId INT PRIMARY KEY,
                                   ContractArrivalTime NVARCHAR(8) NULL,
                                   ContractLeaveTime NVARCHAR(8) NOT NULL,
                                   MinMonthlyHours INT NOT NULL,
                                   FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

CREATE TABLE DailyDetails (
                              Id INT PRIMARY KEY IDENTITY(1,1),
                              Date DATE NOT NULL,
                              UserId INT NOT NULL,
                              ArrivalTime NVARCHAR(8) NULL,
                              LeaveTime NVARCHAR(8) NULL,
                              PersonalTime INT NULL, -- در دقیقه
                              Description NVARCHAR(500) NULL,
                              GoCost INT NULL,
                              ReturnCost INT NULL,
                              LeaveType NVARCHAR(50) NULL,
                              FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

CREATE TABLE DailyProjectTasks (
                                   Id INT PRIMARY KEY IDENTITY(1,1),
                                   Date DATE NOT NULL,
                                   UserId INT NOT NULL,
                                   ProjectId INT NOT NULL,
                                   Duration INT NOT NULL, -- در دقیقه
                                   Description NVARCHAR(500) NULL,
                                   FOREIGN KEY (UserId) REFERENCES Users(UserId),
                                   FOREIGN KEY (ProjectId) REFERENCES Projects(Id)
);

CREATE TABLE DailyPersonalCarCosts (
                                       Date DATE NOT NULL,
                                       UserId INT NOT NULL,
                                       ProjectId INT NOT NULL,
                                       Kilometers INT NULL,
                                       Cost INT NULL,
                                       Description NVARCHAR(MAX) NULL,
                                       PRIMARY KEY (Date, UserId, ProjectId),
                                       FOREIGN KEY (UserId) REFERENCES Users(UserId),
                                       FOREIGN KEY (ProjectId) REFERENCES Projects(Id)
);

CREATE TABLE MonthlyGymCosts (
                                 Id INT PRIMARY KEY IDENTITY(1,1),
                                 UserId INT NOT NULL,
                                 Year INT NOT NULL,
                                 Month INT NOT NULL CHECK (Month BETWEEN 1 AND 12),
                                 Cost INT NOT NULL,
                                 GymHours INT NULL, -- تعداد ساعات ورزش در ماه
                                 Description NVARCHAR(500) NULL,
                                 FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

CREATE TABLE MonthlyReports (
                                ReportId INT PRIMARY KEY IDENTITY(1,1),
                                UserId INT NOT NULL,
                                Year INT NOT NULL,
                                Month INT NOT NULL CHECK (Month BETWEEN 1 AND 12),
                                JalaliYear INT NOT NULL,
                                JalaliMonth INT NOT NULL CHECK (JalaliMonth BETWEEN 1 AND 12),
                                TotalHours INT NOT NULL,
                                GymCost INT NOT NULL,
                                Status NVARCHAR(50) NOT NULL CHECK (Status IN ('draft', 'submitted_to_group_manager', 'submitted_to_general_manager', 'submitted_to_finance', 'approved')),
                                GroupId INT NULL,
                                GeneralManagerStatus NVARCHAR(50) NULL DEFAULT 'pending' CHECK (GeneralManagerStatus IN ('pending', 'approved_by_general_manager')),
                                ManagerComment NVARCHAR(500) NULL,
                                FinanceComment NVARCHAR(500) NULL,
                                SubmittedAt DATETIME NULL,
                                ApprovedAt DATETIME NULL,
                                FOREIGN KEY (UserId) REFERENCES Users(UserId),
                                FOREIGN KEY (GroupId) REFERENCES Groups(GroupId)
);

-- ایندکس‌ها برای بهینه‌سازی کوئری‌ها (بر اساس db-schema.sql.txt)
CREATE INDEX IX_DailyDetails_Date_UserId ON DailyDetails(Date, UserId);
CREATE INDEX IX_DailyProjectTasks_Date_UserId ON DailyProjectTasks(Date, UserId);
CREATE INDEX IX_MonthlyReports_Year_Month ON MonthlyReports(Year, Month);
CREATE INDEX IX_MonthlyReports_JalaliYear_JalaliMonth ON MonthlyReports(JalaliYear, JalaliMonth);

-- حالا VIEWها با نام‌های اصلی جدول‌ها، که از دیتابیس UMD داده می‌کشند (PasswordHash حذف شده)
-- ویو برای Users (از جدول users در UMD و groupManagers برای تعیین Role، بدون PasswordHash)
CREATE VIEW Users AS
SELECT 
    u.personalid AS UserId,
    u.id AS Username,  -- یوزرنیم = id
    CASE 
        WHEN gm.personalId IS NOT NULL THEN 'group_manager'  -- اگر در groupManagers باشد، نقش مدیر گروه
        ELSE 'user'  -- پیش‌فرض کاربر عادی (برای نقش‌های دیگر مثل general_manager, finance_manager, admin شرط اضافه کنید اگر داده‌ای دارید)
    END AS Role
FROM UMD.dbo.users u
LEFT JOIN UMD.dbo.groupManagers gm ON u.personalid = gm.personalId
WHERE u.IsActive = 1;  -- فقط کاربران فعال

-- ویو برای Groups (مستقیم از جدول groups در UMD)
CREATE VIEW Groups AS
SELECT 
    g.id AS GroupId,
    g.groupname AS GroupName,
    g.managerID AS ManagerId  -- مدیر = کد پرسنلی (مپ به UserId)
FROM UMD.dbo.groups g;

-- ویو برای UserGroup (از فیلدهای groupid و personalid در users در UMD)
CREATE VIEW UserGroup AS
SELECT 
    u.personalid AS UserId,
    u.groupid AS GroupId
FROM UMD.dbo.users u
WHERE u.groupid IS NOT NULL AND u.IsActive = 1;  -- فقط کاربران فعال با گروه

-- ویو برای Projects (مستقیم از جدول projects در UMD)
CREATE VIEW Projects AS
SELECT 
    p.id AS Id,
    p.projectName AS ProjectName,
    1 AS securityLevel  -- فیک/پیش‌فرض، چون داده‌ای ندارد (می‌توان تغییر داد)
FROM UMD.dbo.projects p;

-- ویو اضافی برای groupManagers اگر نیاز باشد (اما در اسکیمای اصلی نیست؛ اختیاری)
CREATE VIEW GroupManagers AS
SELECT 
    gm.personalId,
    gm.firstname,
    gm.lastname,
    gm.email,
    gm.groupname
FROM UMD.dbo.groupManagers gm;

-- اضافه کردن INSTEAD OF triggers برای عملیات INSERT, UPDATE, DELETE روی VIEWها
-- این تریگرها اجازه می‌دهند برنامه INSERT/UPDATE/DELETE روی VIEWها انجام دهد، و عملیات به جدول‌های زیرین در UMD هدایت شود.
-- برای Users: Role محاسبه‌ای است، پس برای INSERT/UPDATE اگر Role='group_manager' باشد، به groupManagers اضافه/بروزرسانی می‌کند.
-- فیلدهای اضافی در users (مثل farsifirstname) در تریگرها مدیریت نشده (فرض بر این که اپ فقط ستون‌های VIEW را استفاده می‌کند؛ اگر نیاز باشد، فیلدهای پیش‌فرض بگذارید یا شرط اضافه کنید).

-- تریگرها برای VIEW Users
CREATE TRIGGER trg_InsteadOfInsert_Users
ON Users
INSTEAD OF INSERT
AS
BEGIN
    -- INSERT به users (فیلدهای اضافی پیش‌فرض یا از inserted مپ کنید اگر دارید)
    INSERT INTO UMD.dbo.users (personalid, id, IsActive /* اضافه فیلدهای دیگر اگر نیاز */)
    SELECT UserId, Username, 1 /* IsActive پیش‌فرض */ /* , farsifirstname=NULL, etc. */
    FROM inserted;

    -- اگر Role='group_manager'، به groupManagers اضافه کن
    INSERT INTO UMD.dbo.groupManagers (personalId /* , firstname, lastname, email, groupname اگر نیاز */)
    SELECT UserId /* , NULL, NULL, NULL, NULL */ 
    FROM inserted WHERE Role = 'group_manager';
END;

CREATE TRIGGER trg_InsteadOfUpdate_Users
ON Users
INSTEAD OF UPDATE
AS
BEGIN
    -- UPDATE users
    UPDATE u
    SET u.id = i.Username /* , دیگر فیلدها اگر مپ شوند */
    FROM UMD.dbo.users u
    INNER JOIN inserted i ON u.personalid = i.UserId;

    -- مدیریت Role: اگر Role تغییر کرد، groupManagers را بروزرسانی کن
    -- حذف اگر Role != 'group_manager'
    DELETE gm
    FROM UMD.dbo.groupManagers gm
    INNER JOIN inserted i ON gm.personalId = i.UserId
    WHERE i.Role != 'group_manager';

    -- اضافه اگر Role = 'group_manager' و وجود ندارد
    INSERT INTO UMD.dbo.groupManagers (personalId /* , دیگر فیلدها */)
    SELECT i.UserId /* , NULL, etc. */
    FROM inserted i
    LEFT JOIN UMD.dbo.groupManagers gm ON i.UserId = gm.personalId
    WHERE i.Role = 'group_manager' AND gm.personalId IS NULL;
END;

CREATE TRIGGER trg_InsteadOfDelete_Users
ON Users
INSTEAD OF DELETE
AS
BEGIN
    -- DELETE از users (و groupManagers اگر مرتبط)
    DELETE gm
    FROM UMD.dbo.groupManagers gm
    INNER JOIN deleted d ON gm.personalId = d.UserId;

    DELETE u
    FROM UMD.dbo.users u
    INNER JOIN deleted d ON u.personalid = d.UserId;
END;

-- تریگرها برای VIEW Groups
CREATE TRIGGER trg_InsteadOfInsert_Groups
ON Groups
INSTEAD OF INSERT
AS
BEGIN
    INSERT INTO UMD.dbo.groups (id, groupname, managerID)
    SELECT GroupId, GroupName, ManagerId
    FROM inserted;
END;

CREATE TRIGGER trg_InsteadOfUpdate_Groups
ON Groups
INSTEAD OF UPDATE
AS
BEGIN
    UPDATE g
    SET g.groupname = i.GroupName,
        g.managerID = i.ManagerId
    FROM UMD.dbo.groups g
    INNER JOIN inserted i ON g.id = i.GroupId;
END;

CREATE TRIGGER trg_InsteadOfDelete_Groups
ON Groups
INSTEAD OF DELETE
AS
BEGIN
    DELETE g
    FROM UMD.dbo.groups g
    INNER JOIN deleted d ON g.id = d.GroupId;
END;

-- تریگرها برای VIEW UserGroup (این VIEW از users استخراج می‌شود، پس UPDATE groupid در users)
CREATE TRIGGER trg_InsteadOfInsert_UserGroup
ON UserGroup
INSTEAD OF INSERT
AS
BEGIN
    -- UPDATE groupid در users (فرض بر یک گروه per کاربر؛ اگر چندتا، منطق تغییر دهید)
    UPDATE u
    SET u.groupid = i.GroupId
    FROM UMD.dbo.users u
    INNER JOIN inserted i ON u.personalid = i.UserId;
END;

CREATE TRIGGER trg_InsteadOfUpdate_UserGroup
ON UserGroup
INSTEAD OF UPDATE
AS
BEGIN
    -- مشابه INSERT، groupid را بروزرسانی
    UPDATE u
    SET u.groupid = i.GroupId
    FROM UMD.dbo.users u
    INNER JOIN inserted i ON u.personalid = i.UserId;
END;

CREATE TRIGGER trg_InsteadOfDelete_UserGroup
ON UserGroup
INSTEAD OF DELETE
AS
BEGIN
    -- پاک کردن groupid در users
    UPDATE u
    SET u.groupid = NULL
    FROM UMD.dbo.users u
    INNER JOIN deleted d ON u.personalid = d.UserId;
END;

-- تریگرها برای VIEW Projects
CREATE TRIGGER trg_InsteadOfInsert_Projects
ON Projects
INSTEAD OF INSERT
AS
BEGIN
    INSERT INTO UMD.dbo.projects (id, projectName /* securityLevel فیک، پس ذخیره نمی‌شود */)
    SELECT Id, ProjectName
    FROM inserted;
END;

CREATE TRIGGER trg_InsteadOfUpdate_Projects
ON Projects
INSTEAD OF UPDATE
AS
BEGIN
    UPDATE p
    SET p.projectName = i.ProjectName /* securityLevel فیک، بروزرسانی نمی‌شود */
    FROM UMD.dbo.projects p
    INNER JOIN inserted i ON p.id = i.Id;
END;

CREATE TRIGGER trg_InsteadOfDelete_Projects
ON Projects
INSTEAD OF DELETE
AS
BEGIN
    DELETE p
    FROM UMD.dbo.projects p
    INNER JOIN deleted d ON p.id = d.Id;
END;

-- حالا برنامه می‌تواند بدون تغییر به Users, Groups و غیره کوئری بزند (SELECT, INSERT, UPDATE, DELETE)، اما داده‌ها از/به UMD می‌روند.
-- اگر FOREIGN KEYها مشکل ایجاد کنند (چون روی VIEW هستند)، می‌توانید CHECK CONSTRAINTها را با NOCHECK تعریف کنید یا منطق اپ را تنظیم کنید.
-- برای نقش‌های دیگر (مثل admin) در Role، شرط‌های بیشتری به VIEW و تریگرها اضافه کنید اگر داده‌ای دارید.