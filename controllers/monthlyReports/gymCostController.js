const {sql, poolPromise} = require('../../config/db.config');
const {getJalaliMonthRange} = require('../../utils/dateConverter');

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
 *               year: { type: integer }
 *               month: { type: integer }
 *               cost: { type: integer }
 *               hours: { type: integer }
 *     responses:
 *       201: { description: Gym cost saved }
 *       400: { description: Invalid input }
 *       500: { description: Server error }
 */
const saveMonthlyGymCost = async (req, res) => {
    checkRole(['user', 'group_manager', 'general_manager', 'finance_manager', 'admin'])(req, res, async () => {
        const userId = req.user.userId;
        const {year, month, cost, hours} = req.body;
        if (!year || !month || !cost) {
            return res.status(400).send('Missing required fields');
        }
        try {
            const pool = await poolPromise;

            const existingReport = await pool.request()
                .input('userId', sql.Int, userId)
                .input('year', sql.Int, year)
                .input('month', sql.Int, month)
                .query('SELECT 1 FROM MonthlyReports WHERE UserId = @userId AND Year = @year AND Month = @month');

            if (existingReport.recordset.length > 0) {
                return res.status(400).send('گزارش ساعات ماهیانه برای این ماه وجود دارد');
            }

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
            res.status(201).json(result.recordset[0] || {message: 'Gym cost saved'});
        } catch (err) {
            res.status(500).send(err.message);
        }
    });
};

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
const saveMonthlyGymCostJalali = async (req, res) => {
    checkRole(['user', 'group_manager', 'general_manager', 'finance_manager', 'admin'])(req, res, async () => {
        const userId = req.user.userId;
        const {year, month, cost, hours} = req.body;

        const jalaliYear = parseInt(year);
        const jalaliMonth = parseInt(month);

        if (isNaN(jalaliYear) || isNaN(jalaliMonth) || jalaliMonth < 1 || jalaliMonth > 12) {
            return res.status(400).send('Invalid Jalali year or month');
        }

        try {
            const monthRange = getJalaliMonthRange(jalaliYear, jalaliMonth);
            const gregorianYear = monthRange.start.getFullYear();
            const gregorianMonth = monthRange.start.getMonth() + 1;

            const pool = await poolPromise;

            const existingReport = await pool.request()
                .input('userId', sql.Int, userId)
                .input('year', sql.Int, gregorianYear)
                .input('month', sql.Int, gregorianMonth)
                .query('SELECT 1 FROM MonthlyReports WHERE UserId = @userId AND Year = @year AND Month = @month');

            if (existingReport.recordset.length > 0) {
                return res.status(400).send('گزارش ساعات ماهیانه برای این ماه وجود دارد');
            }

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

            res.status(201).json(result.recordset[0] || {message: 'Gym cost saved with Jalali date'});
        } catch (err) {
            res.status(500).send(err.message);
        }
    });
};

module.exports = {
    saveMonthlyGymCost,
    saveMonthlyGymCostJalali,
    checkRole
};