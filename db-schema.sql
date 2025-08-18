-- ایجاد جدول Users برای مدیریت کاربران
CREATE TABLE Users (
                       UserId INT PRIMARY KEY IDENTITY(1,1),
                       Username NVARCHAR(100) NOT NULL UNIQUE,
                       PasswordHash NVARCHAR(256) NOT NULL,
                       Role NVARCHAR(50) NOT NULL CHECK (Role IN ('user', 'group_manager', 'general_manager', 'finance_manager', 'admin'))
);

-- ایجاد جدول Groups برای مدیریت گروه‌ها
CREATE TABLE Groups (
                        GroupId INT PRIMARY KEY IDENTITY(1,1),
                        GroupName NVARCHAR(100) NOT NULL UNIQUE,
                        ManagerId INT NOT NULL,
                        FOREIGN KEY (ManagerId) REFERENCES Users(UserId)
);

-- ایجاد جدول UserGroup برای تخصیص کاربران به گروه‌ها
CREATE TABLE UserGroup (
                           UserId INT NOT NULL,
                           GroupId INT NOT NULL,
                           PRIMARY KEY (UserId, GroupId),
                           FOREIGN KEY (UserId) REFERENCES Users(UserId),
                           FOREIGN KEY (GroupId) REFERENCES Groups(GroupId)
);

-- ایجاد جدول Projects برای مدیریت پروژه‌ها
CREATE TABLE Projects (
                          Id INT PRIMARY KEY,
                          ProjectName NVARCHAR(100) NOT NULL,
                          securityLevel INT NOT NULL
);

-- ایجاد جدول UserProjectAccess برای مدیریت دسترسی کاربران به پروژه‌ها
CREATE TABLE UserProjectAccess (
                                   UserId INT NOT NULL,
                                   ProjectId INT NOT NULL,
                                   PRIMARY KEY (UserId, ProjectId),
                                   FOREIGN KEY (UserId) REFERENCES Users(UserId),
                                   FOREIGN KEY (ProjectId) REFERENCES Projects(Id)
);

