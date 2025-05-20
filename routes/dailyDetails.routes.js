const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db.config');
const { DateTime } = require('luxon');

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
 *       500:
 *         description: Server error
 */
router.get('/:date', async (req, res) => {
  try {
    const pool = await poolPromise;
    const { date } = req.params;
    const { userId } = req.query;

    const detailResult = await pool
      .request()
      .input('date', sql.Date, date)
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM DailyDetails WHERE Date = @date AND UserId = @userId');

    if (detailResult.recordset.length === 0) {
      return res.status(404).send('جزئیات روزانه یافت نشد');
    }

    const tasksResult = await pool
      .request()
      .input('date', sql.Date, date)
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');

    const carCostsResult = await pool
      .request()
      .input('date', sql.Date, date)
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM DailyPersonalCarCosts WHERE Date = @date AND UserId = @userId');

    const detail = detailResult.recordset[0];
    const detailDate = DateTime.fromJSDate(detail.Date, { zone: 'Asia/Tehran' });

    // تبدیل زمان‌های رشته‌ای به فرمت ISO
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
        { zone: 'Asia/Tehran' }
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
        { zone: 'Asia/Tehran' }
      ).toISO();
    }

    res.json({
      ...detail,
      tasks: tasksResult.recordset,
      personalCarCosts: carCostsResult.recordset,
    });
  } catch (err) {
    console.error('Error in GET /daily-details/:date:', err);
    res.status(500).send('خطای سرور در دریافت جزئیات روزانه');
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
  const { date, userId, arrivalTime, leaveTime, leaveType, personalTime, description, goCost, returnCost, tasks, personalCarCosts } = req.body;

  if (!date || !userId) {
    return res.status(400).send('تاریخ و شناسه کاربر الزامی هستند');
  }

  const validateTime = (time, paramName) => {
    if (!time) return null;

    // پشتیبانی از فرمت‌های ISO و HH:mm(:ss)
    const isoRegex = /^\d{4}-\d{2}-\d{2}T([0-1]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?\.\d{3}([+-]\d{2}:?\d{2}|Z)$/;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/;
    let hours, minutes, seconds = 0;

    console.log(`Validating ${paramName}: ${time}`);

    if (isoRegex.test(time)) {
      const dt = DateTime.fromISO(time, { zone: 'Asia/Tehran' });
      if (!dt.isValid) {
        console.error(`Invalid ISO time format for ${paramName}: ${time}`);
        throw new Error(`Validation failed for parameter '${paramName}'. Invalid ISO time.`);
      }
      hours = dt.hour;
      minutes = dt.minute;
      seconds = dt.second;
    } else if (timeRegex.test(time)) {
      [hours, minutes, seconds = 0] = time.split(':').map(Number);
    } else {
      console.error(`Invalid time format for ${paramName}: ${time}`);
      throw new Error(`Validation failed for parameter '${paramName}'. Invalid time.`);
    }

    // فرمت HH:mm:ss برای ذخیره به‌عنوان NVARCHAR
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    console.log(`Formatted ${paramName} for SQL: ${formattedTime}`);
    return formattedTime;
  };

  if (personalCarCosts && personalCarCosts.length > 0) {
    for (const carCost of personalCarCosts) {
      if (!carCost.projectId || !carCost.cost || carCost.cost <= 0) {
        return res.status(400).send('شناسه پروژه و هزینه خودرو شخصی باید معتبر و بزرگ‌تر از صفر باشند');
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
    request.input('date', sql.Date, date);
    request.input('userId', sql.Int, userId);

    console.log('Deleting existing tasks and car costs...');
    await request.query('DELETE FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');
    await request.query('DELETE FROM DailyPersonalCarCosts WHERE Date = @date AND UserId = @userId');

    console.log('Inserting/Updating DailyDetails...');
    console.log(`arrivalTime: ${validatedArrivalTime}, leaveTime: ${validatedLeaveTime}`);
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
      taskRequest.input('date', sql.Date, date);
      taskRequest.input('userId', sql.Int, userId);
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
      carCostRequest.input('date', sql.Date, date);
      carCostRequest.input('userId', sql.Int, userId);
      const carCostResult = await carCostRequest
        .input('carCostProjectId', sql.Int, carCost.projectId)
        .input('cost', sql.Int, carCost.cost)
        .input('carCostDescription', sql.NVarChar, carCost.description || null)
        .query(
          'INSERT INTO DailyPersonalCarCosts (Date, UserId, ProjectId, Cost, Description) OUTPUT INSERTED.* VALUES (@date, @userId, @carCostProjectId, @cost, @carCostDescription)'
        );
      carCostsResult.push(carCostResult.recordset[0]);
    }

    const responseDetail = detailResult.recordset[0];
    const detailDate = DateTime.fromJSDate(responseDetail.Date, { zone: 'Asia/Tehran' });

    // تبدیل زمان‌های رشته‌ای به فرمت ISO برای پاسخ
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
        { zone: 'Asia/Tehran' }
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
        { zone: 'Asia/Tehran' }
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
    console.error('Error in POST /daily-details:', err);
    console.error('Error stack:', err.stack);
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
    const { year, month } = req.params;
    const { userId } = req.query;

    const detailResult = await pool
      .request()
      .input('year', sql.Int, year)
      .input('month', sql.Int, month)
      .input('userId', sql.Int, userId)
      .query(`
        SELECT * FROM DailyDetails
        WHERE YEAR(Date) = @year AND MONTH(Date) = @month AND UserId = @userId
        ORDER BY Date
      `);

    const details = [];
    for (const detail of detailResult.recordset) {
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

      // تبدیل زمان‌های رشته‌ای به فرمت ISO
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
          { zone: 'Asia/Tehran' }
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
          { zone: 'Asia/Tehran' }
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
    console.error('Error in GET /daily-details/month/:year/:month:', err);
    res.status(500).send('خطای سرور در دریافت جزئیات ماهانه');
  }
});

module.exports = router;