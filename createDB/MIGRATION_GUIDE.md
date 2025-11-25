# ⚠️ تفاوت‌های مهم: کد فعلی vs جدول‌های واقعی UMD

## 🔴 مشکل اصلی

کد فعلی شما از **ساختار قدیمی** استفاده می‌کند که با جدول‌های واقعی UMD **سازگار نیست**!

---

## 📊 مقایسه ساختارها

### ❌ کد فعلی (نادرست برای UMD)

```javascript
// در userManagementController.js فعلی
SELECT u.UserId, u.Username, u.Role
FROM Users u                    // ❌ جدول Users وجود ندارد!
LEFT JOIN UserGroup ug ...      // ❌ جدول UserGroup وجود ندارد!
WHERE u.UserId = @userId        // ❌ فیلد UserId وجود ندارد!
```

### ✅ کد صحیح (برای UMD واقعی)

```javascript
// کد صحیح برای جدول‌های واقعی UMD
SELECT 
    u.personalid,              // ✅ کلید اصلی واقعی
    u.id as username,          // ✅ نام فیلد واقعی
    u.farsifirstname,
    u.farsilastname,
    u.email,
    u.groupid,
    g.groupname
FROM users u                   // ✅ جدول واقعی
LEFT JOIN groups g ON u.groupid = g.id
WHERE u.personalid = @personalId AND u.IsActive = 1
```

---

## 🗺️ نقشه تبدیل فیلدها

| کد فعلی (نادرست) | جدول‌های UMD واقعی | توضیح |
|------------------|-------------------|--------|
| `Users` | `users` | نام جدول |
| `UserId` | `personalid` | کلید اصلی |
| `Username` | `id` | نام کاربری |
| - | `farsifirstname` | نام فارسی |
| - | `farsilastname` | نام خانوادگی |
| `Role` | محاسبه شده از `groupManagers` | نقش کاربر |
| `UserGroup` | استفاده از `groupid` در `users` | گروه کاربر |
| `Groups.GroupId` | `groups.id` | کلید اصلی گروه |
| `Groups.GroupName` | `groups.groupname` | نام گروه |
| `Groups.ManagerId` | `groups.managerID` | مدیر گروه |
| `Projects.Id` | `projects.id` | کلید اصلی پروژه |
| `Projects.ProjectName` | `projects.projectName` | نام پروژه |

---

## 🔧 راه‌حل‌های پیشنهادی

### گزینه 1️⃣: ویرایش کدهای موجود (پیشنهاد می‌شود)

همه controller ها را ویرایش کنید و از ساختار جدید استفاده کنید.

**مثال قبل و بعد:**

```javascript
// ❌ قبل (کد فعلی نادرست)
const getAllUsers = async (req, res) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`
            SELECT u.UserId, u.Username, u.Role
            FROM Users u
            WHERE u.Role = 'user'
        `);
    res.json({ users: result.recordset });
};

// ✅ بعد (کد صحیح برای UMD)
const getAllUsers = async (req, res) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`
            SELECT 
                u.personalid,
                u.id as username,
                u.farsifirstname,
                u.farsilastname,
                u.email,
                u.groupid,
                g.groupname,
                CASE 
                    WHEN gm.personalId IS NOT NULL THEN 'group_manager'
                    ELSE 'user'
                END as role
            FROM users u
            LEFT JOIN groups g ON u.groupid = g.id
            LEFT JOIN groupManagers gm ON u.personalid = gm.personalId
            WHERE u.IsActive = 1
        `);
    res.json({ users: result.recordset });
};
```

### گزینه 2️⃣: ساخت VIEW برای سازگاری (پیچیده‌تر)

اگر نمی‌خواهید کدها را تغییر دهید، می‌توانید VIEW ایجاد کنید که ساختار قدیمی را شبیه‌سازی کند:

```sql
-- ایجاد VIEW با نام‌های قدیمی
CREATE VIEW Users_Compatible AS
SELECT 
    u.personalid AS UserId,
    u.id AS Username,
    u.email AS Email,
    CASE 
        WHEN gm.personalId IS NOT NULL THEN 'group_manager'
        ELSE 'user'
    END AS Role,
    u.IsActive
FROM users u
LEFT JOIN groupManagers gm ON u.personalid = gm.personalId
WHERE u.IsActive = 1;
```

⚠️ **اما این روش پیچیدگی بیشتری دارد و مشکلات INSERT/UPDATE/DELETE را حل نمی‌کند.**

---

## 📝 چک‌لیست تغییرات لازم

### فایل‌های نیازمند ویرایش:

- [ ] `controllers/admin/userManagementController.js`
- [ ] `controllers/admin/groupManagementController.js`
- [ ] `controllers/admin/projectManagementController.js`
- [ ] `controllers/dailyDetails/crudController.js`
- [ ] `controllers/monthlyReports/draftController.js`
- [ ] سایر controller ها که از جدول‌های `users`, `groups`, `projects` استفاده می‌کنند

### تغییرات کلیدی:

1. **نام جدول‌ها:**
   - `Users` → `users`
   - `Groups` → `groups`
   - `Projects` → `projects`
   - `UserGroup` → حذف (استفاده از `users.groupid`)

2. **نام فیلدها:**
   - `UserId` → `personalid`
   - `Username` → `id`
   - `GroupId` → `id` (در جدول groups)
   - `GroupName` → `groupname`
   - `ManagerId` → `managerID`
   - `ProjectName` → `projectName`

3. **محاسبه Role:**
   ```sql
   CASE 
       WHEN gm.personalId IS NOT NULL THEN 'group_manager'
       ELSE 'user'
   END as role
   ```

---

## 🎯 توصیه نهایی

**بهترین راه:** کدهای موجود را ویرایش کنید تا با ساختار واقعی UMD سازگار شوند.

این کار:
- ✅ ساده‌تر است
- ✅ منطبق با داده‌های واقعی است
- ✅ مشکلات CRUD را حل می‌کند
- ✅ نگهداری آسان‌تری دارد

---

**آیا می‌خواهید من کدهای شما را برای سازگاری با UMD ویرایش کنم؟** 🤔
