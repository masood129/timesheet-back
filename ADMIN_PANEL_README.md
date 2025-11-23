# Admin Panel - راهنمای استفاده

## معرفی

پنل ادمین به کاربران با نقش `admin` اجازه می‌دهد تا تمام جنبه‌های سیستم تایم‌شیت را مدیریت کنند.

## راه‌اندازی اولیه

### 1. ایجاد جدول AdminUsers

ابتدا اسکریپت SQL را اجرا کنید:

```bash
# در SQL Server Management Studio یا Azure Data Studio
# فایل create-admin-table.sql را اجرا کنید
```

### 2. افزودن کاربر ادمین

برای افزودن یک کاربر به عنوان ادمین:

```sql
INSERT INTO AdminUsers (UserId) VALUES (YOUR_USER_ID);
```

مثال:
```sql
-- اگر کاربر با UserId = 1 را می‌خواهید ادمین کنید
INSERT INTO AdminUsers (UserId) VALUES (1);
```

### 3. بررسی دسترسی

برای بررسی اینکه کاربر ادمین است یا خیر:

```sql
SELECT * FROM vw_UserRoles WHERE UserId = 1;
```

## Endpoints پنل ادمین

تمام endpointهای ادمین با `/admin` شروع می‌شوند و نیاز به:
1. توکن JWT معتبر دارند (Authorization header)
2. کاربر باید نقش `admin` داشته باشد

### مدیریت کاربران

```
GET    /admin/users                    - لیست تمام کاربران
GET    /admin/users/:id                - جزئیات یک کاربر
POST   /admin/users                    - ایجاد کاربر جدید
PUT    /admin/users/:id                - بروزرسانی کاربر
DELETE /admin/users/:id                - حذف کاربر
PUT    /admin/users/:id/role           - تغییر نقش کاربر
```

#### مثال: ایجاد کاربر جدید

```bash
curl -X POST http://localhost:3000/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "UserId": 123,
    "Username": "newuser",
    "Role": "user"
  }'
```

#### مثال: تغییر نقش کاربر

```bash
curl -X PUT http://localhost:3000/admin/users/123/role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Role": "group_manager"
  }'
```

### مدیریت پروژه‌ها

```
GET    /admin/projects                 - لیست تمام پروژه‌ها
GET    /admin/projects/:id             - جزئیات یک پروژه
POST   /admin/projects                 - ایجاد پروژه جدید
PUT    /admin/projects/:id             - بروزرسانی پروژه
DELETE /admin/projects/:id             - حذف پروژه
GET    /admin/projects/:id/users       - کاربران با دسترسی به پروژه
POST   /admin/projects/:id/users       - افزودن دسترسی کاربر
DELETE /admin/projects/:id/users/:userId - حذف دسترسی کاربر
```

#### مثال: افزودن دسترسی کاربر به پروژه

```bash
curl -X POST http://localhost:3000/admin/projects/10/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "UserId": 123
  }'
```

### مدیریت گروه‌ها

```
GET    /admin/groups                   - لیست تمام گروه‌ها
GET    /admin/groups/:id               - جزئیات یک گروه
POST   /admin/groups                   - ایجاد گروه جدید
PUT    /admin/groups/:id               - بروزرسانی گروه
DELETE /admin/groups/:id               - حذف گروه
GET    /admin/groups/:id/members       - اعضای گروه
POST   /admin/groups/:id/members       - افزودن کاربر به گروه
DELETE /admin/groups/:id/members/:userId - حذف کاربر از گروه
PUT    /admin/groups/:id/manager       - تعیین مدیر گروه
```

#### مثال: ایجاد گروه جدید

```bash
curl -X POST http://localhost:3000/admin/groups \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "GroupId": 5,
    "GroupName": "تیم توسعه",
    "ManagerId": 10
  }'
```

### گزارش‌ها و آمار

```
GET    /admin/reports/monthly          - تمام گزارش‌های ماهانه
GET    /admin/reports/daily            - جزئیات روزانه تمام کاربران
GET    /admin/reports/statistics       - آمار کلی سیستم
GET    /admin/reports/user/:userId/summary - خلاصه فعالیت کاربر
```

