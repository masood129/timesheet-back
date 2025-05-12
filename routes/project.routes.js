const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db.config');

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Retrieve all projects
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Id:
 *                     type: integer
 *                   ProjectName:
 *                     type: string
 *                   securityLevel:
 *                     type: integer
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Projects');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error in GET /projects:', err);
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get a project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Id:
 *                   type: integer
 *                 ProjectName:
 *                   type: string
 *                 securityLevel:
 *                   type: integer
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Projects WHERE Id = @id');
    if (result.recordset.length === 0) {
      return res.status(404).send('Project not found');
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error in GET /projects/:id:', err);
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Id
 *               - ProjectName
 *               - securityLevel
 *             properties:
 *               Id:
 *                 type: integer
 *               ProjectName:
 *                 type: string
 *               securityLevel:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Project created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Id:
 *                   type: integer
 *                 ProjectName:
 *                   type: string
 *                 securityLevel:
 *                   type: integer
 *       400:
 *         description: Invalid input or ID already exists
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  const { Id, ProjectName, securityLevel } = req.body;
  if (!Id || !ProjectName || securityLevel == null) {
    return res.status(400).send('Id, ProjectName, and securityLevel are required');
  }
  try {
    const pool = await poolPromise;
    const checkResult = await pool
      .request()
      .input('id', sql.Int, Id)
      .query('SELECT COUNT(*) as count FROM Projects WHERE Id = @id');
    if (checkResult.recordset[0].count > 0) {
      return res.status(400).send('Id already exists');
    }
    const result = await pool
      .request()
      .input('Id', sql.Int, Id)
      .input('ProjectName', sql.NVarChar, ProjectName)
      .input('securityLevel', sql.Int, securityLevel)
      .query(
        'INSERT INTO Projects (Id, ProjectName, securityLevel) OUTPUT INSERTED.* VALUES (@Id, @ProjectName, @securityLevel)'
      );
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error in POST /projects:', err);
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ProjectName:
 *                 type: string
 *               securityLevel:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Project updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Id:
 *                   type: integer
 *                 ProjectName:
 *                   type: string
 *                 securityLevel:
 *                   type: integer
 *       404:
 *         description: Project not found
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
  const { ProjectName, securityLevel } = req.body;
  if (!ProjectName && securityLevel == null) {
    return res.status(400).send('At least one field is required');
  }
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('ProjectName', sql.NVarChar, ProjectName || null)
      .input('securityLevel', sql.Int, securityLevel ?? null)
      .query(
        'UPDATE Projects SET ProjectName = COALESCE(@ProjectName, ProjectName), securityLevel = COALESCE(@securityLevel, securityLevel) OUTPUT INSERTED.* WHERE Id = @id'
      );
    if (result.recordset.length === 0) {
      return res.status(404).send('Project not found');
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error in PUT /projects/:id:', err);
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Project deleted
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Projects WHERE Id = @id');
    if (result.rowsAffected[0] === 0) {
      return res.status(404).send('Project not found');
    }
    res.status(204).send();
  } catch (err) {
    console.error('Error in DELETE /projects/:id:', err);
    res.status(500).send('Server error');
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
 *       500:
 *         description: Server error
 */
router.get('/daily-details/:date', async (req, res) => {
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
      return res.status(404).send('Daily details not found');
    }

    const tasksResult = await pool
      .request()
      .input('date', sql.Date, date)
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');

    res.json({
      ...detailResult.recordset[0],
      tasks: tasksResult.recordset,
    });
  } catch (err) {
    console.error('Error in GET /daily-details/:date:', err);
    res.status(500).send('Server error');
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
router.post('/daily-details', async (req, res) => {
  const { date, userId, arrivalTime, leaveTime, leaveType, personalTime, description, goCost, returnCost, personalCarCost, tasks } = req.body;

  if (!date || !userId) {
    return res.status(400).send('Date and UserId are required');
  }

  // تابع اعتبارسنجی و تبدیل زمان
  const validateTime = (time) => {
    if (!time) return null;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/;
    if (!timeRegex.test(time)) {
      throw new Error(`Invalid time format: ${time}. Expected format: HH:mm or HH:mm:ss`);
    }
    // تبدیل به شیء Date برای سازگاری با sql.Time
    const [hours, minutes, seconds = '00'] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds, 10));
    return date;
  };

  let pool;
  let transaction;
  let transactionBegun = false;

  try {
    // اعتبارسنجی و تبدیل زمان‌ها
    const validatedArrivalTime = validateTime(arrivalTime);
    const validatedLeaveTime = validateTime(leaveTime);

    // لاگ کردن مقادیر برای عیب‌یابی
    console.log('Validated arrivalTime:', validatedArrivalTime);
    console.log('Validated leaveTime:', validatedLeaveTime);

    pool = await poolPromise;
    if (!pool) {
      throw new Error('Failed to establish database connection');
    }

    // ایجاد یک تراکنش جدید
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    transactionBegun = true;

    // ایجاد یک درخواست متصل به تراکنش
    const request = transaction.request();

    // تعریف پارامترهای مشترک یک بار
    request.input('date', sql.Date, date);
    request.input('userId', sql.Int, userId);

    // Delete existing tasks for the date
    await request.query('DELETE FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');

    // Insert or update DailyDetails
    const detailResult = await request
      .input('arrivalTime', sql.Time, validatedArrivalTime)
      .input('leaveTime', sql.Time, validatedLeaveTime)
      .input('leaveType', sql.NVarChar, leaveType || null)
      .input('personalTime', sql.Int, personalTime || null)
      .input('description', sql.NVarChar, description || null)
      .input('goCost', sql.Int, goCost || null)
      .input('returnCost', sql.Int, returnCost || null)
      .input('personalCarCost', sql.Int, personalCarCost || null)
      .query(`
        IF EXISTS (SELECT 1 FROM DailyDetails WHERE Date = @date AND UserId = @userId)
          UPDATE DailyDetails
          SET ArrivalTime = @arrivalTime, LeaveTime = @leaveTime, LeaveType = @leaveType,
              PersonalTime = @personalTime, Description = @description, GoCost = @goCost,
              ReturnCost = @returnCost, PersonalCarCost = @personalCarCost
          OUTPUT INSERTED.*
          WHERE Date = @date AND UserId = @userId
        ELSE
          INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, LeaveType, PersonalTime, Description, GoCost, ReturnCost, PersonalCarCost)
          OUTPUT INSERTED.*
          VALUES (@date, @userId, @arrivalTime, @leaveTime, @leaveType, @personalTime, @description, @goCost, @returnCost, @personalCarCost)
      `);

    // Insert tasks
    const tasksResult = [];
    for (const task of tasks || []) {
      const taskResult = await request
        .input('projectId', sql.Int, task.projectId)
        .input('duration', sql.Int, task.duration || null)
        .input('taskDescription', sql.NVarChar, task.description || null)
        .query(
          'INSERT INTO DailyProjectTasks (Date, UserId, ProjectId, Duration, Description) OUTPUT INSERTED.* VALUES (@date, @userId, @projectId, @duration, @taskDescription)'
        );
      tasksResult.push(taskResult.recordset[0]);
    }

    // تأیید تراکنش
    await transaction.commit();

    res.status(201).json({
      ...detailResult.recordset[0],
      tasks: tasksResult,
    });
  } catch (err) {
    if (transaction && transactionBegun) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error('Failed to rollback transaction:', rollbackErr);
      }
    }
    console.error('Error in POST /daily-details:', err);
    console.error('Error stack:', err.stack);
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
router.get('/daily-details/month/:year/:month', async (req, res) => {
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
      details.push({
        ...detail,
        tasks: tasksResult.recordset,
      });
    }

    res.json(details);
  } catch (err) {
    console.error('Error in GET /daily-details/month/:year/:month:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;