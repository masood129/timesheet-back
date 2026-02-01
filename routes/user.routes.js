const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');

/**
 * @swagger
 * /users/subordinates:
 *   get:
 *     summary: Get list of subordinates or all users based on role (excluding self)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users (subordinates for group managers, all for general/finance managers, excluding the logged-in user)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   UserId:
 *                     type: integer
 *                   Username:
 *                     type: string
 *                   Role:
 *                     type: string
 *                   GroupId:
 *                     type: integer
 *                   GroupName:
 *                     type: string
 *       403:
 *         description: Access denied - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/subordinates', usersController.getSubordinates);

/**
 * @swagger
 * /users/by-direct-admin/{directAdminId}:
 *   get:
 *     summary: Get list of employees by directAdminId
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: directAdminId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The personalId of the direct admin
 *     responses:
 *       200:
 *         description: List of employees with the specified directAdminId
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   UserId:
 *                     type: integer
 *                   Username:
 *                     type: string
 *                   Role:
 *                     type: string
 *                   GroupId:
 *                     type: integer
 *                   GroupName:
 *                     type: string
 *       400:
 *         description: Invalid directAdminId - must be a number
 *       403:
 *         description: Access denied - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/by-direct-admin/:directAdminId', usersController.getUsersByDirectAdmin);

module.exports = router;
