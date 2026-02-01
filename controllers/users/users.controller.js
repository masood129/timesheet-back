const { sql, poolPromise } = require('../../config/db.config');
const logger = require('../../utils/logger.service');

/**
 * @description Get list of subordinates or all users based on role (excluding self)
 */
const getSubordinates = async (req, res) => {
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
            
            logger.api.info('Fetched all users for manager', { userId: user.userId, count: result.recordset.length });
        } else {
            // For group managers: check if manager and get subordinates except self
            const managerCheck = await pool
                .request()
                .input('managerId', sql.Int, user.userId)
                .query('SELECT COUNT(*) AS Count FROM groups WHERE managerID = @managerId');

            if (managerCheck.recordset[0].Count === 0) {
                logger.api.warn('Non-manager attempted to get subordinates', { userId: user.userId });
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
            
            logger.api.info('Fetched subordinates for group manager', { userId: user.userId, count: result.recordset.length });
        }

        res.json(result.recordset);
    } catch (err) {
        logger.errors.error('Error in getSubordinates', { userId: user.userId, error: err.message });
        console.error('Error in GET /users/subordinates:', err.message);
        res.status(500).send('Server error');
    }
};

/**
 * @description Get list of employees by directAdminId
 */
const getUsersByDirectAdmin = async (req, res) => {
    const { directAdminId } = req.params;
    const user = req.user; // From authMiddleware

    try {
        const pool = await poolPromise;

        // Validate that directAdminId is a number
        const adminId = parseInt(directAdminId);
        if (isNaN(adminId)) {
            logger.api.warn('Invalid directAdminId provided', { directAdminId, userId: user.userId });
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

        logger.api.info('Fetched users by direct admin', { directAdminId: adminId, count: result.recordset.length });

        res.json(result.recordset);
    } catch (err) {
        logger.errors.error('Error in getUsersByDirectAdmin', { directAdminId, error: err.message });
        console.error('Error in GET /users/by-direct-admin/:directAdminId:', err.message);
        res.status(500).send('Server error');
    }
};

module.exports = {
    getSubordinates,
    getUsersByDirectAdmin
};
