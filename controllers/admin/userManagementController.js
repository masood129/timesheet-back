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
                g.groupname,
                u.IsActive,
                u.directAdminid,
                CONCAT(da.farsifirstname, ' ', da.farsilastname) AS directAdmin
            FROM users u
            LEFT JOIN groups g ON u.groupid = g.id
            LEFT JOIN users da ON u.directAdminid = da.personalid
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
                    u.IsActive,
                    u.directAdminid,
                    CONCAT(da.farsifirstname, ' ', da.farsilastname) AS directAdmin,
                    uch.ContractArrivalTime,
                    uch.ContractLeaveTime,
                    uch.MinMonthlyHours
                FROM users u
                LEFT JOIN groups g ON u.groupid = g.id
                LEFT JOIN users da ON u.directAdminid = da.personalid
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
    const { 
        Username, username, 
        farsifirstname, 
        farsilastname, 
        email, 
        groupid, groupId,
        Role, role,
        IsActive, isActive,
        directAdminid,
        ContractArrivalTime,
        ContractLeaveTime,
        MinMonthlyHours
    } = req.body;

    // Support both capitalized and lowercase field names for compatibility
    const finalUsername = Username || username;
    const finalGroupId = groupid ?? groupId;
    const finalRole = Role || role;
    const finalIsActive = IsActive ?? isActive;

    if (!finalUsername && !farsifirstname && !farsilastname && !email && finalGroupId == null && !finalRole && finalIsActive == null && directAdminid === undefined) {
        return res.status(400).send('حداقل یکی از فیلدها الزامی است');
    }

    // Validate role if provided
    const validRoles = ['user', 'group_manager', 'general_manager', 'finance_manager', 'admin'];
    if (finalRole && !validRoles.includes(finalRole)) {
        return res.status(400).send('نقش نامعتبر است');
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

        // Build dynamic UPDATE query
        const updateFields = [];
        const request = pool.request();
        request.input('personalId', sql.Int, id);

        if (finalUsername !== undefined) {
            updateFields.push('id = @username');
            request.input('username', sql.NVarChar, finalUsername);
        }
        if (farsifirstname !== undefined) {
            updateFields.push('farsifirstname = @farsifirstname');
            request.input('farsifirstname', sql.NVarChar, farsifirstname);
        }
        if (farsilastname !== undefined) {
            updateFields.push('farsilastname = @farsilastname');
            request.input('farsilastname', sql.NVarChar, farsilastname);
        }
        if (email !== undefined) {
            updateFields.push('email = @email');
            request.input('email', sql.NVarChar, email);
        }
        if (finalGroupId !== undefined) {
            updateFields.push('groupid = @groupId');
            request.input('groupId', sql.Int, finalGroupId);
            
            // Also update groups field with the group name
            if (finalGroupId !== null) {
                // Get the group name
                const groupResult = await pool.request()
                    .input('grpId', sql.Int, finalGroupId)
                    .query('SELECT groupname FROM groups WHERE id = @grpId');
                
                if (groupResult.recordset.length > 0) {
                    const groupName = groupResult.recordset[0].groupname;
                    updateFields.push('groups = @groups');
                    request.input('groups', sql.NVarChar, groupName);
                }
            } else {
                // If groupid is null, clear groups too
                updateFields.push('groups = NULL');
            }
        }
        if (finalRole !== undefined) {
            updateFields.push('role = @role');
            request.input('role', sql.NVarChar, finalRole);
        }
        if (finalIsActive !== undefined) {
            updateFields.push('IsActive = @isActive');
            request.input('isActive', sql.Bit, finalIsActive);
        }
        if (directAdminid !== undefined) {
            updateFields.push('directAdminid = @directAdminid');
            request.input('directAdminid', sql.Int, directAdminid);
            
            // Also update directAdmin field with the full name
            if (directAdminid !== null) {
                // Get the full name of the direct admin
                const adminResult = await pool.request()
                    .input('adminId', sql.Int, directAdminid)
                    .query('SELECT farsifirstname, farsilastname FROM users WHERE personalid = @adminId');
                
                if (adminResult.recordset.length > 0) {
                    const admin = adminResult.recordset[0];
                    const fullName = `${admin.farsifirstname} ${admin.farsilastname}`;
                    updateFields.push('directAdmin = @directAdmin');
                    request.input('directAdmin', sql.NVarChar, fullName);
                }
            } else {
                // If directAdminid is null, clear directAdmin too
                updateFields.push('directAdmin = NULL');
            }
        }

        if (updateFields.length > 0) {
            const updateQuery = `
                UPDATE users
                SET ${updateFields.join(', ')}
                WHERE personalid = @personalId
            `;
            await request.query(updateQuery);
        }

        // Update contract hours if provided (only if non-null values are present)
        const hasNonNullContractValues = (ContractArrivalTime !== undefined && ContractArrivalTime !== null) ||
                                        (ContractLeaveTime !== undefined && ContractLeaveTime !== null) ||
                                        (MinMonthlyHours !== undefined && MinMonthlyHours !== null);

        if (hasNonNullContractValues) {
            // Check if contract hours record exists
            const contractCheck = await pool
                .request()
                .input('userId', sql.Int, id)
                .query('SELECT COUNT(*) as count FROM UserContractHours WHERE UserId = @userId');

            const contractRequest = pool.request();
            contractRequest.input('userId', sql.Int, id);

            if (contractCheck.recordset[0].count > 0) {
                // Update existing record (only non-null values)
                const contractUpdateFields = [];
                if (ContractArrivalTime !== undefined && ContractArrivalTime !== null) {
                    contractUpdateFields.push('ContractArrivalTime = @contractArrivalTime');
                    contractRequest.input('contractArrivalTime', sql.Time, ContractArrivalTime);
                }
                if (ContractLeaveTime !== undefined && ContractLeaveTime !== null) {
                    contractUpdateFields.push('ContractLeaveTime = @contractLeaveTime');
                    contractRequest.input('contractLeaveTime', sql.Time, ContractLeaveTime);
                }
                if (MinMonthlyHours !== undefined && MinMonthlyHours !== null) {
                    contractUpdateFields.push('MinMonthlyHours = @minMonthlyHours');
                    contractRequest.input('minMonthlyHours', sql.Int, MinMonthlyHours);
                }

                if (contractUpdateFields.length > 0) {
                    const contractUpdateQuery = `
                        UPDATE UserContractHours
                        SET ${contractUpdateFields.join(', ')}
                        WHERE UserId = @userId
                    `;
                    await contractRequest.query(contractUpdateQuery);
                }
            } else {
                // Insert new record only if we have required non-null values
                // ContractLeaveTime is required (NOT NULL in DB)
                if (ContractLeaveTime !== null && ContractLeaveTime !== undefined) {
                    contractRequest
                        .input('contractArrivalTime', sql.Time, ContractArrivalTime || null)
                        .input('contractLeaveTime', sql.Time, ContractLeaveTime)
                        .input('minMonthlyHours', sql.Int, MinMonthlyHours || null);
                    
                    await contractRequest.query(`
                        INSERT INTO UserContractHours (UserId, ContractArrivalTime, ContractLeaveTime, MinMonthlyHours)
                        VALUES (@userId, @contractArrivalTime, @contractLeaveTime, @minMonthlyHours)
                    `);
                }
            }
        } else if ((ContractArrivalTime === null || ContractLeaveTime === null || MinMonthlyHours === null) &&
                   (ContractArrivalTime !== undefined || ContractLeaveTime !== undefined || MinMonthlyHours !== undefined)) {
            // If all contract values are explicitly set to null, delete the contract hours record
            await pool
                .request()
                .input('userId', sql.Int, id)
                .query('DELETE FROM UserContractHours WHERE UserId = @userId');
        }

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
