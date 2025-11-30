# خلاصه تغییرات Swagger

## کارهای انجام شده ✅

1. **ساختار مدولار ایجاد شد:**
   - پوشه `components/` برای schemas و security
   - پوشه `paths/` برای endpointهای مختلف
   - فایل‌های جداگانه برای هر ماژول

2. **فایل‌های ایجاد شده:**
   - `components/schemas.yaml` - تمام schema definitions
   - `components/security.yaml` - security schemes
   - `paths/auth.yaml` - Authentication endpoints
   - `paths/projects.yaml` - Project management
   - `paths/daily-details.yaml` - Daily details endpoints
   - `paths/monthly-reports.yaml` - Monthly reports endpoints
   - `paths/users.yaml` - User endpoints
   - `paths/test.yaml` - Test endpoints
   - `paths/admin/users.yaml` - Admin user management
   - `combine-swagger.js` - Script for combining files
   - `README.md` - Documentation

## کارهای باقی‌مانده 🔄

برای کامل شدن ساختار مدولار، نیاز به ایجاد فایل‌های زیر داریم:

1. **Admin Paths کامل:**
   - `paths/admin/projects.yaml`
   - `paths/admin/groups.yaml`
   - `paths/admin/reports.yaml`
   - `paths/admin/config.yaml`
   - `paths/admin/month-periods.yaml`
   - `paths/admin/logs.yaml`

2. **به‌روزرسانی package.json:**
   - اضافه کردن `js-yaml` به dependencies (اگر نیاز باشد)

3. **تست و اجرا:**
   - اجرای اسکریپت combine
   - تست swagger.json نهایی
   - بررسی همه endpointها

## نحوه تکمیل

### گزینه 1: استفاده از فایل موجود
می‌توانید از `swagger.json` موجود استفاده کنید و به مرور آن را به فایل‌های کوچکتر تقسیم کنید.

### گزینه 2: تکمیل ساختار مدولار
1. فایل‌های admin باقی‌مانده را ایجاد کنید
2. اسکریپت combine را اجرا کنید
3. فایل swagger.json جدید را تست کنید

### گزینه 3: به‌روزرسانی مستقیم
می‌توانید فایل `swagger.json` موجود را مستقیماً به‌روزرسانی کنید و endpointهای جدید را اضافه کنید.

## نکات

- تمام endpointهای موجود در route files بررسی شده‌اند
- ساختار برای آینده قابل توسعه است
- می‌توانید به مرور فایل‌های بیشتری اضافه کنید



