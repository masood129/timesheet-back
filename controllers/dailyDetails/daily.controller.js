const { sql, poolPromise } = require('../../config/db.config');
const { isValidDate, parseDate } = require('../../utils/dateUtils');
const { DateTime } = require('luxon');

/**
 * @swagger
 * /daily-details/{date}:
 *   get:
 *     summary: Get daily details by date
 *     tags: [DailyDetails]
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date of the daily details (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Daily details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DailyDetail'
 *       400:
 *         description: Invalid date
 *       404:
 *         description: No details found for the date
 *       500:
 *         description: Server error
 */
const getDailyDetails = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { date } = req.params;
        const userId = req.user.userId;

        if (!date || !isValidDate(date)) {
            return res.status(400).send('Valid date is required');
        }

        const parsedDate = parseDate(date);

        const detailResult = await pool
            .request()
            .input('date', sql.Date, parsedDate)
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM DailyDetails WHERE Date = @date AND UserId = @userId');

        if (detailResult.recordset.length === 0) {
            return res.status(404).send('No details found for the date');
        }

        const detail = detailResult.recordset[0];

        const tasksResult = await pool
            .request()
            .input('date', sql.Date, parsedDate)
            .input('userId', sql.Int, userId)
            .query(`
                SELECT 
                    dpt.*,
                    p.ProjectName
                FROM DailyProjectTasks dpt
                LEFT JOIN Projects p ON dpt.ProjectId = p.Id
                WHERE dpt.Date = @date AND dpt.UserId = @userId
            `);

        const carCostsResult = await pool
            .request()
            .input('date', sql.Date, parsedDate)
            .input('userId', sql.Int, userId)
            .query(`
                SELECT 
                    dpcc.*,
                    p.ProjectName
                FROM DailyPersonalCarCosts dpcc
                LEFT JOIN Projects p ON dpcc.ProjectID = p.Id
                WHERE dpcc.Date = @date AND dpcc.UserId = @userId
            `);

        const detailDate = DateTime.fromJSDate(parsedDate, { zone: 'Asia/Tehran' });

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

        res.json({
            ...detail,
            tasks: tasksResult.recordset,
            personalCarCosts: carCostsResult.recordset,
        });
    } catch (err) {
        console.error(`Error in GET /daily-details/:date: ${err.message}`);
        res.status(500).send(`Server error: ${err.message}`);
    }
};

module.exports = {
    getDailyDetails
};
