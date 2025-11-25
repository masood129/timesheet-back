const { sql, poolPromise } = require('../../config/db.config');

/**
 * Get all monthly reports with filtering
 */
const getAllMonthlyReports = async (req, res) => {
    const { status, userId, year, month, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const pool = await poolPromise;
        let query = `
            SELECT 
                mr.*,
                u.id as username,
                u.farsifirstname,
                u.farsilastname
            FROM MonthlyReports mr
            JOIN users u ON mr.UserId = u.personalid
            WHERE u.IsActive = 1
        `;
        const request = pool.request();

        if (status) {
            query += ' AND mr.Status = @status';
            request.input('status', sql.NVarChar, status);
        }

        if (userId) {
            query += ' AND mr.UserId = @userId';
            request.input('userId', sql.Int, userId);
        }

        if (year) {
            query += ' AND mr.JalaliYear = @year';
            request.input('year', sql.Int, year);
        }

        if (month) {
            query += ' AND mr.JalaliMonth = @month';
            request.input('month', sql.Int, month);
        }

        query += ' ORDER BY mr.ReportId DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, parseInt(limit));

        const result = await request.query(query);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM MonthlyReports mr JOIN users u ON mr.UserId = u.personalid WHERE u.IsActive = 1';
        const countRequest = pool.request();

        if (status) {
            countQuery += ' AND mr.Status = @status';
            countRequest.input('status', sql.NVarChar, status);
        }

        if (userId) {
            countQuery += ' AND mr.UserId = @userId';
            countRequest.input('userId', sql.Int, userId);
        }

        if (year) {
            countQuery += ' AND mr.JalaliYear = @year';
            countRequest.input('year', sql.Int, year);
        }

        if (month) {
            countQuery += ' AND mr.JalaliMonth = @month';
            countRequest.input('month', sql.Int, month);
        }

        const countResult = await countRequest.query(countQuery);

        res.json({
            reports: result.recordset,
            total: countResult.recordset[0].total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (err) {
        console.error('Error in getAllMonthlyReports:', err.message);
        res.status(500).send('خطای سرور در دریافت گزارش‌های ماهانه');
    }
};

/**
 * Get all daily details with filtering
 */
const getAllDailyDetails = async (req, res) => {
    const { userId, startDate, endDate, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const pool = await poolPromise;
        let query = `
            SELECT 
                dd.*,
                u.id as username,
                u.farsifirstname,
                u.farsilastname
            FROM DailyDetails dd
            JOIN users u ON dd.UserId = u.personalid
            WHERE u.IsActive = 1
        `;
        const request = pool.request();

        if (userId) {
            query += ' AND dd.UserId = @userId';
            request.input('userId', sql.Int, userId);
        }

        if (startDate) {
            query += ' AND dd.Date >= @startDate';
            request.input('startDate', sql.Date, startDate);
        }

        if (endDate) {
            query += ' AND dd.Date <= @endDate';
            request.input('endDate', sql.Date, endDate);
        }

        query += ' ORDER BY dd.Date DESC, dd.UserId OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, parseInt(limit));

        const result = await request.query(query);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM DailyDetails dd JOIN users u ON dd.UserId = u.personalid WHERE u.IsActive = 1';
        const countRequest = pool.request();

        if (userId) {
            countQuery += ' AND dd.UserId =  @userId';
            countRequest.input('userId', sql.Int, userId);
        }

        if (startDate) {
            countQuery += ' AND dd.Date >= @startDate';
            countRequest.input('startDate', sql.Date, startDate);
        }

        if (endDate) {
            countQuery += ' AND dd.Date <= @endDate';
            countRequest.input('endDate', sql.Date, endDate);
        }

        const countResult = await countRequest.query(countQuery);

        res.json({
            dailyDetails: result.recordset,
            total: countResult.recordset[0].total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (err) {
        console.error('Error in getAllDailyDetails:', err.message);
        res.status(500).send('خطای سرور در دریافت جزئیات روزانه');
    }
};

/**
 * Get system statistics
 */
const getSystemStatistics = async (req, res) => {
    try {
        const pool = await poolPromise;

        // Total active users
        const usersResult = await pool.request().query('SELECT COUNT(*) as total FROM users WHERE IsActive = 1');

        // Total projects
        const projectsResult = await pool.request().query('SELECT COUNT(*) as total FROM projects');

        // Total groups
        const groupsResult = await pool.request().query('SELECT COUNT(*) as total FROM groups');

        // Pending reports
        const pendingReportsResult = await pool.request().query(`
            SELECT COUNT(*) as total FROM MonthlyReports
            WHERE Status IN ('draft', 'submitted_to_group_manager', 'submitted_to_general_manager', 'submitted_to_finance')
        `);

        // Approved reports
        const approvedReportsResult = await pool.request().query(`
            SELECT COUNT(*) as total FROM MonthlyReports WHERE Status = 'approved'
        `);

        // Users by role
        const usersByRoleResult = await pool.request().query(`
            SELECT role, COUNT(*) as count FROM users WHERE IsActive = 1 GROUP BY role
        `);

        // Recent activity (last 30 days)
        const recentActivityResult = await pool.request().query(`
            SELECT COUNT(*) as total FROM DailyDetails
            WHERE Date >= DATEADD(day, -30, GETDATE())
        `);

        res.json({
            totalUsers: usersResult.recordset[0].total,
            totalProjects: projectsResult.recordset[0].total,
            totalGroups: groupsResult.recordset[0].total,
            pendingReports: pendingReportsResult.recordset[0].total,
            approvedReports: approvedReportsResult.recordset[0].total,
            usersByRole: usersByRoleResult.recordset,
            recentActivityCount: recentActivityResult.recordset[0].total
        });
    } catch (err) {
        console.error('Error in getSystemStatistics:', err.message);
        res.status(500).send('خطای سرور در دریافت آمار سیستم');
    }
};

/**
 * Get user activity summary
 */
const getUserActivitySummary = async (req, res) => {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    try {
        const pool = await poolPromise;

        // Check if user exists
        const userCheck = await pool
            .request()
            .input('personalId', sql.Int, userId)
            .query('SELECT id as username, role, farsifirstname, farsilastname FROM users WHERE personalid = @personalId AND IsActive = 1');

        if (userCheck.recordset.length === 0) {
            return res.status(404).send('کاربر یافت نشد');
        }

        const user = userCheck.recordset[0];

        // Build query with date filters
        const request = pool.request().input('userId', sql.Int, userId);
        let dateFilter = '';

        if (startDate) {
            dateFilter += ' AND dd.Date >= @startDate';
            request.input('startDate', sql.Date, startDate);
        }

        if (endDate) {
            dateFilter += ' AND dd.Date <= @endDate';
            request.input('endDate', sql.Date, endDate);
        }

        // Total working days
        const workingDaysResult = await request.query(`
            SELECT COUNT(DISTINCT Date) as total FROM DailyDetails dd
            WHERE UserId = @userId ${dateFilter}
        `);

        // Total hours worked
        const totalHoursResult = await pool
            .request()
            .input('userId', sql.Int, userId)
            .input('startDate', sql.Date, startDate || '1900-01-01')
            .input('endDate', sql.Date, endDate || '2100-12-31')
            .query(`
                SELECT SUM(Duration) as totalMinutes FROM DailyProjectTasks
                WHERE UserId = @userId
                  AND Date >= @startDate
                  AND Date <= @endDate
            `);

        const totalMinutes = totalHoursResult.recordset[0].totalMinutes || 0;
        const totalHours = Math.floor(totalMinutes / 60);

        // Projects worked on
        const projectsResult = await pool
            .request()
            .input('userId', sql.Int, userId)
            .input('startDate', sql.Date, startDate || '1900-01-01')
            .input('endDate', sql.Date, endDate || '2100-12-31')
            .query(`
                SELECT DISTINCT p.id, p.projectName, SUM(dpt.Duration) as totalMinutes
                FROM DailyProjectTasks dpt
                JOIN projects p ON dpt.ProjectId = p.id
                WHERE dpt.UserId = @userId
                  AND dpt.Date >= @startDate
                  AND dpt.Date <= @endDate
                GROUP BY p.id, p.projectName
                ORDER BY totalMinutes DESC
            `);

        // Monthly reports
        const reportsResult = await pool
            .request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT ReportId, JalaliYear, JalaliMonth, Status, TotalHours
                FROM MonthlyReports
                WHERE UserId = @userId
                ORDER BY JalaliYear DESC, JalaliMonth DESC
            `);

        res.json({
            user: {
                personalId: userId,
                username: user.username,
                fullName: `${user.farsifirstname} ${user.farsilastname}`,
                role: user.role
            },
            summary: {
                totalWorkingDays: workingDaysResult.recordset[0].total,
                totalHours: totalHours,
                totalMinutes: totalMinutes,
                projects: projectsResult.recordset,
                monthlyReports: reportsResult.recordset
            },
            dateRange: {
                startDate: startDate || 'همه',
                endDate: endDate || 'همه'
            }
        });
    } catch (err) {
        console.error('Error in getUserActivitySummary:', err.message);
        res.status(500).send('خطای سرور در دریافت خلاصه فعالیت کاربر');
    }
};

module.exports = {
    getAllMonthlyReports,
    getAllDailyDetails,
    getSystemStatistics,
    getUserActivitySummary
};
