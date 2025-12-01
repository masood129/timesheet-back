# مستندات کامل Swagger API

## 📋 خلاصه

این پروژه از ساختار مدولار برای مستندات Swagger API استفاده می‌کند که نگهداری و توسعه آن را آسان می‌کند.

## ✅ وضعیت: **کامل و به‌روز**

تاریخ آخرین به‌روزرسانی: دسامبر 2025

## 📊 آمار مستندات

- **تعداد کل Endpoints:** 67
- **تعداد Tags:** 16
- **تعداد Schemas:** 19

### تقسیم‌بندی Endpoints:

#### 🔐 Authentication & Access (5 endpoints)
- **Auth** - احراز هویت کاربران
- **User Project Access** - مدیریت دسترسی به پروژه‌ها (2 endpoints)
- **Month Periods** - اطلاعات دوره‌های ماهانه (2 endpoints)

#### 📁 Core Features (36 endpoints)
- **Projects** - مدیریت پروژه‌ها (5 endpoints)
- **Daily Details** - جزئیات روزانه (4 endpoints)
- **Monthly Reports** - گزارش‌های ماهانه (11 endpoints)
- **Users** - مدیریت کاربران (به‌زودی)

#### 👨‍💼 Admin Panel (31 endpoints)
- **Admin - Users** - مدیریت کاربران (6 endpoints)
- **Admin - Projects** - مدیریت پروژه‌ها (8 endpoints)
- **Admin - Groups** - مدیریت گروه‌ها (8 endpoints)
- **Admin - Reports** - گزارش‌ها و آمار (10 endpoints)
- **Admin - Config** - تنظیمات سیستم (4 endpoints)
- **Admin - Month Periods** - تنظیمات دوره‌های ماهانه (4 endpoints)
- **Admin - Logs** - مدیریت لاگ‌ها (4 endpoints)
- **Admin - Dashboard Settings** - تنظیمات داشبورد (3 endpoints)

#### 🧪 Testing (1 endpoint)
- **Test** - endpoint تست تبدیل تاریخ جلالی

## 📂 ساختار فایل‌ها

```
swagger/
├── components/
│   ├── schemas.yaml          # تعاریف Schema (19 schema)
│   └── security.yaml         # تنظیمات امنیتی (JWT Bearer)
├── paths/
│   ├── admin/               # Admin endpoints
│   │   ├── users.yaml       # مدیریت کاربران
│   │   ├── projects.yaml    # مدیریت پروژه‌ها
│   │   ├── groups.yaml      # مدیریت گروه‌ها
│   │   ├── reports.yaml     # گزارش‌ها و آمار
│   │   ├── config.yaml      # تنظیمات سیستم
│   │   ├── month-periods.yaml # تنظیمات دوره‌های ماهانه
│   │   ├── logs.yaml        # مدیریت لاگ‌ها
│   │   └── dashboard-settings.yaml # تنظیمات داشبورد
│   ├── auth.yaml            # احراز هویت
│   ├── projects.yaml        # پروژه‌ها
│   ├── daily-details.yaml   # جزئیات روزانه
│   ├── monthly-reports.yaml # گزارش‌های ماهانه
│   ├── month-periods.yaml   # دوره‌های ماهانه
│   ├── user-project-access.yaml # دسترسی به پروژه‌ها
│   ├── users.yaml          # کاربران
│   └── test.yaml           # تست
├── combine-swagger.js       # اسکریپت ترکیب فایل‌ها
├── swagger.json            # خروجی نهایی (تولید خودکار)
├── README.md              # راهنمای اولیه
├── SUMMARY.md            # خلاصه تغییرات قبلی
└── COMPLETE_DOCUMENTATION.md # این فایل

```

## 🔧 نحوه استفاده

### 1. مشاهده مستندات

```bash
# اجرای سرور
npm start

# دسترسی به Swagger UI
http://localhost:3000/api-docs
```

### 2. به‌روزرسانی مستندات

```bash
# بعد از تغییر هر فایل YAML، اجرا کنید:
node swagger/combine-swagger.js
```

### 3. افزودن Endpoint جدید

