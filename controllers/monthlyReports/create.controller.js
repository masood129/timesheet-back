const { sql, poolPromise } = require('../../config/db.config');
const { getJalaliMonthRange } = require('../../utils/dateConverter');

exports.createGregorian = async (req, res) => {
    const { year, month } = req.params;
    const userId = req.user.userId;
    try {
        const pool = await poolPromise;
        const groupResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT GroupId FROM UserGroup WHERE UserId = @userId');
        const groupId = groupResult.recordset[0]?.GroupId || null;

        const hoursResult = await pool.request()
            .input('userId', sql.Int, userId)
            .input('year', sql.Int, year)
            .input('month', sql.Int, month)
            .query(`
        SELECT SUM(dpt.Duration) AS TotalHours
        FROM DailyProjectTasks dpt
          INNER JOIN DailyDetails dd ON dpt.Date = dd.Date AND dpt.UserId = dd.UserId
        WHERE dpt.UserId = @userId
          AND YEAR(dpt.Date) = @year
          AND MONTH(dpt.Date) = @month
          AND dd.LeaveType = 'work'
      `);
        const totalHours = hoursResult.recordset[0].TotalHours || 0;

        const gymResult = await pool.request()
            .input('userId', sql.Int, userId)
            .input('year', sql.Int, year)
            .input('month', sql.Int, month)
            .query('SELECT Cost, GymHours FROM MonthlyGymCosts WHERE UserId = @userId AND Year = @year AND Month = @month');
        const gymCost = gymResult.recordset[0]?.Cost || 0;

        const existingReport = await pool.request()
            .input('userId', sql.Int, userId)
            .input('year', sql.Int, year)
            .input('month', sql.Int, month)
            .query(`
        SELECT Status
        FROM MonthlyReports
        WHERE UserId = @userId
          AND Year = @year
          AND Month = @month
      `);

        if (existingReport.recordset.length > 0) {
            const status = existingReport.recordset[0].Status;
            if (status !== 'draft') {
                return res.status(400).send('گزارش وجود دارد');
            }
            const updateResult = await pool.request()
                .input('userId', sql.Int, userId)
                .input('year', sql.Int, year)
                .input('month', sql.Int, month)
                .input('totalHours', sql.Int, totalHours)
                .input('gymCost', sql.Int, gymCost)
                .input('groupId', sql.Int, groupId)
                .query(`
          UPDATE MonthlyReports
          SET TotalHours = @totalHours,
              GymCost    = @gymCost,
              Status     = 'draft',
              GroupId    = @groupId
          OUTPUT INSERTED.*
          WHERE UserId = @userId
            AND Year = @year
            AND Month = @month
            AND Status = 'draft'
        `);
            res.status(201).json(updateResult.recordset[0]);
        } else {
            const insertResult = await pool.request()
                .input('userId', sql.Int, userId)
                .input('year', sql.Int, year)
                .input('month', sql.Int, month)
                .input('totalHours', sql.Int, totalHours)
                .input('gymCost', sql.Int, gymCost)
                .input('groupId', sql.Int, groupId)
                .query(`
          INSERT INTO MonthlyReports (UserId, Year, Month, TotalHours, GymCost, Status, GroupId)
          OUTPUT INSERTED.*
          VALUES (@userId, @year, @month, @totalHours, @gymCost, 'draft', @groupId)
        `);
            res.status(201).json(insertResult.recordset[0]);
        }
    } catch (err) {
        console.error('Error in createGregorian:', err.message);
        res.status(500).send(err.message);
    }
};

