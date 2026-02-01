const { sql, poolPromise } = require('../../config/db.config');
const logger = require('../../utils/logger.service');

/**
 * @description Get all projects accessible to the current user
 */
const getAllProjects = async (req, res) => {
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
        logger.errors.error('Error in getAllProjects', { 
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
};

/**
 * @description Get a project by ID if accessible to the current user
 */
const getProjectById = async (req, res) => {
    const userId = req.user.userId;
    const projectId = req.params.id;
    
    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('id', sql.Int, projectId)
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
                .input('id', sql.Int, projectId)
                .query('SELECT COUNT(*) as count FROM projects WHERE id = @id');
                
            if (existsResult.recordset[0].count === 0) {
                logger.api.warn('Project not found', { userId, projectId });
                return res.status(404).send('پروژه یافت نشد');
            } else {
                logger.api.warn('User does not have access to project', { userId, projectId });
                return res.status(403).send('دسترسی به این پروژه مجاز نیست');
            }
        }
        
        logger.api.info('Project fetched successfully', { userId, projectId });
        res.json(result.recordset[0]);
    } catch (err) {
        logger.errors.error('Error in getProjectById', { userId, projectId, error: err.message });
        console.error('Error in GET /projects/:id:', err);
        res.status(500).send('خطای سرور در دریافت پروژه');
    }
};

/**
 * @description Create a new project
 */
const createProject = async (req, res) => {
    const { 
        Id, 
        ProjectName,
        IsActive,
        FinanceCenterCost,
        BaseCenterCost,
        BLine,
        SystemType,
        ContractType,
        CenterType
    } = req.body;
    
    if (!Id) {
        logger.api.warn('Create project attempt without Id');
        return res.status(400).send('شناسه پروژه الزامی است');
    }
    
    try {
        const pool = await poolPromise;
        const checkResult = await pool
            .request()
            .input('id', sql.Int, Id)
            .query('SELECT COUNT(*) as count FROM projects WHERE id = @id');
            
        if (checkResult.recordset[0].count > 0) {
            logger.api.warn('Create project attempt with existing Id', { projectId: Id });
            return res.status(400).send('شناسه پروژه قبلاً وجود دارد');
        }
        
        const result = await pool
            .request()
            .input('Id', sql.Int, Id)
            .input('ProjectName', sql.NVarChar, ProjectName || null)
            .input('IsActive', sql.Bit, IsActive !== undefined ? (IsActive ? 1 : 0) : 1)
            .input('FinanceCenterCost', sql.Int, FinanceCenterCost || null)
            .input('BaseCenterCost', sql.NVarChar(50), BaseCenterCost || null)
            .input('BLine', sql.NVarChar(50), BLine || null)
            .input('SystemType', sql.NVarChar(50), SystemType || null)
            .input('ContractType', sql.NVarChar(50), ContractType || null)
            .input('CenterType', sql.NVarChar(50), CenterType || null)
            .query(`
                INSERT INTO projects (
                    id, 
                    projectName, 
                    IsActive,
                    FinanceCenterCost,
                    BaseCenterCost,
                    BLine,
                    SystemType,
                    ContractType,
                    CenterType
                ) 
                OUTPUT INSERTED.* 
                VALUES (
                    @Id, 
                    @ProjectName, 
                    @IsActive,
                    @FinanceCenterCost,
                    @BaseCenterCost,
                    @BLine,
                    @SystemType,
                    @ContractType,
                    @CenterType
                )
            `);
        
        logger.api.info('Project created successfully', { projectId: Id, projectName: ProjectName });
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        logger.errors.error('Error in createProject', { projectId: Id, error: err.message });
        console.error('Error in POST /projects:', err);
        res.status(500).send('خطای سرور در ایجاد پروژه');
    }
};

/**
 * @description Update a project
 */
const updateProject = async (req, res) => {
    const projectId = req.params.id;
    const { 
        ProjectName,
        IsActive,
        FinanceCenterCost,
        BaseCenterCost,
        BLine,
        SystemType,
        ContractType,
        CenterType
    } = req.body;
    
    try {
        const pool = await poolPromise;
        
        // Build update fields dynamically
        let updateFields = [];
        const request = pool.request().input('id', sql.Int, projectId);
        
        if (ProjectName !== undefined) {
            updateFields.push('projectName = @ProjectName');
            request.input('ProjectName', sql.NVarChar, ProjectName);
        }
        
        if (IsActive !== undefined) {
            updateFields.push('IsActive = @IsActive');
            request.input('IsActive', sql.Bit, IsActive ? 1 : 0);
        }
        
        if (FinanceCenterCost !== undefined) {
            updateFields.push('FinanceCenterCost = @FinanceCenterCost');
            request.input('FinanceCenterCost', sql.Int, FinanceCenterCost || null);
        }
        
        if (BaseCenterCost !== undefined) {
            updateFields.push('BaseCenterCost = @BaseCenterCost');
            request.input('BaseCenterCost', sql.NVarChar(50), BaseCenterCost || null);
        }
        
        if (BLine !== undefined) {
            updateFields.push('BLine = @BLine');
            request.input('BLine', sql.NVarChar(50), BLine || null);
        }
        
        if (SystemType !== undefined) {
            updateFields.push('SystemType = @SystemType');
            request.input('SystemType', sql.NVarChar(50), SystemType || null);
        }
        
        if (ContractType !== undefined) {
            updateFields.push('ContractType = @ContractType');
            request.input('ContractType', sql.NVarChar(50), ContractType || null);
        }
        
        if (CenterType !== undefined) {
            updateFields.push('CenterType = @CenterType');
            request.input('CenterType', sql.NVarChar(50), CenterType || null);
        }
        
        if (updateFields.length === 0) {
            logger.api.warn('Update project attempt without fields', { projectId });
            return res.status(400).send('هیچ فیلدی برای بروزرسانی ارسال نشده است');
        }
        
        const result = await request.query(`
            UPDATE projects 
            SET ${updateFields.join(', ')} 
            OUTPUT INSERTED.* 
            WHERE id = @id
        `);
        
        if (result.recordset.length === 0) {
            logger.api.warn('Update project attempt for non-existent project', { projectId });
            return res.status(404).send('پروژه یافت نشد');
        }
        
        logger.api.info('Project updated successfully', { projectId });
        res.json(result.recordset[0]);
    } catch (err) {
        logger.errors.error('Error in updateProject', { projectId, error: err.message });
        console.error('Error in PUT /projects/:id:', err);
        res.status(500).send('خطای سرور در به‌روزرسانی پروژه');
    }
};

/**
 * @description Delete a project
 */
const deleteProject = async (req, res) => {
    const projectId = req.params.id;
    
    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('id', sql.Int, projectId)
            .query('DELETE FROM projects WHERE id = @id');
            
        if (result.rowsAffected[0] === 0) {
            logger.api.warn('Delete project attempt for non-existent project', { projectId });
            return res.status(404).send('پروژه یافت نشد');
        }
        
        logger.api.info('Project deleted successfully', { projectId });
        res.status(204).send();
    } catch (err) {
        logger.errors.error('Error in deleteProject', { projectId, error: err.message });
        console.error('Error in DELETE /projects/:id:', err);
        res.status(500).send('خطای سرور در حذف پروژه');
    }
};

module.exports = {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
};
