# ⚡ شروع سریع - Quick Start

## 🎯 محیط واقعی (Production) - فقط 1 دستور!

### روش 1: SQL Server Management Studio
```
1. باز کردن: createDB/production/SETUP-PRODUCTION.sql
2. فشردن F5
3. تمام! ✅
```

### روش 2: Command Line
```powershell
cd createDB\production
sqlcmd -S localhost -d UMD -i SETUP-PRODUCTION.sql
```

**همین!** تمام 9 جدول ساخته می‌شود! 🎉

---

## 🧪 محیط تستی (Testing) - فقط 1 دستور!

### روش 1: SSMS
```
1. باز کردن: createDB/testing/SETUP-TESTING.sql
2. فشردن F5
3. تمام! ✅
```

### روش 2: Command Line
```powershell
cd createDB\testing
sqlcmd -S localhost -d UMD -i SETUP-TESTING.sql
```

**همین!** جداول + داده‌های تستی آماده! 🎉

---

## ✅ بررسی

```sql
-- چک کردن جداول
SELECT name FROM sys.tables WHERE name LIKE '%[A-Z]%' ORDER BY name;

-- چک کردن داده‌ها (testing)
SELECT COUNT(*) FROM DailyDetails;
```

---

## 🆘 مشکل داری؟

پوشه `docs/` و فایل `SETUP-GUIDE.md` را ببین!

---

**این همه! راحت شد نه؟** 😊