#### مثال: دریافت آمار سیستم

```bash
curl -X GET http://localhost:3000/admin/reports/statistics \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

پاسخ:
```json
{
  "totalUsers": 50,
  "totalProjects": 15,
  "totalGroups": 5,
  "pendingReports": 12,
  "approvedReports": 38,
  "usersByRole": [
    {"Role": "user", "count": 40},
    {"Role": "group_manager", "count": 5},
    {"Role": "general_manager", "count": 3},
    {"Role": "admin", "count": 2}
  ],
  "recentActivityCount": 450
}
```

### تنظیمات سیستم

```
GET    /admin/config/contract-hours    - لیست ساعات قراردادی
GET    /admin/config/contract-hours/:userId - ساعات قراردادی کاربر
PUT    /admin/config/contract-hours/:userId - بروزرسانی ساعات قراردادی
DELETE /admin/config/contract-hours/:userId - حذف ساعات قراردادی
GET    /admin/config/system            - تنظیمات سیستم
```

#### مثال: تنظیم ساعات قراردادی کاربر

```bash
curl -X PUT http://localhost:3000/admin/config/contract-hours/123 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ContractArrivalTime": "08:00:00",
    "ContractLeaveTime": "17:00:00",
    "MinMonthlyHours": 176
  }'
```

## استفاده از Swagger UI

تمام endpointهای ادمین در Swagger UI مستند شده‌اند:

1. به آدرس `http://localhost:3000/api-docs` بروید
2. ابتدا از endpoint `/auth/login` برای دریافت توکن استفاده کنید
3. روی دکمه "Authorize" کلیک کنید و توکن را وارد کنید
4. حالا می‌توانید تمام endpointهای ادمین را تست کنید

## نقش‌های موجود

- `user`: کاربر عادی
- `group_manager`: مدیر گروه
- `general_manager`: مدیر کل
- `finance_manager`: مدیر مالی
- `admin`: ادمین سیستم (دسترسی کامل)

## امنیت

### محدودیت دسترسی

- تمام endpointهای `/admin/*` فقط برای کاربران با نقش `admin` قابل دسترسی هستند
- سایر کاربران با خطای 403 (Forbidden) مواجه می‌شوند

### توصیه‌های امنیتی

1. **محدود کردن تعداد ادمین‌ها**: فقط به کاربران مورد اعتماد نقش ادمین بدهید
2. **Audit Logging**: تمام عملیات ادمین در console لاگ می‌شوند
3. **توکن‌های قوی**: از JWT_SECRET قوی استفاده کنید
4. **HTTPS**: در محیط production حتماً از HTTPS استفاده کنید

## عیب‌یابی

### خطای 401 (Unauthorized)
- بررسی کنید که توکن معتبر است
- بررسی کنید که توکن منقضی نشده باشد

### خطای 403 (Forbidden)
- بررسی کنید که کاربر در جدول AdminUsers وجود دارد
- بررسی کنید که نقش کاربر در توکن JWT به درستی تنظیم شده

### خطای 500 (Server Error)
- لاگ‌های سرور را بررسی کنید
- اتصال به دیتابیس را بررسی کنید

## مثال کامل: ایجاد یک پروژه و افزودن کاربران

```bash
# 1. ورود به سیستم با کاربر ادمین
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin"}' | jq -r '.token')

# 2. ایجاد پروژه جدید
curl -X POST http://localhost:3000/admin/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Id": 100,
    "ProjectName": "پروژه جدید",
    "securityLevel": 1
  }'

# 3. افزودن کاربر به پروژه
curl -X POST http://localhost:3000/admin/projects/100/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"UserId": 123}'

# 4. بررسی کاربران پروژه
curl -X GET http://localhost:3000/admin/projects/100/users \
  -H "Authorization: Bearer $TOKEN"
```

## پشتیبانی

برای سوالات یا مشکلات، لطفاً به مستندات Swagger مراجعه کنید یا با تیم توسعه تماس بگیرید.
