const { sql, poolPromise } = require('../config/eos_db.config');
const logger = require('../utils/logger.service');

exports.getTimeRecords = async (req, res) => {
    try {
        const { cardNo, date } = req.query; // date should be in Shamsi format e.g. 1403/09/10

        if (!cardNo || !date) {
            logger.api.warn('Missing parameters for time records', { cardNo, date });
            return res.status(400).send({ message: 'CardNo and Date are required.' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('cardNo', sql.NVarChar, cardNo)
            .input('date', sql.NVarChar, date)
            .query('SELECT * FROM timeRecords WHERE CardNo = @cardNo AND Rdate = @date ORDER BY Rtime');

        logger.api.info('Fetched time records', { cardNo, date, count: result.recordset.length });
        res.status(200).json(result.recordset);
    } catch (err) {
        logger.errors.error('Error fetching time records', { error: err.message, cardNo: req.query.cardNo, date: req.query.date });
        res.status(500).send({ message: 'Error fetching time records.' });
    }
};
