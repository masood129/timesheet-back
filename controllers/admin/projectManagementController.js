const { sql, poolPromise } = require('../../config/db.config');

/**
 * Get all projects (admin view - no access restrictions)
 */
const getAllProjects = async (req, res) => {
    const { search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const pool = await poolPromise;
        let query = 'SELECT * FROM Projects WHERE 1=1';
        const request = pool.request();

        if (search) {
            query += ' AND ProjectName LIKE @search';
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        query += ' ORDER BY Id OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, parseInt(limit));

        const result = await request.query(query);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM Projects WHERE 1=1';
        const countRequest = pool.request();

        if (search) {
            countQuery += ' AND ProjectName LIKE @search';
            countRequest.input('search', sql.NVarChar, `%${search}%`);
        }

        const countResult = await countRequest.query(countQuery);

        res.json({
            projects: result.recordset,
            total: countResult.recordset[0].total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (err) {
        console.error('Error in getAllProjects:', err.message);
        res.status(500).send('خطای سرور در دریافت لیست پروژه‌ها');
    }
};

/**
 * Get project by ID with user access list
 */
const getProjectById = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('projectId', sql.Int, id)
            .query('SELECT * FROM Projects WHERE Id = @projectId');

        if (result.recordset.length === 0) {
            return res.status(404).send('پروژه یافت نشد');
        }

        // Get users with access to this project
        const usersResult = await pool
            .request()
            .input('projectId', sql.Int, id)
            .query(`
                SELECT u.UserId, u.Username, u.Role
                FROM Users u
                JOIN UserProjectAccess upa ON u.UserId = upa.UserId
                WHERE upa.ProjectId = @projectId
            `);

        const project = result.recordset[0];
        project.Users = usersResult.recordset;

        res.json(project);
    } catch (err) {
        console.error('Error in getProjectById:', err.message);
        res.status(500).send('خطای سرور در دریافت اطلاعات پروژه');
    }
};

/**
 * Create new project
 */
const createProject = async (req, res) => {
    const { Id, ProjectName, securityLevel = 1 } = req.body;

    if (!Id || !ProjectName) {
        return res.status(400).send('شناسه و نام پروژه الزامی است');
    }

    try {
        const pool = await poolPromise;

        // Check if project already exists
        const checkResult = await pool
            .request()
            .input('id', sql.Int, Id)
            .query('SELECT COUNT(*) as count FROM Projects WHERE Id = @id');

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).send('پروژه با این شناسه قبلاً وجود دارد');
        }

        const result = await pool
            .request()
            .input('id', sql.Int, Id)
            .input('projectName', sql.NVarChar, ProjectName)
            .input('securityLevel', sql.Int, securityLevel)
            .query(`
                INSERT INTO Projects (Id, ProjectName, securityLevel)
                OUTPUT INSERTED.*
                VALUES (@id, @projectName, @securityLevel)
            `);

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error('Error in createProject:', err.message);
        res.status(500).send('خطای سرور در ایجاد پروژه');
    }
};

/**
 * Update project
 */
const updateProject = async (req, res) => {
    const { id } = req.params;
    const { ProjectName, securityLevel } = req.body;

    if (!ProjectName && securityLevel == null) {
        return res.status(400).send('حداقل یکی از فیلدها الزامی است');
    }

    try {
        const pool = await poolPromise;

        const result = await pool
            .request()
            .input('id', sql.Int, id)
            .input('projectName', sql.NVarChar, ProjectName || null)
            .input('securityLevel', sql.Int, securityLevel ?? null)
            .query(`
                UPDATE Projects
                SET ProjectName = COALESCE(@projectName, ProjectName),
                    securityLevel = COALESCE(@securityLevel, securityLevel)
                OUTPUT INSERTED.*
                WHERE Id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).send('پروژه یافت نشد');
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error in updateProject:', err.message);
        res.status(500).send('خطای سرور در بروزرسانی پروژه');
    }
};

/**
 * Delete project
 */
const deleteProject = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;

        // Delete user access first
        await pool
            .request()
            .input('projectId', sql.Int, id)
            .query('DELETE FROM UserProjectAccess WHERE ProjectId = @projectId');

        // Delete project
        const result = await pool
            .request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Projects WHERE Id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('پروژه یافت نشد');
        }

        res.json({ message: 'پروژه با موفقیت حذف شد' });
    } catch (err) {
        console.error('Error in deleteProject:', err.message);
        res.status(500).send('خطای سرور در حذف پروژه');
    }
};

/**
 * Get users with access to a project
 */
const getProjectUsers = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;

        // Check if project exists
        const projectCheck = await pool
            .request()
            .input('projectId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM Projects WHERE Id = @projectId');

        if (projectCheck.recordset[0].count === 0) {
            return res.status(404).send('پروژه یافت نشد');
        }

        const result = await pool
            .request()
            .input('projectId', sql.Int, id)
            .query(`
                SELECT u.UserId, u.Username, u.Role
                FROM Users u
                JOIN UserProjectAccess upa ON u.UserId = upa.UserId
                WHERE upa.ProjectId = @projectId
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error in getProjectUsers:', err.message);
        res.status(500).send('خطای سرور در دریافت کاربران پروژه');
    }
};

/**
 * Add user access to project
 */
const addUserToProject = async (req, res) => {
    const { id } = req.params;
    const { UserId } = req.body;

    if (!UserId) {
        return res.status(400).send('شناسه کاربر الزامی است');
    }

    try {
        const pool = await poolPromise;

        // Check if project exists
        const projectCheck = await pool
            .request()
            .input('projectId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM Projects WHERE Id = @projectId');

        if (projectCheck.recordset[0].count === 0) {
            return res.status(404).send('پروژه یافت نشد');
        }

        // Check if user exists
        const userCheck = await pool
            .request()
            .input('userId', sql.Int, UserId)
            .query('SELECT COUNT(*) as count FROM Users WHERE UserId = @userId');

        if (userCheck.recordset[0].count === 0) {
            return res.status(404).send('کاربر یافت نشد');
        }

        // Check if access already exists
        const accessCheck = await pool
            .request()
            .input('userId', sql.Int, UserId)
            .input('projectId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM UserProjectAccess WHERE UserId = @userId AND ProjectId = @projectId');

        if (accessCheck.recordset[0].count > 0) {
            return res.status(400).send('کاربر قبلاً به این پروژه دسترسی دارد');
        }

        // Add access
        await pool
            .request()
            .input('userId', sql.Int, UserId)
            .input('projectId', sql.Int, id)
            .query('INSERT INTO UserProjectAccess (UserId, ProjectId) VALUES (@userId, @projectId)');

        res.status(201).json({ message: 'دسترسی کاربر به پروژه با موفقیت افزوده شد' });
    } catch (err) {
        console.error('Error in addUserToProject:', err.message);
        res.status(500).send('خطای سرور در افزودن دسترسی کاربر');
    }
};

/**
 * Remove user access from project
 */
const removeUserFromProject = async (req, res) => {
    const { id, userId } = req.params;

    try {
        const pool = await poolPromise;

        const result = await pool
            .request()
            .input('userId', sql.Int, userId)
            .input('projectId', sql.Int, id)
            .query('DELETE FROM UserProjectAccess WHERE UserId = @userId AND ProjectId = @projectId');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('دسترسی یافت نشد');
        }

        res.json({ message: 'دسترسی کاربر از پروژه حذف شد' });
    } catch (err) {
        console.error('Error in removeUserFromProject:', err.message);
        res.status(500).send('خطای سرور در حذف دسترسی کاربر');
    }
};

module.exports = {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectUsers,
    addUserToProject,
    removeUserFromProject
};
