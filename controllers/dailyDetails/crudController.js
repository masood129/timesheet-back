const {sql, poolPromise} = require('../../config/db.config');
const {isValidDate, parseDate} = require('../../utils/dateUtils');
const {DateTime} = require('luxon');

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
const createOrUpdateDailyDetails = async (req, res) => {
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

        const allowedLeaveTypes = ['work', 'annual_leave', 'sick_leave', 'gift_leave', 'mission'];
        if (leaveType && !allowedLeaveTypes.includes(leaveType)) {
            return res.status(400).send('Invalid LeaveType');
        }

        if (!date || !isValidDate(date)) {
            return res.status(400).send('Valid date is required');
        }

        const parsedDate = parseDate(date);
        if (!parsedDate) {
            return res.status(400).send('Invalid date format');
        }

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
                if (!cost.projectId || !cost.cost || !cost.kilometers) {
                    return res.status(400).send('Each personal car cost must have projectId, cost, and kilometers');
                }
            }
        }

        const request = new sql.Request(transaction);
        request.input('date', sql.Date, parsedDate);
        request.input('userId', sql.Int, userId);
        request.input('arrivalTime', sql.NVarChar, formattedArrivalTime || null);
        request.input('leaveTime', sql.NVarChar, formattedLeaveTime || null);
        request.input('leaveType', sql.NVarChar, leaveType || null);
        request.input('personalTime', sql.Int, personalTime || null);
        request.input('description', sql.NVarChar, description || null);
        request.input('goCost', sql.Int, goCost || null);
        request.input('returnCost', sql.Int, returnCost || null);

        const detailResult = await request.query(`
            IF EXISTS (SELECT 1 FROM DailyDetails WHERE Date = @date AND UserId = @userId)
                UPDATE DailyDetails
                SET ArrivalTime = @arrivalTime,
                    LeaveTime = @leaveTime,
                    LeaveType = @leaveType,
                    PersonalTime = @personalTime,
                    Description = @description,
                    GoCost = @goCost,
                    ReturnCost = @returnCost
                OUTPUT INSERTED.*
                WHERE Date = @date AND UserId = @userId
            ELSE
                INSERT INTO DailyDetails (Date, UserId, ArrivalTime, LeaveTime, LeaveType,
                                          PersonalTime, Description, GoCost, ReturnCost)
                OUTPUT INSERTED.*
                VALUES (@date, @userId, @arrivalTime, @leaveTime, @leaveType,
                        @personalTime, @description, @goCost, @returnCost)
        `);

        const deleteTasksRequest = transaction.request();
        deleteTasksRequest.input('date', sql.Date, parsedDate);
        deleteTasksRequest.input('userId', sql.Int, userId);
        await deleteTasksRequest.query('DELETE FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');

        const deleteCarCostsRequest = transaction.request();
        deleteCarCostsRequest.input('date', sql.Date, parsedDate);
        deleteCarCostsRequest.input('userId', sql.Int, userId);
        await deleteCarCostsRequest.query('DELETE FROM DailyPersonalCarCosts WHERE Date = @date AND UserId = @userId');

        for (const task of tasks) {
            const taskRequest = transaction.request();
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
            costRequest.input('kilometers', sql.Int, cost.kilometers || null);
            costRequest.input('cost', sql.Int, cost.cost);
            costRequest.input('description', sql.NVarChar, cost.description || null);
            await costRequest.query(`
                INSERT INTO DailyPersonalCarCosts (Date, UserId, ProjectID, Kilometers, Cost, Description)
                VALUES (@date, @userId, @projectId, @kilometers, @cost, @description)
            `);
        }

        await transaction.commit();

        const fetchRequest = pool.request();
        fetchRequest.input('date', sql.Date, parsedDate);
        fetchRequest.input('userId', sql.Int, userId);
        const detailResultFetch = await fetchRequest.query('SELECT * FROM DailyDetails WHERE Date = @date AND UserId = @userId');
        const detail = detailResultFetch.recordset[0];

        const tasksResult = await fetchRequest.query('SELECT * FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');
        const carCostsResult = await fetchRequest.query('SELECT * FROM DailyPersonalCarCosts WHERE Date = @date AND UserId = @userId');

        const detailDate = DateTime.fromJSDate(parsedDate, {zone: 'Asia/Tehran'});

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
};

module.exports = {createOrUpdateDailyDetails};