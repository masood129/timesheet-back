const { sql, poolPromise } = require('../../config/db.config');

exports.checkSubmittedJalali = async (req, res) => {
    try {
        const { year, month } = req.params;
        const userId = req.user.userId;

        const jy = parseInt(year);
        const jm = parseInt(month);
        if (isNaN(jy) || isNaN(jm) || jm < 1 || jm > 12) {
            return res.status(400).send('Invalid Jalali year or month');
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('jalaliYear', sql.Int, jy)
            .input('jalaliMonth', sql.Int, jm)
            .query('SELECT TOP 1 Status FROM MonthlyReports WHERE UserId = @userId AND JalaliYear = @jalaliYear AND JalaliMonth = @jalaliMonth');

        const status = result.recordset.length > 0 ? result.recordset[0].Status : null;
        res.json({ status });
    } catch (err) {
        console.error('Error in checkSubmittedJalali:', err.message);
        res.status(500).send('Server error');
    }
};