1. فایل YAML مربوطه را در `paths/` یا `paths/admin/` ویرایش کنید
2. در صورت نیاز، Schema جدید را به `components/schemas.yaml` اضافه کنید
3. اسکریپت `combine-swagger.js` را اجرا کنید
4. سرور را مجدداً راه‌اندازی کنید

## 📝 Schemas موجود

### Core Schemas
1. **Project** - اطلاعات پروژه
2. **ProjectInput** - ورودی ایجاد پروژه
3. **DailyDetail** - جزئیات روزانه
4. **DailyProjectTask** - وظایف پروژه
5. **DailyPersonalCarCost** - هزینه‌های خودروی شخصی
6. **MonthlyReport** - گزارش ماهانه
7. **User** - اطلاعات کاربر
8. **Group** - اطلاعات گروه
9. **MonthPeriod** - دوره ماهانه

### Admin Schemas
10. **ContractHours** - ساعات قراردادی
11. **SystemConfig** - تنظیمات سیستم
12. **SystemStatistics** - آمار سیستم
13. **UserActivitySummary** - خلاصه فعالیت کاربر
14. **LogEntry** - ورودی لاگ
15. **DashboardSettings** - تنظیمات داشبورد

### Utility Schemas
16. **ProjectAccessStatus** - وضعیت دسترسی به پروژه
17. **Error** - پیام خطا

## 🔐 امنیت

تمام endpointها (به جز `/auth/login`) نیاز به JWT Token دارند:

```javascript
// Header
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🏷️ Tags

1. **Auth** - احراز هویت
2. **Projects** - پروژه‌ها
3. **DailyDetails** - جزئیات روزانه
4. **MonthlyReports** - گزارش‌های ماهانه
5. **Users** - کاربران
6. **Month Periods** - دوره‌های ماهانه
7. **User Project Access** - دسترسی به پروژه‌ها
8. **Admin - Users** - مدیریت کاربران
9. **Admin - Projects** - مدیریت پروژه‌ها
10. **Admin - Groups** - مدیریت گروه‌ها
11. **Admin - Reports** - گزارش‌ها و آمار
12. **Admin - Config** - تنظیمات سیستم
13. **Admin - Month Periods** - تنظیمات دوره‌های ماهانه
14. **Admin - Logs** - مدیریت لاگ‌ها
15. **Admin - Dashboard Settings** - تنظیمات داشبورد
16. **Test** - تست

## 📌 نکات مهم

### 1. تبدیل تاریخ
سیستم از تقویم جلالی و میلادی پشتیبانی می‌کند:
- Endpointهای با `/jalali/` از تاریخ شمسی استفاده می‌کنند
- سایر endpointها از تاریخ میلادی استفاده می‌کنند

### 2. Pagination
بیشتر endpointهای لیستی از pagination پشتیبانی می‌کنند:
```
?page=1&limit=50
```

### 3. فیلترینگ و جستجو
Endpointهای admin از query parameters برای فیلتر پشتیبانی می‌کنند:
```
?search=keyword&role=user
```

### 4. نقش‌های کاربری
- `user` - کاربر عادی
- `group_manager` - مدیر گروه
- `general_manager` - مدیر کل
- `finance_manager` - مدیر مالی
- `admin` - مدیر سیستم

## 🔄 Workflow گزارش‌های ماهانه

1. **draft** - پیش‌نویس (کاربر)
2. **submitted_to_group_manager** - ارسال به مدیر گروه
3. **submitted_to_general_manager** - ارسال به مدیر کل
4. **submitted_to_finance** - ارسال به مالی
5. **approved** - تایید نهایی

## 🚀 توسعه آینده

- [ ] افزودن WebSocket endpoints
- [ ] افزودن File Upload endpoints
- [ ] افزودن Notification endpoints
- [ ] بهبود Schema Validation
- [ ] افزودن Examples به Swagger UI

## 📞 پشتیبانی

برای گزارش مشکلات یا پیشنهادات، لطفاً یک Issue ایجاد کنید.

---

**وضعیت:** ✅ کامل و آماده استفاده  
**نسخه:** 1.0.0  
**آخرین به‌روزرسانی:** دسامبر 2025

