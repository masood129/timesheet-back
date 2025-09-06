const { sql, poolPromise } = require('../../config/db.config');

exports.getById = async (req, res) => {
    const { reportId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;
    try {
        const pool = await poolPromise;
        let query = 'SELECT * FROM MonthlyReports WHERE ReportId = @reportId';
        if (role === 'user') query += ' AND UserId = @userId';
        else if (role === 'group_manager') query += ' AND GroupId IN (SELECT GroupId FROM Groups WHERE ManagerId = @userId)';

        const result = await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('userId', sql.Int, userId)
            .query(query);

        if (result.recordset.length === 0) return res.status(404).send('Report not found or access denied');
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error in getById:', err.message);
        res.status(500).send(err.message);
    }
};

exports.getGroup = async (req, res) => {
    const { year, month } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;
    try {
        const pool = await poolPromise;
        let query = 'SELECT mr.*, u.Username FROM MonthlyReports mr JOIN Users u ON mr.UserId = u.UserId WHERE Year = @year AND Month = @month';
        if (role === 'group_manager') query += ' AND GroupId IN (SELECT GroupId FROM Groups WHERE ManagerId = @userId)';

        const result = await pool.request()
            .input('year', sql.Int, year)
            .input('month', sql.Int, month)
            .input('userId', sql.Int, userId)
            .query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error in getGroup:', err.message);
        res.status(500).send(err.message);
    }
};

exports.getJalaliGroup = async (req, res) => {
    const { year, month } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;
    try {
        const jalaliYear = parseInt(year);
        const jalaliMonth = parseInt(month);
        if (isNaN(jalaliYear) || isNaN(jalaliMonth) || jalaliMonth < 1 || jalaliMonth > 12) {
            return res.status(400).send('Invalid Jalali year or month');
        }

        const pool = await poolPromise;
        let query = `
      SELECT mr.*, u.Username
      FROM MonthlyReports mr
        JOIN Users u ON mr.UserId = u.UserId
      WHERE mr.JalaliYear = @jalaliYear
        AND mr.JalaliMonth = @jalaliMonth
    `;
        if (role === 'group_manager') query += ' AND mr.GroupId IN (SELECT GroupId FROM Groups WHERE ManagerId = @userId)';

        const result = await pool.request()
            .input('jalaliYear', sql.Int, jalaliYear)
            .input('jalaliMonth', sql.Int, jalaliMonth)
            .input('userId', sql.Int, userId)
            .query(query);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error in getJalaliGroup:', err.message);
        res.status(500).send(err.message);
    }
};

exports.getGroupRange = async (req, res) => {
    const { startYear, startMonth, endYear, endMonth } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;
    try {
        const sYear = parseInt(startYear);
        const sMonth = parseInt(startMonth);
        const eYear = parseInt(endYear);
        const eMonth = parseInt(endMonth);
        if (isNaN(sYear) || isNaN(sMonth) || isNaN(eYear) || isNaN(eMonth) || sMonth < 1 || sMonth > 12 || eMonth < 1 || eMonth > 12) {
            return res.status(400).send('Invalid year or month');
        }
        if (sYear > eYear || (sYear === eYear && sMonth > eMonth)) {
            return res.status(400).send('Start date must be before or equal to end date');
        }

        const pool = await poolPromise;
        let query = `
      SELECT mr.*, u.Username
      FROM MonthlyReports mr
        JOIN Users u ON mr.UserId = u.UserId
      WHERE (Year > @startYear OR (Year = @startYear AND Month >= @startMonth))
        AND (Year < @endYear OR (Year = @endYear AND Month <= @endMonth))
    `;
        if (role === 'group_manager') query += ' AND GroupId IN (SELECT GroupId FROM Groups WHERE ManagerId = @userId)';

        const result = await pool.request()
            .input('startYear', sql.Int, sYear)
            .input('startMonth', sql.Int, sMonth)
            .input('endYear', sql.Int, eYear)
            .input('endMonth', sql.Int, eMonth)
            .input('userId', sql.Int, userId)
            .query(query);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error in getGroupRange:', err.message);
        res.status(500).send(err.message);
    }
};
