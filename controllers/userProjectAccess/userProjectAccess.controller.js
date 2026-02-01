const { sql, poolPromise } = require('../../config/db.config');
const logger = require('../../utils/logger.service');

/**
 * @description Get all projects with access status for current user
 */
const getAllProjectsWithAccess = async (req, res) => {
    const userId = req.user.userId;
    logger.api.info('GET /user-project-access request', { userId });

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT 
                    p.id,
                    p.projectName,
                    CAST(
                        CASE 
                            WHEN upa.UserId IS NOT NULL THEN 1
                            ELSE 0
                        END AS BIT
                    ) as hasAccess
                FROM projects p
                LEFT JOIN UserProjectAccess upa 
                    ON p.id = upa.ProjectId AND upa.UserId = @userId
                ORDER BY p.projectName
            `);

        logger.api.info('GET /user-project-access query executed', {
            userId,
            projectCount: result.recordset.length
        });

        res.json(result.recordset);
    } catch (err) {
        logger.errors.error('Error in getAllProjectsWithAccess', {
            userId,
            error: err.message,
            stack: err.stack
        });
        console.error('Error in GET /user-project-access:', err);
        res.status(500).json({
            error: 'خطای سرور در دریافت لیست پروژه‌ها',
            message: err.message
        });
    }
};

/**
 * @description Toggle project access for current user
 */
const toggleProjectAccess = async (req, res) => {
    const userId = req.user.userId;
    const projectId = parseInt(req.params.projectId);

    logger.api.info('PUT /user-project-access/:projectId request', {
        userId,
        projectId
    });

    try {
        const pool = await poolPromise;

        // Check if project exists
        const projectCheck = await pool.request()
            .input('projectId', sql.Int, projectId)
            .query('SELECT COUNT(*) as count FROM projects WHERE id = @projectId');

        if (projectCheck.recordset[0].count === 0) {
            logger.api.warn('Project not found', { userId, projectId });
            return res.status(404).json({
                error: 'پروژه یافت نشد'
            });
        }

        // Check current access status
        const accessCheck = await pool.request()
            .input('userId', sql.Int, userId)
            .input('projectId', sql.Int, projectId)
            .query(`
                SELECT COUNT(*) as count 
                FROM UserProjectAccess 
                WHERE UserId = @userId AND ProjectId = @projectId
            `);

        const hasAccess = accessCheck.recordset[0].count > 0;

        if (hasAccess) {
            // Remove access
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('projectId', sql.Int, projectId)
                .query(`
                    DELETE FROM UserProjectAccess 
                    WHERE UserId = @userId AND ProjectId = @projectId
                `);

            logger.api.info('Project access removed', { userId, projectId });

            res.json({
                hasAccess: false,
                message: 'دسترسی به پروژه حذف شد'
            });
        } else {
            // Add access
            try {
                await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('projectId', sql.Int, projectId)
                    .query(`
                        INSERT INTO UserProjectAccess (UserId, ProjectId)
                        VALUES (@userId, @projectId)
                    `);

                logger.api.info('Project access added', { userId, projectId });

                res.json({
                    hasAccess: true,
                    message: 'دسترسی به پروژه اضافه شد'
                });
            } catch (insertErr) {
                // Handle potential duplicate key error (race condition)
                if (insertErr.number === 2627 || insertErr.code === 'EREQUEST' && insertErr.message.includes('PRIMARY KEY')) {
                    logger.api.warn('Duplicate access attempt (race condition)', { userId, projectId });
                    res.json({
                        hasAccess: true,
                        message: 'دسترسی به پروژه اضافه شد'
                    });
                } else {
                    throw insertErr;
                }
            }
        }
    } catch (err) {
        logger.errors.error('Error in toggleProjectAccess', {
            userId,
            projectId,
            error: err.message,
            stack: err.stack
        });
        console.error('Error in PUT /user-project-access/:projectId:', err);
        res.status(500).json({
            error: 'خطای سرور در تغییر دسترسی پروژه',
            message: err.message
        });
    }
};

module.exports = {
    getAllProjectsWithAccess,
    toggleProjectAccess
};
