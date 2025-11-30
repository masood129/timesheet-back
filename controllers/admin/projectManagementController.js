const { sql, poolPromise } = require('../../config/db.config');

/**
 * Get all projects (admin view - no access restrictions)
 */
const getAllProjects = async (req, res) => {
    const { search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const pool = await poolPromise;
        let query = 'SELECT id, projectName FROM projects WHERE 1=1';
        const request = pool.request();

        if (search) {
            query += ' AND projectName LIKE @search';
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        query += ' ORDER BY id OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, parseInt(limit));

        const result = await request.query(query);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM projects WHERE 1=1';
        const countRequest = pool.request();

        if (search) {
            countQuery += ' AND projectName LIKE @search';
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
            .query('SELECT id, projectName FROM projects WHERE id = @projectId');

        if (result.recordset.length === 0) {
            return res.status(404).send('پروژه یافت نشد');
        }

        // Get users with access to this project
        const usersResult = await pool
            .request()
            .input('projectId', sql.Int, id)
            .query(`
                SELECT 
                    u.personalid,
                    u.id as username,
                    u.farsifirstname,
                    u.farsilastname,
                    u.email,
                    u.role
                FROM users u
                JOIN UserProjectAccess upa ON u.personalid = upa.UserId
                WHERE upa.ProjectId = @projectId AND u.IsActive = 1
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
    const { id, projectName } = req.body;

    if (!id || !projectName) {
        return res.status(400).send('شناسه و نام پروژه الزامی است');
    }

    try {
        const pool = await poolPromise;

        // Check if project already exists
        const checkResult = await pool
            .request()
            .input('id', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM projects WHERE id = @id');

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).send('پروژه با این شناسه قبلاً وجود دارد');
        }

        const result = await pool
            .request()
            .input('id', sql.Int, id)
            .input('projectName', sql.NVarChar, projectName)
            .query(`
                INSERT INTO projects (id, projectName)
                OUTPUT INSERTED.*
                VALUES (@id, @projectName)
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
    const { projectName, id: newId } = req.body;

    if (!projectName) {
        return res.status(400).send('نام پروژه الزامی است');
    }

    try {
        const pool = await poolPromise;

        // Build the update query dynamically based on what fields are provided
        let updateFields = ['projectName = @projectName'];
        const request = pool.request()
            .input('oldId', sql.Int, id)
            .input('projectName', sql.NVarChar, projectName);

        // If a new ID is provided and it's different from the current ID, update it
        if (newId !== undefined && newId !== null && parseInt(newId) !== parseInt(id)) {
            // Check if the new ID already exists
            const existingProject = await pool
                .request()
                .input('newId', sql.Int, newId)
                .query('SELECT id FROM projects WHERE id = @newId');

            if (existingProject.recordset.length > 0) {
                return res.status(409).send('کد پروژه جدید قبلاً استفاده شده است');
            }

            updateFields.push('id = @newId');
            request.input('newId', sql.Int, newId);
        }

        const result = await request.query(`
            UPDATE projects
            SET ${updateFields.join(', ')}
            OUTPUT INSERTED.*
            WHERE id = @oldId
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
            .query('DELETE FROM projects WHERE id = @id');

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
            .query('SELECT COUNT(*) as count FROM projects WHERE id = @projectId');

        if (projectCheck.recordset[0].count === 0) {
            return res.status(404).send('پروژه یافت نشد');
        }

        const result = await pool
            .request()
            .input('projectId', sql.Int, id)
            .query(`
                SELECT 
                    u.personalid,
                    u.id as username,
                    u.farsifirstname,
                    u.farsilastname,
                    u.email,
                    u.role
                FROM users u
                JOIN UserProjectAccess upa ON u.personalid = upa.UserId
                WHERE upa.ProjectId = @projectId AND u.IsActive = 1
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
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).send('شناسه کاربر الزامی است');
    }

    try {
        const pool = await poolPromise;

        // Check if project exists
        const projectCheck = await pool
            .request()
            .input('projectId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM projects WHERE id = @projectId');

        if (projectCheck.recordset[0].count === 0) {
            return res.status(404).send('پروژه یافت نشد');
        }

        // Check if user exists
        const userCheck = await pool
            .request()
            .input('personalId', sql.Int, userId)
            .query('SELECT COUNT(*) as count FROM users WHERE personalid = @personalId AND IsActive = 1');

        if (userCheck.recordset[0].count === 0) {
            return res.status(404).send('کاربر یافت نشد');
        }

        // Check if access already exists
        const accessCheck = await pool
            .request()
            .input('userId', sql.Int, userId)
            .input('projectId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM UserProjectAccess WHERE UserId = @userId AND ProjectId = @projectId');

        if (accessCheck.recordset[0].count > 0) {
            return res.status(400).send('کاربر قبلاً به این پروژه دسترسی دارد');
        }

        // Add access
        await pool
            .request()
            .input('userId', sql.Int, userId)
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
