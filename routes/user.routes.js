// Add this to a new file or an existing routes file, e.g., user.routes.js
const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db.config');

// Assuming you have a authMiddleware already defined in index.js

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
// Add this to a new file or an existing routes file, e.g., user.routes.js
const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db.config');

// Assuming you have a authMiddleware already defined in index.js

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
router.get('/subordinates', async (req, res) => {
    const user = req.user; // From authMiddleware

    try {
        const pool = await poolPromise;

        let result;

        if (['general_manager', 'finance_manager'].includes(user.role)) {
            // For general and finance managers: get all users except self, with optional group info
            result = await pool
                .request()
                .input('userId', sql.Int, user.userId)
                .query(`
                    SELECT 
                        u.personalid as UserId, 
                        u.id as Username, 
                        u.role as Role, 
                        u.farsifirstname,
                        u.farsilastname,
                        g.id as GroupId, 
                        g.groupname as GroupName
                    FROM users u
                    LEFT JOIN groups g ON u.groupid = g.id
                    WHERE u.personalid != @userId
                      AND u.IsActive = 1
                `);
        } else {
            // For group managers: check if manager and get subordinates except self
            const managerCheck = await pool
                .request()
                .input('managerId', sql.Int, user.userId)
                .query('SELECT COUNT(*) AS Count FROM groups WHERE managerID = @managerId');

            if (managerCheck.recordset[0].Count === 0) {
                return res.status(403).send('Access denied: Insufficient permissions');
            }

            result = await pool
                .request()
                .input('managerId', sql.Int, user.userId)
                .input('userId', sql.Int, user.userId)
                .query(`
                    SELECT 
                        u.personalid as UserId, 
                        u.id as Username, 
                        u.role as Role, 
                        u.farsifirstname,
                        u.farsilastname,
                        g.id as GroupId, 
                        g.groupname as GroupName
                    FROM users u
                    INNER JOIN groups g ON u.groupid = g.id
                    WHERE g.managerID = @managerId
                      AND u.personalid != @userId
                      AND u.IsActive = 1
                `);
        }

        res.json(result.recordset);
    } catch (err) {
        console.error('Error in GET /users/subordinates:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;