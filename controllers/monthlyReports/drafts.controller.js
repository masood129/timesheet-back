const { sql, poolPromise } = require('../../config/db.config');
const { getJalaliMonthRange } = require('../../utils/dateConverter');

exports.getMyDrafts = async (req, res) => {
    const userId = req.user.userId;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
        SELECT mr.*, u.Username, g.GroupName, m.Username AS ManagerUsername
        FROM MonthlyReports mr
          JOIN Users u ON mr.UserId = u.UserId
          LEFT JOIN Groups g ON mr.GroupId = g.GroupId
          LEFT JOIN Users m ON g.ManagerId = m.UserId
        WHERE mr.UserId = @userId
          AND mr.Status = 'draft'
      `);

        const drafts = result.recordset;

        for (let report of drafts) {
            const monthRange = getJalaliMonthRange(report.JalaliYear, report.JalaliMonth);
            const startDate = monthRange.start;
            const endDate = monthRange.end;

            const commuteResult = await pool.request()
                .input('userId', sql.Int, userId)
                .input('startDate', sql.Date, startDate)
                .input('endDate', sql.Date, endDate)
                .query(`
          SELECT SUM(ISNULL(GoCost, 0) + ISNULL(ReturnCost, 0)) AS TotalCommuteCost
          FROM DailyDetails
          WHERE UserId = @userId
            AND Date >= @startDate
            AND Date <= @endDate
            AND LeaveType = 'work'
        `);
            report.totalCommuteCost = commuteResult.recordset[0].TotalCommuteCost || 0;

            const carCostsResult = await pool.request()
                .input('userId', sql.Int, userId)
                .input('startDate', sql.Date, startDate)
                .input('endDate', sql.Date, endDate)
                .query(`
          SELECT dpc.ProjectID, SUM(ISNULL(dpc.Cost, 0)) AS TotalCost
          FROM DailyPersonalCarCosts dpc
            INNER JOIN DailyDetails dd ON dpc.Date = dd.Date AND dpc.UserId = dd.UserId
          WHERE dpc.UserId = @userId
            AND dpc.Date >= @startDate
            AND dpc.Date <= @endDate
            AND dd.LeaveType = 'work'
          GROUP BY dpc.ProjectID
        `);
            report.personalCarCostsByProject = carCostsResult.recordset;
        }

        res.json(drafts);
    } catch (err) {
        console.error('Error in getMyDrafts:', err.message);
        res.status(500).send('Server error');
    }
};

exports.exitDraft = async (req, res) => {
    const { reportId } = req.params;
    const userId = req.user.userId;
    try {
        const pool = await poolPromise;
        const reportResult = await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('userId', sql.Int, userId)
            .query(`
        SELECT Status
        FROM MonthlyReports
        WHERE ReportId = @reportId
          AND UserId = @userId
      `);

        if (reportResult.recordset.length === 0) {
            return res.status(404).send('Report not found or access denied');
        }

        const status = reportResult.recordset[0].Status;
        if (status !== 'draft') {
            return res.status(400).send('Only draft reports can be exited');
        }

        await pool.request()
            .input('reportId', sql.Int, reportId)
            .query(`DELETE FROM MonthlyReports WHERE ReportId = @reportId AND Status = 'draft'`);

        res.send('Exited from draft state and returned to normal');
    } catch (err) {
        console.error('Error in exitDraft:', err.message);
        res.status(500).send('Server error');
    }
};
