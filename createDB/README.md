# 📚 راهنمای نصب دیتابیس Timesheet

به بسته نصب دیتابیس سیستم Timesheet خوش آمدید.  
این پوشه تمام فایل‌های لازم برای راه‌اندازی دیتابیس را شامل می‌شود.

---

## ⚡ نصب سریع (2 دقیقه)

### 🎯 برای محیط واقعی (Production)

1. باز کردن **SQL Server Management Studio (SSMS)**
2. کلیک بر روی **File → Open → File**
3. انتخاب فایل: `production/SETUP-PRODUCTION.sql`
4. فشردن کلید **F5** برای اجرا
5. **تمام!** ✅

> **نکته:** این فایل 9 جدول اصلی سیستم را بدون هیچ داده تستی ایجاد می‌کند.

---

### 🧪 برای محیط تستی (Testing)

1. باز کردن **SSMS**
2. کلیک بر روی **File → Open → File**
3. انتخاب فایل: `testing/SETUP-TESTING.sql`
4. فشردن کلید **F5**
5. **تمام!** ✅

> **نکته:** این فایل جداول + داده‌های نمونه برای تست را ایجاد می‌کند.

---

## 📋 پیش‌نیازها

- ✅ SQL Server 2016 یا نسخه‌های بالاتر
- ✅ دیتابیس `UMD` باید از قبل ایجاد شده باشد
- ✅ دسترسی برای ساخت جدول، Index و Stored Procedure

---

## 📁 ساختار پوشه

```
createDB/
├── production/           محیط واقعی
│   └── SETUP-PRODUCTION.sql
│
├── testing/             محیط تستی
│   ├── SETUP-TESTING.sql
│   └── simple-*.sql    (داده‌های نمونه)
│
├── docs/               راهنماها و مستندات
│   ├── SETUP-GUIDE.md
│   ├── QUICK-START.md
│   └── database-overview.html
│
└── oldquery/           فایل‌های قدیمی (برای مرجع)
```

---

## 📖 راهنماهای تکمیلی

برای اطلاعات بیشتر به پوشه `docs/` مراجعه کنید:

- 📘 **QUICK-START.md** - راهنمای شروع سریع
- 📗 **SETUP-GUIDE.md** - راهنمای نصب کامل
- 📊 **database-overview.html** - نمای بصری دیتابیس (در مرورگر باز کنید)

---

## 🗄️ جداول ایجاد شده

پس از اجرا، 9 جدول زیر ایجاد می‌شوند:

1. **Admins** - مدیران سیستم
2. **UserContractHours** - ساعات قراردادی کاربران
3. **UserProjectAccess** - دسترسی به پروژه‌ها
4. **DailyDetails** - جزئیات حضور و غیاب روزانه
5. **DailyProjectTasks** - وظایف پروژه‌ای روزانه
6. **DailyPersonalCarCosts** - هزینه ماشین شخصی
7. **MonthlyGymCosts** - هزینه ورزش ماهیانه
8. **MonthlyReports** - گزارش‌های ماهیانه
9. **MonthPeriodSettings** - تنظیمات بازه زمانی

---

## ✅ بررسی موفقیت نصب

پس از اجرای فایل، برای بررسی موفقیت نصب:

```sql
-- لیست جداول ایجاد شده
SELECT name FROM sys.tables 
WHERE name IN (
    'Admins', 'UserContractHours', 'UserProjectAccess',
    'DailyDetails', 'DailyProjectTasks', 'DailyPersonalCarCosts',
    'MonthlyGymCosts', 'MonthlyReports', 'MonthPeriodSettings'
)
ORDER BY name;

-- باید 9 جدول نمایش داده شود
```

---

## ⚠️ نکات مهم

- ✅ همیشه قبل از تغییرات **Backup** از دیتابیس بگیرید
- ✅ در محیط Production از فایل `production/SETUP-PRODUCTION.sql` استفاده کنید
- ✅ در محیط Testing از فایل `testing/SETUP-TESTING.sql` استفاده کنید
- ✅ پوشه `oldquery/` فقط برای مرجع است و نیازی به اجرا ندارد

---

## 🆘 نیاز به کمک؟

اگر در فرآیند نصب با مشکل مواجه شدید:

1. 📖 فایل `docs/SETUP-GUIDE.md` را مطالعه کنید
2. 🌐 فایل `docs/database-overview.html` را در مرورگر باز کنید
3. 📧 با تیم پشتیبانی تماس بگیرید

---

**موفق باشید! 🎉**

*آخرین بروزرسانی: 1403/10/17*

