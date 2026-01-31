# خلاصه تست سناریوهای مختلف

## 🎯 سناریوهای تست شده

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TEST SCENARIOS FOR CHECK SUBMIT                  │
└─────────────────────────────────────────────────────────────────────┘

📋 Endpoint: GET /monthly-reports/check-submitted/jalali/:year/:month
```

---

## ✅ سناریو ۱: جدول کاملاً خالی

```
Database:
┌──────────────────┐
│ MonthlyReports   │
│ (empty table)    │
└──────────────────┘

Request:
  GET /monthly-reports/check-submitted/jalali/1403/10
  UserId: 123

Query Result:
  recordset = []
  recordset.length = 0

Response:
  HTTP 200 OK
  { "status": null }

✅ هیچ ارور رخ نمی‌دهد
```

---

## ✅ سناریو ۲: رکورد برای کاربر دیگر موجود است

```
Database:
┌──────────────────────────────────────────────┐
│ MonthlyReports                               │
├─────────┬──────┬───────┬─────────────────────┤
│ UserId  │ Year │ Month │ Status              │
├─────────┼──────┼───────┼─────────────────────┤
│ 456     │ 1403 │ 10    │ draft               │
│ 789     │ 1403 │ 10    │ submitted_to_gm     │
└─────────┴──────┴───────┴─────────────────────┘

Request:
  GET /monthly-reports/check-submitted/jalali/1403/10
  UserId: 123  ← این کاربر در جدول نیست

Query Result:
  recordset = []  ← WHERE UserId = 123 فیلتر می‌کند
  recordset.length = 0

Response:
  HTTP 200 OK
  { "status": null }

✅ فقط رکوردهای خود کاربر را برمی‌گرداند
```

---

## ✅ سناریو ۳: رکورد برای ماه دیگر موجود است

```
Database:
┌──────────────────────────────────────────────┐
│ MonthlyReports                               │
├─────────┬──────┬───────┬─────────────────────┤
│ UserId  │ Year │ Month │ Status              │
├─────────┼──────┼───────┼─────────────────────┤
│ 123     │ 1403 │ 9     │ approved            │
│ 123     │ 1403 │ 11    │ draft               │
└─────────┴──────┴───────┴─────────────────────┘

Request:
  GET /monthly-reports/check-submitted/jalali/1403/10
  UserId: 123  ← ماه 10 درخواست شده

Query Result:
  recordset = []  ← WHERE JalaliMonth = 10 فیلتر می‌کند
  recordset.length = 0

Response:
  HTTP 200 OK
  { "status": null }

✅ فقط ماه درخواستی را بررسی می‌کند
```

---

## ✅ سناریو ۴: رکورد معتبر موجود است

```
Database:
┌──────────────────────────────────────────────┐
│ MonthlyReports                               │
├─────────┬──────┬───────┬─────────────────────┤
│ UserId  │ Year │ Month │ Status              │
├─────────┼──────┼───────┼─────────────────────┤
│ 123     │ 1403 │ 10    │ draft               │ ← این رکورد
└─────────┴──────┴───────┴─────────────────────┘

Request:
  GET /monthly-reports/check-submitted/jalali/1403/10
  UserId: 123

Query Result:
  recordset = [{ Status: 'draft' }]
  recordset.length = 1

Response:
  HTTP 200 OK
  { "status": "draft" }

✅ Status صحیح برگردانده می‌شود
```

---

## ✅ سناریو ۵: چند رکورد (نادر اما باید تست شود)

```
Database:
┌──────────────────────────────────────────────────────┐
│ MonthlyReports                                       │
├─────────┬──────┬───────┬─────────────────────────────┤
│ UserId  │ Year │ Month │ Status                      │
├─────────┼──────┼───────┼─────────────────────────────┤
│ 123     │ 1403 │ 10    │ draft                       │ ← این
│ 123     │ 1403 │ 10    │ submitted_to_group_manager  │
└─────────┴──────┴───────┴─────────────────────────────┘
                          (نباید اتفاق بیفتد، اما تست می‌کنیم)

Request:
  GET /monthly-reports/check-submitted/jalali/1403/10
  UserId: 123

Query Result:
  recordset = [{ Status: 'draft' }]  ← TOP 1 فقط اولین را برمی‌گرداند
  recordset.length = 1

