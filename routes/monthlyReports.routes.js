const express = require('express');
const router = express.Router();
const {sql, poolPromise} = require('../config/db.config');
const {getJalaliMonthRange} = require('../utils/dateConverter');

const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).send('Access denied');
    next();
};

// Middleware for validating reportId as integer
const validateReportId = (req, res, next) => {
    const reportId = parseInt(req.params.reportId);
    if (isNaN(reportId)) {
        return res.status(400).send('Invalid reportId: must be an integer');
    }
    req.params.reportId = reportId; // Normalize to number
    next();
};

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
router.delete('/:reportId/exit-draft', checkRole(['user']), validateReportId, async (req, res) => {
    const { reportId } = req.params;
    const userId = req.user.userId;

    try {
        const pool = await poolPromise;

        // چک کردن وجود گزارش و اینکه متعلق به کاربر باشد و در وضعیت draft باشد
        const reportResult = await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('userId', sql.Int, userId)
            .query(`
                SELECT Status
                FROM MonthlyReports
                WHERE ReportId = @reportId AND UserId = @userId
            `);

        if (reportResult.recordset.length === 0) {
            return res.status(404).send('Report not found or access denied');
        }

        const status = reportResult.recordset[0].Status;
        if (status !== 'draft') {
            return res.status(400).send('Only draft reports can be exited');
        }

        // حذف گزارش برای خروج از حالت draft، با شرط اضافی Status = 'draft' برای امنیت بیشتر
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
router.put('/:reportId/reject-to-draft', checkRole(['group_manager', 'general_manager', 'finance_manager']), validateReportId, async (req, res) => {
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

        // محدود کردن دسترسی بر اساس نقش
        if (role === 'group_manager') {
            query += ' AND g.ManagerId = @userId';
        }
        // برای general_manager و finance_manager، دسترسی به همه (بدون شرط اضافی)

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

        // بروزرسانی وضعیت به draft و اضافه کردن کامنت
        let updateQuery = `
            UPDATE MonthlyReports
            SET Status = 'draft',
                GeneralManagerStatus = 'pending',
                SubmittedAt = NULL,
                ApprovedAt = NULL
        `;
        if (role === 'finance_manager') {
            updateQuery += `, FinanceComment = ISNULL(FinanceComment + '\n', '') + @comment`;
        } else { // group_manager or general_manager
            updateQuery += `, ManagerComment = ISNULL(ManagerComment + '\n', '') + @comment`;
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
 *           description: Jalali year (e.g., 1404)
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           description: Jalali month (1-12, e.g., 6 for Shahrivar)
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
        console.error('Error in GET /monthly-reports/check-submitted/jalali/:year/:month:', err.message);
        res.status(500).send('Server error');
    }
});

/**
 * @swagger
 * /monthly-gym-costs:
 *   post:
 *     summary: Save monthly gym cost
 *     tags: [MonthlyReports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               year: { type: integer }
 *               month: { type: integer }
 *               cost: { type: integer }
 *               hours: { type: integer }
 *     responses:
 *       201: { description: Gym cost saved }
 *       400: { description: Invalid input }
 *       500: { description: Server error }
 */
router.post('/monthly-gym-costs', checkRole(['user']), async (req, res) => {
    const userId = req.user.userId; // Changed: Use authenticated userId instead of body
    const { year, month, cost, hours } = req.body;
    if (!year || !month || !cost) {
        return res.status(400).send('Missing required fields');
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('year', sql.Int, year)
            .input('month', sql.Int, month)
            .input('cost', sql.Int, cost)
            .input('hours', sql.Int, hours || null)
            .query(`
                IF EXISTS (SELECT 1 FROM MonthlyGymCosts WHERE UserId = @userId AND Year = @year AND Month = @month)
                    UPDATE MonthlyGymCosts SET Cost = @cost, GymHours = @hours 
                    OUTPUT INSERTED.*
                    WHERE UserId = @userId AND Year = @year AND Month = @month
                ELSE
                    INSERT INTO MonthlyGymCosts (UserId, Year, Month, Cost, GymHours) 
                    OUTPUT INSERTED.*
                    VALUES (@userId, @year, @month, @cost, @hours)
            `);
        res.status(201).json(result.recordset[0] || { message: 'Gym cost saved' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

/**
 * @swagger
 * /monthly-gym-costs/jalali:
 *   post:
 *     summary: Save monthly gym cost using Jalali calendar
 *     tags: [MonthlyReports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               year: { type: integer, description: "Jalali year of the gym cost" }
 *               month: { type: integer, description: "Jalali month of the gym cost (1-12)" }
 *               cost: { type: integer, description: "Gym cost amount" }
 *               hours: { type: integer, description: "Gym hours" }
 *             required:
 *               - year
 *               - month
 *               - cost
 *               - hours
 *     responses:
 *       201:
 *         description: Gym cost saved with Jalali date
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/monthly-gym-costs/jalali', checkRole(['user']), async (req, res) => {
    const userId = req.user.userId; // Changed: Use authenticated userId instead of body
    const { year, month, cost, hours } = req.body;

    // اعتبارسنجی ورودی‌ها
    if (!year || !month || !cost || isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).send('Invalid input');
    }

    try {
        // تبدیل تاریخ جلالی به میلادی
        const monthRange = getJalaliMonthRange(year, month);
        const gregorianYear = monthRange.start.getFullYear();
        const gregorianMonth = monthRange.start.getMonth() + 1;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('gregorianYear', sql.Int, gregorianYear)
            .input('gregorianMonth', sql.Int, gregorianMonth)
            .input('cost', sql.Int, cost)
            .input('hours', sql.Int, hours || null)
            .query(`
                IF EXISTS (SELECT 1 FROM MonthlyGymCosts WHERE UserId = @userId AND Year = @gregorianYear AND Month = @gregorianMonth)
                    UPDATE MonthlyGymCosts 
                    SET Cost = @cost, GymHours = @hours 
                    OUTPUT INSERTED.*
                    WHERE UserId = @userId AND Year = @gregorianYear AND Month = @gregorianMonth
                ELSE
                    INSERT INTO MonthlyGymCosts (UserId, Year, Month, Cost, GymHours) 
                    OUTPUT INSERTED.*
                    VALUES (@userId, @gregorianYear, @gregorianMonth, @cost, @hours)
            `);

        res.status(201).json(result.recordset[0] || { message: 'Gym cost saved with Jalali date' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

/**
 * @swagger
 * /monthly-reports/{year}/{month}:
 *   post:
 *     summary: Create monthly report (by user) using Gregorian calendar
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
 *       201: { description: Report created }
 *       400: { description: Invalid input }
 *       500: { description: Server error }
 */
router.post('/:year/:month', checkRole(['user', 'group_manager', 'general_manager']), async (req, res) => {
    const {year, month} = req.params;
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
            .query('SELECT SUM(Duration) AS TotalHours FROM DailyProjectTasks WHERE UserId = @userId AND YEAR(Date) = @year AND MONTH(Date) = @month');
        const totalHours = hoursResult.recordset[0].TotalHours || 0;

        const gymResult = await pool.request()
            .input('userId', sql.Int, userId)
            .input('year', sql.Int, year)
            .input('month', sql.Int, month)
            .query('SELECT Cost, GymHours FROM MonthlyGymCosts WHERE UserId = @userId AND Year = @year AND Month = @month');
        const gymCost = gymResult.recordset[0]?.Cost || 0;
        // const gymHours = gymResult.recordset[0]?.GymHours || 0;  // مثال: اگر در گزارش نیاز باشه

        // Check for existing report
        const existingReport = await pool.request()
            .input('userId', sql.Int, userId)
            .input('year', sql.Int, year)
            .input('month', sql.Int, month)
            .query(`
                SELECT Status
                FROM MonthlyReports
                WHERE UserId = @userId AND Year = @year AND Month = @month
            `);

        if (existingReport.recordset.length > 0) {
            const status = existingReport.recordset[0].Status;
            if (status !== 'draft') {
                return res.status(400).send('Report already submitted and cannot be updated');
            }
            // Update if draft
            const updateResult = await pool.request()
                .input('userId', sql.Int, userId)
                .input('year', sql.Int, year)
                .input('month', sql.Int, month)
                .input('totalHours', sql.Int, totalHours)
                .input('gymCost', sql.Int, gymCost)
                .input('groupId', sql.Int, groupId)
                .query(`
                    UPDATE MonthlyReports 
                    SET TotalHours = @totalHours, GymCost = @gymCost, Status = 'draft', GroupId = @groupId 
                    OUTPUT INSERTED.*
                    WHERE UserId = @userId AND Year = @year AND Month = @month AND Status = 'draft'
                `);
            res.status(201).json(updateResult.recordset[0]);
        } else {
            // Insert new
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
        res.status(500).send(err.message);
    }
});

/**
 * @swagger
 * /monthly-reports/jalali/{year}/{month}:
 *   post:
 *     summary: Create monthly report using Jalali calendar (by user)
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
 *       201: { description: Report created }
 *       400: { description: Invalid input }
 *       500: { description: Server error }
 */
router.post('/jalali/:year/:month', checkRole(['user', 'group_manager', 'general_manager']), async (req, res) => {
    const {year, month} = req.params;
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
            .query('SELECT SUM(Duration) AS TotalHours FROM DailyProjectTasks WHERE UserId = @userId AND Date >= @startDate AND Date <= @endDate');

        const totalHours = hoursResult.recordset[0].TotalHours || 0;

        const gymResult = await pool.request()
            .input('userId', sql.Int, userId)
            .input('year', sql.Int, gregorianYear)
            .input('month', sql.Int, gregorianMonth)
            .query('SELECT Cost, GymHours FROM MonthlyGymCosts WHERE UserId = @userId AND Year = @year AND Month = @month');
        const gymCost = gymResult.recordset[0]?.Cost || 0;
        // const gymHours = gymResult.recordset[0]?.GymHours || 0;  // مثال: اگر در گزارش نیاز باشه

        // Check for existing report
        const existingReport = await pool.request()
            .input('userId', sql.Int, userId)
            .input('year', sql.Int, gregorianYear)
            .input('month', sql.Int, gregorianMonth)
            .query(`
                SELECT Status
                FROM MonthlyReports
                WHERE UserId = @userId AND Year = @year AND Month = @month
            `);

        if (existingReport.recordset.length > 0) {
            const status = existingReport.recordset[0].Status;
            if (status !== 'draft') {
                return res.status(400).send('Report already submitted and cannot be updated');
            }
            // Update if draft
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
                    SET JalaliYear = @jalaliYear, JalaliMonth = @jalaliMonth, TotalHours = @totalHours, GymCost = @gymCost, Status = 'draft', GroupId = @groupId 
                    OUTPUT INSERTED.*
                    WHERE UserId = @userId AND Year = @year AND Month = @month AND Status = 'draft'
                `);
            res.status(201).json(updateResult.recordset[0]);
        } else {
            // Insert new
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
        res.status(500).send(err.message);
    }
});

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
router.put('/:reportId/submit-to-group-manager', checkRole(['user', 'group_manager']), validateReportId, async (req, res) => {
    const {reportId} = req.params;
    const userId = req.user.userId;
    try {
        const pool = await poolPromise;
        const reportResult = await pool.request()
            .input('reportId', sql.Int, reportId)
            .query('SELECT UserId, Status FROM MonthlyReports WHERE ReportId = @reportId');

        if (reportResult.recordset.length === 0) {
            return res.status(404).send('Report not found');
        }

        const report = reportResult.recordset[0];
        if (report.Status !== 'draft') {
            return res.status(400).send('Report cannot be submitted; it is not in draft status');
        }

        if (req.user.role === 'user' && report.UserId !== userId) {
            return res.status(403).send('Access denied: Users can only submit their own reports');
        }

        await pool.request()
            .input('reportId', sql.Int, reportId)
            .query('UPDATE MonthlyReports SET Status = \'submitted_to_group_manager\', SubmittedAt = GETDATE() WHERE ReportId = @reportId AND Status = \'draft\'');
        res.send('Submitted to group manager');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

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
router.put('/:reportId/approve-group-manager', checkRole(['group_manager']), validateReportId, async (req, res) => {
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
router.put('/:reportId/approve-general-manager', checkRole(['general_manager']), validateReportId, async (req, res) => {
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
router.put('/:reportId/approve-finance', checkRole(['finance_manager']), validateReportId, async (req, res) => {
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

/**
 * @swagger
 * /monthly-reports/{reportId}:
 *   get:
 *     summary: Get report by ID
 *     tags: [MonthlyReports]
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200: { description: Report details }
 *       403: { description: Access denied }
 *       404: { description: Report not found }
 *       500: { description: Server error }
 */
router.get('/:reportId', validateReportId, async (req, res) => {
    const {reportId} = req.params;
    const userId = req.user.userId;
    const role = req.user.role;
    try {
        const pool = await poolPromise;
        let query = 'SELECT * FROM MonthlyReports WHERE ReportId = @reportId';
        if (role === 'user') {
            query += ' AND UserId = @userId';
        } else if (role === 'group_manager') {
            query += ' AND GroupId IN (SELECT GroupId FROM Groups WHERE ManagerId = @userId)';
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
        res.status(500).send(err.message);
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
 *       200: { description: List of reports }
 *       403: { description: Access denied }
 *       500: { description: Server error }
 */
router.get('/group/:year/:month', checkRole(['group_manager', 'general_manager', 'finance_manager']), async (req, res) => {
    const {year, month} = req.params;
    const userId = req.user.userId;
    const role = req.user.role;
    try {
        const pool = await poolPromise;
        let query = 'SELECT mr.*, u.Username FROM MonthlyReports mr JOIN Users u ON mr.UserId = u.UserId WHERE Year = @year AND Month = @month';
        if (role === 'group_manager') {
            query += ' AND GroupId IN (SELECT GroupId FROM Groups WHERE ManagerId = @userId)';
        }

        const result = await pool.request()
            .input('year', sql.Int, year)
            .input('month', sql.Int, month)
            .input('userId', sql.Int, userId)
            .query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
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
 *       200: { description: List of reports }
 *       403: { description: Access denied }
 *       500: { description: Server error }
 */
router.get('/jalali/group/:year/:month', checkRole(['group_manager', 'general_manager', 'finance_manager']), async (req, res) => {
    const {year, month} = req.params;
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
        res.status(500).send(err.message);
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
        // اعتبارسنجی ورودی‌ها
        const sYear = parseInt(startYear);
        const sMonth = parseInt(startMonth);
        const eYear = parseInt(endYear);
        const eMonth = parseInt(endMonth);

        if (isNaN(sYear) || isNaN(sMonth) || isNaN(eYear) || isNaN(eMonth) ||
            sMonth < 1 || sMonth > 12 || eMonth < 1 || eMonth > 12) {
            return res.status(400).send('Invalid year or month');
        }

        // اطمینان از اینکه بازه معتبر است
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

module.exports = router;