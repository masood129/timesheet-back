const express = require('express');
const router = express.Router();
const {sql, poolPromise} = require('../config/db.config');
const {getJalaliMonthRange, jalaliToGregorian} = require('../utils/dateConverter');
const {DateTime} = require('luxon');

function isValidDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        return false;
    }
    const trimmedDate = dateString.trim();
    let dt = DateTime.fromFormat(trimmedDate, 'yyyy-MM-dd', {zone: 'Asia/Tehran'});
    if (dt.isValid) {
        return true;
    }
    dt = DateTime.fromISO(trimmedDate, {zone: 'Asia/Tehran'});
    return dt.isValid;
}

function parseDate(dateString) {
    if (!isValidDate(dateString)) return null;
    const trimmedDate = dateString.trim();
    let dt;
    dt = DateTime.fromFormat(trimmedDate, 'yyyy-MM-dd', {zone: 'Asia/Tehran'});
    if (dt.isValid) {
        return dt.toJSDate();
    }
    dt = DateTime.fromISO(trimmedDate, {zone: 'Asia/Tehran'});
    if (dt.isValid) {
        return dt.toJSDate();
    }
    return null;
}

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
router.get('/jalali/month/:year/:month', async (req, res) => {
    try {
        const pool = await poolPromise;
        const {year, month} = req.params;
        const userId = req.user.userId;

        const jalaliYear = parseInt(year);
        const jalaliMonth = parseInt(month);

        if (isNaN(jalaliYear) || isNaN(jalaliMonth) || jalaliMonth < 1 || jalaliMonth > 12) {
            return res.status(400).send('Invalid Jalali year or month');
        }

        // تبدیل تاریخ شمسی به میلادی
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

            const detailDate = DateTime.fromJSDate(detail.Date, {zone: 'Asia/Tehran'});

            if (detail.ArrivalTime) {
                const [hours, minutes, seconds = '00'] = detail.ArrivalTime.split(':').map(Number);
                detail.ArrivalTime = DateTime.fromObject({
                    year: detailDate.year,
                    month: detailDate.month,
                    day: detailDate.day,
                    hour: hours,
                    minute: minutes,
                    second: seconds,
                }, {zone: 'Asia/Tehran'}).toISO();
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
                }, {zone: 'Asia/Tehran'}).toISO();
            }

            details.push({
                ...detail, tasks: tasksResult.recordset, personalCarCosts: carCostsResult.recordset,
            });
        }

        res.json(details);
    } catch (err) {
        console.error(`Error in GET /daily-details/jalali/month/:year/:month: ${err.message}`);
        res.status(500).send(`Server error: ${err.message}`);
    }
});


/**
 * @swagger
 * /daily-details/range:
 *   get:
 *     summary: Get daily details for a date range
 *     tags: [DailyDetails]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date of the range (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date of the range (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Daily details for the date range
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DailyDetail'
 *       400:
 *         description: Invalid input (e.g., invalid dates)
 *       500:
 *         description: Server error
 */
router.get('/range', async (req, res) => {
    try {
        const pool = await poolPromise;
        const {startDate: startDateStr, endDate: endDateStr} = req.query;
        const userId = req.user.userId;

        const startDate = parseDate(startDateStr);
        const endDate = parseDate(endDateStr);

        if (!startDate || !endDate) {
            return res.status(400).send('Invalid startDate or endDate');
        }

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

            const detailDate = DateTime.fromJSDate(detail.Date, {zone: 'Asia/Tehran'});

            if (detail.ArrivalTime) {
                const [hours, minutes, seconds = '00'] = detail.ArrivalTime.split(':').map(Number);
                detail.ArrivalTime = DateTime.fromObject({
                    year: detailDate.year,
                    month: detailDate.month,
                    day: detailDate.day,
                    hour: hours,
                    minute: minutes,
                    second: seconds,
                }, {zone: 'Asia/Tehran'}).toISO();
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
                }, {zone: 'Asia/Tehran'}).toISO();
            }

            details.push({
                ...detail, tasks: tasksResult.recordset, personalCarCosts: carCostsResult.recordset,
            });
        }

        res.json(details);
    } catch (err) {
        console.error(`Error in GET /daily-details/range: ${err.message}`);
        res.status(500).send(`Server error: ${err.message}`);
    }
});

