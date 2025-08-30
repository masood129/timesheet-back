const express = require('express');
const router = express.Router();
const {sql, poolPromise} = require('../config/db.config');
const {getJalaliMonthRange} = require('../utils/dateConverter');

const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).send('Access denied');
    next();
};

/**
 * @swagger
 * /monthly-reports/{reportId}/exit-draft:
 *   delete:
 *     summary: Exit from draft state by deleting the draft monthly report (by user)
 *     tags: [MonthlyReports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the report to exit from draft
 *     responses:
 *       200:
 *         description: Exited from draft state successfully
 *       400:
 *         description: Only draft reports can be exited
 *       403:
 *         description: Access denied (not the owner or invalid role)
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
router.delete('/:reportId/exit-draft', checkRole(['user']), async (req, res) => {
    const {reportId} = req.params;
    const userId = req.user.userId;

    try {
        const pool = await poolPromise;

        // Check if the report exists, belongs to the user, and is in draft status
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

        // Delete the report to exit draft state, with additional Status = 'draft' condition for security
        await pool.request()
            .input('reportId', sql.Int, reportId)
            .query('DELETE FROM MonthlyReports WHERE ReportId = @reportId AND Status = \'draft\'');

        res.send('Exited from draft state and returned to normal');
    } catch (err) {
        console.error('Error in DELETE /monthly-reports/:reportId/exit-draft:', err.message);
        res.status(500).send('Server error');
    }
});

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
router.put('/:reportId/reject-to-draft', checkRole(['group_manager', 'general_manager', 'finance_manager']), async (req, res) => {
    const {reportId} = req.params;
    const {comment} = req.body;
    const userId = req.user.userId;
    const role = req.user.role;

    try {
        const pool = await poolPromise;

        // Check existence and access based on role
        let query = `
            SELECT Status, GroupId, GeneralManagerStatus
            FROM MonthlyReports
            WHERE ReportId = @reportId
        `;
        if (role === 'group_manager') {
            query += ' AND GroupId IN (SELECT GroupId FROM Groups WHERE ManagerId = @userId)';
        }

        const reportResult = await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('userId', sql.Int, userId)
            .query(query);

        if (reportResult.recordset.length === 0) {
            return res.status(404).send('Report not found or access denied');
        }

        const report = reportResult.recordset[0];
        const currentStatus = report.Status;
        const generalStatus = report.GeneralManagerStatus;

        // Check current status based on role
        let canReject = false;
        if (role === 'group_manager' && currentStatus === 'submitted_to_group_manager') {
            canReject = true;
        } else if (role === 'general_manager' && currentStatus === 'submitted_to_general_manager' && generalStatus === 'pending') {
            canReject = true;
        } else if (role === 'finance_manager' && currentStatus === 'submitted_to_finance') {
            canReject = true;
        }

        if (!canReject) {
            return res.status(400).send('Report cannot be rejected from current status');
        }

        // Update status to draft and add comment
        await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('comment', sql.NVarChar, comment)
            .query(`
                UPDATE MonthlyReports
                SET Status               = 'draft',
                    ManagerComment       = COALESCE(ManagerComment + ' | ', '') + @comment,
                    GeneralManagerStatus = NULL
                WHERE ReportId = @reportId
            `);

        res.send('Report rejected and reverted to draft');
    } catch (err) {
        console.error('Error in PUT /monthly-reports/:reportId/reject-to-draft:', err.message);
        res.status(500).send('Server error');
    }
});

/**
 * @swagger
 * /monthly-reports/check-submitted/jalali/{year}/{month}:
 *   get:
 *     summary: Get the status for the monthly report of the current user in the specified Jalali month
 *     tags: [MonthlyReports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Jalali year (e.g., 1404)
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: Jalali month (1-12, e.g., 6 for Shahrivar)
 *     responses:
 *       200:
 *         description: Status of the report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   nullable: true
 *                   description: The overall status (e.g., 'draft', 'approved', 'submitted_to_group_manager') or null if no report exists
 *       400:
 *         description: Invalid Jalali year or month
 *       403:
 *         description: Access denied (not user role)
 *       500:
 *         description: Server error
 */
