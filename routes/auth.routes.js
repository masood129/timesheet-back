const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user (admin or regular) and generate JWT token using username only
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 description: User's username
 *     responses:
 *       200:
 *         description: Successful login, returns JWT token and userId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                 userId:
 *                   type: integer
 *                   description: User's ID
 *                 Username:
 *                   type: string
 *                   description: User's username
 *                 Role:
 *                   type: string
 *                   description: User's role
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid username
 *       500:
 *         description: Server error
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/login-as:
 *   post:
 *     summary: Login as another user (manager impersonation)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetUserId
 *             properties:
 *               targetUserId:
 *                 type: integer
 *                 description: Target user's ID to impersonate
 *     responses:
 *       200:
 *         description: Successful impersonation
 *       401:
 *         description: No token provided
 *       403:
 *         description: Access denied - Only managers can impersonate
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/login-as', authController.loginAs);

module.exports = router;