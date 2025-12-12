# نحوه خواندن داده‌های کاربری از دیتابیس UMD

## 📖 مفهوم ساختار

با کوئری‌هایی که ساخته شدند، تمام جدول‌ها **مستقیماً** در دیتابیس `UMD` قرار دارند:

```
دیتابیس UMD
├── users (جدول پایه - داده‌های واقعی کاربران)
├── groups (جدول پایه - داده‌های واقعی گروه‌ها)
├── projects (جدول پایه - داده‌های واقعی پروژه‌ها)
├── groupManagers (جدول پایه - داده‌های واقعی مدیران)
├── Admins (جدول جدید برنامه)
├── UserProjectAccess (جدول جدید برنامه)
├── DailyDetails (جدول جدید برنامه)
└── ... (سایر جدول‌های برنامه)
```

---

## 🔌 تنظیمات اتصال به دیتابیس

### فایل `.env`

```env
DB_SERVER=192.168.1.24
DB_DATABASE=UMD
DB_USER=sa
DB_PASSWORD=your_password_here
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

### فایل `config/database.js`

```javascript
const sql = require('mssql');

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,      // UMD
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || 1433),
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

async function getConnection() {
    if (!pool) {
        pool = await sql.connect(config);
    }
    return pool;
}

module.exports = {
    getConnection,
    sql
};
```

---

## 📝 نمونه کدهای خواندن داده‌ها

### 1️⃣ خواندن اطلاعات کاربر (از جدول users)

```javascript
// controllers/userController.js
const { getConnection, sql } = require('../config/database');

// دریافت تمام کاربران فعال
async function getAllUsers(req, res) {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`
                SELECT 
                    personalid,
                    farsifirstname,
                    farsilastname,
                    email,
                    id as username,
                    groups,
                    directAdmin,
                    directAdminid,
                    groupid,
                    IsActive
                FROM users
                WHERE IsActive = 1
                ORDER BY farsifirstname
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت لیست کاربران',
            error: error.message
        });
    }
}

// دریافت اطلاعات یک کاربر خاص
async function getUserById(req, res) {
    try {
        const { personalId } = req.params;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('personalId', sql.Int, personalId)
            .query(`
                SELECT 
                    u.personalid,
                    u.farsifirstname,
                    u.farsilastname,
                    u.email,
                    u.id as username,
                    u.groups,
                    u.directAdmin,
                    u.directAdminid,
                    u.groupid,
                    u.IsActive,
                    g.groupname,
                    g.managerID
                FROM users u
                LEFT JOIN groups g ON u.groupid = g.id
                WHERE u.personalid = @personalId
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'کاربر یافت نشد'
            });
        }
        
        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت اطلاعات کاربر',
            error: error.message
        });
    }
}

module.exports = {
    getAllUsers,
    getUserById
};
```

### 2️⃣ خواندن اطلاعات گروه‌ها (از جدول groups)

```javascript
// controllers/groupController.js
const { getConnection, sql } = require('../config/database');

// دریافت تمام گروه‌ها با تعداد اعضا
async function getAllGroups(req, res) {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`
                SELECT 
                    g.id,
                    g.groupname,
                    g.managerID,
                    gm.firstname + ' ' + gm.lastname AS managerName,
                    gm.email AS managerEmail,
                    COUNT(u.personalid) AS memberCount
                FROM groups g
                LEFT JOIN groupManagers gm ON g.managerID = gm.personalId
                LEFT JOIN users u ON g.id = u.groupid AND u.IsActive = 1
                GROUP BY g.id, g.groupname, g.managerID, 
                         gm.firstname, gm.lastname, gm.email
                ORDER BY g.groupname
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت لیست گروه‌ها',
            error: error.message
        });
    }
}

// دریافت اعضای یک گروه
async function getGroupMembers(req, res) {
    try {
        const { groupId } = req.params;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('groupId', sql.Int, groupId)
            .query(`
                SELECT 
                    u.personalid,
                    u.farsifirstname + ' ' + u.farsilastname AS fullName,
                    u.email,
                    u.id as username,
                    u.directAdmin
                FROM users u
                WHERE u.groupid = @groupId 
                  AND u.IsActive = 1
                ORDER BY u.farsifirstname
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error fetching group members:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت اعضای گروه',
            error: error.message
        });
    }
}

module.exports = {
    getAllGroups,
    getGroupMembers
};
```

### 3️⃣ خواندن پروژه‌ها با دسترسی کاربران

```javascript
// controllers/projectController.js
const { getConnection, sql } = require('../config/database');

// دریافت پروژه‌های یک کاربر
async function getUserProjects(req, res) {
    try {
        const { personalId } = req.params;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('personalId', sql.Int, personalId)
            .query(`
                SELECT DISTINCT
                    p.id,
                    p.projectName
                FROM projects p
                INNER JOIN UserProjectAccess upa ON p.id = upa.ProjectId
                WHERE upa.UserId = @personalId
                ORDER BY p.projectName
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error fetching user projects:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت پروژه‌های کاربر',
            error: error.message
        });
    }
}

// دریافت تمام پروژه‌ها
async function getAllProjects(req, res) {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`
                SELECT 
                    id,
                    projectName
                FROM projects
                ORDER BY projectName
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت لیست پروژه‌ها',
            error: error.message
        });
    }
}

module.exports = {
    getUserProjects,
    getAllProjects
};
```

### 4️⃣ ثبت گزارش روزانه (استفاده از چند جدول)

```javascript
// controllers/dailyReportController.js
const { getConnection, sql } = require('../config/database');

