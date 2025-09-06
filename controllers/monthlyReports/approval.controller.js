const { sql, poolPromise } = require('../../config/db.config');

exports.rejectToDraft = async (req, res) => {
    const { reportId } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId;
    const role = req.user.role;
    try {
        const pool = await poolPromise;
        let query = `
      SELECT mr.*, g.ManagerId
      FROM MonthlyReports mr
        LEFT JOIN Groups g ON mr.GroupId = g.GroupId
      WHERE mr.ReportId = @reportId
    `;
        if (role === 'group_manager') {
            query += ' AND g.ManagerId = @userId';
        }

        const reportResult = await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('userId', sql.Int, userId)
            .query(query);

        if (reportResult.recordset.length === 0) {
            return res.status(404).send('Report not found or access denied');
        }

        const report = reportResult.recordset[0];
        if (report.Status === 'draft') return res.status(400).send('Report is already in draft status');
        if (report.Status === 'approved') return res.status(400).send('Approved reports cannot be rejected');

        let updateQuery = `
      UPDATE MonthlyReports
      SET Status = 'draft',
          GeneralManagerStatus = 'pending',
          SubmittedAt = NULL,
          ApprovedAt = NULL
    `;
        if (role === 'finance_manager') {
            updateQuery += `, FinanceComment = ISNULL(FinanceComment + '\n', '') + @comment`;
        } else {
            updateQuery += `, ManagerComment = ISNULL(ManagerComment + '\n', '') + @comment`;
        }
        updateQuery += ` WHERE ReportId = @reportId`;

        await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('comment', sql.NVarChar, comment || 'Rejected without comment')
            .query(updateQuery);

        res.send('Report rejected and reverted to draft');
    } catch (err) {
        console.error('Error in rejectToDraft:', err.message);
        res.status(500).send('Server error');
    }
};

exports.submitToGroupManager = async (req, res) => {
    const { reportId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;
    try {
        const pool = await poolPromise;
        const reportResult = await pool.request()
            .input('reportId', sql.Int, reportId)
            .query('SELECT UserId, Status, GroupId FROM MonthlyReports WHERE ReportId = @reportId');

        if (reportResult.recordset.length === 0) return res.status(404).send('Report not found');

        const report = reportResult.recordset[0];
        if (report.Status !== 'draft') return res.status(400).send('Report cannot be submitted; it is not in draft status');
        if (role === 'user' && report.UserId !== userId) return res.status(403).send('Access denied: Users can only submit their own reports');

        let newStatus = 'submitted_to_group_manager';
        if (role === 'group_manager' && report.UserId === userId) {
            const groupCheck = await pool.request()
                .input('groupId', sql.Int, report.GroupId)
                .input('userId', sql.Int, userId)
                .query('SELECT 1 FROM Groups WHERE GroupId = @groupId AND ManagerId = @userId');

            if (groupCheck.recordset.length > 0) newStatus = 'submitted_to_general_manager';
        }
        if (role === 'general_manager' && report.UserId === userId) newStatus = 'submitted_to_finance';

        await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('newStatus', sql.NVarChar, newStatus)
            .query('UPDATE MonthlyReports SET Status = @newStatus, SubmittedAt = GETDATE() WHERE ReportId = @reportId AND Status = \'draft\'');

        res.send(`Submitted to ${newStatus.replace('submitted_to_', '')}`);
    } catch (err) {
        console.error('Error in submitToGroupManager:', err.message);
        res.status(500).send('Server error');
    }
};

exports.approveGroupManager = async (req, res) => {
    const { reportId } = req.params;
    const { comment, toGeneralManager } = req.body;
    const userId = req.user.userId;
    try {
        const pool = await poolPromise;
        const reportResult = await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('userId', sql.Int, userId)
            .query(`
        SELECT mr.*
        FROM MonthlyReports mr
          JOIN Groups g ON mr.GroupId = g.GroupId
        WHERE mr.ReportId = @reportId
          AND g.ManagerId = @userId
      `);
        if (reportResult.recordset.length === 0) return res.status(403).send('Access denied: Not the group manager for this report');

        const newStatus = toGeneralManager ? 'submitted_to_general_manager' : 'submitted_to_finance';
        await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('comment', sql.NVarChar, comment)
            .input('newStatus', sql.NVarChar, newStatus)
            .query(`
        UPDATE MonthlyReports
        SET Status = @newStatus, ManagerComment = @comment
        WHERE ReportId = @reportId
          AND Status = 'submitted_to_group_manager'
      `);

        res.send(`Approved and submitted to ${toGeneralManager ? 'general manager' : 'finance'}`);
    } catch (err) {
        console.error('Error in approveGroupManager:', err.message);
        res.status(500).send(err.message);
    }
};

exports.approveGeneralManager = async (req, res) => {
    const { reportId } = req.params;
    const { comment } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('comment', sql.NVarChar, comment)
            .query(`
        UPDATE MonthlyReports
        SET Status = 'submitted_to_finance',
            GeneralManagerStatus = 'approved_by_general_manager',
            ManagerComment = @comment
        WHERE ReportId = @reportId
          AND Status = 'submitted_to_general_manager'
      `);
        res.send('Approved and submitted to finance');
    } catch (err) {
        console.error('Error in approveGeneralManager:', err.message);
        res.status(500).send(err.message);
    }
};

exports.approveFinance = async (req, res) => {
    const { reportId } = req.params;
    const { comment } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('comment', sql.NVarChar, comment)
            .query(`
        UPDATE MonthlyReports
        SET Status = 'approved',
            FinanceComment = @comment,
            ApprovedAt = GETDATE()
        WHERE ReportId = @reportId
          AND Status = 'submitted_to_finance'
      `);
        res.send('Final approved');
    } catch (err) {
        console.error('Error in approveFinance:', err.message);
        res.status(500).send(err.message);
    }
};
