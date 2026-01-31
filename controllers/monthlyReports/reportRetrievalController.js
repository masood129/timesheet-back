const { sql, poolPromise } = require('../../config/db.config');

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

const getReportIdsJalali = async (req, res) => {
    checkRole(['user', 'group_manager', 'general_manager', 'finance_manager', 'admin'])(req, res, async () => {
        const { year, month } = req.params;
        
        // Validate req.user exists
        if (!req.user || !req.user.userId || !req.user.role) {
            console.error('getReportIdsJalali: req.user is invalid', { user: req.user });
            return res.status(401).send('Unauthorized: Invalid user session');
        }
        
        const userId = req.user.userId;
        const role = req.user.role;

        const jalaliYear = parseInt(year);
        const jalaliMonth = parseInt(month);

        if (isNaN(jalaliYear) || isNaN(jalaliMonth) || jalaliMonth < 1 || jalaliMonth > 12) {
            console.error('getReportIdsJalali: Invalid parameters', { year, month, jalaliYear, jalaliMonth });
            return res.status(400).send('Invalid Jalali year or month');
        }

        try {
            const pool = await poolPromise;
            let query = `
                SELECT ReportId, UserId
                FROM MonthlyReports
                WHERE JalaliYear = @jalaliYear
                  AND JalaliMonth = @jalaliMonth
            `;
            if (role === 'user') {
                query += ' AND UserId = @userId';
            } else if (role === 'group_manager') {
                query += ' AND GroupId IN (SELECT id FROM groups WHERE managerID = @userId)';
            }

            console.log('getReportIdsJalali: Query params', { userId, role, jalaliYear, jalaliMonth });

            const result = await pool.request()
                .input('jalaliYear', sql.Int, jalaliYear)
                .input('jalaliMonth', sql.Int, jalaliMonth)
                .input('userId', sql.Int, userId)
                .query(query);

            console.log('getReportIdsJalali: Query result', { recordCount: result.recordset.length });
            res.json(result.recordset.map(row => ({ reportId: row.ReportId, userId: row.UserId })));
        } catch (err) {
            console.error('Error in GET /monthly-reports/report-ids/jalali/:year/:month:', {
                message: err.message,
                stack: err.stack,
                userId,
                role,
                year: jalaliYear,
                month: jalaliMonth
            });
            res.status(500).send(`Server error: ${err.message}`);
        }
    });
};

const checkSubmittedJalali = async (req, res) => {
    checkRole(['user', 'group_manager', 'general_manager', 'finance_manager', 'admin'])(req, res, async () => {
        const { year, month } = req.params;
        
        // Validate req.user exists
        if (!req.user || !req.user.userId) {
            console.error('checkSubmittedJalali: req.user or req.user.userId is undefined');
            return res.status(401).send('Unauthorized: Invalid user session');
        }
        
        const userId = req.user.userId;

        const jy = parseInt(year);
        const jm = parseInt(month);

        if (isNaN(jy) || isNaN(jm) || jm < 1 || jm > 12) {
            console.error('checkSubmittedJalali: Invalid parameters', { year, month, jy, jm });
            return res.status(400).send('Invalid Jalali year or month');
        }

        try {
            const pool = await poolPromise;
            console.log('checkSubmittedJalali: Query params', { userId, jalaliYear: jy, jalaliMonth: jm });
            
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .input('jalaliYear', sql.Int, jy)
                .input('jalaliMonth', sql.Int, jm)
                .query('SELECT TOP 1 Status FROM MonthlyReports WHERE UserId = @userId AND JalaliYear = @jalaliYear AND JalaliMonth = @jalaliMonth');

            const status = result.recordset.length > 0 ? result.recordset[0].Status : null;
            console.log('checkSubmittedJalali: Query result', { status, recordCount: result.recordset.length });

            res.json({ status });
        } catch (err) {
            console.error('Error in GET /monthly-reports/check-submitted/jalali/:year/:month:', {
                message: err.message,
                stack: err.stack,
                userId,
                year: jy,
                month: jm
            });
            res.status(500).send(`Server error: ${err.message}`);
        }
    });
};

const getReportById = async (req, res) => {
    validateReportId(req, res, async () => {
        const { reportId } = req.params;
        const userId = req.user.userId;
        const role = req.user.role;
        try {
            const pool = await poolPromise;
            let query = 'SELECT * FROM MonthlyReports WHERE ReportId = @reportId';
            if (role === 'user') {
                query += ' AND UserId = @userId';
            } else if (role === 'group_manager') {
                query += ' AND GroupId IN (SELECT id FROM groups WHERE managerID = @userId)';
            }

            const result = await pool.request()
                .input('reportId', sql.Int, reportId)
                .input('userId', sql.Int, userId)
                .query(query);

            if (result.recordset.length === 0) {
                return res.status(404).send('Report not found or access denied');
            }
            res.json(result.recordset[0]);
        } catch (err) {
            res.status(500).send(err.message);
        }
    });
};

