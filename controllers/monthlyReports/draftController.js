const { sql, poolPromise } = require('../../config/db.config');
const { getJalaliMonthRange } = require('../../utils/dateConverter');

const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).send('Access denied');
    next();
};

const validateReportId = (req, res, next) => {
    const reportId = parseInt(req.params.reportId);
    if (isNaN(reportId)) {
        return res.status(400).send('Invalid reportId: must be an integer');
    }
    req.params.reportId = reportId;
    next();
};

/**
 * @swagger
 * /monthly-reports/my-drafts:
 *   get:
 *     summary: Get list of draft reports for the current user
 *     tags: [MonthlyReports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of draft reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MonthlyReport'
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
const getMyDrafts = async (req, res) => {
    checkRole(['user', 'group_manager', 'general_manager', 'finance_manager'])(req, res, async () => {
        const userId = req.user.userId;

        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT 
                        mr.*,
                        u.id as username,
                        u.farsifirstname,
                        u.farsilastname,
                        g.groupname,
                        m.id AS managerUsername
                    FROM MonthlyReports mr
                    JOIN users u ON mr.UserId = u.personalid
                    LEFT JOIN groups g ON mr.GroupId = g.id
                    LEFT JOIN users m ON g.managerID = m.personalid
                    WHERE mr.UserId = @userId
                      AND mr.Status = 'draft'
                      AND u.IsActive = 1
                `);

            const drafts = result.recordset;

            for (let report of drafts) {
                const monthRange = getJalaliMonthRange(report.JalaliYear, report.JalaliMonth);
                const startDate = monthRange.start;
                const endDate = monthRange.end;

                const commuteResult = await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('startDate', sql.Date, startDate)
                    .input('endDate', sql.Date, endDate)
                    .query(`
                        SELECT SUM(ISNULL(GoCost, 0) + ISNULL(ReturnCost, 0)) AS TotalCommuteCost
                        FROM DailyDetails
                        WHERE UserId = @userId
                          AND Date >= @startDate
                          AND Date <= @endDate
                          AND LeaveType IN ('work', 'mission')
                    `);
                report.totalCommuteCost = commuteResult.recordset[0].TotalCommuteCost || 0;

                const carCostsResult = await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('startDate', sql.Date, startDate)
                    .input('endDate', sql.Date, endDate)
                    .query(`
                        SELECT dpc.ProjectID, SUM(ISNULL(dpc.Cost, 0)) AS TotalCost
                        FROM DailyPersonalCarCosts dpc
                        INNER JOIN DailyDetails dd ON dpc.Date = dd.Date AND dpc.UserId = dd.UserId
                        WHERE dpc.UserId = @userId
                          AND dpc.Date >= @startDate
                          AND dpc.Date <= @endDate
                          AND dd.LeaveType IN ('work', 'mission')
                        GROUP BY dpc.ProjectID
                    `);
                report.personalCarCostsByProject = carCostsResult.recordset;

                const projectHoursResult = await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('startDate', sql.Date, startDate)
                    .input('endDate', sql.Date, endDate)
                    .query(`
                        SELECT dpt.ProjectID, SUM(dpt.Duration) AS TotalHours
                        FROM DailyProjectTasks dpt
                        INNER JOIN DailyDetails dd ON dpt.Date = dd.Date AND dpt.UserId = dd.UserId
                        WHERE dpt.UserId = @userId
                          AND dpt.Date >= @startDate
                          AND dpt.Date <= @endDate
                          AND dd.LeaveType IN ('work', 'mission')
                        GROUP BY dpt.ProjectID
                    `);
                report.projectHoursByProject = projectHoursResult.recordset;

                const leaveTypesResult = await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('startDate', sql.Date, startDate)
                    .input('endDate', sql.Date, endDate)
                    .query(`
                        SELECT LeaveType, COUNT(*) AS Count
                        FROM DailyDetails
                        WHERE UserId = @userId
                          AND Date >= @startDate
                          AND Date <= @endDate
                          AND LeaveType NOT IN ('work', 'mission')
                        GROUP BY LeaveType
                    `);
                report.leaveTypesCount = leaveTypesResult.recordset.reduce((acc, row) => {
                    acc[row.LeaveType] = row.Count;
                    return acc;
                }, {});
            }

            res.json(drafts);
        } catch (err) {
            console.error('Error in GET /monthly-reports/my-drafts:', err.message);
            res.status(500).send('Server error');
        }
    });
};

/**
 * @swagger
 * /monthly-reports/exit-draft/{reportId}:
 *   delete:
 *     summary: Exit from draft state by deleting the draft monthly report (by user)
 *     tags: [MonthlyReports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the report to exit from draft
 *     responses:
 *       200:
 *         description: Exited from draft state successfully
 *       400:
 *         description: Only draft reports can be exited
 *       403:
 *         description: Access denied (not the owner or invalid role)
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
const exitDraft = async (req, res) => {
    checkRole(['user', 'group_manager', 'general_manager', 'finance_manager'])(req, res, async () => {
        validateReportId(req, res, async () => {
            const { reportId } = req.params;
            const userId = req.user.userId;

            try {
                const pool = await poolPromise;
                const reportResult = await pool.request()
                    .input('reportId', sql.Int, reportId)
                    .input('userId', sql.Int, userId)
                    .query(`
                        SELECT Status
                        FROM MonthlyReports
                        WHERE ReportId = @reportId
                          AND UserId = @userId
                    `);

                if (reportResult.recordset.length === 0) {
                    return res.status(404).send('Report not found or access denied');
                }

                const status = reportResult.recordset[0].Status;
                if (status !== 'draft') {
                    return res.status(400).send('Only draft reports can be exited');
                }

                await pool.request()
                    .input('reportId', sql.Int, reportId)
                    .query('DELETE FROM MonthlyReports WHERE ReportId = @reportId AND Status = \'draft\'');

                res.send('Exited from draft state and returned to normal');
            } catch (err) {
                console.error('Error in DELETE /monthly-reports/:reportId/exit-draft:', err.message);
                res.status(500).send('Server error');
            }
        });
    });
};

/**
 * @swagger
 * /monthly-reports/{year}/{month}:
 *   post:
 *     summary: Create monthly report (by user) using Gregorian calendar
 *     tags: [MonthlyReports]
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
 *     responses:
 *       201: { description: Report created }
 *       400: { description: Invalid input }
 *       500: { description: Server error }
 */
