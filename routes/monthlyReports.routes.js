const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db.config');


const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).send('Access denied');
    next();
};

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
 *               userId: { type: integer }
 *               year: { type: integer }
 *               month: { type: integer }
 *               cost: { type: integer }
 *     responses:
 *       201: { description: Gym cost saved }
 *       400: { description: Invalid input }
 *       500: { description: Server error }
 */
router.post('/monthly-gym-costs', checkRole(['user']), async (req, res) => {
    const { userId, year, month, cost } = req.body;
    if (!userId || !year || !month || !cost) {
        return res.status(400).send('Missing required fields');
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('year', sql.Int, year)
            .input('month', sql.Int, month)
            .input('cost', sql.Int, cost)
            .query(`
                IF EXISTS (SELECT 1 FROM MonthlyGymCosts WHERE UserId = @userId AND Year = @year AND Month = @month)
                    UPDATE MonthlyGymCosts SET Cost = @cost WHERE UserId = @userId AND Year = @year AND Month = @month
                ELSE
                    INSERT INTO MonthlyGymCosts (UserId, Year, Month, Cost) VALUES (@userId, @year, @month, @cost)
            `);
        res.status(201).send('Gym cost saved');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

/**
 * @swagger
 * /monthly-reports/{year}/{month}:
 *   post:
 *     summary: Create monthly report (by user)
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
router.post('/:year/:month', checkRole(['user']), async (req, res) => {
    const { year, month } = req.params;
    const userId = req.user.userId;
    try {
        const pool = await poolPromise;
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
            .query('SELECT Cost FROM MonthlyGymCosts WHERE UserId = @userId AND Year = @year AND Month = @month');
        const gymCost = gymResult.recordset[0]?.Cost || 0;

        await pool.request()
            .input('userId', sql.Int, userId)
            .input('year', sql.Int, year)
            .input('month', sql.Int, month)
            .input('totalHours', sql.Int, totalHours)
            .input('gymCost', sql.Int, gymCost)
            .query('INSERT INTO MonthlyReports (UserId, Year, Month, TotalHours, GymCost, Status) VALUES (@userId, @year, @month, @totalHours, @gymCost, \'draft\')');
        res.status(201).send('Report created');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

/**
 * @swagger
 * /monthly-reports/{reportId}/submit-to-manager:
 *   put:
 *     summary: Submit report to manager (by user)
 *     tags: [MonthlyReports]
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200: { description: Submitted }
 */
router.put('/:reportId/submit-to-manager', checkRole(['user']), async (req, res) => {
    const { reportId } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('reportId', sql.Int, reportId)
            .query('UPDATE MonthlyReports SET Status = \'submitted_to_manager\', SubmittedAt = GETDATE() WHERE ReportId = @reportId AND Status = \'draft\'');
        res.send('Submitted to manager');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

/**
 * @swagger
 * /monthly-reports/{reportId}/approve-manager:
 *   put:
 *     summary: Approve and submit to finance (by manager)
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
 */
router.put('/:reportId/approve-manager', checkRole(['manager']), async (req, res) => {
    const { reportId } = req.params;
    const { comment } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('comment', sql.NVarChar, comment)
            .query('UPDATE MonthlyReports SET Status = \'submitted_to_finance\', ManagerComment = @comment WHERE ReportId = @reportId AND Status = \'submitted_to_manager\'');
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
 */
router.put('/:reportId/approve-finance', checkRole(['finance']), async (req, res) => {
    const { reportId } = req.params;
    const { comment } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('reportId', sql.Int, reportId)
            .input('comment', sql.NVarChar, comment)
            .query('UPDATE MonthlyReports SET Status = \'approved\', FinanceComment = @comment, ApprovedAt = GETDATE() WHERE ReportId = @reportId AND Status = \'submitted_to_finance\'');
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
 */
router.get('/:reportId', async (req, res) => {
    const { reportId } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('reportId', sql.Int, reportId)
            .query('SELECT * FROM MonthlyReports WHERE ReportId = @reportId');
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;