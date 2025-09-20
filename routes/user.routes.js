// Add this to a new file or an existing routes file, e.g., user.routes.js
const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db.config');

// Assuming you have a authMiddleware already defined in index.js

/**
 * @swagger
 * /users/subordinates:
 *   get:
 *     summary: Get list of subordinates for the logged-in manager
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subordinates
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
 *         description: Access denied - User is not a manager of any group
 *       500:
 *         description: Server error
 */
router.get('/subordinates', async (req, res) => {
    const user = req.user; // From authMiddleware

    try {
        const pool = await poolPromise;

        // First, check if the user is a manager of any group
        const managerCheck = await pool
            .request()
            .input('managerId', sql.Int, user.userId)
            .query('SELECT COUNT(*) AS Count FROM Groups WHERE ManagerId = @managerId');

        if (managerCheck.recordset[0].Count === 0) {
            return res.status(403).send('Access denied: User is not a manager of any group');
        }

        // Get subordinates
        const result = await pool
            .request()
            .input('managerId', sql.Int, user.userId)
            .query(`
                SELECT u.UserId, u.Username, u.Role, g.GroupId, g.GroupName
                FROM Users u
                INNER JOIN UserGroup ug ON u.UserId = ug.UserId
                INNER JOIN Groups g ON ug.GroupId = g.GroupId
                WHERE g.ManagerId = @managerId
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error in GET /users/subordinates:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;