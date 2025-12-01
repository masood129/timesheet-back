const express = require('express');
const router = express.Router();
const eosController = require('../controllers/eosController');

router.get('/time-records', eosController.getTimeRecords);

module.exports = router;