const createMonthlyReportGregorian = async (req, res) => {
    checkRole(['user', 'group_manager', 'general_manager'])(req, res, async () => {
        const { year, month } = req.params;
        const userId = req.user.userId;
        try {
            const pool = await poolPromise;
            // Get user's group from users table
            const groupResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT groupid FROM users WHERE personalid = @userId');
            const groupId = groupResult.recordset[0]?.groupid || null;

            const hoursResult = await pool.request()
                .input('userId', sql.Int, userId)
                .input('year', sql.Int, year)
                .input('month', sql.Int, month)
                .query(`
                    SELECT SUM(dpt.Duration) AS TotalHours
                    FROM DailyProjectTasks dpt
                    INNER JOIN DailyDetails dd ON dpt.Date = dd.Date AND dpt.UserId = dd.UserId
                    WHERE dpt.UserId = @userId
                      AND YEAR(dpt.Date) = @year
                      AND MONTH(dpt.Date) = @month
                      AND dd.LeaveType IN ('work', 'mission')
                `);
            const totalHours = hoursResult.recordset[0].TotalHours || 0;

            const gymResult = await pool.request()
                .input('userId', sql.Int, userId)
                .input('year', sql.Int, year)
                .input('month', sql.Int, month)
                .query('SELECT Cost, GymHours FROM MonthlyGymCosts WHERE UserId = @userId AND Year = @year AND Month = @month');
            const gymCost = gymResult.recordset[0]?.Cost || 0;

            const existingReport = await pool.request()
                .input('userId', sql.Int, userId)
                .input('year', sql.Int, year)
                .input('month', sql.Int, month)
                .query(`
                    SELECT Status
                    FROM MonthlyReports
                    WHERE UserId = @userId
                      AND Year = @year
                      AND Month = @month
                `);

            if (existingReport.recordset.length > 0) {
                const status = existingReport.recordset[0].Status;
                if (status !== 'draft') {
                    return res.status(400).send('گزارش وجود دارد');
                }
                const updateResult = await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('year', sql.Int, year)
                    .input('month', sql.Int, month)
                    .input('totalHours', sql.Int, totalHours)
                    .input('gymCost', sql.Int, gymCost)
                    .input('groupId', sql.Int, groupId)
                    .query(`
                        UPDATE MonthlyReports
                        SET TotalHours = @totalHours,
                            GymCost    = @gymCost,
                            Status     = 'draft',
                            GroupId    = @groupId 
                        OUTPUT INSERTED.*
                        WHERE UserId = @userId
                          AND Year = @year
                          AND Month = @month
                          AND Status = 'draft'
                    `);
                res.status(201).json(updateResult.recordset[0]);
            } else {
                const insertResult = await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('year', sql.Int, year)
                    .input('month', sql.Int, month)
                    .input('totalHours', sql.Int, totalHours)
                    .input('gymCost', sql.Int, gymCost)
                    .input('groupId', sql.Int, groupId)
                    .query(`
                        INSERT INTO MonthlyReports (UserId, Year, Month, TotalHours, GymCost, Status, GroupId)
                        OUTPUT INSERTED.*
                        VALUES (@userId, @year, @month, @totalHours, @gymCost, 'draft', @groupId)
                    `);
                res.status(201).json(insertResult.recordset[0]);
            }
        } catch (err) {
            res.status(500).send(err.message);
        }
    });
};

