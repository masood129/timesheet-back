# Swagger Documentation Structure

این پروژه از یک ساختار مدولار برای مستندات Swagger استفاده می‌کند که فایل‌ها را به بخش‌های کوچکتر و قابل مدیریت تقسیم می‌کند.

## ساختار پوشه‌ها

```
swagger/
├── components/           # کامپوننت‌های مشترک
│   ├── schemas.yaml     # Schema definitions
│   └── security.yaml    # Security schemes
├── paths/               # API endpoints
│   ├── admin/          # Admin endpoints
│   │   └── users.yaml
│   ├── auth.yaml       # Authentication
│   ├── projects.yaml   # Projects
│   ├── daily-details.yaml
│   ├── monthly-reports.yaml
│   ├── users.yaml
│   └── test.yaml
├── combine-swagger.js   # Script to combine YAML files
├── swagger.json         # Combined output (generated)
└── README.md           # This file
```

## نحوه استفاده

### برای ترکیب فایل‌های YAML:

```bash
node swagger/combine-swagger.js
```

این اسکریپت تمام فایل‌های YAML را خوانده و یک فایل `swagger.json` واحد ایجاد می‌کند.

### برای به‌روزرسانی فایل swagger.json:

1. فایل‌های YAML را ویرایش کنید
2. اسکریپت ترکیب را اجرا کنید
3. سرور را restart کنید

## افزودن endpoint جدید

1. فایل YAML مربوطه را در `paths/` پیدا کنید
2. endpoint جدید را اضافه کنید
3. اگر schema جدید نیاز دارید، به `components/schemas.yaml` اضافه کنید
4. اسکریپت ترکیب را اجرا کنید

## نکات مهم

- تمام فایل‌های YAML باید از ساختار OpenAPI 3.0.3 پیروی کنند
- برای استفاده از schema، از `$ref: '#/components/schemas/SchemaName'` استفاده کنید
- برای security، از `bearerAuth: []` استفاده کنید



