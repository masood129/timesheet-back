-- داده‌های نمونه برای تست
-- کاربران
INSERT INTO Users (Username, PasswordHash, Role)
VALUES ('admin_user', 'hashed_admin', 'admin'),
       ('group_manager_tehran', 'hashed_mgr1', 'group_manager'),
       ('general_manager_hq', 'hashed_gen1', 'general_manager'),
       ('finance_manager_acc', 'hashed_fin1', 'finance_manager'),
       ('user_engineer1', 'hashed_user1', 'user'),
       ('user_developer2', 'hashed_user2', 'user');

-- گروه‌ها
INSERT INTO Groups (GroupName, ManagerId)
VALUES ('Engineering Team', 2), -- Manager: group_manager_tehran
       ('Development Team', 2);

-- تخصیص کاربران به گروه‌ها
INSERT INTO UserGroup (UserId, GroupId)
VALUES (5, 1), -- user_engineer1 به Engineering
       (6, 2);
-- user_developer2 به Development

-- پروژه‌ها
INSERT INTO Projects (Id, ProjectName, securityLevel)
VALUES (1001, 'AI Project Tehran', 3),
       (1002, 'Web Dev System', 2);

-- دسترسی کاربران به پروژه‌ها
INSERT INTO UserProjectAccess (UserId, ProjectId)
VALUES (5, 1001), -- user_engineer1 به AI Project
       (6, 1002);
-- user_developer2 به Web Dev

-- قراردادهای کاربران
INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours)
VALUES (5, NULL, '18:00', 160), -- ورود اختیاری
       (6, '09:00', '17:00', 150);

-- جزئیات روزانه (برای 1404/05 و 1404/06 شمسی ≈ 2025/08 و 2025/09 میلادی)
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost,
                          LeaveType)
VALUES ('2025-08-15', 5, '09:30', '18:00', 30, 'Meeting with team', 50000, 50000, NULL), -- معادل 1404/05/24
       ('2025-09-01', 6, NULL, '17:30', 0, 'Remote work', 0, 0, 'remote');
-- معادل 1404/06/10

-- وظایف پروژه روزانه
INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
VALUES ('2025-08-15', 5, 1001, 300, 'Developed AI module'), -- 5 ساعت
       ('2025-09-01', 6, 1002, 420, 'Fixed bugs in web app');
-- 7 ساعت

-- هزینه‌های ماشین شخصی
INSERT INTO DailyPersonalCarCosts (Date, UserId, ProjectId, Kilometers, Cost, Description)
VALUES ('2025-08-15', 5, 1001, 50, 100000, 'Trip to office'),
       ('2025-09-01', 6, 1002, 0, 0, 'No car used');

-- هزینه‌های ورزش ماهیانه
INSERT INTO MonthlyGymCosts (UserId, Year, Month, Cost, GymHours, Description)
VALUES (5, 2025, 8, 200000, 20, 'Gym membership August'),
       (6, 2025, 9, 150000, 15, 'Gym September');

-- گزارش‌های ماهیانه (با JalaliYear/Month و workflow کامل)
INSERT INTO MonthlyReports (UserId, Year, Month, JalaliYear, JalaliMonth, TotalHours, GymCost, Status, GroupId,
                            GeneralManagerStatus, ManagerComment, FinanceComment, SubmittedAt, ApprovedAt)
VALUES (5, 2025, 8, 1404, 5, 180, 200000, 'draft', 1, 'pending', NULL, NULL, NULL, NULL),
       (6, 2025, 9, 1404, 6, 160, 150000, 'submitted_to_group_manager', 2, 'pending', N'نیاز به بررسی', NULL,
        '2025-09-10 10:00:00', NULL),
       (5, 2025, 8, 1404, 5, 190, 200000, 'submitted_to_general_manager', 1, 'pending', N'تأیید شده توسط مدیر گروه',
        NULL, '2025-08-20 11:00:00', NULL),
       (6, 2025, 9, 1404, 6, 170, 150000, 'submitted_to_finance', 2, 'approved_by_general_manager',
        N'تأیید شده توسط مدیر کل', N'در انتظار پرداخت', '2025-09-15 12:00:00', NULL),
       (5, 2025, 8, 1404, 5, 185, 200000, 'approved', 1, 'approved_by_general_manager', N'همه چیز درست است',
        N'پرداخت انجام شد', '2025-08-25 13:00:00', '2025-08-30 14:00:00');

-- تست‌های جامع
-- 1. تست کاربران و نقش‌ها
SELECT *
FROM Users;

-- 2. تست قراردادها
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
WHERE dd.Date BETWEEN '2025-08-01' AND '2025-09-30'
ORDER BY dd.Date;

-- 6. تست وظایف پروژه روزانه
SELECT u.Username, p.ProjectName, dpt.Date, dpt.Duration, dpt.Description
FROM DailyProjectTasks dpt
         JOIN Users u ON dpt.UserId = u.UserId
         JOIN Projects p ON dpt.ProjectId = p.Id
