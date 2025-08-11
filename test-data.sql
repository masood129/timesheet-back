-- کاربران نمونه (پسورد هش شده فرضی)
INSERT INTO Users (Username, PasswordHash, Role) VALUES
('admin', 'hashed_admin', 'admin'),
('manager1', 'hashed_manager', 'manager'),
('finance1', 'hashed_finance', 'finance'),
('user1', 'hashed_user', 'user'),
('user2', 'hashed_user', 'user');

-- قراردادها (ساعت ورود اختیاری، حداقل ساعت)
INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours) VALUES
(4, NULL, '17:00:00', 160),  -- user1: ورود اختیاری
(5, '08:30:00', '17:00:00', 180);  -- user2: ورود الزامی

-- پروژه‌ها
INSERT INTO Projects (ProjectName, securityLevel) VALUES
(N'پروژه الف', 1),
(N'پروژه ب', 2);

-- جزئیات روزانه نمونه برای محاسبه گزارش
INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, PersonalTime) VALUES
('2025-08-01', 4, '08:00:00', '17:00:00', 30),
('2025-08-02', 4, '08:30:00', '16:30:00', 0);

INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description) VALUES
('2025-08-01', 4, 1, 480, N'کار روی پروژه'), -- 8 ساعت
('2025-08-02', 4, 2, 420, N'جلسه');  -- 7 ساعت

-- هزینه ورزش ماهیانه
INSERT INTO MonthlyGymCosts (UserId, Year, Month, Cost, Description) VALUES
(4, 2025, 8, 500000, N'هزینه باشگاه مرداد'),
(5, 2025, 8, 600000, N'هزینه استخر مرداد');

-- گزارش ماهانه نمونه
INSERT INTO MonthlyReports (UserId, Year, Month, TotalHours, GymCost, Status) VALUES
(4, 2025, 8, 900, 500000, 'draft'),  -- مجموع ساعات فرضی
(5, 2025, 8, 1000, 600000, 'submitted_to_manager');