/**
 * @swagger
 * /monthly-reports/jalali/{year}/{month}:
 *   post:
 *     summary: Create monthly report using Jalali calendar (by user)
 *     tags: [MonthlyReports]
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
 *     responses:
 *       201: { description: Report created }
 *       400: { description: Invalid input }
 *       500: { description: Server error }
 */
const createMonthlyReportJalali = async (req, res) => {
    checkRole(['user', 'group_manager', 'general_manager', 'finance_manager'])(req, res, async () => {
        const { year, month } = req.params;
        const userId = req.user.userId;

        try {
            const jalaliYear = parseInt(year);
            const jalaliMonth = parseInt(month);

            if (isNaN(jalaliYear) || isNaN(jalaliMonth) || jalaliMonth < 1 || jalaliMonth > 12) {
                return res.status(400).send('Invalid Jalali year or month');
            }

            const monthRange = getJalaliMonthRange(jalaliYear, jalaliMonth);
            const startDate = monthRange.start;
            const endDate = monthRange.end;

            const gregorianYear = startDate.getFullYear();
            const gregorianMonth = startDate.getMonth() + 1;

            const pool = await poolPromise;
            // Get user's group from users table
            const groupResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT groupid FROM users WHERE personalid = @userId');
            const groupId = groupResult.recordset[0]?.groupid || null;

            const hoursResult = await pool.request()
                .input('userId', sql.Int, userId)
                .input('startDate', sql.Date, startDate)
                .input('endDate', sql.Date, endDate)
                .query(`
                    SELECT SUM(dpt.Duration) AS TotalHours
                    FROM DailyProjectTasks dpt
                    INNER JOIN DailyDetails dd ON dpt.Date = dd.Date AND dpt.UserId = dd.UserId
                    WHERE dpt.UserId = @userId
                      AND dpt.Date >= @startDate
                      AND dpt.Date <= @endDate
                      AND dd.LeaveType IN ('work', 'mission')
                `);

            const totalHours = hoursResult.recordset[0].TotalHours || 0;

            const gymResult = await pool.request()
                .input('userId', sql.Int, userId)
                .input('year', sql.Int, gregorianYear)
                .input('month', sql.Int, gregorianMonth)
                .query('SELECT Cost, GymHours FROM MonthlyGymCosts WHERE UserId = @userId AND Year = @year AND Month = @month');
            const gymCost = gymResult.recordset[0]?.Cost || 0;

            const existingReport = await pool.request()
                .input('userId', sql.Int, userId)
                .input('year', sql.Int, gregorianYear)
                .input('month', sql.Int, gregorianMonth)
                .query(`
                    SELECT Status
                    FROM MonthlyReports
                    WHERE UserId = @userId
                      AND Year = @year
                      AND Month = @month
                `);

            if (existingReport.recordset.length > 0) {
                const status = existingReport.recordset[0].Status;
                if (status !== 'draft') {
                    return res.status(400).send('گزارش وجود دارد');
                }
                const updateResult = await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('year', sql.Int, gregorianYear)
                    .input('month', sql.Int, gregorianMonth)
                    .input('jalaliYear', sql.Int, jalaliYear)
                    .input('jalaliMonth', sql.Int, jalaliMonth)
                    .input('totalHours', sql.Int, totalHours)
                    .input('gymCost', sql.Int, gymCost)
                    .input('groupId', sql.Int, groupId)
                    .query(`
                        UPDATE MonthlyReports
                        SET JalaliYear  = @jalaliYear,
                            JalaliMonth = @jalaliMonth,
                            TotalHours  = @totalHours,
                            GymCost     = @gymCost,
                            Status      = 'draft',
                            GroupId     = @groupId 
                        OUTPUT INSERTED.*
                        WHERE UserId = @userId
                          AND Year = @year
                          AND Month = @month
                          AND Status = 'draft'
                    `);
                res.status(201).json(updateResult.recordset[0]);
            } else {
                const insertResult = await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('year', sql.Int, gregorianYear)
                    .input('month', sql.Int, gregorianMonth)
                    .input('jalaliYear', sql.Int, jalaliYear)
                    .input('jalaliMonth', sql.Int, jalaliMonth)
                    .input('totalHours', sql.Int, totalHours)
                    .input('gymCost', sql.Int, gymCost)
                    .input('groupId', sql.Int, groupId)
                    .query(`
                        INSERT INTO MonthlyReports (UserId, Year, Month, JalaliYear, JalaliMonth, TotalHours, GymCost,
                                                    Status, GroupId)
                        OUTPUT INSERTED.*
                        VALUES (@userId, @year, @month, @jalaliYear, @jalaliMonth, @totalHours, @gymCost, 'draft', @groupId)
                    `);
                res.status(201).json(insertResult.recordset[0]);
            }
        } catch (err) {
            res.status(500).send(err.message);
        }
    });
};

module.exports = {
    getMyDrafts,
    exitDraft,
    createMonthlyReportGregorian,
    createMonthlyReportJalali,
    checkRole,
    validateReportId
};