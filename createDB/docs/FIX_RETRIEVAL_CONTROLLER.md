# راهنمای ویرایش دستی `retrievalController.js`

## ⚠️ مهم: این فایل به ویرایش دستی نیاز دارد

فایل `controllers/dailyDetails/retrievalController.js` 1030 خط دارد و فقط 2 جای کوچک نیاز به تغییر دارند.

---

## تغییر 1️⃣: خط 589-593

**قبل:**
```javascript
                    SELECT 1
                    FROM UserGroup ug
                             INNER JOIN Groups g ON ug.GroupId = g.GroupId
                    WHERE ug.UserId = @userId
                      AND g.ManagerId = @managerId
```

**بعد:**
```javascript
                    SELECT 1
                    FROM users u
                    INNER JOIN groups g ON u.groupid = g.id
                    WHERE u.personalid = @userId
                      AND g.managerID = @managerId
                      AND u.IsActive = 1
```

---

## تغییر 2️⃣: خط 795-799

**قبل:**
```javascript
                    SELECT 1
                    FROM UserGroup ug
                             INNER JOIN Groups g ON ug.GroupId = g.GroupId
                    WHERE ug.UserId = @userId
                      AND g.ManagerId = @managerId
```

**بعد:**
```javascript
                    SELECT 1
                    FROM users u
                    INNER JOIN groups g ON u.groupid = g.id
                    WHERE u.personalid = @userId
                      AND g.managerID = @managerId
                      AND u.IsActive = 1
```

---

## چک‌لیست بعد از تغییرات:

- [ ] خط 589-593 ویرایش شد
- [ ] خط 795-799 ویرایش شد
- [ ] فایل ذخیره شد
- [ ] Search کردید که `UserGroup` دیگه وجود نداره: ✅ باید 0 نتیجه بده

---

**نکته:** این دو تغییر فقط برای authorization check عضویت در گروه هستند. باقی فایل نیاز به تغییر ندارد!
