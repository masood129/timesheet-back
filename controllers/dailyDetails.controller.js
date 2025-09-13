const { sql, poolPromise } = require('../config/db.config');
const { toGregorian, toJalali } = require('../utils/dateConverter');

// ثبت جزئیات روزانه
exports.createDailyDetail = async (req, res) => {
    const { date, enterTime, exitTime, taskTime, personalTime, leaveType, description, goCost, returnCost } = req.body;
    const userId = req.user.userId;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('date', sql.Date, date)
            .input('enterTime', sql.VarChar, enterTime)
            .input('exitTime', sql.VarChar, exitTime)
            .input('taskTime', sql.Int, taskTime)
            .input('personalTime', sql.Int, personalTime)
            .input('leaveType', sql.NVarChar, leaveType)
            .input('description', sql.NVarChar, description)
            .input('goCost', sql.Int, goCost)
            .input('returnCost', sql.Int, returnCost)
            .query(`
                INSERT INTO DailyDetails (UserId, Date, EnterTime, ExitTime, TaskTime, PersonalTime, LeaveType, Description, GoCost, ReturnCost)
                VALUES (@userId, @date, @enterTime, @exitTime, @taskTime, @personalTime, @leaveType, @description, @goCost, @returnCost)
            `);

        res.status(201).json({ message: 'Daily detail created successfully' });
    } catch (err) {
        console.error('Error creating daily detail:', err.message);
        res.status(500).send('Server error');
    }
};

// دریافت لیست روزانه بر اساس سال/ماه شمسی
exports.getDailyDetailsByMonth = async (req, res) => {
    const { year, month } = req.params;
    const userId = req.user.userId;

    try {
        const { start, end } = toGregorian(year, month);

        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('startDate', sql.Date, start)
            .input('endDate', sql.Date, end)
            .query(`
                SELECT * FROM DailyDetails
                WHERE UserId = @userId AND Date BETWEEN @startDate AND @endDate
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching daily details:', err.message);
        res.status(500).send('Server error');
    }
};

// گرفتن رکورد روز خاص
exports.getDailyDetailByDate = async (req, res) => {
    const { date } = req.params;
    const userId = req.user.userId;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('date', sql.Date, date)
            .query(`
                SELECT * FROM DailyDetails WHERE UserId = @userId AND Date = @date
            `);

        if (result.recordset.length === 0) {
            return res.status(404).send('No record found for this date');
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching daily detail by date:', err.message);
        res.status(500).send('Server error');
    }
};

// بروزرسانی جزئیات روزانه
exports.updateDailyDetail = async (req, res) => {
    const { date } = req.params;
    const { enterTime, exitTime, taskTime, personalTime, leaveType, description, goCost, returnCost } = req.body;
    const userId = req.user.userId;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('date', sql.Date, date)
            .input('enterTime', sql.VarChar, enterTime)
            .input('exitTime', sql.VarChar, exitTime)
            .input('taskTime', sql.Int, taskTime)
            .input('personalTime', sql.Int, personalTime)
            .input('leaveType', sql.NVarChar, leaveType)
            .input('description', sql.NVarChar, description)
            .input('goCost', sql.Int, goCost)
            .input('returnCost', sql.Int, returnCost)
            .query(`
                UPDATE DailyDetails
                SET EnterTime = @enterTime,
                    ExitTime = @exitTime,
                    TaskTime = @taskTime,
                    PersonalTime = @personalTime,
                    LeaveType = @leaveType,
                    Description = @description,
                    GoCost = @goCost,
                    ReturnCost = @returnCost
                WHERE UserId = @userId AND Date = @date
            `);

        res.json({ message: 'Daily detail updated successfully' });
    } catch (err) {
        console.error('Error updating daily detail:', err.message);
        res.status(500).send('Server error');
    }
};
