const {sql, poolPromise} = require('../../config/db.config');

const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).send('Access denied');
    next();
};

const validateReportId = (req, res, next) => {
    const reportId = parseInt(req.params.reportId);
    if (isNaN(reportId)) {
        return res.status(400).send('Invalid reportId: must be an integer');
    }
    req.params.reportId = reportId;
    next();
};

/**
 * @swagger
 * /monthly-reports/{reportId}/submit-to-group-manager:
 *   put:
 *     summary: Submit report to group manager (by user or group manager)
 *     tags: [MonthlyReports]
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200: { description: Submitted to group manager }
 *       403: { description: Access denied }
 *       500: { description: Server error }
 */
const submitToGroupManager = async (req, res) => {
    checkRole(['user', 'group_manager', 'general_manager', 'finance_manager'])(req, res, async () => {
        validateReportId(req, res, async () => {
            const {reportId} = req.params;
            const userId = req.user.userId;
            const role = req.user.role;
            try {
                const pool = await poolPromise;
                const reportResult = await pool.request()
                    .input('reportId', sql.Int, reportId)
                    .query('SELECT UserId, Status, GroupId FROM MonthlyReports WHERE ReportId = @reportId');

                if (reportResult.recordset.length === 0) {
                    return res.status(404).send('Report not found');
                }

                const report = reportResult.recordset[0];
                if (report.Status !== 'draft') {
                    return res.status(400).send('Report cannot be submitted; it is not in draft status');
                }

                if (role === 'user' && report.UserId !== userId) {
                    return res.status(403).send('Access denied: Users can only submit their own reports');
                }

                let newStatus = 'submitted_to_group_manager';

                if (role === 'group_manager' && report.UserId === userId) {
                    const groupCheck = await pool.request()
                        .input('groupId', sql.Int, report.GroupId)
                        .input('userId', sql.Int, userId)
                        .query('SELECT 1 FROM Groups WHERE GroupId = @groupId AND ManagerId = @userId');

                    if (groupCheck.recordset.length > 0) {
                        newStatus = 'submitted_to_general_manager';
                    }
                }

                if (role === 'general_manager' && report.UserId === userId) {
                    newStatus = 'submitted_to_finance';
                }

                await pool.request()
                    .input('reportId', sql.Int, reportId)
                    .input('newStatus', sql.NVarChar, newStatus)
                    .query('UPDATE MonthlyReports SET Status = @newStatus, SubmittedAt = GETDATE() WHERE ReportId = @reportId AND Status = \'draft\'');

                res.send(`Submitted to ${newStatus.replace('submitted_to_', '')}`);
            } catch (err) {
                console.error('Error in PUT /monthly-reports/:reportId/submit-to-group-manager:', err.message);
                res.status(500).send('Server error');
            }
        });
    });
};

/**
 * @swagger
 * /monthly-reports/{reportId}/approve-group-manager:
 *   put:
 *     summary: Approve and submit to general manager or finance (by group manager)
 *     tags: [MonthlyReports]
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment: { type: string }
 *               toGeneralManager: { type: boolean }
 *     responses:
 *       200: { description: Approved and submitted }
 *       403: { description: Access denied }
 *       500: { description: Server error }
 */
const approveGroupManager = async (req, res) => {
    checkRole(['group_manager'])(req, res, async () => {
        validateReportId(req, res, async () => {
            const {reportId} = req.params;
            const {comment, toGeneralManager} = req.body;
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

                if (reportResult.recordset.length === 0) {
                    return res.status(403).send('Access denied: Not the group manager for this report');
                }

                const newStatus = toGeneralManager ? 'submitted_to_general_manager' : 'submitted_to_finance';
                await pool.request()
                    .input('reportId', sql.Int, reportId)
                    .input('comment', sql.NVarChar, comment)
                    .input('newStatus', sql.NVarChar, newStatus)
                    .query(`
                        UPDATE MonthlyReports
                        SET Status         = @newStatus,
                            ManagerComment = @comment
                        WHERE ReportId = @reportId
                          AND Status = 'submitted_to_group_manager'
                    `);
                res.send(`Approved and submitted to ${toGeneralManager ? 'general manager' : 'finance'}`);
            } catch (err) {
                res.status(500).send(err.message);
            }
        });
    });
};

