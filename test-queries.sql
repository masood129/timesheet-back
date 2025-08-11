-- تست کاربران و نقش‌ها
SELECT * FROM Users;

-- تست قراردادها (حداقل ساعت و ورود اختیاری)
SELECT u.Username, c.ContractArrivalTime, c.MinMonthlyHours 
FROM Users u JOIN UserContractHours c ON u.UserId = c.UserId;

-- تست هزینه ورزش
SELECT u.Username, g.Cost 
FROM MonthlyGymCosts g JOIN Users u ON g.UserId = u.UserId 
WHERE Year = 2025 AND Month = 8;

-- تست گزارش ماهانه (workflow)
SELECT u.Username, r.TotalHours, r.Status, r.GymCost 
FROM MonthlyReports r JOIN Users u ON r.UserId = u.UserId;

-- تست محاسبه مجموع ساعات (برای گزارش - نمونه query)
SELECT SUM(Duration) AS TotalHours 
FROM DailyProjectTasks 
WHERE UserId = 4 AND YEAR(Date) = 2025 AND MONTH(Date) = 8;