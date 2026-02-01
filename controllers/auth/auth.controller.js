const jwt = require('jsonwebtoken');
const { sql, poolPromise } = require('../../config/db.config');
const logger = require('../../utils/logger.service');

/**
 * @description Login endpoint - authenticates user (admin or regular) and generates JWT token
 */
const login = async (req, res) => {
    const { username } = req.body;

    if (!username) {
        logger.api.warn('Login attempt without username');
        return res.status(400).send('Username is required');
    }

    try {
        const pool = await poolPromise;

        // Check if user is admin
        const adminResult = await pool
            .request()
            .input('username', sql.NVarChar, username)
            .query('SELECT AdminId as UserId, Username, \'admin\' as Role FROM Admins WHERE Username = @username AND IsActive = 1');

        if (adminResult.recordset.length > 0) {
            const admin = adminResult.recordset[0];
            const token = jwt.sign(
                { userId: admin.UserId, role: admin.Role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Update last login
            await pool
                .request()
                .input('adminId', sql.Int, admin.UserId)
                .query('UPDATE Admins SET LastLoginAt = GETDATE() WHERE AdminId = @adminId');

            logger.api.info('Admin login successful', { userId: admin.UserId, username: admin.Username });

            return res.json({
                token,
                userId: admin.UserId,
                Username: admin.Username,
                Role: admin.Role,
                farsifirstname: null,
                farsilastname: null,
                message: 'Admin login successful'
            });
        }

        // Check if regular user
        const userResult = await pool
            .request()
            .input('username', sql.NVarChar, username)
            .query('SELECT personalid as UserId, id as Username, role as Role, farsifirstname, farsilastname FROM users WHERE id = @username AND IsActive = 1');

        if (userResult.recordset.length === 0) {
            logger.api.warn('Login attempt with invalid username', { username });
            return res.status(401).send('Invalid username');
        }

        const user = userResult.recordset[0];
        const token = jwt.sign(
            { userId: user.UserId, role: user.Role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        logger.api.info('User login successful', { userId: user.UserId, username: user.Username });

        res.json({
            token,
            userId: user.UserId,
            Username: user.Username,
            Role: user.Role,
            farsifirstname: user.farsifirstname,
            farsilastname: user.farsilastname,
            message: 'Login successful'
        });
    } catch (err) {
        logger.errors.error('Error in login', { error: err.message, username });
        console.error('Error in POST /auth/login:', err.message);
        res.status(500).send('Server error');
    }
};

/**
 * @description Login-as endpoint - allows managers to impersonate other users
 */
const loginAs = async (req, res) => {
    const { targetUserId } = req.body;
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        logger.api.warn('Login-as attempt without token');
        return res.status(401).send('No token provided');
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!['group_manager', 'general_manager'].includes(decoded.role)) {
            logger.api.warn('Login-as attempt by unauthorized role', { userId: decoded.userId, role: decoded.role });
            return res.status(403).send('Access denied: Only managers can impersonate');
        }

        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('userId', sql.Int, targetUserId)
            .query('SELECT personalid as UserId, id as Username, role as Role FROM users WHERE personalid = @userId AND IsActive = 1');

        if (result.recordset.length === 0) {
            logger.api.warn('Login-as attempt for non-existent user', { managerId: decoded.userId, targetUserId });
            return res.status(404).send('User not found');
        }

        const user = result.recordset[0];
        const newToken = jwt.sign(
            { userId: user.UserId, role: user.Role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Shorter expiry for impersonation
        );

        logger.api.info('Login-as successful', { managerId: decoded.userId, targetUserId: user.UserId });

        res.json({
            token: newToken,
            userId: user.UserId,
            Username: user.Username,
            Role: user.Role,
            message: 'Impersonation successful'
        });
    } catch (err) {
        logger.errors.error('Error in login-as', { error: err.message, targetUserId });
        console.error('Error in POST /auth/login-as:', err.message);
        res.status(500).send('Server error');
    }
};

module.exports = {
    login,
    loginAs
};