/**
 * @swagger
 * /monthly-reports/{reportId}/approve-general-manager:
 *   put:
 *     summary: Approve and submit to finance (by general manager)
 *     tags: [MonthlyReports]
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment: { type: string }
 *     responses:
 *       200: { description: Approved and submitted to finance }
 *       403: { description: Access denied }
 *       500: { description: Server error }
 */
const approveGeneralManager = async (req, res) => {
    checkRole(['general_manager'])(req, res, async () => {
        validateReportId(req, res, async () => {
            const {reportId} = req.params;
            const {comment} = req.body;
            try {
                const pool = await poolPromise;
                await pool.request()
                    .input('reportId', sql.Int, reportId)
                    .input('comment', sql.NVarChar, comment)
                    .query(`
                        UPDATE MonthlyReports
                        SET Status               = 'submitted_to_finance',
                            GeneralManagerStatus = 'approved_by_general_manager',
                            ManagerComment       = @comment
                        WHERE ReportId = @reportId
                          AND Status = 'submitted_to_general_manager'
                    `);
                res.send('Approved and submitted to finance');
            } catch (err) {
                res.status(500).send(err.message);
            }
        });
    });
};

/**
 * @swagger
 * /monthly-reports/{reportId}/approve-finance:
 *   put:
 *     summary: Final approve (by finance)
 *     tags: [MonthlyReports]
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment: { type: string }
 *     responses:
 *       200: { description: Approved }
 *       403: { description: Access denied }
 *       500: { description: Server error }
 */
const approveFinance = async (req, res) => {
    checkRole(['finance_manager'])(req, res, async () => {
        validateReportId(req, res, async () => {
            const {reportId} = req.params;
            const {comment} = req.body;
            try {
                const pool = await poolPromise;
                await pool.request()
                    .input('reportId', sql.Int, reportId)
                    .input('comment', sql.NVarChar, comment)
                    .query(`
                        UPDATE MonthlyReports
                        SET Status         = 'approved',
                            FinanceComment = @comment,
                            ApprovedAt     = GETDATE()
                        WHERE ReportId = @reportId
                          AND Status = 'submitted_to_finance'
                    `);
                res.send('Final approved');
            } catch (err) {
                res.status(500).send(err.message);
            }
        });
    });
};

/**
 * @swagger
 * /monthly-reports/{reportId}/reject-to-draft:
 *   put:
 *     summary: Reject report and revert to draft (by managers)
 *     tags: [MonthlyReports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment: { type: string, description: "Reason for rejection" }
 *     responses:
 *       200: { description: Report rejected and reverted to draft }
 *       400: { description: Report cannot be rejected; invalid status }
 *       403: { description: Access denied }
 *       404: { description: Report not found }
 *       500: { description: Server error }
 */
const rejectToDraft = async (req, res) => {
    checkRole(['group_manager', 'general_manager', 'finance_manager'])(req, res, async () => {
        validateReportId(req, res, async () => {
            const {reportId} = req.params;
            const {comment} = req.body;
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
                if (report.Status === 'draft') {
                    return res.status(400).send('Report is already in draft status');
                }
                if (report.Status === 'approved') {
                    return res.status(400).send('Approved reports cannot be rejected');
                }

                let updateQuery = `
                    UPDATE MonthlyReports
                    SET Status               = 'draft',
                        GeneralManagerStatus = 'pending',
                        SubmittedAt          = NULL,
                        ApprovedAt           = NULL
                `;
                if (role === 'finance_manager') {
                    updateQuery += `, FinanceComment = ISNULL(FinanceComment + '\\n', '') + @comment`;
                } else {
                    updateQuery += `, ManagerComment = ISNULL(ManagerComment + '\\n', '') + @comment`;
                }
                updateQuery += ` WHERE ReportId = @reportId`;

                await pool.request()
                    .input('reportId', sql.Int, reportId)
                    .input('comment', sql.NVarChar, comment || 'Rejected without comment')
                    .query(updateQuery);

                res.send('Report rejected and reverted to draft');
            } catch (err) {
                console.error('Error in PUT /monthly-reports/:reportId/reject-to-draft:', err.message);
                res.status(500).send('Server error');
            }
        });
    });
};

module.exports = {
    submitToGroupManager,
    approveGroupManager,
    approveGeneralManager,
    approveFinance,
    rejectToDraft,
    checkRole,
    validateReportId
};