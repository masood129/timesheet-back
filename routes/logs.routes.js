const express = require('express');
const router = express.Router();
const logsController = require('../controllers/admin/logs.controller');

/**
 * @swagger
 * /admin/logs/categories:
 *   get:
 *     summary: Get all available log categories and their files
 *     tags: [Admin - Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of log categories
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/categories', logsController.getLogCategories);

/**
 * @swagger
 * /admin/logs/:category:
 *   get:
 *     summary: Get logs for a specific category
 *     tags: [Admin - Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Logs for the specified category
 *       404:
 *         description: Log file not found
 */
router.get('/:category', logsController.getLogsByCategory);

/**
 * @swagger
 * /admin/logs/search:
 *   get:
 *     summary: Search across all logs
 *     tags: [Admin - Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search/all', logsController.searchLogs);

/**
 * @swagger
 * /admin/logs/download/:category/:date:
 *   get:
 *     summary: Download a specific log file
 *     tags: [Admin - Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Log file download
 *       404:
 *         description: Log file not found
 */
router.get('/download/:category/:date', logsController.downloadLog);

module.exports = router;
