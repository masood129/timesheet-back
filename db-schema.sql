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
                                       Date DATE,
                                       UserId INT,
                                       ProjectID INT, -- نام ستون ممکن است متفاوت باشد
                                       Kilometers INT, -- ستون برای کیلومتر
                                       Cost INT,
                                       Description NVARCHAR(MAX)
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
                                                     ('group_manager1', 'hashed_group_manager1', 'group_manager'),
                                                     ('group_manager2', 'hashed_group_manager2', 'group_manager'),
                                                     ('group_manager3', 'hashed_group_manager3', 'group_manager'),
                                                     ('group_manager4', 'hashed_group_manager4', 'group_manager'),
                                                     ('general_manager1', 'hashed_general_manager1', 'general_manager'),
                                                     ('general_manager2', 'hashed_general_manager2', 'general_manager'),
                                                     ('general_manager3', 'hashed_general_manager3', 'general_manager'),
                                                     ('finance_manager1', 'hashed_finance_manager1', 'finance_manager'),
                                                     ('finance_manager2', 'hashed_finance_manager2', 'finance_manager'),
                                                     ('user1', 'hashed_user1', 'user'),
                                                     ('user2', 'hashed_user2', 'user'),
                                                     ('user3', 'hashed_user3', 'user'),
                                                     ('user4', 'hashed_user4', 'user'),
                                                     ('user5', 'hashed_user5', 'user'),
                                                     ('user6', 'hashed_user6', 'user'),
                                                     ('user7', 'hashed_user7', 'user'),
                                                     ('user8', 'hashed_user8', 'user'),
                                                     ('user9', 'hashed_user9', 'user'),
                                                     ('user10', 'hashed_user10', 'user');

-- گروه‌ها
INSERT INTO Groups (GroupName, ManagerId) VALUES
                                              ('GroupA', 2), -- group_manager1
                                              ('GroupB', 3), -- group_manager2
                                              ('GroupC', 4), -- group_manager3
                                              ('GroupD', 5), -- group_manager4
                                              ('GroupE', 2), -- group_manager1
                                              ('GroupF', 3); -- group_manager2

-- تخصیص کاربران به گروه‌ها
INSERT INTO UserGroup (UserId, GroupId) VALUES
                                            (11, 1), -- user1 در GroupA
                                            (12, 1), -- user2 در GroupA
                                            (13, 2), -- user3 در GroupB
                                            (14, 2), -- user4 در GroupB
                                            (15, 3), -- user5 در GroupC
                                            (16, 3), -- user6 در GroupC
                                            (17, 4), -- user7 در GroupD
                                            (18, 4), -- user8 در GroupD
                                            (19, 5), -- user9 در GroupE
                                            (20, 6); -- user10 در GroupF

-- قراردادها
INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours) VALUES
                                                                                                    (11, NULL, '17:00:00', 160), -- user1
                                                                                                    (12, '08:30:00', '17:00:00', 180), -- user2
                                                                                                    (13, NULL, '17:30:00', 170), -- user3
                                                                                                    (14, '09:00:00', '18:00:00', 160), -- user4
                                                                                                    (15, NULL, '17:00:00', 165), -- user5
                                                                                                    (16, '08:00:00', '16:30:00', 175), -- user6
                                                                                                    (17, NULL, '17:00:00', 160), -- user7
                                                                                                    (18, '08:30:00', '17:00:00', 180), -- user8
                                                                                                    (19, NULL, '17:30:00', 170), -- user9
                                                                                                    (20, '09:00:00', '18:00:00', 160); -- user10

-- پروژه‌ها
INSERT INTO Projects (Id, ProjectName, securityLevel) VALUES
                                                          (1, 'P1000', 1), (2, 'P1001', 1), (3, 'P1002', 2), (4, 'P1003', 2), (5, 'P1004', 1),
                                                          (6, 'P1005', 3), (7, 'P1006', 2), (8, 'P1007', 1), (9, 'P1008', 2), (10, 'P1009', 3),
                                                          (11, 'P1010', 1), (12, 'P1011', 2), (13, 'P1012', 1), (14, 'P1013', 3), (15, 'P1014', 2),
                                                          (16, 'P1015', 1), (17, 'P1016', 1), (18, 'P1017', 2), (19, 'P1018', 3), (20, 'P1019', 1),
                                                          (21, 'P1020', 2), (22, 'P1021', 1), (23, 'P1022', 3), (24, 'P1023', 2), (25, 'P1024', 1),
                                                          (26, 'P1025', 2), (27, 'P1026', 1), (28, 'P1027', 3), (29, 'P1028', 2), (30, 'P1029', 1);

