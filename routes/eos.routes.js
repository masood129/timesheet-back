const express = require('express');
const router = express.Router();
const eosController = require('../controllers/eos');

/**
 * @swagger
 * /eos/time-records:
 *   get:
 *     summary: Get time records from EOS system
 *     tags: [EOS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cardNo
 *         required: true
 *         schema:
 *           type: string
 *         description: Card number
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *         description: Date in Shamsi format (e.g. 1403/09/10)
 *     responses:
 *       200:
 *         description: Time records
 *       400:
 *         description: Missing parameters
 *       500:
 *         description: Server error
 */
router.get('/time-records', eosController.getTimeRecords);

module.exports = router;
