const { sql, poolPromise } = require('../../config/db.config');
const { getJalaliMonthRange, getActualMonthRange } = require('../../utils/dateConverter');

const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).send('Access denied');
    next();
};

/**
 * @swagger
 * /monthly-reports/report:
 *   post:
 *     summary: Get details of a specific monthly report by reportId
 *     tags: [MonthlyReports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportId:
 *                 type: integer
 *                 description: The ID of the report to fetch
 *     responses:
 *       200:
 *         description: Details of the monthly report
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonthlyReport'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Access denied
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
const getReportById = async (req, res) => {
    checkRole(['user', 'group_manager', 'general_manager', 'finance_manager'])(req, res, async () => {
        const { reportId } = req.body;

        if (!reportId) {
            return res.status(400).send('reportId is required');
        }

        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('reportId', sql.Int, reportId)
                .query(`
                    SELECT 
                        mr.*,
                        u.id as username,
                        u.farsifirstname,
                        u.farsilastname,
                        g.groupname AS GroupName,
                        u.directAdmin AS ManagerUsername
                    FROM MonthlyReports mr
                    JOIN users u ON mr.UserId = u.personalid
                    LEFT JOIN groups g ON mr.GroupId = g.id
                    WHERE mr.ReportId = @reportId
                      AND u.IsActive = 1
                `);

            if (result.recordset.length === 0) {
                return res.status(404).send('Report not found');
            }

            const report = result.recordset[0];

            // Access check
            const currentUserId = req.user.userId;
            const currentRole = req.user.role;

            let hasAccess = false;

            if (currentRole === 'user' && report.UserId === currentUserId) {
                hasAccess = true;
            } else if (currentRole === 'group_manager') {
                // Check if current user is the manager of the report's group
                const groupResult = await pool.request()
                    .input('groupId', sql.Int, report.GroupId)
                    .query('SELECT managerID FROM groups WHERE id = @groupId');
                if (groupResult.recordset.length > 0 && groupResult.recordset[0].managerID === currentUserId) {
                    hasAccess = true;
                }
            } else if (currentRole === 'general_manager' || currentRole === 'finance_manager') {
                hasAccess = true;
            }

            if (!hasAccess) {
                return res.status(403).send('Access denied');
            }

            // استفاده از بازه واقعی بر اساس تنظیمات ادمین
            const monthRange = await getActualMonthRange(pool, report.JalaliYear, report.JalaliMonth);
            const startDate = monthRange.start;
            const endDate = monthRange.end;

            const commuteResult = await pool.request()
                .input('userId', sql.Int, report.UserId)
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
                .input('userId', sql.Int, report.UserId)
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
                .input('userId', sql.Int, report.UserId)
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
                .input('userId', sql.Int, report.UserId)
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

            res.json(report);
        } catch (err) {
            console.error('Error in POST /monthly-reports/report:', err.message);
            res.status(500).send('Server error');
        }
    });
};

module.exports = { getReportById };