-- تخصیص دسترسی کاربران به پروژه‌ها (هر کاربر حداقل به 1 پروژه دسترسی دارد)
INSERT INTO UserProjectAccess (UserId, ProjectId) VALUES
-- user1 (6 پروژه)
(11, 1), (11, 3), (11, 5), (11, 7), (11, 9), (11, 11),
-- user2 (4 پروژه)
(12, 2), (12, 4), (12, 6), (12, 8),
-- user3 (8 پروژه)
(13, 3), (13, 5), (13, 7), (13, 9), (13, 11), (13, 13), (13, 15), (13, 17),
-- user4 (3 پروژه)
(14, 4), (14, 6), (14, 8),
-- user5 (5 پروژه)
(15, 5), (15, 7), (15, 9), (15, 11), (15, 13),
-- user6 (7 پروژه)
(16, 6), (16, 8), (16, 10), (16, 12), (16, 14), (16, 16), (16, 18),
-- user7 (2 پروژه)
(17, 7), (17, 9),
-- user8 (10 پروژه)
(18, 8), (18, 10), (18, 12), (18, 14), (18, 16), (18, 18), (18, 20), (18, 22), (18, 24), (18, 26),
-- user9 (4 پروژه)
(19, 9), (19, 11), (19, 13), (19, 15),
-- user10 (6 پروژه)
(20, 10), (20, 12), (20, 14), (20, 16), (20, 18), (20, 20);

-- جزئیات روزانه
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost, LeaveType) VALUES
                                                                                                                              ('2025-08-01', 11, '08:00:00', '17:00:00', 30, N'حضور در محل کار', 10000, 10000, NULL),
                                                                                                                              ('2025-08-02', 11, '08:30:00', '16:30:00', 0, N'حضور در محل کار', 10000, 10000, NULL),
                                                                                                                              ('2025-08-01', 12, '08:30:00', '17:00:00', 15, N'حضور در محل کار', 12000, 12000, NULL),
                                                                                                                              ('2025-08-01', 13, '09:00:00', '17:30:00', 20, N'حضور در محل کار', 11000, 11000, NULL),
                                                                                                                              ('2025-08-02', 14, '09:00:00', '18:00:00', 10, N'حضور در محل کار', 13000, 13000, NULL),
                                                                                                                              ('2025-08-01', 15, '08:00:00', '17:00:00', 25, N'حضور در محل کار', 10000, 10000, NULL),
                                                                                                                              ('2025-08-02', 16, '08:00:00', '16:30:00', 0, N'حضور در محل کار', 11000, 11000, NULL),
                                                                                                                              ('2025-08-01', 17, '08:30:00', '17:00:00', 30, N'حضور در محل کار', 12000, 12000, NULL),
                                                                                                                              ('2025-08-02', 18, '08:30:00', '17:00:00', 15, N'حضور در محل کار', 10000, 10000, NULL),
                                                                                                                              ('2025-08-01', 19, '09:00:00', '17:30:00', 20, N'حضور در محل کار', 11000, 11000, NULL),
                                                                                                                              ('2025-08-02', 20, '09:00:00', '18:00:00', 10, N'حضور در محل کار', 13000, 13000, NULL);

-- وظایف پروژه روزانه
INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description) VALUES
                                                                                   ('2025-08-01', 11, 1, 480, N'کار روی پروژه'), -- user1, 8 ساعت
                                                                                   ('2025-08-02', 11, 3, 420, N'جلسه'), -- user1, 7 ساعت
                                                                                   ('2025-08-01', 12, 2, 450, N'برنامه‌نویسی'), -- user2, 7.5 ساعت
                                                                                   ('2025-08-01', 13, 3, 480, N'کار روی پروژه'), -- user3, 8 ساعت
                                                                                   ('2025-08-02', 14, 4, 420, N'جلسه'), -- user4, 7 ساعت
                                                                                   ('2025-08-01', 15, 5, 450, N'برنامه‌نویسی'), -- user5, 7.5 ساعت
                                                                                   ('2025-08-02', 16, 6, 480, N'کار روی پروژه'), -- user6, 8 ساعت
                                                                                   ('2025-08-01', 17, 7, 420, N'جلسه'), -- user7, 7 ساعت
                                                                                   ('2025-08-02', 18, 8, 450, N'برنامه‌نویسی'), -- user8, 7.5 ساعت
                                                                                   ('2025-08-01', 19, 9, 480, N'کار روی پروژه'), -- user9, 8 ساعت
                                                                                   ('2025-08-02', 20, 10, 420, N'جلسه'); -- user10, 7 ساعت

-- هزینه‌های ماشین شخصی
INSERT INTO DailyPersonalCarCosts (Date, UserId, Cost, Description) VALUES
                                                                        ('2025-08-01', 11, 50000, N'هزینه سوخت رفت و برگشت'),
                                                                        ('2025-08-02', 11, 45000, N'هزینه سوخت'),
                                                                        ('2025-08-01', 12, 48000, N'هزینه سوخت رفت و برگشت'),
                                                                        ('2025-08-01', 13, 52000, N'هزینه سوخت'),
                                                                        ('2025-08-02', 14, 47000, N'هزینه سوخت'),
                                                                        ('2025-08-01', 15, 50000, N'هزینه سوخت رفت و برگشت'),
                                                                        ('2025-08-02', 16, 45000, N'هزینه سوخت'),
                                                                        ('2025-08-01', 17, 48000, N'هزینه سوخت رفت و برگشت'),
                                                                        ('2025-08-02', 18, 52000, N'هزینه سوخت'),
                                                                        ('2025-08-01', 19, 47000, N'هزینه سوخت'),
                                                                        ('2025-08-02', 20, 50000, N'هزینه سوخت رفت و برگشت');

