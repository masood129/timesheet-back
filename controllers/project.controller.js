const { sql, poolPromise } = require('../config/db.config');

// ایجاد پروژه جدید
exports.createProject = async (req, res) => {
    const { projectName, securityLevel } = req.body;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('projectName', sql.NVarChar, projectName)
            .input('securityLevel', sql.Int, securityLevel)
            .query(`
                INSERT INTO Projects (ProjectName, SecurityLevel)
                VALUES (@projectName, @securityLevel)
            `);

        res.status(201).json({ message: 'Project created successfully' });
    } catch (err) {
        console.error('Error creating project:', err.message);
        res.status(500).send('Server error');
    }
};

// لیست همه پروژه‌ها
exports.getProjects = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`SELECT * FROM Projects`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching projects:', err.message);
        res.status(500).send('Server error');
    }
};

// گرفتن یک پروژه خاص
exports.getProjectById = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT * FROM Projects WHERE ProjectID = @id`);

        if (result.recordset.length === 0) {
            return res.status(404).send('Project not found');
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching project:', err.message);
        res.status(500).send('Server error');
    }
};

// بروزرسانی پروژه
exports.updateProject = async (req, res) => {
    const { id } = req.params;
    const { projectName, securityLevel } = req.body;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('projectName', sql.NVarChar, projectName)
            .input('securityLevel', sql.Int, securityLevel)
            .query(`
                UPDATE Projects
                SET ProjectName = @projectName,
                    SecurityLevel = @securityLevel
                WHERE ProjectID = @id
            `);

        res.json({ message: 'Project updated successfully' });
    } catch (err) {
        console.error('Error updating project:', err.message);
        res.status(500).send('Server error');
    }
};

// حذف پروژه
exports.deleteProject = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM Projects WHERE ProjectID = @id`);

        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        console.error('Error deleting project:', err.message);
        res.status(500).send('Server error');
    }
};
