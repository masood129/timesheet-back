const express = require('express');
const router = express.Router();
const {sql, poolPromise} = require('../config/db.config');
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
 *         description: Daily details for the range
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DailyDetail'
 *       400:
 *         description: Invalid input (e.g., missing or invalid parameters)
 *       500:
 *         description: Server error
 */
router.get('/range', async (req, res) => {
    try {
        const pool = await poolPromise;
        const {startDate, endDate} = req.query;
        const userId = req.user.userId;

        if (!startDate || !endDate) {
            return res.status(400).send('startDate and endDate are required');
        }

        if (startDate === 'range' || endDate === 'range') {
            return res.status(400).send('Invalid input: "range" detected in date parameters');
        }

        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            return res.status(400).send('Invalid date format. Use YYYY-MM-DD or ISO 8601');
        }

        const parsedStartDate = parseDate(startDate);
        const parsedEndDate = parseDate(endDate);

        if (!parsedStartDate || !parsedEndDate) {
            return res.status(400).send('Invalid date parameters');
        }

        if (parsedStartDate > parsedEndDate) {
            return res.status(400).send('startDate must be before endDate');
        }

        const adjustedEndDate = DateTime.fromJSDate(parsedEndDate, {zone: 'Asia/Tehran'})
            .plus({days: 1})
            .startOf('day')
            .toJSDate();

        const detailResult = await pool
            .request()
            .input('startDate', sql.Date, parsedStartDate)
            .input('endDate', sql.Date, adjustedEndDate)
            .input('userId', sql.Int, userId)
            .query(`
                SELECT Date,
                       CAST(Date AS DATE) AS DateOnly,
                       UserId,
                       LeaveType,
                       ArrivalTime,
                       LeaveTime,
                       PersonalTime,
                       Description,
                       GoCost,
                       ReturnCost
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
                detail.ArrivalTime = DateTime.fromObject(
                    {
                        year: detailDate.year,
                        month: detailDate.month,
                        day: detailDate.day,
                        hour: hours,
                        minute: minutes,
                        second: seconds,
                    },
                    {zone: 'Asia/Tehran'}
                ).toISO();
            }
            if (detail.LeaveTime) {
                const [hours, minutes, seconds = '00'] = detail.LeaveTime.split(':').map(Number);
                detail.LeaveTime = DateTime.fromObject(
                    {
                        year: detailDate.year,
                        month: detailDate.month,
                        day: detailDate.day,
                        hour: hours,
                        minute: minutes,
                        second: seconds,
                    },
                    {zone: 'Asia/Tehran'}
                ).toISO();
            }

            details.push({
                ...detail,
                tasks: tasksResult.recordset,
                personalCarCosts: carCostsResult.recordset,
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
 * /daily-details/{date}:
 *   get:
 *     summary: Get daily details for a specific date
 *     tags: [DailyDetails]
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for the daily details (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Daily details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DailyDetail'
 *       400:
 *         description: Invalid date format
 *       404:
 *         description: Daily details not found
 *       500:
 *         description: Server error
 */
router.get('/:date', async (req, res) => {
    try {
        const pool = await poolPromise;
        const {date} = req.params;
        const userId = req.user.userId;

        if (!isValidDate(date)) {
            return res.status(400).send('Invalid date format. Use YYYY-MM-DD or ISO 8601');
        }

        const parsedDate = parseDate(date);

        if (!parsedDate) {
            return res.status(400).send('Invalid date parameter');
        }

        const detailResult = await pool
            .request()
            .input('date', sql.Date, parsedDate)
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM DailyDetails WHERE Date = @date AND UserId = @userId');

        if (detailResult.recordset.length === 0) {
            return res.status(404).send('Daily details not found');
        }

        const detail = detailResult.recordset[0];

        const tasksResult = await pool
            .request()
            .input('date', sql.Date, parsedDate)
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');

        const carCostsResult = await pool
            .request()
            .input('date', sql.Date, parsedDate)
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM DailyPersonalCarCosts WHERE Date = @date AND UserId = @userId');

        const detailDate = DateTime.fromJSDate(parsedDate, {zone: 'Asia/Tehran'});

        if (detail.ArrivalTime) {
            const [hours, minutes, seconds = '00'] = detail.ArrivalTime.split(':').map(Number);
            detail.ArrivalTime = DateTime.fromObject(
                {
                    year: detailDate.year,
                    month: detailDate.month,
                    day: detailDate.day,
                    hour: hours,
                    minute: minutes,
                    second: seconds,
                },
                {zone: 'Asia/Tehran'}
            ).toISO();
        }
        if (detail.LeaveTime) {
            const [hours, minutes, seconds = '00'] = detail.LeaveTime.split(':').map(Number);
            detail.LeaveTime = DateTime.fromObject(
                {
                    year: detailDate.year,
                    month: detailDate.month,
                    day: detailDate.day,
                    hour: hours,
                    minute: minutes,
                    second: seconds,
                },
                {zone: 'Asia/Tehran'}
            ).toISO();
        }

        const response = {
            ...detail,
            tasks: tasksResult.recordset,
            personalCarCosts: carCostsResult.recordset,
        };

        res.json(response);
    } catch (err) {
        console.error(`Error in GET /daily-details/:date: ${err.message}`);
        res.status(500).send(`Server error: ${err.message}`);
    }
});

/**
 * @swagger
 * /daily-details:
 *   post:
 *     summary: Create or update daily details
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
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
    let transaction;
    let transactionBegun = false;
    try {
        const pool = await poolPromise;
        transaction = new sql.Transaction(pool);
        await transaction.begin();
        transactionBegun = true;

        const {
            date,
            arrivalTime,
            leaveTime,
            leaveType,
            personalTime,
            description,
            goCost,
            returnCost,
            tasks = [],
            personalCarCosts = [],
        } = req.body;
        const userId = req.user.userId;

        if (!date || !isValidDate(date)) {
            return res.status(400).send('Valid date is required');
        }

        const parsedDate = parseDate(date);
        if (!parsedDate) {
            return res.status(400).send('Invalid date format');
        }

        // تبدیل فرمت زمان به HH:mm:ss
        const formatTime = (isoTime) => {
            if (!isoTime) return null;
            const dt = DateTime.fromISO(isoTime, {zone: 'Asia/Tehran'});
            if (!dt.isValid) return null;
            return dt.toFormat('HH:mm:ss');
        };

        const formattedArrivalTime = formatTime(arrivalTime);
        const formattedLeaveTime = formatTime(leaveTime);

        if (arrivalTime && !formattedArrivalTime) {
            return res.status(400).send('Invalid arrivalTime format. Use ISO 8601');
        }
        if (leaveTime && !formattedLeaveTime) {
            return res.status(400).send('Invalid leaveTime format. Use ISO 8601');
        }

        if (tasks.length > 0) {
            for (const task of tasks) {
                if (!task.projectId || !task.duration) {
                    return res.status(400).send('Each task must have projectId and duration');
                }
            }
        }

        if (personalCarCosts.length > 0) {
            for (const cost of personalCarCosts) {
                if (!cost.projectId || !cost.cost) {
                    return res.status(400).send('Each personal car cost must have projectId and cost');
                }
            }
        }

        const existingDetailsRequest = transaction.request();
        existingDetailsRequest.input('date', sql.Date, parsedDate);
        existingDetailsRequest.input('userId', sql.Int, userId);
        const existingDetailsResult = await existingDetailsRequest.query(`
            SELECT *
            FROM DailyDetails
            WHERE Date = @date
              AND UserId = @userId
        `);

        const request = transaction.request();
        request.input('date', sql.Date, parsedDate);
        request.input('userId', sql.Int, userId);
        request.input('arrivalTime', sql.NVarChar, formattedArrivalTime || null);
        request.input('leaveTime', sql.NVarChar, formattedLeaveTime || null);
        request.input('leaveType', sql.NVarChar, leaveType || null);
        request.input('personalTime', sql.Int, personalTime || null);
        request.input('description', sql.NVarChar, description || null);
        request.input('goCost', sql.Int, goCost || null);
        request.input('returnCost', sql.Int, returnCost || null);

        if (existingDetailsResult.recordset.length > 0) {
            await request.query(`
                UPDATE DailyDetails
                SET ArrivalTime  = @arrivalTime,
                    LeaveTime    = @leaveTime,
                    LeaveType    = @leaveType,
                    PersonalTime = @personalTime,
                    Description  = @description,
                    GoCost       = @goCost,
                    ReturnCost   = @returnCost
                WHERE Date = @date
                  AND UserId = @userId
            `);
        } else {
            await request.query(`
                INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, LeaveType,
                                          PersonalTime, Description, GoCost, ReturnCost)
                VALUES (@date, @userId, @arrivalTime, @leaveTime, @leaveType,
                        @personalTime, @description, @goCost, @returnCost)
            `);
        }

        const deleteTasksRequest = transaction.request();
        deleteTasksRequest.input('date', sql.Date, parsedDate);
        deleteTasksRequest.input('userId', sql.Int, userId);
        await deleteTasksRequest.query('DELETE FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');

        const deleteCarCostsRequest = transaction.request();
        deleteCarCostsRequest.input('date', sql.Date, parsedDate);
        deleteCarCostsRequest.input('userId', sql.Int, userId);
        await deleteCarCostsRequest.query('DELETE FROM DailyPersonalCarCosts WHERE Date = @date AND UserId = @userId');

        for (const task of tasks) {
            const taskRequest = transaction
            Stuart
            taskRequest.input('date', sql.Date, parsedDate);
            taskRequest.input('userId', sql.Int, userId);
            taskRequest.input('projectId', sql.Int, task.projectId);
            taskRequest.input('duration', sql.Int, task.duration);
            taskRequest.input('description', sql.NVarChar, task.description || null);
            await taskRequest.query(`
                INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description)
                VALUES (@date, @userId, @projectId, @duration, @description)
            `);
        }

        for (const cost of personalCarCosts) {
            const costRequest = transaction.request();
            costRequest.input('date', sql.Date, parsedDate);
            costRequest.input('userId', sql.Int, userId);
            costRequest.input('projectId', sql.Int, cost.projectId);
            costRequest.input('cost', sql.Int, cost.cost);
            costRequest.input('description', sql.NVarChar, cost.description || null);
            await costRequest.query(`
                INSERT INTO DailyPersonalCarCosts (Date, UserId, ProjectId, Cost, Description)
                VALUES (@date, @userId, @projectId, @cost, @description)
            `);
        }

        await transaction.commit();

        const fetchRequest = pool.request();
        fetchRequest.input('date', sql.Date, parsedDate);
        fetchRequest.input('userId', sql.Int, userId);
        const detailResult = await fetchRequest.query('SELECT * FROM DailyDetails WHERE Date = @date AND UserId = @userId');
        const detail = detailResult.recordset[0];

        const tasksResult = await fetchRequest.query('SELECT * FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');
        const carCostsResult = await fetchRequest.query('SELECT * FROM DailyPersonalCarCosts WHERE Date = @date AND UserId = @userId');

        const detailDate = DateTime.fromJSDate(parsedDate, {zone: 'Asia/Tehran'});

        if (detail.ArrivalTime) {
            const [hours, minutes, seconds = '00'] = detail.ArrivalTime.split(':').map(Number);
            detail.ArrivalTime = DateTime.fromObject(
                {
                    year: detailDate.year,
                    month: detailDate.month,
                    day: detailDate.day,
                    hour: hours,
                    minute: minutes,
                    second: seconds,
                },
                {zone: 'Asia/Tehran'}
            ).toISO();
        }
        if (detail.LeaveTime) {
            const [hours, minutes, seconds = '00'] = detail.LeaveTime.split(':').map(Number);
            detail.LeaveTime = DateTime.fromObject(
                {
                    year: detailDate.year,
                    month: detailDate.month,
                    day: detailDate.day,
                    hour: hours,
                    minute: minutes,
                    second: seconds,
                },
                {zone: 'Asia/Tehran'}
            ).toISO();
        }

        const response = {
            ...detail,
            tasks: tasksResult.recordset,
            personalCarCosts: carCostsResult.recordset,
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
            year: parsedYear,
            month: parsedMonth,
            day: 1
        }, {zone: 'Asia/Tehran'}).toJSDate();
        const endDate = DateTime.fromObject({
            year: parsedYear,
            month: parsedMonth + 1,
            day: 1
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
                detail.ArrivalTime = DateTime.fromObject(
                    {
                        year: detailDate.year,
                        month: detailDate.month,
                        day: detailDate.day,
                        hour: hours,
                        minute: minutes,
                        second: seconds,
                    },
                    {zone: 'Asia/Tehran'}
                ).toISO();
            }
            if (detail.LeaveTime) {
                const [hours, minutes, seconds = '00'] = detail.LeaveTime.split(':').map(Number);
                detail.LeaveTime = DateTime.fromObject(
                    {
                        year: detailDate.year,
                        month: detailDate.month,
                        day: detailDate.day,
                        hour: hours,
                        minute: minutes,
                        second: seconds,
                    },
                    {zone: 'Asia/Tehran'}
                ).toISO();
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
});

module.exports = router;