const { sql, poolPromise } = require('../../config/db.config');

/**
 * Get all users with optional filtering and pagination
 */
const getAllUsers = async (req, res) => {
    const { role, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const pool = await poolPromise;
        let query = `
            SELECT u.UserId, u.Username, u.Role, ug.GroupId, g.GroupName
            FROM Users u
            LEFT JOIN UserGroup ug ON u.UserId = ug.UserId
            LEFT JOIN Groups g ON ug.GroupId = g.GroupId
            WHERE 1=1
        `;

        const request = pool.request();

        if (role) {
            query += ' AND u.Role = @role';
            request.input('role', sql.NVarChar, role);
        }

        if (search) {
            query += ' AND u.Username LIKE @search';
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        query += ` ORDER BY u.UserId OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, parseInt(limit));

        const result = await request.query(query);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM Users u WHERE 1=1';
        const countRequest = pool.request();

        if (role) {
            countQuery += ' AND u.Role = @role';
            countRequest.input('role', sql.NVarChar, role);
        }

        if (search) {
            countQuery += ' AND u.Username LIKE @search';
            countRequest.input('search', sql.NVarChar, `%${search}%`);
        }

        const countResult = await countRequest.query(countQuery);

        res.json({
            users: result.recordset,
            total: countResult.recordset[0].total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (err) {
        console.error('Error in getAllUsers:', err.message);
        res.status(500).send('خطای سرور در دریافت لیست کاربران');
    }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('userId', sql.Int, id)
            .query(`
                SELECT u.UserId, u.Username, u.Role, ug.GroupId, g.GroupName,
                       uch.ContractArrivalTime, uch.ContractLeaveTime, uch.MinMonthlyHours
                FROM Users u
                LEFT JOIN UserGroup ug ON u.UserId = ug.UserId
                LEFT JOIN Groups g ON ug.GroupId = g.GroupId
                LEFT JOIN UserContractHours uch ON u.UserId = uch.UserId
                WHERE u.UserId = @userId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).send('کاربر یافت نشد');
        }

        // Get user's projects
        const projectsResult = await pool
            .request()
            .input('userId', sql.Int, id)
            .query(`
                SELECT p.Id, p.ProjectName, p.securityLevel
                FROM Projects p
                JOIN UserProjectAccess upa ON p.Id = upa.ProjectId
                WHERE upa.UserId = @userId
            `);

        const user = result.recordset[0];
        user.Projects = projectsResult.recordset;

        res.json(user);
    } catch (err) {
        console.error('Error in getUserById:', err.message);
        res.status(500).send('خطای سرور در دریافت اطلاعات کاربر');
    }
};

/**
 * Create new user
 */
const createUser = async (req, res) => {
    const { UserId, Username, Role = 'user' } = req.body;

    if (!UserId || !Username) {
        return res.status(400).send('شناسه کاربر و نام کاربری الزامی است');
    }

    const validRoles = ['user', 'group_manager', 'general_manager', 'finance_manager', 'admin'];
    if (!validRoles.includes(Role)) {
        return res.status(400).send('نقش نامعتبر است');
    }

    try {
        const pool = await poolPromise;

        // Check if user already exists
        const checkResult = await pool
            .request()
            .input('userId', sql.Int, UserId)
            .query('SELECT COUNT(*) as count FROM Users WHERE UserId = @userId');

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).send('کاربر با این شناسه قبلاً وجود دارد');
        }

        // Insert user (will use INSTEAD OF trigger)
        await pool
            .request()
            .input('userId', sql.Int, UserId)
            .input('username', sql.NVarChar, Username)
            .input('role', sql.NVarChar, Role)
            .query('INSERT INTO Users (UserId, Username, Role) VALUES (@userId, @username, @role)');

        // If admin role, add to AdminUsers table
        if (Role === 'admin') {
            await pool
                .request()
                .input('userId', sql.Int, UserId)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM AdminUsers WHERE UserId = @userId)
                    INSERT INTO AdminUsers (UserId) VALUES (@userId)
                `);
        }

        res.status(201).json({
            UserId,
            Username,
            Role,
            message: 'کاربر با موفقیت ایجاد شد'
        });
    } catch (err) {
        console.error('Error in createUser:', err.message);
        res.status(500).send('خطای سرور در ایجاد کاربر');
    }
};

/**
 * Update user
 */
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { Username } = req.body;

    if (!Username) {
        return res.status(400).send('نام کاربری الزامی است');
    }

    try {
        const pool = await poolPromise;

        // Check if user exists
        const checkResult = await pool
            .request()
            .input('userId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM Users WHERE UserId = @userId');

        if (checkResult.recordset[0].count === 0) {
            return res.status(404).send('کاربر یافت نشد');
        }

        // Update user
        await pool
            .request()
            .input('userId', sql.Int, id)
            .input('username', sql.NVarChar, Username)
            .query('UPDATE Users SET Username = @username WHERE UserId = @userId');

        res.json({ message: 'کاربر با موفقیت بروزرسانی شد' });
    } catch (err) {
        console.error('Error in updateUser:', err.message);
        res.status(500).send('خطای سرور در بروزرسانی کاربر');
    }
};

/**
 * Delete/deactivate user
 */
const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;

        // Check if user exists
        const checkResult = await pool
            .request()
            .input('userId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM Users WHERE UserId = @userId');

        if (checkResult.recordset[0].count === 0) {
            return res.status(404).send('کاربر یافت نشد');
        }

        // Delete user (will use INSTEAD OF trigger to set IsActive = 0)
        await pool
            .request()
            .input('userId', sql.Int, id)
            .query('DELETE FROM Users WHERE UserId = @userId');

        res.json({ message: 'کاربر با موفقیت حذف شد' });
    } catch (err) {
        console.error('Error in deleteUser:', err.message);
        res.status(500).send('خطای سرور در حذف کاربر');
    }
};

/**
 * Update user role
 */
const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { Role } = req.body;

    const validRoles = ['user', 'group_manager', 'general_manager', 'finance_manager', 'admin'];
    if (!validRoles.includes(Role)) {
        return res.status(400).send('نقش نامعتبر است');
    }

    try {
        const pool = await poolPromise;

        // Check if user exists
        const checkResult = await pool
            .request()
            .input('userId', sql.Int, id)
            .query('SELECT Role FROM Users WHERE UserId = @userId');

        if (checkResult.recordset.length === 0) {
            return res.status(404).send('کاربر یافت نشد');
        }

        const oldRole = checkResult.recordset[0].Role;

        // Update role
        await pool
            .request()
            .input('userId', sql.Int, id)
            .input('role', sql.NVarChar, Role)
            .query('UPDATE Users SET Role = @role WHERE UserId = @userId');

        // Manage AdminUsers table
        if (Role === 'admin') {
            await pool
                .request()
                .input('userId', sql.Int, id)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM AdminUsers WHERE UserId = @userId)
                    INSERT INTO AdminUsers (UserId) VALUES (@userId)
                `);
        } else if (oldRole === 'admin') {
            await pool
                .request()
                .input('userId', sql.Int, id)
                .query('DELETE FROM AdminUsers WHERE UserId = @userId');
        }

        res.json({ message: 'نقش کاربر با موفقیت بروزرسانی شد' });
    } catch (err) {
        console.error('Error in updateUserRole:', err.message);
        res.status(500).send('خطای سرور در بروزرسانی نقش کاربر');
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserRole
};
