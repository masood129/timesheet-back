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
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
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
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.get('/range', async (req, res) => {
    try {
        const pool = await poolPromise;
        const {startDate, endDate, userId} = req.query;
        console.log(`Request received: startDate=${startDate}, endDate=${endDate}, userId=${userId}`);

        if (!startDate || !endDate || !userId) {
            return res.status(400).send('startDate، باید endDate و userId الزامی است');
        }

        if (startDate === 'range' || endDate === 'range') {
            returnres.status(400).send('ورودی نامعتبر: مقدار "range" در تاریخ‌ها شناسایی شد');
        }

        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            return res.status(400).send('فرمت تاریخ نامعتبر است. از فرمت YYYY-MM-DD یا ISO 8601 استفاده کنید');
        }

        const parsedStartDate = parseDate(startDate);
        const parsedEndDate = parseDate(endDate);

        if (!parsedStartDate || !parsedEndDate) {
            return res.status(400).send('تاریخ‌های ارسالی نامعتبر هستند');
        }

        if (parsedStartDate > parsedEndDate) {
            return res.status(400).send('startDate باید قبل از endDate باشد');
        }

        // اضافه کردن یک روز به endDate برای اطمینان از پوشش کامل
        const adjustedEndDate = DateTime.fromJSDate(parsedEndDate, {zone: 'Asia/Tehran'})
            .plus({days: 1})
            .startOf('day')
            .toJSDate();

        console.log(`Executing query: startDate=${parsedStartDate}, endDate=${adjustedEndDate}, userId=${userId}`);
        const detailResult = await pool
            .request()
            .input('startDate', sql.Date, parsedStartDate)
            .input('endDate', sql.Date, adjustedEndDate)
            .input('userId', sql.Int, parseInt(userId))
            .query(`
                SELECT Date, CAST (Date AS DATE) AS DateOnly, UserId, LeaveType, ArrivalTime, LeaveTime, PersonalTime, Description, GoCost, ReturnCost
                FROM DailyDetails
                WHERE CAST(Date AS DATE) >= @startDate AND CAST(Date AS DATE) <= @endDate AND UserId = @userId
                ORDER BY Date
            `);

        console.log(`Query returned ${detailResult.recordset.length} records`);
        detailResult.recordset.forEach(record => {
            console.log(`Record: Date=${record.Date}, DateOnly=${record.DateOnly}`);
        });

        const details = [];
        for (const detail of detailResult.recordset) {
            if (!detail.Date || !(detail.Date instanceof Date)) {
                console.log(`Skipping invalid date: ${detail.Date}`);
                continue;
            }

            const tasksResult = await pool
                .request()
                .input('date', sql.Date, detail.Date)
                .input('userId', sql.Int, parseInt(userId))
                .query('SELECT * FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');

            const carCostsResult = await pool
                .request()
                .input('date', sql.Date, detail.Date)
                .input('userId', sql.Int, parseInt(userId))
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

        console.log(`Returning ${details.length} records`);
        res.json(details);
    } catch (err) {
        console.error(`Server error: ${err.message}`);
        res.status(500).send(`خطای سرور: ${err.message}`);
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
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Daily details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DailyDetail'
 *       404:
 *         description: Daily details not found
 *       400:
 *         description: Invalid date format
 *       500:
 *         description: Server error
 */
router.get('/:date', async (req, res) => {
    try {
        const pool = await poolPromise;
        const {date} = req.params;
        const {userId} = req.query;

        if (date === 'range') {
            return res.status(400).send('ورودی نامعتبر: مقدار "range" در تاریخ شناسایی شد');
        }

        if (!isValidDate(date)) {
            return res.status(400).send('فرمت تاریخ نامعتبر است. از فرمت YYYY-MM-DD یا ISO 8601 استفاده کنید');
        }

        const parsedDate = parseDate(date);
        if (!parsedDate) {
            return res.status(400).send('تاریخ ارسالی نامعتبر است');
        }

        const detailResult = await pool
            .request()
            .input('date', sql.Date, parsedDate)
            .input('userId', sql.Int, parseInt(userId))
            .query('SELECT * FROM DailyDetails WHERE CAST(Date AS DATE) = @date AND UserId = @userId');

        if (detailResult.recordset.length === 0) {
            return res.status(404).send('جزئیات روزانه یافت نشد');
        }

        const tasksResult = await pool
            .request()
            .input('date', sql.Date, parsedDate)
            .input('userId', sql.Int, parseInt(userId))
            .query('SELECT * FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');

        const carCostsResult = await pool
            .request()
            .input('date', sql.Date, parsedDate)
            .input('userId', sql.Int, parseInt(userId))
            .query('SELECT * FROM DailyPersonalCarCosts WHERE Date = @date AND UserId = @userId');

        const detail = detailResult.recordset[0];
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

        res.json({
            ...detail,
            tasks: tasksResult.recordset,
            personalCarCosts: carCostsResult.recordset,
        });
    } catch (err) {
        res.status(500).send(`خطای سرور در دریافت جزئیات روزانه: ${err.message}`);
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
    const {
        date,
        userId,
        arrivalTime,
        leaveTime,
        leaveType,
        personalTime,
        description,
        goCost,
        returnCost,
        tasks,
        personalCarCosts
    } = req.body;

    if (!date || !userId) {
        return res.status(400).send('تاریخ و شناسه کاربر الزامی هستند');
    }

    if (!isValidDate(date)) {
        return res.status(400).send('فرمت تاریخ نامعتبر است. از فرمت YYYY-MM-DD یا ISO 8601 استفاده کنید');
    }

    const parsedDate = parseDate(date);
    if (!parsedDate) {
        return res.status(400).send('تاریخ ارسالی نامعتبر است');
    }

    const validateTime = (time, paramName) => {
        if (!time) return null;

        const isoRegex = /^\d{4}-\d{2}-\d{2}T([0-1]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?([+-]\d{2}:?\d{2}|Z)?$/;
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/;
        let hours, minutes, seconds = 0;

        let cleanedTime = time;
        if (cleanedTime.includes('+0330+03:30')) {
            cleanedTime = cleanedTime.replace('+0330+03:30', '+03:30');
        }

        if (isoRegex.test(cleanedTime)) {
            const dt = DateTime.fromISO(cleanedTime, {zone: 'Asia/Tehran'});
            if (!dt.isValid) {
                throw new Error(`Validation failed for parameter '${paramName}'. Invalid ISO time.`);
            }
            hours = dt.hour;
            minutes = dt.minute;
            seconds = dt.second || 0;
        } else if (timeRegex.test(cleanedTime)) {
            [hours, minutes, seconds = 0] = cleanedTime.split(':').map(Number);
        } else {
            throw new Error(`Validation failed for parameter '${paramName}'. Invalid time.`);
        }

        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
            throw new Error(`Validation failed for parameter '${paramName}'. Invalid time values.`);
        }

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (personalCarCosts && personalCarCosts.length > 0) {
        for (const carCost of personalCarCosts) {
            if (!carCost.projectId || !carCost.cost || carCost.cost <= 0 || !carCost.kilometers || carCost.kilometers <= 0) {
                return res.status(400).send('شناسه پروژه، تعداد کیلومترها و هزینه خودرو شخصی باید معتبر و بزرگ‌تر از صفر باشند');
            }
        }
    }

    let pool;
    let transaction;
    let transactionBegun = false;

    try {
        const validatedArrivalTime = validateTime(arrivalTime, 'arrivalTime');
        const validatedLeaveTime = validateTime(leaveTime, 'leaveTime');

        pool = await poolPromise;
        if (!pool) {
            throw new Error('اتصال به پایگاه داده برقرار نشد');
        }

        transaction = new sql.Transaction(pool);
        await transaction.begin();
        transactionBegun = true;

        const request = transaction.request();
        request.input('date', sql.Date, parsedDate);
        request.input('userId', sql.Int, parseInt(userId));

        await request.query('DELETE FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');
        await request.query('DELETE FROM DailyPersonalCarCosts WHERE Date = @date AND UserId = @userId');

        const detailResult = await request
            .input('arrivalTime', sql.NVarChar(8), validatedArrivalTime)
            .input('leaveTime', sql.NVarChar(8), validatedLeaveTime)
            .input('leaveType', sql.NVarChar, leaveType || null)
            .input('personalTime', sql.Int, personalTime || null)
            .input('description', sql.NVarChar, description || null)
            .input('goCost', sql.Int, goCost || null)
            .input('returnCost', sql.Int, returnCost || null)
            .query(`
        IF EXISTS (SELECT 1 FROM DailyDetails WHERE Date = @date AND UserId = @userId)
          UPDATE DailyDetails
          SET ArrivalTime = @arrivalTime, LeaveTime = @leaveTime, LeaveType = @leaveType,
              PersonalTime = @personalTime, Description = @description, GoCost = @goCost,
              ReturnCost = @returnCost
          OUTPUT INSERTED.*
          WHERE Date = @date AND UserId = @userId
        ELSE
          INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, LeaveType, PersonalTime, Description, GoCost, ReturnCost)
          OUTPUT INSERTED.*
          VALUES (@date, @userId, @arrivalTime, @leaveTime, @leaveType, @personalTime, @description, @goCost, @returnCost)
      `);

        const tasksResult = [];
        for (const task of tasks || []) {
            const taskRequest = transaction.request();
            taskRequest.input('date', sql.Date, parsedDate);
            taskRequest.input('userId', sql.Int, parseInt(userId));
            const taskResult = await taskRequest
                .input('taskProjectId', sql.Int, task.projectId)
                .input('duration', sql.Int, task.duration || null)
                .input('taskDescription', sql.NVarChar, task.description || null)
                .query(
                    'INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description) OUTPUT INSERTED.* VALUES (@date, @userId, @taskProjectId, @duration, @taskDescription)'
                );
            tasksResult.push(taskResult.recordset[0]);
        }

        const carCostsResult = [];
        for (const carCost of personalCarCosts || []) {
            const carCostRequest = transaction.request();
            carCostRequest.input('date', sql.Date, parsedDate);
            carCostRequest.input('userId', sql.Int, parseInt(userId));
            const carCostResult = await carCostRequest
                .input('carCostProjectId', sql.Int, carCost.projectId)
                .input('kilometers', sql.Int, carCost.kilometers)
                .input('cost', sql.Int, carCost.cost)
                .input('carCostDescription', sql.NVarChar, carCost.description || null)
                .query(
                    'INSERT INTO DailyPersonalCarCosts (Date, UserId, ProjectId, Kilometers, Cost, Description) OUTPUT INSERTED.* VALUES (@date, @userId, @carCostProjectId, @kilometers, @cost, @carCostDescription)'
                );
            carCostsResult.push(carCostResult.recordset[0]);
        }

        const responseDetail = detailResult.recordset[0];
        const detailDate = DateTime.fromJSDate(responseDetail.Date, {zone: 'Asia/Tehran'});

        if (responseDetail.ArrivalTime) {
            const [hours, minutes, seconds = '00'] = responseDetail.ArrivalTime.split(':').map(Number);
            responseDetail.ArrivalTime = DateTime.fromObject(
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
        if (responseDetail.LeaveTime) {
            const [hours, minutes, seconds = '00'] = responseDetail.LeaveTime.split(':').map(Number);
            responseDetail.LeaveTime = DateTime.fromObject(
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

        await transaction.commit();

        res.status(201).json({
            ...responseDetail,
            tasks: tasksResult,
            personalCarCosts: carCostsResult,
        });
    } catch (err) {
        if (transaction && transactionBegun) {
            try {
                await transaction.rollback();
            } catch (rollbackErr) {
                console.error('خطا در بازگردانی تراکنش:', rollbackErr);
            }
        }
        res.status(500).send(`خطای سرور: ${err.message}`);
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
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Monthly details
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DailyDetail'
 *       500:
 *         description: Server error
 */
router.get('/month/:year/:month', async (req, res) => {
    try {
        const pool = await poolPromise;
        const {year, month} = req.params;
        const {userId} = req.query;

        // محاسبه تاریخ شروع و پایان ماه میلادی
        const startDate = DateTime.fromObject({
            year: parseInt(year),
            month: parseInt(month),
            day: 1
        }, {zone: 'Asia/Tehran'}).toJSDate();
        const endDate = DateTime.fromObject({
            year: parseInt(year),
            month: parseInt(month) + 1,
            day: 1
        }, {zone: 'Asia/Tehran'}).minus({days: 1}).toJSDate();

        console.log(`Executing query for month: year=${year}, month=${month}, userId=${userId}`);
        const detailResult = await pool
            .request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .input('userId', sql.Int, parseInt(userId))
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
                continue;
            }
            const tasksResult = await pool
                .request()
                .input('date', sql.Date, detail.Date)
                .input('userId', sql.Int, parseInt(userId))
                .query('SELECT * FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');

            const carCostsResult = await pool
                .request()
                .input('date', sql.Date, detail.Date)
                .input('userId', sql.Int, parseInt(userId))
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
        res.status(500).send(`خطای سرور در دریافت جزئیات ماهانه: ${err.message}`);
    }
});

module.exports = router;