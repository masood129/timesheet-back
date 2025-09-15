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
const getReportIdsJalali = async (req, res) => {
    checkRole(['user', 'group_manager', 'general_manager', 'finance_manager'])(req, res, async () => {
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
};

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
const checkSubmittedJalali = async (req, res) => {
    checkRole(['user', 'group_manager', 'general_manager', 'finance_manager'])(req, res, async () => {
        const {year, month} = req.params;
        const userId = req.user.userId;

        const jy = parseInt(year);
        const jm = parseInt(month);

        if (isNaN(jy) || isNaN(jm) || jm < 1 || jm > 12) {
            return res.status(400).send('Invalid Jalali year or month');
        }

        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .input('jalaliYear', sql.Int, jy)
                .input('jalaliMonth', sql.Int, jm)
                .query('SELECT TOP 1 Status FROM MonthlyReports WHERE UserId = @userId AND JalaliYear = @jalaliYear AND JalaliMonth = @jalaliMonth');

            const status = result.recordset.length > 0 ? result.recordset[0].Status : null;

            res.json({status});
        } catch (err) {
            console.error('Error in GET /monthly-reports/check-submitted/jalali/:year/:month:', err.message);
            res.status(500).send('Server error');
        }
    });
};

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
const getReportById = async (req, res) => {
    validateReportId(req, res, async () => {
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
};

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
const getGroupReportsGregorian = async (req, res) => {
    checkRole(['group_manager', 'general_manager', 'finance_manager'])(req, res, async () => {
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
};

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
const getGroupReportsJalali = async (req, res) => {
    checkRole(['group_manager', 'general_manager', 'finance_manager'])(req, res, async () => {
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
};

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
const getGroupRangeReports = async (req, res) => {
    checkRole(['group_manager', 'general_manager', 'finance_manager'])(req, res, async () => {
        const {startYear, startMonth, endYear, endMonth} = req.params;
        const userId = req.user.userId;
        const role = req.user.role;
        try {
            const sYear = parseInt(startYear);
            const sMonth = parseInt(startMonth);
            const eYear = parseInt(endYear);
            const eMonth = parseInt(endMonth);

            if (isNaN(sYear) || isNaN(sMonth) || isNaN(eYear) || isNaN(eMonth) ||
                sMonth < 1 || sMonth > 12 || eMonth < 1 || eMonth > 12) {
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
};

module.exports = {
    getReportIdsJalali,
    checkSubmittedJalali,
    getReportById,
    getGroupReportsGregorian,
    getGroupReportsJalali,
    getGroupRangeReports,
    checkRole,
    validateReportId
};