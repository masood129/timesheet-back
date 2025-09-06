const { sql, poolPromise } = require('../../config/db.config');

exports.getReportIdsByJalali = async (req, res) => {
    const { year, month } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    const jalaliYear = parseInt(year);
    const jalaliMonth = parseInt(month);

    if (isNaN(jalaliYear) || isNaN(jalaliMonth) || jalaliMonth < 1 || jalaliMonth > 12) {
        return res.status(400).send('Invalid Jalali year or month');
    }

    try {
        const pool = await poolPromise;
        let query = `
      SELECT ReportId, UserId
      FROM MonthlyReports
      WHERE JalaliYear = @jalaliYear
        AND JalaliMonth = @jalaliMonth
    `;
        if (role === 'user') {
            query += ' AND UserId = @userId';
        } else if (role === 'group_manager') {
            query += ' AND GroupId IN (SELECT GroupId FROM Groups WHERE ManagerId = @userId)';
        }

        const result = await pool.request()
            .input('jalaliYear', sql.Int, jalaliYear)
            .input('jalaliMonth', sql.Int, jalaliMonth)
            .input('userId', sql.Int, userId)
            .query(query);

        res.json(result.recordset.map(row => ({ reportId: row.ReportId, userId: row.UserId })));
    } catch (err) {
        console.error('Error in getReportIdsByJalali:', err.message);
        res.status(500).send('Server error');
    }
};