WHERE dpt.Date BETWEEN '2025-08-01' AND '2025-09-30'
ORDER BY dpt.Date;

-- 7. تست هزینه‌های ماشین شخصی
SELECT u.Username, dpc.Date, dpc.Cost, dpc.Description
FROM DailyPersonalCarCosts dpc
         JOIN Users u ON dpc.UserId = u.UserId
WHERE dpc.Date BETWEEN '2025-08-01' AND '2025-09-30'
ORDER BY dpc.Date;

-- 8. تست هزینه‌های ورزش ماهیانه
SELECT u.Username, mgc.Year, mgc.Month, mgc.Cost, mgc.GymHours, mgc.Description
FROM MonthlyGymCosts mgc
         JOIN Users u ON mgc.UserId = u.UserId
WHERE mgc.Year = 2025
  AND mgc.Month IN (8, 9);

-- 9. تست گزارش‌های ماهیانه (workflow کامل)
SELECT u.Username,
       mr.Year,
       mr.Month,
       mr.JalaliYear,
       mr.JalaliMonth,
       mr.TotalHours,
       mr.GymCost,
       mr.Status,
       mr.GeneralManagerStatus,
       mr.ManagerComment,
       mr.FinanceComment,
       mr.SubmittedAt,
       mr.ApprovedAt
FROM MonthlyReports mr
         JOIN Users u ON mr.UserId = u.UserId
WHERE mr.Year = 2025
  AND mr.Month IN (8, 9)
ORDER BY mr.Status;

-- 10. تست محاسبه مجموع ساعات برای گزارش ماهیانه
SELECT u.Username, SUM(dpt.Duration) AS TotalHours
FROM DailyProjectTasks dpt
         JOIN Users u ON dpt.UserId = u.UserId
WHERE YEAR(dpt.Date) = 2025
  AND MONTH(dpt.Date) IN (8, 9)
GROUP BY u.UserId, u.Username;

-- 11. تست گزارش‌های ارسالی به مدیر گروه
SELECT u.Username, mr.Year, mr.Month, mr.JalaliYear, mr.JalaliMonth, mr.TotalHours, mr.GymCost
FROM MonthlyReports mr
         JOIN Users u ON mr.UserId = u.UserId
WHERE mr.Status = 'submitted_to_group_manager'
  AND mr.Year = 2025
  AND mr.Month = 9;

-- 12. تست گزارش‌های ارسالی به مدیر کل
SELECT u.Username, mr.Year, mr.Month, mr.JalaliYear, mr.JalaliMonth, mr.TotalHours, mr.GymCost
FROM MonthlyReports mr
         JOIN Users u ON mr.UserId = u.UserId
WHERE mr.Status = 'submitted_to_general_manager'
  AND mr.Year = 2025
  AND mr.Month = 8;

-- 13. تست گزارش‌های ارسالی به امور مالی
SELECT u.Username, mr.Year, mr.Month, mr.JalaliYear, mr.JalaliMonth, mr.TotalHours, mr.GymCost
FROM MonthlyReports mr
         JOIN Users u ON mr.UserId = u.UserId
WHERE mr.Status = 'submitted_to_finance'
  AND mr.Year = 2025
  AND mr.Month = 9;

-- 14. تست گزارش‌های تأییدشده نهایی
SELECT u.Username,
       mr.Year,
       mr.Month,
       mr.JalaliYear,
       mr.JalaliMonth,
       mr.TotalHours,
       mr.GymCost,
       mr.ApprovedAt
FROM MonthlyReports mr
         JOIN Users u ON mr.UserId = u.UserId
WHERE mr.Status = 'approved'
  AND mr.Year = 2025
  AND mr.Month = 8;

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

-- 18. تست گزارش‌های Jalali
SELECT u.Username, mr.JalaliYear, mr.JalaliMonth, mr.TotalHours, mr.GymCost
FROM MonthlyReports mr
         JOIN Users u ON mr.UserId = u.UserId
WHERE mr.JalaliYear = 1404
  AND mr.JalaliMonth IN (5, 6);

-- 19. تست مجموع ساعات با Jalali
SELECT u.Username, SUM(dpt.Duration) AS TotalHours
FROM DailyProjectTasks dpt
         JOIN Users u ON dpt.UserId = u.UserId
         JOIN DailyDetails dd ON dpt.Date = dd.Date
WHERE YEAR(dpt.Date) = 2025
  AND MONTH(dpt.Date) IN (8, 9)
GROUP BY u.UserId, u.Username;

-- 20. تست دسترسی پروژه بر اساس نقش
SELECT u.Username, p.ProjectName
FROM Users u
         JOIN UserProjectAccess upa ON u.UserId = upa.UserId
         JOIN Projects p ON upa.ProjectId = p.Id
WHERE u.Role = 'user';
