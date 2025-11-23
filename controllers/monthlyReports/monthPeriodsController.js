const { sql, poolPromise } = require('../../config/db.config');

/**
 * Get month period for a specific year and month (public endpoint)
 * Used by mobile app and admin panel to fetch period information
 * GET /api/month-periods/:year/:month
 */
const getMonthPeriod = async (req, res) => {
    const { year, month } = req.params;

    if (!year || !month) {
        return res.status(400).send('سال و ماه الزامی است');
    }

    if (month < 1 || month > 12) {
        return res.status(400).send('ماه باید بین 1 تا 12 باشد');
    }

    if (year < 1300 || year > 1500) {
        return res.status(400).send('سال نامعتبر است');
    }

    try {
        const pool = await poolPromise;

        const result = await pool
            .request()
            .input('year', sql.Int, parseInt(year))
            .input('month', sql.Int, parseInt(month))
            .execute('sp_GetMonthPeriod');

        if (result.recordset.length === 0) {
            return res.status(404).send('بازه ماه یافت نشد');
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error in getMonthPeriod:', err.message);
        res.status(500).send('خطای سرور در دریافت بازه ماه');
    }
};

/**
 * Get all month periods for a specific year (public endpoint)
 * GET /api/month-periods/:year
 */
const getYearMonthPeriods = async (req, res) => {
    const { year } = req.params;

    if (!year || year < 1300 || year > 1500) {
        return res.status(400).send('سال نامعتبر است');
    }

    try {
        const pool = await poolPromise;

        const result = await pool
            .request()
            .input('year', sql.Int, parseInt(year))
            .execute('sp_GetYearMonthPeriods');

        res.json(result.recordset);
    } catch (err) {
        console.error('Error in getYearMonthPeriods:', err.message);
        res.status(500).send('خطای سرور در دریافت بازه‌های سال');
    }
};

module.exports = {
    getMonthPeriod,
    getYearMonthPeriods
};
