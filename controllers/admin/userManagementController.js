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
            SELECT 
                u.personalid,
                u.id as username,
                u.farsifirstname,
                u.farsilastname,
                u.email,
                u.role,
                u.groupid,
                g.groupname
            FROM users u
            LEFT JOIN groups g ON u.groupid = g.id
            WHERE u.IsActive = 1
        `;

        const request = pool.request();

        if (role) {
            query += ' AND u.role = @role';
            request.input('role', sql.NVarChar, role);
        }

        if (search) {
            query += ' AND (u.id LIKE @search OR u.farsifirstname LIKE @search OR u.farsilastname LIKE @search)';
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        query += ` ORDER BY u.personalid OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, parseInt(limit));

        const result = await request.query(query);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM users u WHERE u.IsActive = 1';
        const countRequest = pool.request();

        if (role) {
            countQuery += ' AND u.role = @role';
            countRequest.input('role', sql.NVarChar, role);
        }

        if (search) {
            countQuery += ' AND (u.id LIKE @search OR u.farsifirstname LIKE @search OR u.farsilastname LIKE @search)';
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
            .input('personalId', sql.Int, id)
            .query(`
                SELECT 
                    u.personalid,
                    u.id as username,
                    u.farsifirstname,
                    u.farsilastname,
                    u.email,
                    u.role,
                    u.groupid,
                    g.groupname,
                    uch.ContractArrivalTime,
                    uch.ContractLeaveTime,
                    uch.MinMonthlyHours
                FROM users u
                LEFT JOIN groups g ON u.groupid = g.id
                LEFT JOIN UserContractHours uch ON u.personalid = uch.UserId
                WHERE u.personalid = @personalId AND u.IsActive = 1
            `);

        if (result.recordset.length === 0) {
            return res.status(404).send('کاربر یافت نشد');
        }

        // Get user's projects
        const projectsResult = await pool
            .request()
            .input('personalId', sql.Int, id)
            .query(`
                SELECT p.id, p.projectName
                FROM projects p
                JOIN UserProjectAccess upa ON p.id = upa.ProjectId
                WHERE upa.UserId = @personalId
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
    const { personalId, username, farsifirstname, farsilastname, email, role = 'user', groupId } = req.body;

    if (!personalId || !username) {
        return res.status(400).send('کد پرسنلی و نام کاربری الزامی است');
    }

    const validRoles = ['user', 'group_manager'];
    if (!validRoles.includes(role)) {
        return res.status(400).send('نقش نامعتبر است');
    }

    try {
        const pool = await poolPromise;

        // Check if user already exists
        const checkResult = await pool
            .request()
            .input('personalId', sql.Int, personalId)
            .query('SELECT COUNT(*) as count FROM users WHERE personalid = @personalId');

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).send('کاربر با این کد پرسنلی قبلاً وجود دارد');
        }

        // Insert user
        await pool
            .request()
            .input('personalId', sql.Int, personalId)
            .input('username', sql.NVarChar, username)
            .input('farsifirstname', sql.NVarChar, farsifirstname || null)
            .input('farsilastname', sql.NVarChar, farsilastname || null)
            .input('email', sql.NVarChar, email || null)
            .input('role', sql.NVarChar, role)
            .input('groupId', sql.Int, groupId || null)
            .query(`
                INSERT INTO users (personalid, id, farsifirstname, farsilastname, email, role, groupid, IsActive)
                VALUES (@personalId, @username, @farsifirstname, @farsilastname, @email, @role, @groupId, 1)
            `);

        res.status(201).json({
            personalId,
            username,
            farsifirstname,
            farsilastname,
            email,
            role,
            groupId,
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
    const { username, farsifirstname, farsilastname, email, groupId } = req.body;

    if (!username && !farsifirstname && !farsilastname && !email && groupId == null) {
        return res.status(400).send('حداقل یکی از فیلدها الزامی است');
    }

    try {
        const pool = await poolPromise;

        // Check if user exists
        const checkResult = await pool
            .request()
            .input('personalId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM users WHERE personalid = @personalId');

        if (checkResult.recordset[0].count === 0) {
            return res.status(404).send('کاربر یافت نشد');
        }

        // Update user
        await pool
            .request()
            .input('personalId', sql.Int, id)
            .input('username', sql.NVarChar, username || null)
            .input('farsifirstname', sql.NVarChar, farsifirstname || null)
            .input('farsilastname', sql.NVarChar, farsilastname || null)
            .input('email', sql.NVarChar, email || null)
            .input('groupId', sql.Int, groupId ?? null)
            .query(`
                UPDATE users
                SET id = COALESCE(@username, id),
                    farsifirstname = COALESCE(@farsifirstname, farsifirstname),
                    farsilastname = COALESCE(@farsilastname, farsilastname),
                    email = COALESCE(@email, email),
                    groupid = COALESCE(@groupId, groupid)
                WHERE personalid = @personalId
            `);

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
            .input('personalId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM users WHERE personalid = @personalId');

        if (checkResult.recordset[0].count === 0) {
            return res.status(404).send('کاربر یافت نشد');
        }

        // Deactivate user (set IsActive = 0)
        await pool
            .request()
            .input('personalId', sql.Int, id)
            .query('UPDATE users SET IsActive = 0 WHERE personalid = @personalId');

        res.json({ message: 'کاربر با موفقیت غیرفعال شد' });
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
    const { Role, role } = req.body;
    
    // Support both 'Role' (capitalized) and 'role' (lowercase) for compatibility
    const userRole = Role || role;

    const validRoles = ['user', 'group_manager', 'general_manager', 'finance_manager', 'admin'];
    if (!userRole || !validRoles.includes(userRole)) {
        return res.status(400).send('نقش نامعتبر است');
    }

    try {
        const pool = await poolPromise;

        // Check if user exists
        const checkResult = await pool
            .request()
            .input('personalId', sql.Int, id)
            .query('SELECT role FROM users WHERE personalid = @personalId');

        if (checkResult.recordset.length === 0) {
            return res.status(404).send('کاربر یافت نشد');
        }

        // Update role
        await pool
            .request()
            .input('personalId', sql.Int, id)
            .input('role', sql.NVarChar, userRole)
            .query('UPDATE users SET role = @role WHERE personalid = @personalId');

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
