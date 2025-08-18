const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {sql, poolPromise} = require('../config/db.config');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and generate JWT token using username only
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
router.post('/login', async (req, res) => {
    const {username} = req.body;

    if (!username) {
        return res.status(400).send('Username is required');
    }

    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('username', sql.NVarChar, username)
            .query('SELECT UserId, Username, Role FROM Users WHERE Username = @username');

        if (result.recordset.length === 0) {
            return res.status(401).send('Invalid username');
        }

        const user = result.recordset[0];
        const token = jwt.sign(
            {userId: user.UserId, role: user.Role},
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        );

        res.json({token, userId: user.UserId, Username: user.Username, Role: user.Role});
    } catch (err) {
        console.error('Error in POST /auth/login:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;