exports.createJalali = async (req, res) => {
    const { year, month } = req.params;
    const userId = req.user.userId;
    try {
        const jalaliYear = parseInt(year);
        const jalaliMonth = parseInt(month);
        if (isNaN(jalaliYear) || isNaN(jalaliMonth) || jalaliMonth < 1 || jalaliMonth > 12) {
            return res.status(400).send('Invalid Jalali year or month');
        }
        const monthRange = getJalaliMonthRange(jalaliYear, jalaliMonth);
        const startDate = monthRange.start;
        const endDate = monthRange.end;
        const gregorianYear = startDate.getFullYear();
        const gregorianMonth = startDate.getMonth() + 1;

        const pool = await poolPromise;
        const groupResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT GroupId FROM UserGroup WHERE UserId = @userId');
        const groupId = groupResult.recordset[0]?.GroupId || null;

        const hoursResult = await pool.request()
            .input('userId', sql.Int, userId)
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .query(`
        SELECT SUM(dpt.Duration) AS TotalHours
        FROM DailyProjectTasks dpt
          INNER JOIN DailyDetails dd ON dpt.Date = dd.Date AND dpt.UserId = dd.UserId
        WHERE dpt.UserId = @userId
          AND dpt.Date >= @startDate
          AND dpt.Date <= @endDate
          AND dd.LeaveType = 'work'
      `);
        const totalHours = hoursResult.recordset[0].TotalHours || 0;

        const gymResult = await pool.request()
            .input('userId', sql.Int, userId)
            .input('year', sql.Int, gregorianYear)
            .input('month', sql.Int, gregorianMonth)
            .query('SELECT Cost, GymHours FROM MonthlyGymCosts WHERE UserId = @userId AND Year = @year AND Month = @month');
        const gymCost = gymResult.recordset[0]?.Cost || 0;

        const existingReport = await pool.request()
            .input('userId', sql.Int, userId)
            .input('year', sql.Int, gregorianYear)
            .input('month', sql.Int, gregorianMonth)
            .query(`
        SELECT Status
        FROM MonthlyReports
        WHERE UserId = @userId
          AND Year = @year
          AND Month = @month
      `);

        if (existingReport.recordset.length > 0) {
            const status = existingReport.recordset[0].Status;
            if (status !== 'draft') {
                return res.status(400).send('گزارش وجود دارد');
            }
            const updateResult = await pool.request()
                .input('userId', sql.Int, userId)
                .input('year', sql.Int, gregorianYear)
                .input('month', sql.Int, gregorianMonth)
                .input('jalaliYear', sql.Int, jalaliYear)
                .input('jalaliMonth', sql.Int, jalaliMonth)
                .input('totalHours', sql.Int, totalHours)
                .input('gymCost', sql.Int, gymCost)
                .input('groupId', sql.Int, groupId)
                .query(`
          UPDATE MonthlyReports
          SET JalaliYear  = @jalaliYear,
              JalaliMonth = @jalaliMonth,
              TotalHours  = @totalHours,
              GymCost     = @gymCost,
              Status      = 'draft',
              GroupId     = @groupId
          OUTPUT INSERTED.*
          WHERE UserId = @userId
            AND Year = @year
            AND Month = @month
            AND Status = 'draft'
        `);
            res.status(201).json(updateResult.recordset[0]);
        } else {
            const insertResult = await pool.request()
                .input('userId', sql.Int, userId)
                .input('year', sql.Int, gregorianYear)
                .input('month', sql.Int, gregorianMonth)
                .input('jalaliYear', sql.Int, jalaliYear)
                .input('jalaliMonth', sql.Int, jalaliMonth)
                .input('totalHours', sql.Int, totalHours)
                .input('gymCost', sql.Int, gymCost)
                .input('groupId', sql.Int, groupId)
                .query(`
          INSERT INTO MonthlyReports (UserId, Year, Month, JalaliYear, JalaliMonth, TotalHours, GymCost, Status, GroupId)
          OUTPUT INSERTED.*
          VALUES (@userId, @year, @month, @jalaliYear, @jalaliMonth, @totalHours, @gymCost, 'draft', @groupId)
        `);
            res.status(201).json(insertResult.recordset[0]);
        }
    } catch (err) {
        console.error('Error in createJalali:', err.message);
        res.status(500).send(err.message);
    }
};
