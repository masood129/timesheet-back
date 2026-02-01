const express = require('express');
const router = express.Router();
const userProjectAccessController = require('../controllers/userProjectAccess');

/**
 * @swagger
 * /user-project-access:
 *   get:
 *     summary: Get all projects with access status for current user
 *     tags: [User Project Access]
 *     responses:
 *       200:
 *         description: List of all projects with access status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   projectName:
 *                     type: string
 *                   hasAccess:
 *                     type: boolean
 *       500:
 *         description: Server error
 */
router.get('/', userProjectAccessController.getAllProjectsWithAccess);

/**
 * @swagger
 * /user-project-access/{projectId}:
 *   put:
 *     summary: Toggle project access for current user
 *     tags: [User Project Access]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Access toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasAccess:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.put('/:projectId', userProjectAccessController.toggleProjectAccess);

module.exports = router;
