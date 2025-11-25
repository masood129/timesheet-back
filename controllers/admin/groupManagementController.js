const { sql, poolPromise } = require('../../config/db.config');

/**
 * Get all groups
 */
const getAllGroups = async (req, res) => {
    const { search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const pool = await poolPromise;
        let query = `
            SELECT 
                g.id,
                g.groupname,
                g.managerID,
                u.id as managerUsername,
                u.farsifirstname + ' ' + u.farsilastname as managerName
            FROM groups g
            LEFT JOIN users u ON g.managerID = u.personalid
            WHERE 1=1
        `;
        const request = pool.request();

        if (search) {
            query += ' AND g.groupname LIKE @search';
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        query += ' ORDER BY g.id OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, parseInt(limit));

        const result = await request.query(query);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM groups WHERE 1=1';
        const countRequest = pool.request();

        if (search) {
            countQuery += ' AND groupname LIKE @search';
            countRequest.input('search', sql.NVarChar, `%${search}%`);
        }

        const countResult = await countRequest.query(countQuery);

        res.json({
            groups: result.recordset,
            total: countResult.recordset[0].total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (err) {
        console.error('Error in getAllGroups:', err.message);
        res.status(500).send('خطای سرور در دریافت لیست گروه‌ها');
    }
};

/**
 * Get group by ID with members
 */
const getGroupById = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('groupId', sql.Int, id)
            .query(`
                SELECT 
                    g.id,
                    g.groupname,
                    g.managerID,
                    u.id as managerUsername,
                    u.farsifirstname + ' ' + u.farsilastname as managerName
                FROM groups g
                LEFT JOIN users u ON g.managerID = u.personalid
                WHERE g.id = @groupId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).send('گروه یافت نشد');
        }

        // Get group members
        const membersResult = await pool
            .request()
            .input('groupId', sql.Int, id)
            .query(`
                SELECT 
                    u.personalid,
                    u.id as username,
                    u.farsifirstname,
                    u.farsilastname,
                    u.email,
                    u.role
                FROM users u
                WHERE u.groupid = @groupId AND u.IsActive = 1
            `);

        const group = result.recordset[0];
        group.Members = membersResult.recordset;

        res.json(group);
    } catch (err) {
        console.error('Error in getGroupById:', err.message);
        res.status(500).send('خطای سرور در دریافت اطلاعات گروه');
    }
};

/**
 * Create new group
 */
const createGroup = async (req, res) => {
    const { groupName, managerId } = req.body;

    if (!groupName || !managerId) {
        return res.status(400).send('نام گروه و شناسه مدیر الزامی است');
    }

    try {
        const pool = await poolPromise;

        // Check if manager exists
        const userCheck = await pool
            .request()
            .input('personalId', sql.Int, managerId)
            .query('SELECT COUNT(*) as count FROM users WHERE personalid = @personalId AND IsActive = 1');

        if (userCheck.recordset[0].count === 0) {
            return res.status(404).send('مدیر مورد نظر یافت نشد');
        }

        await pool
            .request()
            .input('groupName', sql.NVarChar, groupName)
            .input('managerId', sql.Int, managerId)
            .query(`
                INSERT INTO groups (groupname, managerID)
                VALUES (@groupName, @managerId)
            `);

        res.status(201).json({
            groupName,
            managerId,
            message: 'گروه با موفقیت ایجاد شد'
        });
    } catch (err) {
        console.error('Error in createGroup:', err.message);
        res.status(500).send('خطای سرور در ایجاد گروه');
    }
};

/**
 * Update group
 */
const updateGroup = async (req, res) => {
    const { id } = req.params;
    const { groupName, managerId } = req.body;

    if (!groupName && managerId == null) {
        return res.status(400).send('حداقل یکی از فیلدها الزامی است');
    }

    try {
        const pool = await poolPromise;

        // Check if group exists
        const checkResult = await pool
            .request()
            .input('groupId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM groups WHERE id = @groupId');

        if (checkResult.recordset[0].count === 0) {
            return res.status(404).send('گروه یافت نشد');
        }

        // If managerId provided, check if user exists
        if (managerId) {
            const userCheck = await pool
                .request()
                .input('personalId', sql.Int, managerId)
                .query('SELECT COUNT(*) as count FROM users WHERE personalid = @personalId AND IsActive = 1');

            if (userCheck.recordset[0].count === 0) {
                return res.status(404).send('مدیر مورد نظر یافت نشد');
            }
        }

        await pool
            .request()
            .input('groupId', sql.Int, id)
            .input('groupName', sql.NVarChar, groupName || null)
            .input('managerId', sql.Int, managerId ?? null)
            .query(`
                UPDATE groups
                SET groupname = COALESCE(@groupName, groupname),
                    managerID = COALESCE(@managerId, managerID)
                WHERE id = @groupId
            `);

        res.json({ message: 'گروه با موفقیت بروزرسانی شد' });
    } catch (err) {
        console.error('Error in updateGroup:', err.message);
        res.status(500).send('خطای سرور در بروزرسانی گروه');
    }
};

/**
 * Delete group
 */
const deleteGroup = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;

        // Remove users from group first (set groupid to NULL)
        await pool
            .request()
            .input('groupId', sql.Int, id)
            .query('UPDATE users SET groupid = NULL WHERE groupid = @groupId');

        // Delete group
        const result = await pool
            .request()
            .input('groupId', sql.Int, id)
            .query('DELETE FROM groups WHERE id = @groupId');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('گروه یافت نشد');
        }

        res.json({ message: 'گروه با موفقیت حذف شد' });
    } catch (err) {
        console.error('Error in deleteGroup:', err.message);
        res.status(500).send('خطای سرور در حذف گروه');
    }
};

/**
 * Get group members
 */
const getGroupMembers = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;

        // Check if group exists
        const groupCheck = await pool
            .request()
            .input('groupId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM groups WHERE id = @groupId');

        if (groupCheck.recordset[0].count === 0) {
            return res.status(404).send('گروه یافت نشد');
        }

        const result = await pool
            .request()
            .input('groupId', sql.Int, id)
            .query(`
                SELECT 
                    u.personalid,
                    u.id as username,
                    u.farsifirstname,
                    u.farsilastname,
                    u.email,
                    u.role
                FROM users u
                WHERE u.groupid = @groupId AND u.IsActive = 1
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error in getGroupMembers:', err.message);
        res.status(500).send('خطای سرور در دریافت اعضای گروه');
    }
};

/**
 * Add user to group
 */
const addUserToGroup = async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).send('شناسه کاربر الزامی است');
    }

    try {
        const pool = await poolPromise;

        // Check if group exists
        const groupCheck = await pool
            .request()
            .input('groupId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM groups WHERE id = @groupId');

        if (groupCheck.recordset[0].count === 0) {
            return res.status(404).send('گروه یافت نشد');
        }

        // Check if user exists
        const userCheck = await pool
            .request()
            .input('personalId', sql.Int, userId)
            .query('SELECT COUNT(*) as count FROM users WHERE personalid = @personalId AND IsActive = 1');

        if (userCheck.recordset[0].count === 0) {
            return res.status(404).send('کاربر یافت نشد');
        }

        // Add user to group (update groupid)
        await pool
            .request()
            .input('personalId', sql.Int, userId)
            .input('groupId', sql.Int, id)
            .query('UPDATE users SET groupid = @groupId WHERE personalid = @personalId');

        res.status(201).json({ message: 'کاربر به گروه اضافه شد' });
    } catch (err) {
        console.error('Error in addUserToGroup:', err.message);
        res.status(500).send('خطای سرور در افزودن کاربر به گروه');
    }
};