const getGroupReportsGregorian = async (req, res) => {
    checkRole(['group_manager', 'general_manager', 'finance_manager', 'admin'])(req, res, async () => {
        const { year, month } = req.params;
        const userId = req.user.userId;
        const role = req.user.role;
        try {
            const pool = await poolPromise;
            let query = 'SELECT mr.*, u.id as username FROM MonthlyReports mr JOIN users u ON mr.UserId = u.personalid WHERE mr.Year = @year AND mr.Month = @month AND u.IsActive = 1';
            if (role === 'group_manager') {
                query += ' AND mr.GroupId IN (SELECT id FROM groups WHERE managerID = @userId)';
            }

            const result = await pool.request()
                .input('year', sql.Int, year)
                .input('month', sql.Int, month)
                .input('userId', sql.Int, userId)
                .query(query);
            res.json(result.recordset);
        } catch (err) {
            res.status(500).send(err.message);
        }
    });
};

const getGroupReportsJalali = async (req, res) => {
    checkRole(['group_manager', 'general_manager', 'finance_manager', 'admin'])(req, res, async () => {
        const { year, month } = req.params;
        
        // Validate req.user exists
        if (!req.user || !req.user.userId || !req.user.role) {
            console.error('getGroupReportsJalali: req.user is invalid', { user: req.user });
            return res.status(401).send('Unauthorized: Invalid user session');
        }
        
        const userId = req.user.userId;
        const role = req.user.role;

        try {
            const jalaliYear = parseInt(year);
            const jalaliMonth = parseInt(month);

            if (isNaN(jalaliYear) || isNaN(jalaliMonth) || jalaliMonth < 1 || jalaliMonth > 12) {
                console.error('getGroupReportsJalali: Invalid parameters', { year, month, jalaliYear, jalaliMonth });
                return res.status(400).send('Invalid Jalali year or month');
            }

            const pool = await poolPromise;
            let query = `
                SELECT mr.*, u.id as username
                FROM MonthlyReports mr
                JOIN users u ON mr.UserId = u.personalid
                WHERE mr.JalaliYear = @jalaliYear
                  AND mr.JalaliMonth = @jalaliMonth
                  AND u.IsActive = 1
            `;

            if (role === 'group_manager') {
                query += ' AND mr.GroupId IN (SELECT id FROM groups WHERE managerID = @userId)';
            }

            console.log('getGroupReportsJalali: Query params', { userId, role, jalaliYear, jalaliMonth });

            const result = await pool.request()
                .input('jalaliYear', sql.Int, jalaliYear)
                .input('jalaliMonth', sql.Int, jalaliMonth)
                .input('userId', sql.Int, userId)
                .query(query);

            console.log('getGroupReportsJalali: Query result', { recordCount: result.recordset.length });
            res.json(result.recordset);
        } catch (err) {
            console.error('Error in getGroupReportsJalali:', {
                message: err.message,
                stack: err.stack,
                userId,
                role,
                year: jalaliYear,
                month: jalaliMonth
            });
            res.status(500).send(`Server error: ${err.message}`);
        }
    });
};

const getGroupRangeReports = async (req, res) => {
    checkRole(['group_manager', 'general_manager', 'finance_manager', 'admin'])(req, res, async () => {
        const { startYear, startMonth, endYear, endMonth } = req.params;
        const userId = req.user.userId;
        const role = req.user.role;
        try {
            const sYear = parseInt(startYear);
            const sMonth = parseInt(startMonth);
            const eYear = parseInt(endYear);
            const eMonth = parseInt(endMonth);

            if (isNaN(sYear) || isNaN(sMonth) || isNaN(eYear) || isNaN(eMonth) ||
                sMonth < 1 || sMonth > 12 || eMonth < 1 || eMonth > 12) {
                return res.status(400).send('Invalid year or month');
            }

            if (sYear > eYear || (sYear === eYear && sMonth > eMonth)) {
                return res.status(400).send('Start date must be before or equal to end date');
            }

            const pool = await poolPromise;
            let query = `
                SELECT mr.*, u.id as username
                FROM MonthlyReports mr
                JOIN users u ON mr.UserId = u.personalid
                WHERE (mr.Year > @startYear OR (mr.Year = @startYear AND mr.Month >= @startMonth))
                  AND (mr.Year < @endYear OR (mr.Year = @endYear AND mr.Month <= @endMonth))
                  AND u.IsActive = 1
            `;
            if (role === 'group_manager') {
                query += ' AND mr.GroupId IN (SELECT id FROM groups WHERE managerID = @userId)';
            }

            const result = await pool.request()
                .input('startYear', sql.Int, sYear)
                .input('startMonth', sql.Int, sMonth)
                .input('endYear', sql.Int, eYear)
                .input('endMonth', sql.Int, eMonth)
                .input('userId', sql.Int, userId)
                .query(query);
            res.json(result.recordset);
        } catch (err) {
            res.status(500).send(err.message);
        }
    });
};

module.exports = {
    getReportIdsJalali,
    checkSubmittedJalali,
    getReportById,
    getGroupReportsGregorian,
    getGroupReportsJalali,
    getGroupRangeReports,
    checkRole,
    validateReportId
};