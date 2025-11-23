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
            SELECT g.GroupId, g.GroupName, g.ManagerId, u.Username as ManagerName
            FROM Groups g
            LEFT JOIN Users u ON g.ManagerId = u.UserId
            WHERE 1=1
        `;
        const request = pool.request();

        if (search) {
            query += ' AND g.GroupName LIKE @search';
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        query += ' ORDER BY g.GroupId OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, parseInt(limit));

        const result = await request.query(query);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM Groups WHERE 1=1';
        const countRequest = pool.request();

        if (search) {
            countQuery += ' AND GroupName LIKE @search';
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
                SELECT g.GroupId, g.GroupName, g.ManagerId, u.Username as ManagerName
                FROM Groups g
                LEFT JOIN Users u ON g.ManagerId = u.UserId
                WHERE g.GroupId = @groupId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).send('گروه یافت نشد');
        }

        // Get group members
        const membersResult = await pool
            .request()
            .input('groupId', sql.Int, id)
            .query(`
                SELECT u.UserId, u.Username, u.Role
                FROM Users u
                JOIN UserGroup ug ON u.UserId = ug.UserId
                WHERE ug.GroupId = @groupId
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
    const { GroupName, ManagerId } = req.body;

    if (!GroupName || !ManagerId) {
        return res.status(400).send('نام گروه و شناسه مدیر الزامی است');
    }

    try {
        const pool = await poolPromise;

        // Check if user exists
        const userCheck = await pool
            .request()
            .input('userId', sql.Int, ManagerId)
            .query('SELECT COUNT(*) as count FROM Users WHERE UserId = @userId');

        if (userCheck.recordset[0].count === 0) {
            return res.status(404).send('مدیر مورد نظر یافت نشد');
        }

        await pool
            .request()
            .input('groupName', sql.NVarChar, GroupName)
            .input('managerId', sql.Int, ManagerId)
            .query(`
                INSERT INTO Groups (GroupName, ManagerId)
                VALUES (@groupName, @managerId)
            `);

        res.status(201).json({
            GroupName,
            ManagerId,
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
    const { GroupName, ManagerId } = req.body;

    if (!GroupName && ManagerId == null) {
        return res.status(400).send('حداقل یکی از فیلدها الزامی است');
    }

    try {
        const pool = await poolPromise;

        // Check if group exists
        const checkResult = await pool
            .request()
            .input('groupId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM Groups WHERE GroupId = @groupId');

        if (checkResult.recordset[0].count === 0) {
            return res.status(404).send('گروه یافت نشد');
        }

        // If ManagerId provided, check if user exists
        if (ManagerId) {
            const userCheck = await pool
                .request()
                .input('userId', sql.Int, ManagerId)
                .query('SELECT COUNT(*) as count FROM Users WHERE UserId = @userId');

            if (userCheck.recordset[0].count === 0) {
                return res.status(404).send('مدیر مورد نظر یافت نشد');
            }
        }

        await pool
            .request()
            .input('groupId', sql.Int, id)
            .input('groupName', sql.NVarChar, GroupName || null)
            .input('managerId', sql.Int, ManagerId ?? null)
            .query(`
                UPDATE Groups
                SET GroupName = COALESCE(@groupName, GroupName),
                    ManagerId = COALESCE(@managerId, ManagerId)
                WHERE GroupId = @groupId
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

        // Remove users from group first
        await pool
            .request()
            .input('groupId', sql.Int, id)
            .query('DELETE FROM UserGroup WHERE GroupId = @groupId');

        // Delete group
        const result = await pool
            .request()
            .input('groupId', sql.Int, id)
            .query('DELETE FROM Groups WHERE GroupId = @groupId');

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
            .query('SELECT COUNT(*) as count FROM Groups WHERE GroupId = @groupId');

        if (groupCheck.recordset[0].count === 0) {
            return res.status(404).send('گروه یافت نشد');
        }

        const result = await pool
            .request()
            .input('groupId', sql.Int, id)
            .query(`
                SELECT u.UserId, u.Username, u.Role
                FROM Users u
                JOIN UserGroup ug ON u.UserId = ug.UserId
                WHERE ug.GroupId = @groupId
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
    const { UserId } = req.body;

    if (!UserId) {
        return res.status(400).send('شناسه کاربر الزامی است');
    }

    try {
        const pool = await poolPromise;

        // Check if group exists
        const groupCheck = await pool
            .request()
            .input('groupId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM Groups WHERE GroupId = @groupId');

        if (groupCheck.recordset[0].count === 0) {
            return res.status(404).send('گروه یافت نشد');
        }

        // Check if user exists
        const userCheck = await pool
            .request()
            .input('userId', sql.Int, UserId)
            .query('SELECT COUNT(*) as count FROM Users WHERE UserId = @userId');

        if (userCheck.recordset[0].count === 0) {
            return res.status(404).send('کاربر یافت نشد');
        }

        // Check if user already in a group
        const memberCheck = await pool
            .request()
            .input('userId', sql.Int, UserId)
            .query('SELECT GroupId FROM UserGroup WHERE UserId = @userId');

        if (memberCheck.recordset.length > 0) {
            // Remove from old group first
            await pool
                .request()
                .input('userId', sql.Int, UserId)
                .query('DELETE FROM UserGroup WHERE UserId = @userId');
        }

        // Add to new group
        await pool
            .request()
            .input('userId', sql.Int, UserId)
            .input('groupId', sql.Int, id)
            .query('INSERT INTO UserGroup (UserId, GroupId) VALUES (@userId, @groupId)');

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
            .input('userId', sql.Int, userId)
            .input('groupId', sql.Int, id)
            .query('DELETE FROM UserGroup WHERE UserId = @userId AND GroupId = @groupId');

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
    const { ManagerId } = req.body;

    if (!ManagerId) {
        return res.status(400).send('شناسه مدیر الزامی است');
    }

    try {
        const pool = await poolPromise;

        // Check if group exists
        const groupCheck = await pool
            .request()
            .input('groupId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM Groups WHERE GroupId = @groupId');

        if (groupCheck.recordset[0].count === 0) {
            return res.status(404).send('گروه یافت نشد');
        }

        // Check if user exists
        const userCheck = await pool
            .request()
            .input('userId', sql.Int, ManagerId)
            .query('SELECT COUNT(*) as count FROM Users WHERE UserId = @userId');

        if (userCheck.recordset[0].count === 0) {
            return res.status(404).send('کاربر یافت نشد');
        }

        // Update group manager
        await pool
            .request()
            .input('groupId', sql.Int, id)
            .input('managerId', sql.Int, ManagerId)
            .query('UPDATE Groups SET ManagerId = @managerId WHERE GroupId = @groupId');

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
