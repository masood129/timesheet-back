const { sql, poolPromise } = require('../../config/db.config');
const { getJalaliMonthRange } = require('../../utils/dateConverter');

exports.saveMonthlyGymCost = async (req, res) => {
    const userId = req.user.userId;
    const { year, month, cost, hours } = req.body;
    if (!year || !month || !cost) {
        return res.status(400).send('Missing required fields');
    }
    try {
        const pool = await poolPromise;
        const existingReport = await pool.request()
            .input('userId', sql.Int, userId)
            .input('year', sql.Int, year)
            .input('month', sql.Int, month)
            .query('SELECT 1 FROM MonthlyReports WHERE UserId = @userId AND Year = @year AND Month = @month');

        if (existingReport.recordset.length > 0) {
            return res.status(400).send('گزارش ساعات ماهیانه برای این ماه وجود دارد');
        }

        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('year', sql.Int, year)
            .input('month', sql.Int, month)
            .input('cost', sql.Int, cost)
            .input('hours', sql.Int, hours || null)
            .query(`
        IF EXISTS (SELECT 1 FROM MonthlyGymCosts WHERE UserId = @userId AND Year = @year AND Month = @month)
          UPDATE MonthlyGymCosts SET Cost = @cost, GymHours = @hours 
            OUTPUT INSERTED.* WHERE UserId = @userId AND Year = @year AND Month = @month
        ELSE
          INSERT INTO MonthlyGymCosts (UserId, Year, Month, Cost, GymHours) 
            OUTPUT INSERTED.* VALUES (@userId, @year, @month, @cost, @hours)
      `);
        res.status(201).json(result.recordset[0] || { message: 'Gym cost saved' });
    } catch (err) {
        console.error('Error in saveMonthlyGymCost:', err.message);
        res.status(500).send(err.message);
    }
};

exports.saveMonthlyGymCostJalali = async (req, res) => {
    const userId = req.user.userId;
    const { year, month, cost, hours } = req.body;
    if (!year || !month || !cost || isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).send('Invalid input');
    }

    try {
        const monthRange = getJalaliMonthRange(year, month);
        const gregorianYear = monthRange.start.getFullYear();
        const gregorianMonth = monthRange.start.getMonth() + 1;

        const pool = await poolPromise;
        const existingReport = await pool.request()
            .input('userId', sql.Int, userId)
            .input('year', sql.Int, gregorianYear)
            .input('month', sql.Int, gregorianMonth)
            .query('SELECT 1 FROM MonthlyReports WHERE UserId = @userId AND Year = @year AND Month = @month');

        if (existingReport.recordset.length > 0) {
            return res.status(400).send('گزارش ساعات ماهیانه برای این ماه وجود دارد');
        }

        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('gregorianYear', sql.Int, gregorianYear)
            .input('gregorianMonth', sql.Int, gregorianMonth)
            .input('cost', sql.Int, cost)
            .input('hours', sql.Int, hours || null)
            .query(`
        IF EXISTS (SELECT 1 FROM MonthlyGymCosts WHERE UserId = @userId AND Year = @gregorianYear AND Month = @gregorianMonth)
          UPDATE MonthlyGymCosts SET Cost = @cost, GymHours = @hours 
            OUTPUT INSERTED.* WHERE UserId = @userId AND Year = @gregorianYear AND Month = @gregorianMonth
        ELSE
          INSERT INTO MonthlyGymCosts (UserId, Year, Month, Cost, GymHours) 
            OUTPUT INSERTED.* VALUES (@userId, @gregorianYear, @gregorianMonth, @cost, @hours)
      `);

        res.status(201).json(result.recordset[0] || { message: 'Gym cost saved with Jalali date' });
    } catch (err) {
        console.error('Error in saveMonthlyGymCostJalali:', err.message);
        res.status(500).send(err.message);
    }
};