/**
 * @swagger
 * /daily-details:
 *   post:
 *     summary: Create or update daily details, including tasks and personal car costs
 *     tags: [DailyDetails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DailyDetailInput'
 *     responses:
 *       201:
 *         description: Daily details created or updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DailyDetail'
 *       400:
 *         description: Invalid input (e.g., invalid date or leaveType)
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
    const userId = req.user.userId;
    const {
        date: dateStr,
        arrivalTime,
        leaveTime,
        goCost,
        returnCost,
        leaveType,
        tasks = [],
        personalCarCosts = []
    } = req.body;

    const allowedLeaveTypes = ['work', 'annual_leave', 'sick_leave', 'gift_leave'];
    if (leaveType && !allowedLeaveTypes.includes(leaveType)) {
        return res.status(400).send('Invalid LeaveType');
    }

    const date = parseDate(dateStr);
    if (!date) {
        return res.status(400).send('Invalid date format');
    }

    let transaction;
    let transactionBegun = false;
    try {
        const pool = await poolPromise;
        transaction = new sql.Transaction(pool);
        await transaction.begin();
        transactionBegun = true;

        const request = new sql.Request(transaction);

        // Insert or update DailyDetails
        let detailResult = await request
            .input('userId', sql.Int, userId)
            .input('date', sql.Date, date)
            .input('arrivalTime', sql.NVarChar, arrivalTime || null)
            .input('leaveTime', sql.NVarChar, leaveTime || null)
            .input('goCost', sql.Int, goCost || null)
            .input('returnCost', sql.Int, returnCost || null)
            .input('leaveType', sql.NVarChar, leaveType || null)
            .query(`
                IF EXISTS (SELECT 1 FROM DailyDetails WHERE UserId = @userId AND Date = @date)
                    UPDATE DailyDetails
                    SET ArrivalTime = @arrivalTime,
                        LeaveTime = @leaveTime,
                        GoCost = @goCost,
                        ReturnCost = @returnCost,
                        LeaveType = @leaveType
                    OUTPUT INSERTED.*
                    WHERE UserId = @userId AND Date = @date
                ELSE
                    INSERT INTO DailyDetails (UserId, Date, ArrivalTime, LeaveTime, GoCost, ReturnCost, LeaveType)
                    OUTPUT INSERTED.*
                    VALUES (@userId, @date, @arrivalTime, @leaveTime, @goCost, @returnCost, @leaveType)
            `);

        const detail = detailResult.recordset[0];

        // Delete existing tasks and personal car costs for this date
        await request
            .input('date', sql.Date, date)
            .input('userId', sql.Int, userId)
            .query('DELETE FROM DailyProjectTasks WHERE UserId = @userId AND Date = @date');

        await request
            .input('date', sql.Date, date)
            .input('userId', sql.Int, userId)
            .query('DELETE FROM DailyPersonalCarCosts WHERE UserId = @userId AND Date = @date');

        // Insert new tasks
        for (const task of tasks) {
            await request
                .input('userId', sql.Int, userId)
                .input('date', sql.Date, date)
                .input('projectId', sql.Int, task.projectId)
                .input('duration', sql.Int, task.duration)
                .input('description', sql.NVarChar, task.description || null)
                .query(`
                    INSERT INTO DailyProjectTasks (UserId, Date, ProjectId, Duration, Description)
                    VALUES (@userId, @date, @projectId, @duration, @description)
                `);
        }

        // Insert new personal car costs
        for (const carCost of personalCarCosts) {
            await request
                .input('userId', sql.Int, userId)
                .input('date', sql.Date, date)
                .input('projectId', sql.Int, carCost.projectId)
                .input('cost', sql.Int, carCost.cost)
                .input('description', sql.NVarChar, carCost.description || null)
                .query(`
                    INSERT INTO DailyPersonalCarCosts (UserId, Date, ProjectId, Cost, Description)
                    VALUES (@userId, @date, @projectId, @cost, @description)
                `);
        }

        await transaction.commit();

        // Fetch updated data to return
        const tasksResult = await pool.request()
            .input('date', sql.Date, date)
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');

        const carCostsResult = await pool.request()
            .input('date', sql.Date, date)
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM DailyPersonalCarCosts WHERE Date = @date AND UserId = @userId');

        const detailDate = DateTime.fromJSDate(detail.Date, {zone: 'Asia/Tehran'});

        if (detail.ArrivalTime) {
            const [hours, minutes, seconds = '00'] = detail.ArrivalTime.split(':').map(Number);
            detail.ArrivalTime = DateTime.fromObject({
                year: detailDate.year,
                month: detailDate.month,
                day: detailDate.day,
                hour: hours,
                minute: minutes,
                second: seconds,
            }, {zone: 'Asia/Tehran'}).toISO();
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
            }, {zone: 'Asia/Tehran'}).toISO();
        }

        const response = {
            ...detail, tasks: tasksResult.recordset, personalCarCosts: carCostsResult.recordset,
        };

        res.status(201).json(response);
    } catch (err) {
        if (transaction && transactionBegun) {
            try {
                await transaction.rollback();
                console.error(`Transaction rolled back due to error: ${err.message}`);
            } catch (rollbackErr) {
                console.error(`Error during transaction rollback: ${rollbackErr.message}`);
            }
        }
        console.error(`Error in POST /daily-details: ${err.message}`);
        res.status(500).send(`Server error: ${err.message}`);
    }
});

/**
 * @swagger
 * /daily-details/month/{year}/{month}:
 *   get:
 *     summary: Get monthly details
 *     tags: [DailyDetails]
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year of the monthly details
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: Month of the monthly details (1-12)
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
router.get('/month/:year/:month', async (req, res) => {
    try {
        const pool = await poolPromise;
        const {year, month} = req.params;
        const userId = req.user.userId;

        const parsedYear = parseInt(year);
        const parsedMonth = parseInt(month);

        if (isNaN(parsedYear) || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
            return res.status(400).send('Invalid year or month');
        }

        const startDate = DateTime.fromObject({
            year: parsedYear, month: parsedMonth, day: 1
        }, {zone: 'Asia/Tehran'}).toJSDate();
        const endDate = DateTime.fromObject({
            year: parsedYear, month: parsedMonth + 1, day: 1
        }, {zone: 'Asia/Tehran'}).minus({days: 1}).toJSDate();

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

            const detailDate = DateTime.fromJSDate(detail.Date, {zone: 'Asia/Tehran'});

            if (detail.ArrivalTime) {
                const [hours, minutes, seconds = '00'] = detail.ArrivalTime.split(':').map(Number);
                detail.ArrivalTime = DateTime.fromObject({
                    year: detailDate.year,
                    month: detailDate.month,
                    day: detailDate.day,
                    hour: hours,
                    minute: minutes,
                    second: seconds,
                }, {zone: 'Asia/Tehran'}).toISO();
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
                }, {zone: 'Asia/Tehran'}).toISO();
            }

            details.push({
                ...detail, tasks: tasksResult.recordset, personalCarCosts: carCostsResult.recordset,
            });
        }

        res.json(details);
    } catch (err) {
        console.error(`Error in GET /daily-details/month/:year/:month: ${err.message}`);
        res.status(500).send(`Server error: ${err.message}`);
    }
});

module.exports = router;