-- هزینه‌های ورزش ماهیانه
INSERT INTO MonthlyGymCosts (UserId, Year, Month, Cost, Description) VALUES
                                                                         (11, 2025, 8, 500000, N'هزینه باشگاه مرداد'),
                                                                         (12, 2025, 8, 600000, N'هزینه استخر مرداد'),
                                                                         (13, 2025, 8, 550000, N'هزینه باشگاه مرداد'),
                                                                         (14, 2025, 8, 580000, N'هزینه استخر مرداد'),
                                                                         (15, 2025, 8, 520000, N'هزینه باشگاه مرداد'),
                                                                         (16, 2025, 8, 590000, N'هزینه استخر مرداد'),
                                                                         (17, 2025, 8, 510000, N'هزینه باشگاه مرداد'),
                                                                         (18, 2025, 8, 600000, N'هزینه استخر مرداد'),
                                                                         (19, 2025, 8, 540000, N'هزینه باشگاه مرداد'),
                                                                         (20, 2025, 8, 570000, N'هزینه استخر مرداد');

-- گزارش‌های ماهیانه
INSERT INTO MonthlyReports (UserId, Year, Month, TotalHours, GymCost, Status, GroupId, GeneralManagerStatus, ManagerComment, FinanceComment, SubmittedAt, ApprovedAt) VALUES
                                                                                                                                                                          (11, 2025, 8, 900, 500000, 'draft', 1, 'pending', NULL, NULL, NULL, NULL),
                                                                                                                                                                          (12, 2025, 8, 1000, 600000, 'submitted_to_group_manager', 1, 'pending', NULL, NULL, '2025-08-05 10:00:00', NULL),
                                                                                                                                                                          (13, 2025, 8, 950, 550000, 'submitted_to_group_manager', 2, 'pending', NULL, NULL, '2025-08-06 11:00:00', NULL),
                                                                                                                                                                          (14, 2025, 8, 920, 580000, 'draft', 2, 'pending', NULL, NULL, NULL, NULL),
                                                                                                                                                                          (15, 2025, 8, 980, 520000, 'submitted_to_general_manager', 3, 'pending', N'نیاز به بررسی بیشتر', NULL, '2025-08-07 09:00:00', NULL),
                                                                                                                                                                          (16, 2025, 8, 940, 590000, 'submitted_to_finance', 3, 'approved_by_general_manager', N'تأیید شده', NULL, '2025-08-08 10:30:00', NULL),
                                                                                                                                                                          (17, 2025, 8, 910, 510000, 'draft', 4, 'pending', NULL, NULL, NULL, NULL),
                                                                                                                                                                          (18, 2025, 8, 990, 600000, 'approved', 4, 'approved_by_general_manager', N'تأیید شده', N'پرداخت انجام شد', '2025-08-09 12:00:00', '2025-08-10 14:00:00'),
                                                                                                                                                                          (19, 2025, 8, 930, 540000, 'submitted_to_group_manager', 5, 'pending', NULL, NULL, '2025-08-05 15:00:00', NULL),
                                                                                                                                                                          (20, 2025, 8, 960, 570000, 'submitted_to_general_manager', 6, 'pending', N'نیاز به اصلاح', NULL, '2025-08-06 16:00:00', NULL);

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

-- 15. تست تعداد پروژه‌های تخصیص‌یافته به هر کاربر
SELECT u.Username, COUNT(upa.ProjectId) AS ProjectCount
FROM Users u
         LEFT JOIN UserProjectAccess upa ON u.UserId = upa.UserId
WHERE u.Role = 'user'
GROUP BY u.UserId, u.Username
HAVING COUNT(upa.ProjectId) >= 1;

-- 16. تست گروه‌های تحت مدیریت هر مدیر گروه
SELECT u.Username, g.GroupName
FROM Users u
         JOIN Groups g ON u.UserId = g.ManagerId
WHERE u.Role = 'group_manager'
ORDER BY u.Username, g.GroupName;

-- 17. تست تعداد کاربران در هر گروه
SELECT g.GroupName, COUNT(ug.UserId) AS UserCount
FROM Groups g
         LEFT JOIN UserGroup ug ON g.GroupId = ug.GroupId
GROUP BY g.GroupId, g.GroupName
ORDER BY g.GroupName;


ALTER TABLE MonthlyReports ADD JalaliYear INT NULL;
ALTER TABLE MonthlyReports ADD JalaliMonth INT NULL;