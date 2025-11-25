const { sql, poolPromise } = require('../../config/db.config');
const { DateTime } = require('luxon');
const { getJalaliMonthRange } = require('../../utils/dateConverter');

/**
 * @swagger
 * /daily-details/jalali/month/{year}/{month}:
 *   get:
 *     summary: Get monthly details using Jalali calendar
 *     tags: [DailyDetails]
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Jalali year of the monthly details
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: Jalali month of the monthly details (1-12)
 *     responses:
 *       200:
 *         description: Monthly details
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DailyDetail'
 *       400:
 *         description: Invalid input (e.g., invalid year or month)
 *       500:
 *         description: Server error
 */
const getJalaliMonthlyDetails = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { year, month } = req.params;
        const userId = req.user.userId;

        const jalaliYear = parseInt(year);
        const jalaliMonth = parseInt(month);

        if (isNaN(jalaliYear) || isNaN(jalaliMonth) || jalaliMonth < 1 || jalaliMonth > 12) {
            return res.status(400).send('Invalid Jalali year or month');
        }

        const monthRange = getJalaliMonthRange(jalaliYear, jalaliMonth);
        const startDate = monthRange.start;
        const endDate = monthRange.end;

        const detailResult = await pool
            .request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .input('userId', sql.Int, userId)
            .query(`
                SELECT *
                FROM DailyDetails
                WHERE CAST(Date AS DATE) >= @startDate
                  AND CAST(Date AS DATE) <= @endDate
                  AND UserId = @userId
                ORDER BY Date
            `);

        const details = [];
        for (const detail of detailResult.recordset) {
            if (!detail.Date || !(detail.Date instanceof Date)) {
                console.warn(`Skipping record with invalid date: ${detail.Date}`);
                continue;
            }
            const tasksResult = await pool
                .request()
                .input('date', sql.Date, detail.Date)
                .input('userId', sql.Int, userId)
                .query('SELECT * FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');

            const carCostsResult = await pool
                .request()
                .input('date', sql.Date, detail.Date)
                .input('userId', sql.Int, userId)
                .query('SELECT * FROM DailyPersonalCarCosts WHERE Date = @date AND UserId = @userId');

            const detailDate = DateTime.fromJSDate(detail.Date, { zone: 'Asia/Tehran' });

            if (detail.ArrivalTime) {
                const [hours, minutes, seconds = '00'] = detail.ArrivalTime.split(':').map(Number);
                detail.ArrivalTime = DateTime.fromObject({
                    year: detailDate.year,
                    month: detailDate.month,
                    day: detailDate.day,
                    hour: hours,
                    minute: minutes,
                    second: seconds,
                }, { zone: 'Asia/Tehran' }).toISO();
            }
            if (detail.LeaveTime) {
                const [hours, minutes, seconds = '00'] = detail.LeaveTime.split(':').map(Number);
                detail.LeaveTime = DateTime.fromObject({
                    year: detailDate.year,
                    month: detailDate.month,
                    day: detailDate.day,
                    hour: hours,
                    minute: minutes,
                    second: seconds,
                }, { zone: 'Asia/Tehran' }).toISO();
            }

            details.push({
                ...detail,
                tasks: tasksResult.recordset,
                personalCarCosts: carCostsResult.recordset,
            });
        }

        res.json(details);
    } catch (err) {
        console.error(`Error in GET /daily-details/jalali/month/:year/:month: ${err.message}`);
        res.status(500).send(`Server error: ${err.message}`);
    }
};

/**
 * @swagger
 * /daily-details/month/{year}/{month}:
 *   get:
 *     summary: Get monthly details using Gregorian calendar
 *     tags: [DailyDetails]
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Gregorian year of the monthly details
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: Gregorian month of the monthly details (1-12)
 *     responses:
 *       200:
 *         description: Monthly details
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DailyDetail'
 *       400:
 *         description: Invalid input (e.g., invalid year or month)
 *       500:
 *         description: Server error
 */
const getMonthlyDetails = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { year, month } = req.params;
        const userId = req.user.userId;

        const parsedYear = parseInt(year);
        const parsedMonth = parseInt(month);

        if (isNaN(parsedYear) || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
            return res.status(400).send('Invalid year or month');
        }

        const startDate = DateTime.fromObject({
            year: parsedYear, month: parsedMonth, day: 1
        }, { zone: 'Asia/Tehran' }).toJSDate();
        const endDate = DateTime.fromObject({
            year: parsedYear, month: parsedMonth + 1, day: 1
        }, { zone: 'Asia/Tehran' }).minus({ days: 1 }).toJSDate();

        const detailResult = await pool
            .request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .input('userId', sql.Int, userId)
            .query(`
                SELECT *
                FROM DailyDetails
                WHERE CAST(Date AS DATE) >= @startDate
                  AND CAST(Date AS DATE) <= @endDate
                  AND UserId = @userId
                ORDER BY Date
            `);

        const details = [];
        for (const detail of detailResult.recordset) {
            if (!detail.Date || !(detail.Date instanceof Date)) {
                console.warn(`Skipping record with invalid date: ${detail.Date}`);
                continue;
            }
            const tasksResult = await pool
                .request()
                .input('date', sql.Date, detail.Date)
                .input('userId', sql.Int, userId)
                .query('SELECT * FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');

            const carCostsResult = await pool
                .request()
                .input('date', sql.Date, detail.Date)
                .input('userId', sql.Int, userId)
                .query('SELECT * FROM DailyPersonalCarCosts WHERE Date = @date AND UserId = @userId');

            const detailDate = DateTime.fromJSDate(detail.Date, { zone: 'Asia/Tehran' });

            if (detail.ArrivalTime) {
                const [hours, minutes, seconds = '00'] = detail.ArrivalTime.split(':').map(Number);
                detail.ArrivalTime = DateTime.fromObject({
                    year: detailDate.year,
                    month: detailDate.month,
                    day: detailDate.day,
                    hour: hours,
                    minute: minutes,
                    second: seconds,
                }, { zone: 'Asia/Tehran' }).toISO();
            }
            if (detail.LeaveTime) {
                const [hours, minutes, seconds = '00'] = detail.LeaveTime.split(':').map(Number);
                detail.LeaveTime = DateTime.fromObject({
                    year: detailDate.year,
                    month: detailDate.month,
                    day: detailDate.day,
                    hour: hours,
                    minute: minutes,
                    second: seconds,
                }, { zone: 'Asia/Tehran' }).toISO();
            }

            details.push({
                ...detail,
                tasks: tasksResult.recordset,
                personalCarCosts: carCostsResult.recordset,
            });
        }

        res.json(details);
    } catch (err) {
        console.error(`Error in GET /daily-details/month/:year/:month: ${err.message}`);
        res.status(500).send(`Server error: ${err.message}`);
    }
};

module.exports = {
    getJalaliMonthlyDetails,
    getMonthlyDetails
};