router.get('/check-submitted/jalali/:year/:month', checkRole(['user']), async (req, res) => {
    const {year, month} = req.params;
    const userId = req.user.userId;

    const jalaliYear = parseInt(year);
    const jalaliMonth = parseInt(month);

    if (isNaN(jalaliYear) || isNaN(jalaliMonth) || jalaliMonth < 1 || jalaliMonth > 12) {
        return res.status(400).send('Invalid Jalali year or month');
    }

    try {
        const pool = await poolPromise;
        const monthRange = getJalaliMonthRange(jalaliYear, jalaliMonth);
        const startDate = monthRange.start;
        const endDate = monthRange.end;

        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .query(`
                SELECT Status
                FROM MonthlyReports
                WHERE UserId = @userId
                  AND SubmittedAt BETWEEN @startDate AND @endDate
            `);

        if (result.recordset.length > 0) {
            res.json({status: result.recordset[0].Status});
        } else {
            res.json({status: null});
        }
    } catch (err) {
        console.error('Error in GET /monthly-reports/check-submitted/jalali/:year/:month:', err.message);
        res.status(500).send('Server error');
    }
});

/**
 * @swagger
 * /monthly-reports/jalali/{year}/{month}:
 *   post:
 *     summary: Create or update a draft monthly report for a Jalali month
 *     tags: [MonthlyReports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Jalali year (e.g., 1404)
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: Jalali month (1-12, e.g., 6 for Shahrivar)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totalHours:
 *                 type: integer
 *                 description: Total hours worked in the month
 *               gymCost:
 *                 type: integer
 *                 description: Gym cost for the month
 *     responses:
 *       201:
 *         description: Report created or updated in draft status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonthlyReport'
 *       400:
 *         description: Invalid input or report already submitted
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post('/jalali/:year/:month', checkRole(['user']), async (req, res) => {
    const {year, month} = req.params;
    const {totalHours, gymCost} = req.body;
    const userId = req.user.userId;

    const jalaliYear = parseInt(year);
    const jalaliMonth = parseInt(month);

    if (isNaN(jalaliYear) || isNaN(jalaliMonth) || jalaliMonth < 1 || jalaliMonth > 12 || totalHours == null || gymCost == null) {
        return res.status(400).send('Invalid input');
    }

    try {
        const pool = await poolPromise;
        const monthRange = getJalaliMonthRange(jalaliYear, jalaliMonth);
        const startDate = monthRange.start;
        const endDate = monthRange.end;

        const gregorianStart = new Date(startDate);
        const gregorianYear = gregorianStart.getFullYear();
        const gregorianMonth = gregorianStart.getMonth() + 1;

        // Check for existing report
        const existingReport = await pool.request()
            .input('userId', sql.Int, userId)
            .input('jalaliYear', sql.Int, jalaliYear)
            .input('jalaliMonth', sql.Int, jalaliMonth)
            .query(`
                SELECT ReportId, Status
                FROM MonthlyReports
                WHERE UserId = @userId
                  AND JalaliYear = @jalaliYear
                  AND JalaliMonth = @jalaliMonth
            `);

        if (existingReport.recordset.length > 0) {
            const report = existingReport.recordset[0];
            if (report.Status !== 'draft') {
                return res.status(400).send('Report already submitted and cannot be updated');
            }
            // Update existing report
            const updateResult = await pool.request()
                .input('reportId', sql.Int, report.ReportId)
                .input('totalHours', sql.Int, totalHours)
                .input('gymCost', sql.Int, gymCost)
                .query(`
                    UPDATE MonthlyReports
                    SET TotalHours = @totalHours,
                        GymCost    = @gymCost
                    OUTPUT INSERTED.*
                    WHERE ReportId = @reportId
                `);
            res.status(201).json(updateResult.recordset[0]);
        } else {
            // Create new report
            const insertResult = await pool.request()
                .input('userId', sql.Int, userId)
                .input('year', sql.Int, gregorianYear)
                .input('month', sql.Int, gregorianMonth)
                .input('jalaliYear', sql.Int, jalaliYear)
                .input('jalaliMonth', sql.Int, jalaliMonth)
                .input('totalHours', sql.Int, totalHours)
                .input('gymCost', sql.Int, gymCost)
                .query(`
                    INSERT INTO MonthlyReports (UserId, Year, Month, JalaliYear, JalaliMonth, TotalHours, GymCost,
                                                Status)
                    OUTPUT INSERTED.*
                    VALUES (@userId, @year, @month, @jalaliYear, @jalaliMonth, @totalHours, @gymCost, 'draft')
                `);
            res.status(201).json(insertResult.recordset[0]);
        }
    } catch (err) {
        console.error('Error in POST /monthly-reports/jalali/:year/:month:', err.message);
        res.status(500).send('Server error');
    }
});

/**
 * @swagger
 * /monthly-reports/{reportId}/submit-to-manager:
 *   put:
 *     summary: Submit report to group manager (by user)
 *     tags: [MonthlyReports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Report submitted to manager
 *       400:
 *         description: Report cannot be submitted; invalid status
 *       403:
 *         description: Access denied
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
router.put('/:reportId/submit-to-manager', checkRole(['user']), async (req, res) => {
    const {reportId} = req.params;
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

        if (reportResult.recordset[0].Status !== 'draft') {
            return res.status(400).send('Only draft reports can be submitted');
        }

        await pool.request()
            .input('reportId', sql.Int, reportId)
            .query(`
                UPDATE MonthlyReports
                SET Status      = 'submitted_to_group_manager',
                    SubmittedAt = GETDATE()
                WHERE ReportId = @reportId
            `);

        res.send('Report submitted to group manager');
    } catch (err) {
        console.error('Error in PUT /monthly-reports/:reportId/submit-to-manager:', err.message);
        res.status(500).send('Server error');
    }
});

/**
 * @swagger
 * /monthly-reports/{reportId}/approve-by-manager:
 *   put:
 *     summary: Approve report by group manager
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
 *               comment: { type: string, description: "Optional comment" }
 *     responses:
 *       200:
 *         description: Report approved by group manager
 *       400:
 *         description: Report cannot be approved; invalid status
 *       403:
 *         description: Access denied
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
router.put('/:reportId/approve-by-manager', checkRole(['group_manager']), async (req, res) => {
    const {reportId} = req.params;
    const {comment} = req.body;
    const userId = req.user.userId;

    try {
        const pool = await poolPromise;

        const reportResult = await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('userId', sql.Int, userId)
            .query(`
                SELECT Status, GroupId
                FROM MonthlyReports
                WHERE ReportId = @reportId
                  AND GroupId IN (SELECT GroupId FROM Groups WHERE ManagerId = @userId)
            `);

        if (reportResult.recordset.length === 0) {
            return res.status(404).send('Report not found or access denied');
        }

        if (reportResult.recordset[0].Status !== 'submitted_to_group_manager') {
            return res.status(400).send('Report cannot be approved from current status');
        }

        await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('comment', sql.NVarChar, comment || null)
            .query(`
                UPDATE MonthlyReports
                SET Status               = 'submitted_to_general_manager',
                    ManagerComment       = @comment,
                    GeneralManagerStatus = 'pending'
                WHERE ReportId = @reportId
            `);

        res.send('Report approved by group manager and submitted to general manager');
    } catch (err) {
        console.error('Error in PUT /monthly-reports/:reportId/approve-by-manager:', err.message);
        res.status(500).send('Server error');
    }
});

/**
 * @swagger
 * /monthly-reports/{reportId}/approve-by-general-manager:
 *   put:
 *     summary: Approve report by general manager
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
 *               comment: { type: string, description: "Optional comment" }
 *     responses:
 *       200:
 *         description: Report approved by general manager
 *       400:
 *         description: Report cannot be approved; invalid status
 *       403:
 *         description: Access denied
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
router.put('/:reportId/approve-by-general-manager', checkRole(['general_manager']), async (req, res) => {
    const {reportId} = req.params;
    const {comment} = req.body;

    try {
        const pool = await poolPromise;

        const reportResult = await pool.request()
            .input('reportId', sql.Int, reportId)
            .query(`
                SELECT Status, GeneralManagerStatus
                FROM MonthlyReports
                WHERE ReportId = @reportId
            `);

        if (reportResult.recordset.length === 0) {
            return res.status(404).send('Report not found');
        }

        const report = reportResult.recordset[0];
        if (report.Status !== 'submitted_to_general_manager' || report.GeneralManagerStatus !== 'pending') {
            return res.status(400).send('Report cannot be approved from current status');
        }

        await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('comment', sql.NVarChar, comment || null)
            .query(`
                UPDATE MonthlyReports
                SET Status               = 'submitted_to_finance',
                    ManagerComment       = COALESCE(ManagerComment + ' | ', '') + @comment,
                    GeneralManagerStatus = 'approved_by_general_manager'
                WHERE ReportId = @reportId
            `);

        res.send('Report approved by general manager and submitted to finance');
    } catch (err) {
        console.error('Error in PUT /monthly-reports/:reportId/approve-by-general-manager:', err.message);
        res.status(500).send('Server error');
    }
});

/**
 * @swagger
 * /monthly-reports/{reportId}/approve-by-finance:
 *   put:
 *     summary: Approve report by finance manager
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
 *               comment: { type: string, description: "Optional comment" }
 *     responses:
 *       200:
 *         description: Report approved by finance
 *       400:
 *         description: Report cannot be approved; invalid status
 *       403:
 *         description: Access denied
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
router.put('/:reportId/approve-by-finance', checkRole(['finance_manager']), async (req, res) => {
    const {reportId} = req.params;
    const {comment} = req.body;

    try {
        const pool = await poolPromise;

        const reportResult = await pool.request()
            .input('reportId', sql.Int, reportId)
            .query(`
                SELECT Status
                FROM MonthlyReports
                WHERE ReportId = @reportId
            `);

        if (reportResult.recordset.length === 0) {
            return res.status(404).send('Report not found');
        }

        if (reportResult.recordset[0].Status !== 'submitted_to_finance') {
            return res.status(400).send('Report cannot be approved from current status');
        }

        await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('comment', sql.NVarChar, comment || null)
            .query(`
                UPDATE MonthlyReports
                SET Status         = 'approved',
                    FinanceComment = @comment,
                    ApprovedAt     = GETDATE()
                WHERE ReportId = @reportId
            `);

        res.send('Report approved by finance');
    } catch (err) {
        console.error('Error in PUT /monthly-reports/:reportId/approve-by-finance:', err.message);
        res.status(500).send('Server error');
    }
});

/**
 * @swagger
 * /monthly-reports/{reportId}:
 *   get:
 *     summary: Get report by ID
 *     tags: [MonthlyReports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Report details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonthlyReport'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
router.get('/:reportId', async (req, res) => {
    const {reportId} = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    try {
        const pool = await poolPromise;
        let query = `
            SELECT mr.*, u.Username
            FROM MonthlyReports mr
                     JOIN Users u ON mr.UserId = u.UserId
            WHERE mr.ReportId = @reportId
        `;
        if (role === 'user') {
            query += ' AND mr.UserId = @userId';
        } else if (role === 'group_manager') {
            query += ' AND mr.GroupId IN (SELECT GroupId FROM Groups WHERE ManagerId = @userId)';
        }

        const result = await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('userId', sql.Int, userId)
            .query(query);

        if (result.recordset.length === 0) {
            return res.status(404).send('Report not found or access denied');
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error in GET /monthly-reports/:reportId:', err.message);
        res.status(500).send('Server error');
    }
});

/**
 * @swagger
 * /monthly-reports/group/{year}/{month}:
 *   get:
 *     summary: Get reports for group manager, general manager, or finance manager using Gregorian calendar
 *     tags: [MonthlyReports]
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MonthlyReport'
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/group/:year/:month', checkRole(['group_manager', 'general_manager', 'finance_manager']), async (req, res) => {
    const {year, month} = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    try {
        const pool = await poolPromise;
        let query = `
            SELECT mr.*, u.Username
            FROM MonthlyReports mr
                     JOIN Users u ON mr.UserId = u.UserId
            WHERE mr.Year = @year
              AND mr.Month = @month
        `;
        if (role === 'group_manager') {
            query += ' AND mr.GroupId IN (SELECT GroupId FROM Groups WHERE ManagerId = @userId)';
        }

        const result = await pool.request()
            .input('year', sql.Int, parseInt(year))
            .input('month', sql.Int, parseInt(month))
            .input('userId', sql.Int, userId)
            .query(query);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error in GET /monthly-reports/group/:year/:month:', err.message);
        res.status(500).send('Server error');
    }
});

/**
 * @swagger
 * /monthly-reports/jalali/group/{year}/{month}:
 *   get:
 *     summary: Get reports for group manager, general manager, or finance manager using Jalali calendar
 *     tags: [MonthlyReports]
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MonthlyReport'
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/jalali/group/:year/:month', checkRole(['group_manager', 'general_manager', 'finance_manager']), async (req, res) => {
    const {year, month} = req.params;
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
            SELECT mr.*, u.Username
            FROM MonthlyReports mr
                     JOIN Users u ON mr.UserId = u.UserId
            WHERE mr.JalaliYear = @jalaliYear
              AND mr.JalaliMonth = @jalaliMonth
        `;
        if (role === 'group_manager') {
            query += ' AND mr.GroupId IN (SELECT GroupId FROM Groups WHERE ManagerId = @userId)';
        }

        const result = await pool.request()
            .input('jalaliYear', sql.Int, jalaliYear)
            .input('jalaliMonth', sql.Int, jalaliMonth)
            .input('userId', sql.Int, userId)
            .query(query);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error in GET /monthly-reports/jalali/group/:year/:month:', err.message);
        res.status(500).send('Server error');
    }
});

/**
 * @swagger
 * /monthly-reports/group/range/{startYear}/{startMonth}/{endYear}/{endMonth}:
 *   get:
 *     summary: Get reports for group manager, general manager, or finance manager within a year-month range (Gregorian)
 *     tags: [MonthlyReports]
 *     parameters:
 *       - in: path
 *         name: startYear
 *         required: true
 *         schema:
 *           type: integer
 *         description: Start year of the range
 *       - in: path
 *         name: startMonth
 *         required: true
 *         schema:
 *           type: integer
 *         description: Start month of the range (1-12)
 *       - in: path
 *         name: endYear
 *         required: true
 *         schema:
 *           type: integer
 *         description: End year of the range
 *       - in: path
 *         name: endMonth
 *         required: true
 *         schema:
 *           type: integer
 *         description: End month of the range (1-12)
 *     responses:
 *       200:
 *         description: List of reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MonthlyReport'
 *       400: { description: Invalid input (e.g., invalid year or month) }
 *       403: { description: Access denied }
 *       500: { description: Server error }
 */