-- ایجاد جدول UserContractHours برای قراردادهای کاربران
CREATE TABLE UserContractHours (
                                   UserId INT PRIMARY KEY,
                                   ContractArrivalTime NVARCHAR(8) NULL,
                                   ContractLeaveTime NVARCHAR(8) NOT NULL,
                                   MinMonthlyHours INT NOT NULL,
                                   FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- ایجاد جدول DailyDetails برای جزئیات روزانه
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

-- ایجاد جدول DailyProjectTasks برای وظایف پروژه روزانه
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

-- ایجاد جدول DailyPersonalCarCosts برای هزینه‌های ماشین شخصی
CREATE TABLE DailyPersonalCarCosts (
                                       Id INT PRIMARY KEY IDENTITY(1,1),
                                       Date DATE NOT NULL,
                                       UserId INT NOT NULL,
                                       Cost INT NOT NULL,
                                       Description NVARCHAR(500) NULL,
                                       FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- ایجاد جدول MonthlyGymCosts برای هزینه‌های ماهیانه ورزش
CREATE TABLE MonthlyGymCosts (
                                 Id INT PRIMARY KEY IDENTITY(1,1),
                                 UserId INT NOT NULL,
                                 Year INT NOT NULL,
                                 Month INT NOT NULL CHECK (Month BETWEEN 1 AND 12),
                                 Cost INT NOT NULL,
                                 Description NVARCHAR(500) NULL,
                                 FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- ایجاد جدول MonthlyReports برای گزارش‌های ماهیانه
CREATE TABLE MonthlyReports (
                                ReportId INT PRIMARY KEY IDENTITY(1,1),
                                UserId INT NOT NULL,
                                Year INT NOT NULL,
                                Month INT NOT NULL CHECK (Month BETWEEN 1 AND 12),
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

-- داده‌های نمونه برای تست
-- کاربران
INSERT INTO Users (Username, PasswordHash, Role) VALUES
                                                     ('admin', 'hashed_admin', 'admin'),
                                                     ('manager1', 'hashed_manager', 'group_manager'),
                                                     ('finance1', 'hashed_finance', 'finance_manager'),
                                                     ('user1', 'hashed_user1', 'user'),
                                                     ('user2', 'hashed_user2', 'user'),
                                                     ('user001', 'hashed_user001', 'user'),
                                                     ('user002', 'hashed_user002', 'user'),
                                                     ('user003', 'hashed_user003', 'user'),
                                                     ('user004', 'hashed_user004', 'user'),
                                                     ('user005', 'hashed_user005', 'user'),
                                                     ('group_manager1', 'hashed_group_manager1', 'group_manager'),
                                                     ('general_manager1', 'hashed_general_manager1', 'general_manager'),
                                                     ('finance_manager1', 'hashed_finance_manager1', 'finance_manager');

-- گروه‌ها
INSERT INTO Groups (GroupName, ManagerId) VALUES
                                              ('GroupA', 11), -- group_manager1
                                              ('GroupB', 2);  -- manager1

-- تخصیص کاربران به گروه‌ها
INSERT INTO UserGroup (UserId, GroupId) VALUES
                                            (6, 1), -- user001 در GroupA
                                            (7, 1), -- user002 در GroupA
                                            (8, 2), -- user003 در GroupB
                                            (9, 2), -- user004 در GroupB
                                            (10, 1); -- user005 در GroupA

-- قراردادها
INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours) VALUES
                                                                                                    (4, NULL, '17:00:00', 160), -- user1
                                                                                                    (5, '08:30:00', '17:00:00', 180); -- user2

-- پروژه‌ها
INSERT INTO Projects (Id, ProjectName, securityLevel) VALUES
                                                          (1, N'پروژه الف', 1),
                                                          (2, N'پروژه ب', 2),
                                                          (3, 'P1000', 1),
                                                          (4, 'P1001', 1),
                                                          (5, 'P1002', 2),
                                                          (6, 'P1003', 2),
                                                          (7, 'P1004', 1),
                                                          (8, 'P1005', 3),
                                                          (9, 'P1006', 2),
                                                          (10, 'P1007', 1),
                                                          (11, 'P1008', 2),
                                                          (12, 'P1009', 3),
                                                          (13, 'P1010', 1),
                                                          (14, 'P1011', 2),
                                                          (15, 'P1012', 1),
                                                          (16, 'P1013', 3),
                                                          (17, 'P1014', 2),
                                                          (18, 'P1015', 1);

-- تخصیص دسترسی کاربران به پروژه‌ها
INSERT INTO UserProjectAccess (UserId, ProjectId) VALUES
-- user001
(6, 3), (6, 5), (6, 7), (6, 9), (6, 11),
-- user002
(7, 4), (7, 6), (7, 8), (7, 10),
-- user003
(8, 3), (8, 6), (8, 8), (8, 11), (8, 13), (8, 15),
-- user004
(9, 5), (9, 9), (9, 12),
-- user005
(10, 4), (10, 7), (10, 10), (10, 12), (10, 14), (10, 16), (10, 17), (10, 18);

-- جزئیات روزانه
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType) VALUES
                                                                                                                              ('2025-08-01', 4, '08:00:00', '17:00:00', 30, N'حضور در محل کار', 10000, 10000, NULL),
                                                                                                                              ('2025-08-02', 4, '08:30:00', '16:30:00', 0, N'حضور در محل کار', 10000, 10000, NULL),
                                                                                                                              ('2025-08-01', 5, '08:30:00', '17:00:00', 15, N'حضور در محل کار', 12000, 12000, NULL);

-- وظایف پروژه روزانه
INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description) VALUES
                                                                                   ('2025-08-01', 4, 1, 480, N'کار روی پروژه'), -- 8 ساعت
                                                                                   ('2025-08-02', 4, 2, 420, N'جلسه'), -- 7 ساعت
                                                                                   ('2025-08-01', 5, 1, 450, N'برنامه‌نویسی'); -- 7.5 ساعت

-- هزینه‌های ماشین شخصی
INSERT INTO DailyPersonalCarCosts (Date, UserId, Cost, Description) VALUES
                                                                        ('2025-08-01', 4, 50000, N'هزینه سوخت رفت و برگشت'),
                                                                        ('2025-08-02', 4, 45000, N'هزینه سوخت');

-- هزینه‌های ورزش ماهیانه
INSERT INTO MonthlyGymCosts (UserId, Year, Month, Cost, Description) VALUES
                                                                         (4, 2025, 8, 500000, N'هزینه باشگاه مرداد'),
                                                                         (5, 2025, 8, 600000, N'هزینه استخر مرداد');

-- گزارش‌های ماهیانه
INSERT INTO MonthlyReports (UserId, Year, Month, TotalHours, GymCost, Status, GroupId, GeneralManagerStatus, ManagerComment, FinanceComment, SubmittedAt, ApprovedAt) VALUES
                                                                                                                                                                          (4, 2025, 8, 900, 500000, 'draft', 2, 'pending', NULL, NULL, NULL, NULL),
                                                                                                                                                                          (5, 2025, 8, 1000, 600000, 'submitted_to_group_manager', 1, 'pending', NULL, NULL, '2025-08-05 10:00:00', NULL);

-- تست‌های جامع
-- 1. تست کاربران و نقش‌ها
SELECT * FROM Users;

-- 2. تست قراردادها (حداقل ساعت و ورود اختیاری)
SELECT u.Username, c.ContractArrivalTime, c.ContractLeaveTime, c.MinMonthlyHours
FROM Users u
         JOIN UserContractHours c ON u.UserId = c.UserId;

-- 3. تست گروه‌ها و تخصیص کاربران
SELECT u.Username, g.GroupName
FROM Users u
         JOIN UserGroup ug ON u.UserId = ug.UserId
         JOIN Groups g ON ug.GroupId = g.GroupId
ORDER BY g.GroupName, u.Username;

-- 4. تست دسترسی کاربران به پروژه‌ها
SELECT u.Username, p.ProjectName, p.securityLevel
FROM Users u
         JOIN UserProjectAccess upa ON u.UserId = upa.UserId
         JOIN Projects p ON upa.ProjectId = p.Id
ORDER BY u.Username, p.ProjectName;

-- 5. تست جزئیات روزانه
SELECT u.Username, dd.Date, dd.ArrivalTime, dd.LeaveTime, dd.PersonalTime, dd.Description
FROM DailyDetails dd
         JOIN Users u ON dd.UserId = u.UserId
WHERE dd.Date BETWEEN '2025-08-01' AND '2025-08-31'
ORDER BY dd.Date;

-- 6. تست وظایف پروژه روزانه
SELECT u.Username, p.ProjectName, dpt.Date, dpt.Duration, dpt.Description
FROM DailyProjectTasks dpt
         JOIN Users u ON dpt.UserId = u.UserId
         JOIN Projects p ON dpt.ProjectId = p.Id
WHERE dpt.Date BETWEEN '2025-08-01' AND '2025-08-31'
ORDER BY dpt.Date;

-- 7. تست هزینه‌های ماشین شخصی
SELECT u.Username, dpc.Date, dpc.Cost, dpc.Description
FROM DailyPersonalCarCosts dpc
         JOIN Users u ON dpc.UserId = u.UserId
WHERE dpc.Date BETWEEN '2025-08-01' AND '2025-08-31'
ORDER BY dpc.Date;

-- 8. تست هزینه‌های ورزش ماهیانه
SELECT u.Username, mgc.Year, mgc.Month, mgc.Cost, mgc.Description
FROM MonthlyGymCosts mgc
         JOIN Users u ON mgc.UserId = u.UserId
WHERE mgc.Year = 2025 AND mgc.Month = 8;

-- 9. تست گزارش‌های ماهیانه (workflow کامل)
SELECT u.Username, mr.Year, mr.Month, mr.TotalHours, mr.GymCost, mr.Status, mr.GeneralManagerStatus, mr.ManagerComment, mr.FinanceComment, mr.SubmittedAt, mr.ApprovedAt
FROM MonthlyReports mr
         JOIN Users u ON mr.UserId = u.UserId
WHERE mr.Year = 2025 AND mr.Month = 8
ORDER BY mr.Status;

-- 10. تست محاسبه مجموع ساعات برای گزارش ماهیانه
SELECT u.Username, SUM(dpt.Duration) AS TotalHours
FROM DailyProjectTasks dpt
         JOIN Users u ON dpt.UserId = u.UserId
WHERE YEAR(dpt.Date) = 2025 AND MONTH(dpt.Date) = 8
GROUP BY u.UserId, u.Username;

-- 11. تست گزارش‌های ارسالی به مدیر گروه
SELECT u.Username, mr.Year, mr.Month, mr.TotalHours, mr.GymCost
FROM MonthlyReports mr
         JOIN Users u ON mr.UserId = u.UserId
WHERE mr.Status = 'submitted_to_group_manager' AND mr.Year = 2025 AND mr.Month = 8;

-- 12. تست گزارش‌های ارسالی به مدیر کل
SELECT u.Username, mr.Year, mr.Month, mr.TotalHours, mr.GymCost
FROM MonthlyReports mr
         JOIN Users u ON mr.UserId = u.UserId
WHERE mr.Status = 'submitted_to_general_manager' AND mr.Year = 2025 AND mr.Month = 8;

-- 13. تست گزارش‌های ارسالی به امور مالی
SELECT u.Username, mr.Year, mr.Month, mr.TotalHours, mr.GymCost
FROM MonthlyReports mr
         JOIN Users u ON mr.UserId = u.UserId
WHERE mr.Status = 'submitted_to_finance' AND mr.Year = 2025 AND mr.Month = 8;

-- 14. تست گزارش‌های تأییدشده نهایی
SELECT u.Username, mr.Year, mr.Month, mr.TotalHours, mr.GymCost, mr.ApprovedAt
FROM MonthlyReports mr
         JOIN Users u ON mr.UserId = u.UserId
WHERE mr.Status = 'approved' AND mr.Year = 2025 AND mr.Month = 8;