Response:
  HTTP 200 OK
  { "status": "draft" }

✅ TOP 1 از برگشت چند رکورد جلوگیری می‌کند
```

---

## ❌ سناریو ۶: مشکلات احتمالی (رفع شده)

### ❌ مشکل ۱: req.user undefined
```
Before Fix:
  const userId = req.user.userId;
  → اگر req.user = undefined باشد
  → ارور: Cannot read property 'userId' of undefined

After Fix:
  if (!req.user || !req.user.userId) {
    return res.status(401).send('Unauthorized');
  }
  const userId = req.user.userId;
  ✅ ارور رفع شد
```

### ❌ مشکل ۲: userId به صورت String در JWT
```
Before Fix:
  req.user = {
    userId: "123",  ← String
    role: "user"
  };
  → در SQL Query ممکن است مشکل ایجاد کند

After Fix:
  const userId = typeof decoded.userId === 'string' 
    ? parseInt(decoded.userId, 10) 
    : decoded.userId;
  ✅ همیشه Integer است
```

---

## 📊 جدول خلاصه نتایج

| سناریو | Database State | recordset | status | HTTP | Response |
|--------|---------------|-----------|--------|------|----------|
| جدول خالی | `[]` | `[]` | `null` | 200 | `{"status":null}` |
| کاربر دیگر | `[{UserId:456}]` | `[]` | `null` | 200 | `{"status":null}` |
| ماه دیگر | `[{Month:9}]` | `[]` | `null` | 200 | `{"status":null}` |
| رکورد معتبر | `[{UserId:123,Month:10}]` | `[{Status:'draft'}]` | `'draft'` | 200 | `{"status":"draft"}` |
| چند رکورد | `[{...},{...}]` | `[{Status:'draft'}]` | `'draft'` | 200 | `{"status":"draft"}` |
| خطای DB | - | - | - | 500 | `Server error: ...` |
| Token نامعتبر | - | - | - | 401 | `Unauthorized` |

---

## 🧪 چگونه تست کنیم؟

### 1. تست SQL
```bash
# در SQL Server Management Studio
USE UMD;
GO

-- اجرای اسکریپت تست
-- فایل: createDB/testing/test-empty-table-scenarios.sql
```

### 2. تست API با cURL
```bash
# تست با جدول خالی یا عدم وجود رکورد
curl -X GET "http://localhost:3000/monthly-reports/check-submitted/jalali/1403/10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -v

# باید 200 OK با {"status":null} برگرداند
```

### 3. بررسی لاگ‌ها
```bash
# لاگ‌های Console باید شامل این باشند:
checkSubmittedJalali: Query params { userId: 123, jalaliYear: 1403, jalaliMonth: 10 }
checkSubmittedJalali: Query result { status: null, recordCount: 0 }
```

---

## ✅ نتیجه‌گیری

```
╔══════════════════════════════════════════════════════════════╗
║  Endpoint با جدول خالی یا عدم وجود رکورد                    ║
║  هیچ ارور نمی‌دهد و به درستی کار می‌کند                     ║
╚══════════════════════════════════════════════════════════════╝

✅ تمام سناریوها تست شده‌اند
✅ کد به درستی آرایه خالی را مدیریت می‌کند
✅ Response JSON همیشه معتبر است
✅ HTTP Status Codes صحیح هستند
✅ لاگ‌های مفید برای Debug وجود دارند
```

---

## 📚 فایل‌های مرتبط

1. [EMPTY-TABLE-BEHAVIOR.md](../database/EMPTY-TABLE-BEHAVIOR.md) - توضیحات کامل رفتار با جدول خالی
2. **test-empty-table-scenarios.sql** - اسکریپت تست SQL (createDB/testing/)
3. [FIX-CHECK-SUBMIT-SUMMARY.md](../fixes/FIX-CHECK-SUBMIT-SUMMARY.md) - خلاصه تمام تغییرات
4. [TEST-CHECK-SUBMIT-ENDPOINT.md](./TEST-CHECK-SUBMIT-ENDPOINT.md) - راهنمای تست و Debug

---

تاریخ: ۲۹ ژانویه ۲۰۲۶ (۹ بهمن ۱۴۰۴)
