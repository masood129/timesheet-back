const { sql, poolPromise } = require('../../config/eos_db.config');
const logger = require('../../utils/logger.service');

/**
 * @description Get time records from EOS system
 */
const getTimeRecords = async (req, res) => {
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

        const cleanRecords = result.recordset.map(record => ({
            cardNo: record.CardNo?.toString().trim(),
            date: record.RDate?.trim(),
            time: record.RTime?.trim()
        }));

        logger.api.info('Fetched time records', { cardNo, date, count: cleanRecords.length });
        res.status(200).json(cleanRecords);
    } catch (err) {
        logger.errors.error('Error fetching time records', { 
            error: err.message, 
            cardNo: req.query.cardNo, 
            date: req.query.date 
        });
        res.status(500).send({ message: 'Error fetching time records.' });
    }
};

module.exports = {
    getTimeRecords
};
