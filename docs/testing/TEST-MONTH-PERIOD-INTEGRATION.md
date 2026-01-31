# 🧪 تست ادغام بازه ماهانه ادمین با ارسال گزارش کاربر

## 📝 توضیحات

این سند نحوه تست ادغام قابلیت **بازه ماهانه ادمین** با **ارسال گزارش ماهانه کاربر** را توضیح می‌دهد.

---

## 🎯 هدف

زمانی که کاربر یک ماه (مثلا بهمن) را ارسال می‌کند، سیستم باید بر اساس بازه‌ای که ادمین برای آن ماه تعریف کرده، ساعات و جزئیات را محاسبه کند.

---

## 🔧 تغییرات اعمال شده

### 1. تابع جدید: `getActualMonthRange`

فایل: `utils/dateConverter.js`

```javascript
async function getActualMonthRange(pool, jalaliYear, jalaliMonth)
```

این تابع:
- از `sp_GetMonthPeriod` استفاده می‌کند
- بازه سفارشی ادمین را چک می‌کند
- اگر بازه سفارشی وجود داشت، آن را برمی‌گرداند
- وگرنه بازه پیش‌فرض (اول تا آخر ماه) را برمی‌گرداند

### 2. کنترلرهای به‌روزرسانی شده

**الف) `monthlyReports/draftController.js`**
- `createMonthlyReportJalali`: هنگام ارسال گزارش ماهانه
- `getMyDrafts`: هنگام دریافت لیست پیش‌نویس‌ها

**ب) `monthlyReports/managerReportController.js`**
- `getReportById`: هنگام دریافت جزئیات یک گزارش

**ج) `dailyDetails/user.controller.js`**
- `getUserMonthlyTableData`: جدول ماهانه کاربر
- `exportUserMonthlyToExcel`: خروجی اکسل

**د) `dailyDetails/monthly.controller.js`**
- `getJalaliMonthlyDetails`: جزئیات روزانه ماهانه

---

## 🧪 مراحل تست

### مرحله 1️⃣: تنظیم بازه سفارشی توسط ادمین

**درخواست:** (از پنل ادمین یا Postman)

```http
POST /api/admin/month-periods
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "Year": 1404,
  "Month": 11,
  "StartDay": 25,
  "StartMonth": 10,
  "StartYear": 1404,
  "EndDay": 24,
  "EndMonth": 11,
  "EndYear": 1404,
  "CurrentJalaliYear": 1404,
  "CurrentJalaliMonth": 11
}
```

**معنی:** بازه ماه بهمن (11) از 25 دی (10) تا 24 بهمن (11) است.

### مرحله 2️⃣: ثبت ساعات کاری در بازه

کاربر باید چند روز ساعت کاری ثبت کند:

**مثال:** ثبت ساعت برای 26 دی 1404

```http
POST /api/daily-details
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "date": "2026-01-15",  // معادل میلادی 26 دی 1404
  "arrivalTime": "08:00:00",
  "leaveTime": "17:00:00",
  "leaveType": "work",
  "personalTime": 60
}
```

**مثال:** ثبت تسک

```http
POST /api/daily-project-tasks
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "date": "2026-01-15",
  "projectId": 1,
  "taskName": "توسعه قابلیت بازه ماهانه",
  "duration": 6,
  "description": "پیاده‌سازی ادغام بازه ادمین با ارسال کاربر"
}
```

### مرحله 3️⃣: ارسال گزارش ماهانه

```http
POST /api/monthly-reports/jalali/1404/11
Authorization: Bearer {user_token}
```

**انتظار:**
- سیستم بازه 25 دی تا 24 بهمن را در نظر می‌گیرد
- فقط ساعات و تسک‌های این بازه محاسبه می‌شوند

### مرحله 4️⃣: بررسی گزارش

```http
GET /api/monthly-reports/my-drafts
Authorization: Bearer {user_token}
```

یا

```http
POST /api/monthly-reports/report
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "reportId": {report_id}
}
```

**چک کنید:**
- `TotalHours`: باید فقط ساعات بازه 25 دی تا 24 بهمن باشد
- `totalCommuteCost`: فقط هزینه‌های این بازه
- `totalCarCost`: فقط هزینه‌های این بازه

### مرحله 5️⃣: بررسی جدول ماهانه

```http
GET /api/daily-details/user/{userId}/jalali/month/1404/11
Authorization: Bearer {token}
```

**انتظار:**
- جدول باید فقط روزهای 25 دی تا 24 بهمن را نشان دهد
- نه از 1 بهمن تا 30 بهمن

---

## ✅ معیارهای موفقیت

1. ✅ وقتی ادمین بازه سفارشی تعریف می‌کند، سیستم آن را ذخیره می‌کند
2. ✅ وقتی کاربر گزارش ماهانه ارسال می‌کند، از بازه سفارشی استفاده می‌شود
3. ✅ محاسبه ساعات کاری بر اساس بازه سفارشی است
4. ✅ محاسبه هزینه‌ها بر اساس بازه سفارشی است
5. ✅ جدول ماهانه فقط روزهای بازه سفارشی را نشان می‌دهد
6. ✅ اگر بازه سفارشی وجود نداشته باشد، از بازه پیش‌فرض استفاده می‌شود

---

## 🐛 نکات عیب‌یابی

### مشکل: ساعات اشتباه محاسبه می‌شود

**بررسی:**
1. آیا بازه سفارشی در `MonthPeriodSettings` ذخیره شده؟
```sql
SELECT * FROM MonthPeriodSettings WHERE Year = 1404 AND Month = 11
```

2. آیا `sp_GetMonthPeriod` بازه صحیح را برمی‌گرداند؟
```sql
EXEC sp_GetMonthPeriod @Year = 1404, @Month = 11
```

3. لاگ‌های backend را بررسی کنید:
```
console.log('Using period range:', monthRange)
```

### مشکل: بازه پیش‌فرض استفاده می‌شود

**بررسی:**
- آیا stored procedure به درستی اجرا شده؟
- آیا تابع `getActualMonthRange` به درستی فراخوانی می‌شود؟

---

## 📊 مثال خروجی

**بازه پیش‌فرض (بدون تنظیم ادمین):**
```json
{
  "Year": 1404,
  "Month": 11,
  "StartDay": 1,
  "StartMonth": 11,
  "StartYear": 1404,
  "EndDay": 30,
  "EndMonth": 11,
  "EndYear": 1404
}
```

**بازه سفارشی (با تنظیم ادمین):**
```json
{
  "Year": 1404,
  "Month": 11,
  "StartDay": 25,
  "StartMonth": 10,
  "StartYear": 1404,
  "EndDay": 24,
  "EndMonth": 11,
  "EndYear": 1404
}
```

---

## 🚀 نتیجه

با این تغییرات:
- ✅ ادمین می‌تواند بازه هر ماه را دلخواه تنظیم کند
- ✅ کاربر هنگام ارسال گزارش، بازه ادمین اعمال می‌شود
- ✅ تمام محاسبات بر اساس بازه سفارشی انجام می‌شود
- ✅ سازگاری کامل با سیستم موجود حفظ شده است

---

**تاریخ ایجاد:** 1404/09/10  
**نسخه:** 1.0  
**وضعیت:** ✅ آماده برای تست

