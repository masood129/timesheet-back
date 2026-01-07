const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db.config');

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
router.get('/by-direct-admin/:directAdminId', async (req, res) => {
    const { directAdminId } = req.params;
    const user = req.user; // From authMiddleware

    try {
        const pool = await poolPromise;

        // Validate that directAdminId is a number
        const adminId = parseInt(directAdminId);
        if (isNaN(adminId)) {
            return res.status(400).send('Invalid directAdminId: must be a number');
        }

        // Get employees where directAdminid equals the provided directAdminId
        const result = await pool
            .request()
            .input('directAdminId', sql.Int, adminId)
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
                WHERE u.directAdminid = @directAdminId
                  AND u.IsActive = 1
                ORDER BY u.personalid
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error in GET /users/by-direct-admin/:directAdminId:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
