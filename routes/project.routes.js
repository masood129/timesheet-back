const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db.config');
const logger = require('../utils/logger.service');

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Retrieve all projects accessible to the current user
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    const userId = req.user.userId;
    logger.api.info('GET /projects request', { userId });
    
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT p.*
                FROM projects p
                         JOIN UserProjectAccess upa ON p.id = upa.ProjectId
                WHERE upa.UserId = @userId
            `);
        
        logger.api.info('GET /projects query executed', { 
            userId, 
            projectCount: result.recordset.length 
        });
        
        if (result.recordset.length === 0) {
            logger.api.warn('No projects found for user', { userId });
        }
        
        res.json(result.recordset);
    } catch (err) {
        logger.errors.error('Error in GET /projects', { 
            userId, 
            error: err.message,
            stack: err.stack 
        });
        console.error('Error in GET /projects:', err);
        res.status(500).json({ 
            error: 'خطای سرور در دریافت پروژه‌ها',
            message: err.message 
        });
    }
});

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get a project by ID if accessible to the current user
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       403:
 *         description: Access denied to this project
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
    const userId = req.user.userId;
    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('id', sql.Int, req.params.id)
            .input('userId', sql.Int, userId)
            .query(`
                SELECT p.*
                FROM projects p
                         JOIN UserProjectAccess upa ON p.id = upa.ProjectId
                WHERE p.id = @id
                  AND upa.UserId = @userId
            `);
        if (result.recordset.length === 0) {
            const existsResult = await pool
                .request()
                .input('id', sql.Int, req.params.id)
                .query('SELECT COUNT(*) as count FROM projects WHERE id = @id');
            if (existsResult.recordset[0].count === 0) {
                return res.status(404).send('پروژه یافت نشد');
            } else {
                return res.status(403).send('دسترسی به این پروژه مجاز نیست');
            }
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error in GET /projects/:id:', err);
        res.status(500).send('خطای سرور در دریافت پروژه');
    }
});

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectInput'
 *     responses:
 *       201:
 *         description: Project created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid input or ID already exists
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
    const { Id, ProjectName } = req.body;
    if (!Id || !ProjectName) {
        return res.status(400).send('شناسه و نام پروژه الزامی هستند');
    }
    try {
        const pool = await poolPromise;
        const checkResult = await pool
            .request()
            .input('id', sql.Int, Id)
            .query('SELECT COUNT(*) as count FROM projects WHERE id = @id');
        if (checkResult.recordset[0].count > 0) {
            return res.status(400).send('شناسه پروژه قبلاً وجود دارد');
        }
        const result = await pool
            .request()
            .input('Id', sql.Int, Id)
            .input('ProjectName', sql.NVarChar, ProjectName)
            .query(
                'INSERT INTO projects (id, projectName) OUTPUT INSERTED.* VALUES (@Id, @ProjectName)'
            );
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error('Error in POST /projects:', err);
        res.status(500).send('خطای سرور در ایجاد پروژه');
    }
});

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ProjectName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
    const { ProjectName } = req.body;
    if (!ProjectName) {
        return res.status(400).send('نام پروژه الزامی است');
    }
    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('id', sql.Int, req.params.id)
            .input('ProjectName', sql.NVarChar, ProjectName)
            .query(
                'UPDATE projects SET projectName = @ProjectName OUTPUT INSERTED.* WHERE id = @id'
            );
        if (result.recordset.length === 0) {
            return res.status(404).send('پروژه یافت نشد');
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error in PUT /projects/:id:', err);
        res.status(500).send('خطای سرور در به‌روزرسانی پروژه');
    }
});

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Project deleted
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM projects WHERE id = @id');
        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('پروژه یافت نشد');
        }
        res.status(204).send();
    } catch (err) {
        console.error('Error in DELETE /projects/:id:', err);
        res.status(500).send('خطای سرور در حذف پروژه');
    }
});

module.exports = router;