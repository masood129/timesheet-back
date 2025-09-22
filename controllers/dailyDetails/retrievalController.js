// controllers/dailyDetails/retrievalController.js (assuming folder structure)

const {sql, poolPromise} = require('../../config/db.config');
const {isValidDate, parseDate} = require('../../utils/dateUtils');
const {DateTime} = require('luxon');
const {getJalaliMonthRange, formatJalaliDate} = require('../../utils/dateConverter');
const exceljs = require('exceljs');

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
        const {year, month} = req.params;
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
 * /daily-details/range:
 *   get:
 *     summary: Get details within a date range
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
 *         description: Details within the range
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
const getRangeDetails = async (req, res) => {
    try {
        const pool = await poolPromise;
        const {startDate, endDate} = req.query;
        const userId = req.user.userId;

        if (!startDate || !endDate || !isValidDate(startDate) || !isValidDate(endDate)) {
            return res.status(400).send('Valid startDate and endDate are required');
        }

        const parsedStartDate = parseDate(startDate);
        const parsedEndDate = parseDate(endDate);

        const detailResult = await pool
            .request()
            .input('startDate', sql.Date, parsedStartDate)
            .input('endDate', sql.Date, parsedEndDate)
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
};

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
        const {date} = req.params;
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
            .query('SELECT * FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');

        const carCostsResult = await pool
            .request()
            .input('date', sql.Date, parsedDate)
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM DailyPersonalCarCosts WHERE Date = @date AND UserId = @userId');

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

/**
 * @swagger
 * /daily-details/user/{userId}/jalali/month/{year}/{month}:
 *   get:
 *     summary: Get monthly details for a specific user using Jalali calendar, formatted for table display
 *     tags: [DailyDetails]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to fetch details for
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
 *         description: Monthly details formatted for table
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   dayOfWeek:
 *                     type: string
 *                     description: Persian name of the day of the week (e.g., 'شنبه')
 *                   date:
 *                     type: string
 *                     description: Jalali date in 'YYYY/MM/DD' format
 *                   arrivalTime:
 *                     type: string
 *                     nullable: true
 *                     description: Arrival time in ISO 8601 format (or null if not set)
 *                   leaveTime:
 *                     type: string
 *                     nullable: true
 *                     description: Leave time in ISO 8601 format (or null if not set)
 *                   personalTime:
 *                     type: integer
 *                     description: Personal time in minutes (defaults to 0 if no entry)
 *                   leaveType:
 *                     type: string
 *                     nullable: true
 *                     description: Leave type (e.g., 'work', 'annual_leave') or null
 *                   projects:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         projectId:
 *                           type: integer
 *                         duration:
 *                           type: integer
 *                         description:
 *                           type: string
 *                           nullable: true
 *                     description: List of projects with hours worked
 *                   totalDailyWork:
 *                     type: integer
 *                     description: Total work duration for the day in minutes
 *                   entryDelay:
 *                     type: integer
 *                     description: Entry delay in minutes (0 if no delay or not applicable)
 *                   description:
 *                     type: string
 *                     nullable: true
 *                     description: Day description or null
 *       400:
 *         description: Invalid input (e.g., invalid userId, year, or month)
 *       403:
 *         description: Access denied (e.g., not authorized to view this user's data)
 *       500:
 *         description: Server error
 */
const getUserJalaliMonthlyDetails = async (req, res) => {
    try {
        const pool = await poolPromise;
        const {userId: paramUserId, year, month} = req.params;
        const targetUserId = parseInt(paramUserId);
        const requesterId = req.user.userId;
        const requesterRole = req.user.role;

        if (isNaN(targetUserId)) {
            return res.status(400).send('Invalid userId');
        }

        const jalaliYear = parseInt(year);
        const jalaliMonth = parseInt(month);

        if (isNaN(jalaliYear) || isNaN(jalaliMonth) || jalaliMonth < 1 || jalaliMonth > 12) {
            return res.status(400).send('Invalid Jalali year or month');
        }

        // Authorization check
        let allowed = false;
        if (requesterId === targetUserId) {
            allowed = true;
        } else if (['general_manager', 'finance_manager'].includes(requesterRole)) {
            allowed = true;
        } else if (requesterRole === 'group_manager') {
            const groupCheck = await pool.request()
                .input('managerId', sql.Int, requesterId)
                .input('userId', sql.Int, targetUserId)
                .query(`
                    SELECT 1
                    FROM UserGroup ug
                             INNER JOIN Groups g ON ug.GroupId = g.GroupId
                    WHERE ug.UserId = @userId
                      AND g.ManagerId = @managerId
                `);
            if (groupCheck.recordset.length > 0) {
                allowed = true;
            }
        }

        if (!allowed) {
            return res.status(403).send('Access denied');
        }

        // Fetch user's contract arrival time
        const contractResult = await pool.request()
            .input('userId', sql.Int, targetUserId)
            .query('SELECT ContractArrivalTime FROM UserContractHours WHERE UserId = @userId');
        const contractArrival = contractResult.recordset[0]?.ContractArrivalTime || null;

        // Get month range in Gregorian
        const monthRange = getJalaliMonthRange(jalaliYear, jalaliMonth);
        const startDate = monthRange.start;
        const endDate = monthRange.end;

        // Fetch all daily details in the range
        const detailResult = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .input('userId', sql.Int, targetUserId)
            .query(`
                SELECT *
                FROM DailyDetails
                WHERE CAST(Date AS DATE) >= @startDate
                  AND CAST(Date AS DATE) <= @endDate
                  AND UserId = @userId
                ORDER BY Date
            `);

        // Map details by Gregorian date string (yyyy-mm-dd)
        const detailsMap = new Map();
        for (const detail of detailResult.recordset) {
            if (!detail.Date || !(detail.Date instanceof Date)) {
                console.warn(`Skipping record with invalid date: ${detail.Date}`);
                continue;
            }
            const gregDateStr = DateTime.fromJSDate(detail.Date, {zone: 'Asia/Tehran'}).toFormat('yyyy-MM-dd');
            detailsMap.set(gregDateStr, detail);
        }

        // Generate data for all days in the month
        const data = [];
        let currentDate = DateTime.fromJSDate(startDate, {zone: 'Asia/Tehran'});
        const endDt = DateTime.fromJSDate(endDate, {zone: 'Asia/Tehran'});

        while (currentDate <= endDt) {
            const gregDateStr = currentDate.toFormat('yyyy-MM-dd');
            const detail = detailsMap.get(gregDateStr) || {
                ArrivalTime: null,
                LeaveTime: null,
                PersonalTime: 0,
                LeaveType: null,
                Description: null
            };

            // Fetch tasks if detail exists
            let tasks = [];
            if (detailsMap.has(gregDateStr)) {
                const tasksRequest = pool.request();
                tasksRequest.input('date', sql.Date, currentDate.toJSDate());
                tasksRequest.input('userId', sql.Int, targetUserId);
                const tasksResult = await tasksRequest.query('SELECT * FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');
                tasks = tasksResult.recordset;
            }

            // Compute fields
            const dayOfWeek = currentDate.setLocale('fa').toFormat('cccc');
            const jalaliDate = formatJalaliDate(currentDate.toJSDate());

            let arrivalTime = null;
            if (detail.ArrivalTime) {
                const [hours, minutes, seconds = '00'] = detail.ArrivalTime.split(':').map(Number);
                arrivalTime = currentDate.set({hour: hours, minute: minutes, second: seconds}).toISO();
            }

            let leaveTime = null;
            if (detail.LeaveTime) {
                const [hours, minutes, seconds = '00'] = detail.LeaveTime.split(':').map(Number);
                leaveTime = currentDate.set({hour: hours, minute: minutes, second: seconds}).toISO();
            }

            const totalDailyWork = tasks.reduce((sum, t) => sum + (t.Duration || 0), 0);

            const projects = tasks.map(t => ({
                projectId: t.ProjectId,
                duration: t.Duration,
                description: t.Description || null
            }));

            let entryDelay = 0;
            if (detail.LeaveType === 'work' && detail.ArrivalTime && contractArrival) {
                const contractParts = contractArrival.split(':').map(Number);
                const contractMinutes = contractParts[0] * 60 + (contractParts[1] || 0);

                const arrivalParts = detail.ArrivalTime.split(':').map(Number);
                const arrivalMinutes = arrivalParts[0] * 60 + (arrivalParts[1] || 0);

                if (arrivalMinutes > contractMinutes) {
                    entryDelay = arrivalMinutes - contractMinutes;
                }
            }

            data.push({
                dayOfWeek,
                date: jalaliDate,
                arrivalTime,
                leaveTime,
                personalTime: detail.PersonalTime || 0,
                leaveType: detail.LeaveType || null,
                projects,
                totalDailyWork,
                entryDelay,
                description: detail.Description || null
            });

            currentDate = currentDate.plus({days: 1});
        }

        res.json(data);
    } catch (err) {
        console.error(`Error in GET /daily-details/user/:userId/jalali/month/:year/:month: ${err.message}`);
        res.status(500).send(`Server error: ${err.message}`);
    }
};

/**
 * @swagger
 * /daily-details/user/{userId}/jalali/month/{year}/{month}/export-excel:
 *   get:
 *     summary: Export monthly details for a specific user as Excel file using Jalali calendar
 *     tags: [DailyDetails]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to fetch details for
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
 *         description: Excel file
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
const exportUserJalaliMonthlyToExcel = async (req, res) => {
    try {
        const pool = await poolPromise;
        const {userId: paramUserId, year, month} = req.params;
        const targetUserId = parseInt(paramUserId);
        const requesterId = req.user.userId;
        const requesterRole = req.user.role;

        if (isNaN(targetUserId)) {
            return res.status(400).send('Invalid userId');
        }

        const jalaliYear = parseInt(year);
        const jalaliMonth = parseInt(month);

        if (isNaN(jalaliYear) || isNaN(jalaliMonth) || jalaliMonth < 1 || jalaliMonth > 12) {
            return res.status(400).send('Invalid Jalali year or month');
        }

        // Authorization check (same as getUserJalaliMonthlyDetails)
        let allowed = false;
        if (requesterId === targetUserId) {
            allowed = true;
        } else if (['general_manager', 'finance_manager'].includes(requesterRole)) {
            allowed = true;
        } else if (requesterRole === 'group_manager') {
            const groupCheck = await pool.request()
                .input('managerId', sql.Int, requesterId)
                .input('userId', sql.Int, targetUserId)
                .query(`
                    SELECT 1
                    FROM UserGroup ug
                             INNER JOIN Groups g ON ug.GroupId = g.GroupId
                    WHERE ug.UserId = @userId
                      AND g.ManagerId = @managerId
                `);
            if (groupCheck.recordset.length > 0) {
                allowed = true;
            }
        }

        if (!allowed) {
            return res.status(403).send('Access denied');
        }

        // Fetch user's contract arrival time (same as before)
        const contractResult = await pool.request()
            .input('userId', sql.Int, targetUserId)
            .query('SELECT ContractArrivalTime FROM UserContractHours WHERE UserId = @userId');
        const contractArrival = contractResult.recordset[0]?.ContractArrivalTime || null;

        // Get month range in Gregorian
        const monthRange = getJalaliMonthRange(jalaliYear, jalaliMonth);
        const startDate = monthRange.start;
        const endDate = monthRange.end;

        // Fetch all daily details in the range (same as before)
        const detailResult = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .input('userId', sql.Int, targetUserId)
            .query(`
                SELECT *
                FROM DailyDetails
                WHERE CAST(Date AS DATE) >= @startDate
                  AND CAST(Date AS DATE) <= @endDate
                  AND UserId = @userId
                ORDER BY Date
            `);

        // Map details by Gregorian date string (same as before)
        const detailsMap = new Map();
        for (const detail of detailResult.recordset) {
            if (!detail.Date || !(detail.Date instanceof Date)) {
                console.warn(`Skipping record with invalid date: ${detail.Date}`);
                continue;
            }
            const gregDateStr = DateTime.fromJSDate(detail.Date, {zone: 'Asia/Tehran'}).toFormat('yyyy-MM-dd');
            detailsMap.set(gregDateStr, detail);
        }

        // Generate data for all days in the month (same as before)
        const data = [];
        let currentDate = DateTime.fromJSDate(startDate, {zone: 'Asia/Tehran'});
        const endDt = DateTime.fromJSDate(endDate, {zone: 'Asia/Tehran'});

        while (currentDate <= endDt) {
            const gregDateStr = currentDate.toFormat('yyyy-MM-dd');
            const detail = detailsMap.get(gregDateStr) || {
                ArrivalTime: null,
                LeaveTime: null,
                PersonalTime: 0,
                LeaveType: null,
                Description: null
            };

            // Fetch tasks if detail exists
            let tasks = [];
            if (detailsMap.has(gregDateStr)) {
                const tasksRequest = pool.request();
                tasksRequest.input('date', sql.Date, currentDate.toJSDate());
                tasksRequest.input('userId', sql.Int, targetUserId);
                const tasksResult = await tasksRequest.query('SELECT * FROM DailyProjectTasks WHERE Date = @date AND UserId = @userId');
                tasks = tasksResult.recordset;
            }

            // Compute fields (same as before)
            const dayOfWeek = currentDate.setLocale('fa').toFormat('cccc');
            const jalaliDate = formatJalaliDate(currentDate.toJSDate());

            let arrivalTime = null;
            if (detail.ArrivalTime) {
                const [hours, minutes, seconds = '00'] = detail.ArrivalTime.split(':').map(Number);
                arrivalTime = currentDate.set({hour: hours, minute: minutes, second: seconds}).toISO();
            }

            let leaveTime = null;
            if (detail.LeaveTime) {
                const [hours, minutes, seconds = '00'] = detail.LeaveTime.split(':').map(Number);
                leaveTime = currentDate.set({hour: hours, minute: minutes, second: seconds}).toISO();
            }

            const totalDailyWork = tasks.reduce((sum, t) => sum + (t.Duration || 0), 0);

            const projects = tasks.map(t => ({
                projectId: t.ProjectId,
                duration: t.Duration,
                description: t.Description || null
            }));

            let entryDelay = 0;
            if (detail.LeaveType === 'work' && detail.ArrivalTime && contractArrival) {
                const contractParts = contractArrival.split(':').map(Number);
                const contractMinutes = contractParts[0] * 60 + (contractParts[1] || 0);

                const arrivalParts = detail.ArrivalTime.split(':').map(Number);
                const arrivalMinutes = arrivalParts[0] * 60 + (arrivalParts[1] || 0);

                if (arrivalMinutes > contractMinutes) {
                    entryDelay = arrivalMinutes - contractMinutes;
                }
            }

            data.push({
                dayOfWeek,
                date: jalaliDate,
                arrivalTime,
                leaveTime,
                personalTime: detail.PersonalTime || 0,
                leaveType: detail.LeaveType || null,
                projects,
                totalDailyWork,
                entryDelay,
                description: detail.Description || null
            });

            currentDate = currentDate.plus({days: 1});
        }

        // Now, create Excel file
        const workbook = new exceljs.Workbook();
        const sheet = workbook.addWorksheet('Monthly Details');

        // Add headers
        sheet.addRow([
            'روز هفته',
            'تاریخ',
            'ساعت ورود',
            'ساعت خروج',
            'ساعت شخصی',
            'وضعیت مرخصی',
            'پروژه‌ها',
            'مجموع کارکرد روزانه',
            'تاخیر ورود',
            'توضیحات'
        ]);

        // Function to format time
        const formatTime = (isoTime) => {
            if (!isoTime) return '-';
            const dt = DateTime.fromISO(isoTime);
            return dt.toFormat('HH:mm');
        };

        // Function to format minutes
        const formatMinutes = (minutes) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours}:${mins.toString().padStart(2, '0')}`;  // Changed padLeft to padStart
        };

        // Function to format projects
        const formatProjects = (projects) => {
            if (projects.length === 0) return '-';
            return projects.map(p => `${p.projectId}: ${formatMinutes(p.duration)} (${p.description || ''})`).join('\n');
        };

        // Function to translate leave type
        const translateLeaveType = (type) => {
            switch (type) {
                case 'work':
                    return 'روزکاری';
                case 'annual_leave':
                    return 'مرخصی سالانه';
                case 'sick_leave':
                    return 'مرخصی استعلاجی';
                case 'gift_leave':
                    return 'مرخصی هدیه';
                case 'mission':
                    return 'ماموریت';
                default:
                    return type || '-';
            }
        };

        // Add data rows
        data.forEach(row => {
            sheet.addRow([
                row.dayOfWeek,
                row.date,
                formatTime(row.arrivalTime),
                formatTime(row.leaveTime),
                formatMinutes(row.personalTime),
                translateLeaveType(row.leaveType),
                formatProjects(row.projects),
                formatMinutes(row.totalDailyWork),
                formatMinutes(row.entryDelay),
                row.description || '-'
            ]);
        });

        // Set column widths (optional)
        sheet.columns = [
            {width: 15},
            {width: 15},
            {width: 15},
            {width: 15},
            {width: 15},
            {width: 20},
            {width: 30},
            {width: 20},
            {width: 15},
            {width: 40}
        ];

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Send as attachment
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="monthly_details_${jalaliYear}_${jalaliMonth}.xlsx"`);
        res.send(buffer);
    } catch (err) {
        console.error(`Error in GET /daily-details/user/:userId/jalali/month/:year/:month/export-excel: ${err.message}`);
        res.status(500).send(`Server error: ${err.message}`);
    }
};

module.exports = {
    getJalaliMonthlyDetails,
    getRangeDetails,
    getDailyDetails,
    getMonthlyDetails,
    getUserJalaliMonthlyDetails,
    exportUserJalaliMonthlyToExcel
};