async function submitDailyReport(req, res) {
    const pool = await getConnection();
    const transaction = pool.transaction();
    
    try {
        await transaction.begin();
        
        const { 
            personalId, 
            date, 
            arrivalTime, 
            leaveTime, 
            personalTime,
            description,
            goCost,
            returnCost,
            tasks // آرایه‌ای از وظایف پروژه
        } = req.body;
        
        // 1. بررسی وجود کاربر در جدول users
        const userCheck = await transaction.request()
            .input('personalId', sql.Int, personalId)
            .query(`
                SELECT personalid, groupid 
                FROM users 
                WHERE personalid = @personalId AND IsActive = 1
            `);
        
        if (userCheck.recordset.length === 0) {
            throw new Error('کاربر یافت نشد');
        }
        
        // 2. ثبت جزئیات روزانه
        const dailyResult = await transaction.request()
            .input('date', sql.Date, date)
            .input('userId', sql.Int, personalId)
            .input('arrivalTime', sql.NVarChar, arrivalTime)
            .input('leaveTime', sql.NVarChar, leaveTime)
            .input('personalTime', sql.Int, personalTime)
            .input('description', sql.NVarChar, description)
            .input('goCost', sql.Int, goCost)
            .input('returnCost', sql.Int, returnCost)
            .query(`
                INSERT INTO DailyDetails 
                (Date, UserId, ArrivalTime, LeaveTime, PersonalTime, 
                 Description, GoCost, ReturnCost)
                VALUES 
                (@date, @userId, @arrivalTime, @leaveTime, @personalTime,
                 @description, @goCost, @returnCost)
            `);
        
        // 3. ثبت وظایف پروژه
        for (const task of tasks) {
            // بررسی دسترسی به پروژه
            const accessCheck = await transaction.request()
                .input('userId', sql.Int, personalId)
                .input('projectId', sql.Int, task.projectId)
                .query(`
                    SELECT 1 
                    FROM UserProjectAccess 
                    WHERE UserId = @userId AND ProjectId = @projectId
                `);
            
            if (accessCheck.recordset.length === 0) {
                throw new Error(`شما به پروژه ${task.projectId} دسترسی ندارید`);
            }
            
            await transaction.request()
                .input('date', sql.Date, date)
                .input('userId', sql.Int, personalId)
                .input('projectId', sql.Int, task.projectId)
                .input('duration', sql.Int, task.duration)
                .input('taskDescription', sql.NVarChar, task.description)
                .query(`
                    INSERT INTO DailyProjectTasks 
                    (Date, UserId, ProjectId, Duration, Description)
                    VALUES 
                    (@date, @userId, @projectId, @duration, @taskDescription)
                `);
        }
        
        await transaction.commit();
        
        res.json({
            success: true,
            message: 'گزارش روزانه با موفقیت ثبت شد'
        });
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error submitting daily report:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در ثبت گزارش روزانه',
            error: error.message
        });
    }
}

module.exports = {
    submitDailyReport
};
```

---

## 🔐 Authentication با استفاده از جدول users

```javascript
// controllers/authController.js
const { getConnection, sql } = require('../config/database');
const jwt = require('jsonwebtoken');

async function login(req, res) {
    try {
        const { username, password } = req.body;
        const pool = await getConnection();
        
        // جستجوی کاربر در جدول users
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT 
                    u.personalid,
                    u.farsifirstname,
                    u.farsilastname,
                    u.email,
                    u.id as username,
                    u.groupid,
                    u.directAdminid,
                    g.groupname,
                    gm.personalId as isManager
                FROM users u
                LEFT JOIN groups g ON u.groupid = g.id
                LEFT JOIN groupManagers gm ON u.personalid = gm.personalId
                WHERE u.id = @username AND u.IsActive = 1
            `);
        
        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'نام کاربری یا رمز عبور اشتباه است'
            });
        }
        
        const user = result.recordset[0];
        
        // TODO: بررسی رمز عبور (اگر در دیتابیس ذخیره شده باشد)
        // در صورتی که رمز عبور در جدول users نیست،
        // باید از یک سیستم احراز هویت دیگر استفاده کنید (مثل LDAP)
        
        // تعیین نقش کاربر
        let role = 'user';
        if (user.isManager) {
            role = 'group_manager';
        }
        
        // ایجاد توکن JWT
        const token = jwt.sign(
            {
                personalId: user.personalid,
                username: user.username,
                role: role,
                groupId: user.groupid
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            token: token,
            user: {
                personalId: user.personalid,
                fullName: `${user.farsifirstname} ${user.farsilastname}`,
                email: user.email,
                username: user.username,
                groupName: user.groupname,
                role: role
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در ورود به سیستم',
            error: error.message
        });
    }
}

module.exports = {
    login
};
```

---

## 🎯 نکات مهم

### ✅ دسترسی مستقیم
همه جدول‌ها در یک دیتابیس (`UMD`) هستند، پس خواندن خیلی ساده است.

### ✅ JOIN ها
می‌توانید راحت بین جدول‌های مختلف JOIN بزنید:
```sql
SELECT u.*, g.groupname, p.projectName
FROM users u
LEFT JOIN groups g ON u.groupid = g.id
LEFT JOIN UserProjectAccess upa ON u.personalid = upa.UserId
LEFT JOIN projects p ON upa.ProjectId = p.id
```

### ✅ Transaction ها
برای عملیات‌هایی که چند جدول را تغییر می‌دهند، حتماً از Transaction استفاده کنید.

### ⚠️ احراز هویت
جدول `users` در UMD ممکن است رمز عبور نداشته باشد. اگر ندارد، باید:
- از LDAP/Active Directory استفاده کنید
- یا یک جدول جداگانه برای رمز عبور ایجاد کنید
- یا از جدول `Admins` برای ورود استفاده کنید

---

**خلاصه:** برنامه شما فقط کافیه به دیتابیس `UMD` وصل بشه و مستقیماً از جدول‌ها بخونه! 🚀
