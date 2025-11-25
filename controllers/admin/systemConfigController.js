const { sql, poolPromise } = require('../../config/db.config');

/**
 * Get all contract hours
 */
const getAllContractHours = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                uch.*,
                u.id as username,
                u.farsifirstname,
                u.farsilastname
            FROM UserContractHours uch
            JOIN users u ON uch.UserId = u.personalid
            WHERE u.IsActive = 1
            ORDER BY u.id
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error in getAllContractHours:', err.message);
        res.status(500).send('خطای سرور در دریافت ساعات قراردادی');
    }
};

/**
 * Get contract hours for a specific user
 */
const getUserContractHours = async (req, res) => {
    const { userId } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT 
                    uch.*,
                    u.id as username,
                    u.farsifirstname,
                    u.farsilastname
                FROM UserContractHours uch
                JOIN users u ON uch.UserId = u.personalid
                WHERE uch.UserId = @userId
                  AND u.IsActive = 1
            `);

        if (result.recordset.length === 0) {
            return res.status(404).send('ساعات قراردادی برای این کاربر یافت نشد');
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error in getUserContractHours:', err.message);
        res.status(500).send('خطای سرور در دریافت ساعات قراردادی کاربر');
    }
};

/**
 * Update user contract hours
 */
const updateUserContractHours = async (req, res) => {
    const { userId } = req.params;
    const { ContractArrivalTime, ContractLeaveTime, MinMonthlyHours } = req.body;

    if (!ContractLeaveTime || !MinMonthlyHours) {
        return res.status(400).send('زمان خروج و حداقل ساعات ماهانه الزامی است');
    }

    try {
        const pool = await poolPromise;

        // Check if user exists
        const userCheck = await pool
            .request()
            .input('userId', sql.Int, userId)
            .query('SELECT COUNT(*) as count FROM users WHERE personalid = @userId AND IsActive = 1');

        if (userCheck.recordset[0].count === 0) {
            return res.status(404).send('کاربر یافت نشد');
        }

        // Check if contract hours exist
        const contractCheck = await pool
            .request()
            .input('userId', sql.Int, userId)
            .query('SELECT COUNT(*) as count FROM UserContractHours WHERE UserId = @userId');

        if (contractCheck.recordset[0].count > 0) {
            // Update existing
            await pool
                .request()
                .input('userId', sql.Int, userId)
                .input('arrivalTime', sql.NVarChar, ContractArrivalTime || null)
                .input('leaveTime', sql.NVarChar, ContractLeaveTime)
                .input('minHours', sql.Int, MinMonthlyHours)
                .query(`
                    UPDATE UserContractHours
                    SET ContractArrivalTime = @arrivalTime,
                        ContractLeaveTime = @leaveTime,
                        MinMonthlyHours = @minHours
                    WHERE UserId = @userId
                `);
        } else {
            // Insert new
            await pool
                .request()
                .input('userId', sql.Int, userId)
                .input('arrivalTime', sql.NVarChar, ContractArrivalTime || null)
                .input('leaveTime', sql.NVarChar, ContractLeaveTime)
                .input('minHours', sql.Int, MinMonthlyHours)
                .query(`
                    INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours)
                    VALUES (@userId, @arrivalTime, @leaveTime, @minHours)
                `);
        }

        res.json({ message: 'ساعات قراردادی با موفقیت بروزرسانی شد' });
    } catch (err) {
        console.error('Error in updateUserContractHours:', err.message);
        res.status(500).send('خطای سرور در بروزرسانی ساعات قراردادی');
    }
};

/**
 * Delete user contract hours
 */
const deleteUserContractHours = async (req, res) => {
    const { userId } = req.params;

    try {
        const pool = await poolPromise;

        const result = await pool
            .request()
            .input('userId', sql.Int, userId)
            .query('DELETE FROM UserContractHours WHERE UserId = @userId');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('ساعات قراردادی یافت نشد');
        }

        res.json({ message: 'ساعات قراردادی حذف شد' });
    } catch (err) {
        console.error('Error in deleteUserContractHours:', err.message);
        res.status(500).send('خطای سرور در حذف ساعات قراردادی');
    }
};

/**
 * Get system configuration
 */
const getSystemConfig = async (req, res) => {
    try {
        const pool = await poolPromise;

        // Get database info
        const dbInfoResult = await pool.request().query(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE IsActive = 1) as TotalUsers,
                (SELECT COUNT(*) FROM projects) as TotalProjects,
                (SELECT COUNT(*) FROM groups) as TotalGroups,
                (SELECT COUNT(*) FROM DailyDetails) as TotalDailyRecords,
                (SELECT COUNT(*) FROM MonthlyReports) as TotalMonthlyReports
        `);

        res.json({
            databaseInfo: dbInfoResult.recordset[0],
            serverTime: new Date().toISOString(),
            timezone: 'Asia/Tehran'
        });
    } catch (err) {
        console.error('Error in getSystemConfig:', err.message);
        res.status(500).send('خطای سرور در دریافت تنظیمات سیستم');
    }
};

module.exports = {
    getAllContractHours,
    getUserContractHours,
    updateUserContractHours,
    deleteUserContractHours,
    getSystemConfig
};