router.get('/group/range/:startYear/:startMonth/:endYear/:endMonth', checkRole(['group_manager', 'general_manager', 'finance_manager']), async (req, res) => {
    const {startYear, startMonth, endYear, endMonth} = req.params;
    const userId = req.user.userId;
    const role = req.user.role;
    try {
        // Input validation
        const sYear = parseInt(startYear);
        const sMonth = parseInt(startMonth);
        const eYear = parseInt(endYear);
        const eMonth = parseInt(endMonth);

        if (isNaN(sYear) || isNaN(sMonth) || isNaN(eYear) || isNaN(eMonth) ||
            sMonth < 1 || sMonth > 12 || eMonth < 1 || eMonth > 12) {
            return res.status(400).send('Invalid year or month');
        }

        // Ensure valid range
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
        if (role === 'group_manager') {
            query += ' AND GroupId IN (SELECT GroupId FROM Groups WHERE ManagerId = @userId)';
        }

        const result = await pool.request()
            .input('startYear', sql.Int, sYear)
            .input('startMonth', sql.Int, sMonth)
            .input('endYear', sql.Int, eYear)
            .input('endMonth', sql.Int, eMonth)
            .input('userId', sql.Int, userId)
            .query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

/**
 * @swagger
 * /monthly-reports/report-ids/jalali/{year}/{month}:
 *   get:
 *     summary: Get report IDs and user IDs for the specified Jalali month (for authorized users)
 *     tags: [MonthlyReports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Jalali year (e.g., 1404)
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: Jalali month (1-12, e.g., 6 for Shahrivar)
 *     responses:
 *       200:
 *         description: List of report IDs and user IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   reportId: { type: integer }
 *                   userId: { type: integer }
 *       400:
 *         description: Invalid Jalali year or month
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/report-ids/jalali/:year/:month', checkRole(['user', 'group_manager', 'general_manager', 'finance_manager']), async (req, res) => {
    const {year, month} = req.params;
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

        res.json(result.recordset.map(row => ({reportId: row.ReportId, userId: row.UserId})));
    } catch (err) {
        console.error('Error in GET /monthly-reports/report-ids/jalali/:year/:month:', err.message);
        res.status(500).send('Server error');
    }
});

/**
 * @swagger
 * /monthly-reports/my-drafts:
 *   get:
 *     summary: Get list of draft reports for the current user
 *     tags: [MonthlyReports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of draft reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MonthlyReport'
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/my-drafts', checkRole(['user']), async (req, res) => {
    const userId = req.user.userId;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT mr.*, u.Username
                FROM MonthlyReports mr
                         JOIN Users u ON mr.UserId = u.UserId
                WHERE mr.UserId = @userId
                  AND mr.Status = 'draft'
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error in GET /monthly-reports/my-drafts:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;