/**
 * Remove user from group
 */
const removeUserFromGroup = async (req, res) => {
    const { id, userId } = req.params;

    try {
        const pool = await poolPromise;

        const result = await pool
            .request()
            .input('personalId', sql.Int, userId)
            .input('groupId', sql.Int, id)
            .query('UPDATE users SET groupid = NULL WHERE personalid = @personalId AND groupid = @groupId');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('کاربر در این گروه یافت نشد');
        }

        res.json({ message: 'کاربر از گروه حذف شد' });
    } catch (err) {
        console.error('Error in removeUserFromGroup:', err.message);
        res.status(500).send('خطای سرور در حذف کاربر از گروه');
    }
};

/**
 * Set group manager
 */
const setGroupManager = async (req, res) => {
    const { id } = req.params;
    const { managerId } = req.body;

    if (!managerId) {
        return res.status(400).send('شناسه مدیر الزامی است');
    }

    try {
        const pool = await poolPromise;

        // Check if group exists
        const groupCheck = await pool
            .request()
            .input('groupId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM groups WHERE id = @groupId');

        if (groupCheck.recordset[0].count === 0) {
            return res.status(404).send('گروه یافت نشد');
        }

        // Check if user exists
        const userCheck = await pool
            .request()
            .input('personalId', sql.Int, managerId)
            .query('SELECT COUNT(*) as count FROM users WHERE personalid = @personalId AND IsActive = 1');

        if (userCheck.recordset[0].count === 0) {
            return res.status(404).send('کاربر یافت نشد');
        }

        // Update group manager
        await pool
            .request()
            .input('groupId', sql.Int, id)
            .input('managerId', sql.Int, managerId)
            .query('UPDATE groups SET managerID = @managerId WHERE id = @groupId');

        res.json({ message: 'مدیر گروه با موفقیت تنظیم شد' });
    } catch (err) {
        console.error('Error in setGroupManager:', err.message);
        res.status(500).send('خطای سرور در تنظیم مدیر گروه');
    }
};

module.exports = {
    getAllGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupMembers,
    addUserToGroup,
    removeUserFromGroup,
    setGroupManager
};
