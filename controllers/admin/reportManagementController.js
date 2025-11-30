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

/**
 * Update report status (Admin only)
 * Allows admin to change report status directly
 */
const updateReportStatus = async (req, res) => {
    const { reportId } = req.params;
    const { Status, comment } = req.body;

    // Validate status
    const validStatuses = [
        'draft',
        'submitted_to_group_manager',
        'submitted_to_general_manager',
        'submitted_to_finance',
        'approved'
    ];

    if (!Status || !validStatuses.includes(Status)) {
        return res.status(400).send('وضعیت نامعتبر است. مقادیر مجاز: ' + validStatuses.join(', '));
    }

    try {
        const pool = await poolPromise;

        // Check if report exists
        const reportCheck = await pool
            .request()
            .input('reportId', sql.Int, reportId)
            .query('SELECT * FROM MonthlyReports WHERE ReportId = @reportId');

        if (reportCheck.recordset.length === 0) {
            return res.status(404).send('گزارش یافت نشد');
        }

        const currentReport = reportCheck.recordset[0];

        // Build update query
        let updateQuery = 'UPDATE MonthlyReports SET Status = @status';
        const request = pool.request()
            .input('reportId', sql.Int, reportId)
            .input('status', sql.NVarChar, Status);

        // Update timestamps based on status
        if (Status === 'submitted_to_group_manager' || Status === 'submitted_to_general_manager' || Status === 'submitted_to_finance') {
            updateQuery += ', SubmittedAt = GETDATE()';
        }

        if (Status === 'approved') {
            updateQuery += ', ApprovedAt = GETDATE()';
        }

        if (Status === 'draft') {
            updateQuery += ', SubmittedAt = NULL, ApprovedAt = NULL';
        }

        // Add comment if provided
        if (comment) {
            updateQuery += ', ManagerComment = @comment';
            request.input('comment', sql.NVarChar, comment);
        }

        updateQuery += ' WHERE ReportId = @reportId';

        await request.query(updateQuery);

        res.json({
            success: true,
            message: 'وضعیت گزارش با موفقیت به‌روز شد',
            reportId: reportId,
            newStatus: Status
        });
    } catch (err) {
        console.error('Error in updateReportStatus:', err.message);
        res.status(500).send('خطای سرور در به‌روزرسانی وضعیت گزارش');
    }
};

/**
 * Approve report (Admin only)
 * Can either approve directly or update status
 * Supports both {Status: "..."} and {comment: "..."} formats
 */
const approveReport = async (req, res) => {
    const { reportId } = req.params;
    const { Status, status, Comment, comment } = req.body;

    // Support both uppercase and lowercase field names
    let targetStatus = Status || status || 'approved';
    const targetComment = Comment || comment;

    // Handle 'rejected' status by converting it to 'draft'
    if (targetStatus === 'rejected') {
        targetStatus = 'draft';
    }

    // Validate status
    const validStatuses = [
        'draft',
        'submitted_to_group_manager',
        'submitted_to_general_manager',
        'submitted_to_finance',
        'approved',
        'rejected' // This will be converted to 'draft'
    ];

    if (!validStatuses.includes(Status || status || 'approved')) {
        return res.status(400).send('وضعیت نامعتبر است. مقادیر مجاز: ' + validStatuses.join(', '));
    }

    try {
        const pool = await poolPromise;

        // Check if report exists
        const reportCheck = await pool
            .request()
            .input('reportId', sql.Int, reportId)
            .query('SELECT * FROM MonthlyReports WHERE ReportId = @reportId');

        if (reportCheck.recordset.length === 0) {
            return res.status(404).send('گزارش یافت نشد');
        }

        // Build update query
        let updateQuery = 'UPDATE MonthlyReports SET Status = @status';
        const request = pool.request()
            .input('reportId', sql.Int, reportId)
            .input('status', sql.NVarChar, targetStatus);

        // Update timestamps based on status
        if (targetStatus === 'submitted_to_group_manager' || 
            targetStatus === 'submitted_to_general_manager' || 
            targetStatus === 'submitted_to_finance') {
            updateQuery += ', SubmittedAt = GETDATE()';
        }

        if (targetStatus === 'approved') {
            updateQuery += ', ApprovedAt = GETDATE()';
        }

        if (targetStatus === 'draft') {
            updateQuery += ', SubmittedAt = NULL, ApprovedAt = NULL';
            
            // If this is a rejection, append to existing comments
            const originalStatus = Status || status || 'approved';
            if (originalStatus === 'rejected' && targetComment) {
                updateQuery += ', ManagerComment = ISNULL(ManagerComment + \'\n\', \'\') + @comment';
                request.input('comment', sql.NVarChar, targetComment);
            } else if (targetComment) {
                updateQuery += ', ManagerComment = @comment';
                request.input('comment', sql.NVarChar, targetComment);
            }
        } else if (targetComment) {
            // Add comment for other statuses
            updateQuery += ', ManagerComment = @comment';
            request.input('comment', sql.NVarChar, targetComment);
        }

        updateQuery += ' WHERE ReportId = @reportId';

        const result = await request.query(updateQuery);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('گزارش یافت نشد');
        }

        // Prepare response message based on status
        const originalStatus = Status || status || 'approved';
        let message;
        
        if (originalStatus === 'rejected') {
            message = 'گزارش رد شد و به وضعیت پیش‌نویس بازگشت';
        } else {
            switch (targetStatus) {
                case 'approved':
                    message = 'گزارش با موفقیت تایید شد';
                    break;
                case 'submitted_to_general_manager':
                    message = 'گزارش به مدیر کل ارسال شد';
                    break;
                case 'submitted_to_finance':
                    message = 'گزارش به واحد مالی ارسال شد';
                    break;
                case 'submitted_to_group_manager':
                    message = 'گزارش به مدیر گروه ارسال شد';
                    break;
                case 'draft':
                    message = 'گزارش به وضعیت پیش‌نویس بازگشت';
                    break;
                default:
                    message = 'وضعیت گزارش به‌روز شد';
            }
        }

        res.json({
            success: true,
            message: message,
            reportId: reportId,
            newStatus: originalStatus === 'rejected' ? 'rejected' : targetStatus,
            actualStatus: targetStatus // The actual status in database
        });
    } catch (err) {
        console.error('Error in approveReport:', err.message);
        res.status(500).send('خطای سرور در به‌روزرسانی گزارش');
    }
};

/**
 * Reject report to draft (Admin only)
 */
const rejectReport = async (req, res) => {
    const { reportId } = req.params;
    const { comment } = req.body;

    try {
        const pool = await poolPromise;

        const result = await pool
            .request()
            .input('reportId', sql.Int, reportId)
            .input('comment', sql.NVarChar, comment || 'رد شده توسط ادمین')
            .query(`
                UPDATE MonthlyReports
                SET Status = 'draft',
                    SubmittedAt = NULL,
                    ApprovedAt = NULL,
                    ManagerComment = ISNULL(ManagerComment + '\n', '') + @comment
                WHERE ReportId = @reportId
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('گزارش یافت نشد');
        }

        res.json({
            success: true,
            message: 'گزارش رد شد و به وضعیت پیش‌نویس بازگشت',
            reportId: reportId
        });
    } catch (err) {
        console.error('Error in rejectReport:', err.message);
        res.status(500).send('خطای سرور در رد گزارش');
    }
};

module.exports = {
    getAllMonthlyReports,
    getAllDailyDetails,
    getSystemStatistics,
    getUserActivitySummary,
    updateReportStatus,
    approveReport,
    rejectReport
};
