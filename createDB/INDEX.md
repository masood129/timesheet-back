# 📂 فهرست کامل فایل‌های createDB

## 🎯 شروع سریع

### برای محیط واقعی (Production):
```
📄 production/SETUP-PRODUCTION.sql  ← فقط همین یک فایل!
```

### برای محیط تستی (Testing):
```
📄 testing/SETUP-TESTING.sql  ← فقط همین یک فایل!
```

### راهنماها:
```
📖 QUICK-START.md     ← شروع سریع (2 دقیقه)
📖 SETUP-GUIDE.md     ← راهنمای کامل
```

---

## 📁 ساختار کامل پوشه

```
createDB/
│
├── 🎯 QUICK-START.md              ← شروع سریع
├── 📖 SETUP-GUIDE.md              ← راهنمای کامل
│
├── production/                     ✅ محیط واقعی
│   └── SETUP-PRODUCTION.sql       ← فایل اصلی (همه جداول)
│
├── testing/                        🧪 محیط تستی
│   ├── SETUP-TESTING.sql          ← فایل اصلی (جداول + داده)
│   ├── simple-data.sql            ← داده‌های تستی
│   ├── simple-contracts.sql       ← قراردادها
│   ├── simple-access.sql          ← دسترسی‌ها
│   ├── simple-daily.sql           ← جزئیات روزانه
│   ├── simple-monthly.sql         ← گزارش ماهیانه
│   └── simple-costs.sql           ← هزینه‌ها
│
├── archive/                        📦 فایل‌های قدیمی
│   ├── 00-drop-all-tables.sql
│   ├── 01-create-umd-base-tables.sql
│   ├── 02-create-app-tables.sql
│   ├── 03-insert-umd-test-data.sql
│   ├── 04-insert-app-test-data.sql
│   ├── 05-add-role-to-users.sql
│   ├── 06-add-startyear-endyear-to-monthperiods.sql
│   ├── 07-rebuild-monthperiod-stored-procedures.sql
│   ├── 08-test-monthperiod-procedures.sql
│   ├── 09-fix-monthperiod-calculation.sql
│   ├── 10-add-period-validation-and-auto-adjust.sql
│   ├── 11-create-dashboard-settings-table.sql
│   ├── 12-add-isactive-to-projects.sql
│   ├── 13-insert-advanced-test-data.sql
│   ├── 14-insert-complex-scenarios.sql
│   └── 15-sample-queries.sql
│
├── docs/                           📚 مستندات
│   ├── database-overview.html     ← نمای تعاملی دیتابیس
│   ├── EOSDB-SAMPLES-README.md    ← توضیحات نمونه‌ها
│   ├── EOSDB-SAMPLES-SUMMARY.sql  ← خلاصه نمونه‌ها
│   ├── SIMPLE-FILES-GUIDE.md      ← راهنمای فایل‌های ساده
│   ├── MIGRATION_GUIDE.md
│   ├── MIGRATION_SUMMARY.md
│   ├── USAGE_GUIDE.md
│   └── README.md
│
└── oldquery/                       🗄️ کوئری‌های قدیمی
    └── (فایل‌های query قدیمی)
```

---

## 🎯 کدام فایل را استفاده کنم؟

### ❓ می‌خواهم در محیط واقعی استفاده کنم
➡️ `production/SETUP-PRODUCTION.sql`

### ❓ می‌خواهم تست کنم
➡️ `testing/SETUP-TESTING.sql`

### ❓ می‌خواهم داده‌های تستی اضافه کنم
➡️ فایل‌های `testing/simple-*.sql`

### ❓ می‌خواهم دیتابیس را ببینم
➡️ باز کردن `docs/database-overview.html` در مرورگر

### ❓ می‌خواهم راهنما بخوانم
➡️ شروع با `QUICK-START.md`، سپس `SETUP-GUIDE.md`

---

## 📊 مقایسه: قبل و بعد

### ❌ قبل:
- 15 فایل SQL مختلف
- باید به ترتیب اجرا شوند
- گیج کننده و طولانی

### ✅ حالا:
- **1 فایل** برای Production
- **1 فایل** برای Testing
- ساده و سریع!

---

##  🚀 شروع کنید!

### گام 1: تصمیم بگیرید
```
محیط واقعی؟  → production/SETUP-PRODUCTION.sql
محیط تستی؟   → testing/SETUP-TESTING.sql
```

### گام 2: اجرا کنید
```powershell
# Production
cd production
sqlcmd -S localhost -d UMD -i SETUP-PRODUCTION.sql

# یا Testing
cd testing
sqlcmd -S localhost -d UMD -i SETUP-TESTING.sql
```

### گام 3: لذت ببرید! 🎉

---

## 🆘 نیاز به کمک؟

1. 📖 `QUICK-START.md` - برای شروع سریع
2. 📚 `SETUP-GUIDE.md` - برای راهنمای کامل
3. 🌐 `docs/database-overview.html` - برای نمای بصری
4. 📧 تماس با تیم پشتیبانی

---

## 📝 نکات مهم

✅ همیشه قبل از تغییرات Backup بگیرید  
✅ در Production از داده‌های تستی استفاده نکنید  
✅ فایل‌های archive فقط برای مرجع هستند  
✅ همه فایل‌های لازم در production/ و testing/ هستند  

---

**ساخته شده با ❤️ برای راحتی شما**

آخرین بروزرسانی: 1403/09/22
