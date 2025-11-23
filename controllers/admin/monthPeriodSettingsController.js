const { sql, poolPromise } = require('../../config/db.config');

/**
 * Helper function: تبدیل تاریخ میلادی به شمسی (ساده)
 * برای دریافت ماه و سال جاری شمسی
 */
const getCurrentJalaliYearMonth = () => {
    const now = new Date();
    // این یک تقریب ساده است - برای استفاده واقعی از کتابخانه jalaali استفاده کنید
    // فعلاً فرض می‌کنیم کاربر سال و ماه جاری را در body ارسال می‌کند
    // یا از یک endpoint جداگانه دریافت می‌شود
    return {
        year: 1404, // مقدار پیش‌فرض - باید از کلاینت دریافت شود
        month: 8    // مقدار پیش‌فرض - باید از کلاینت دریافت شود
    };
};

/**
 * Get all month periods for a specific year
 * GET /api/admin/month-periods/:year
 */
const getAllMonthPeriods = async (req, res) => {
    const { year } = req.params;

    if (!year || year < 1300 || year > 1500) {
        return res.status(400).send('سال نامعتبر است');
    }

    try {
        const pool = await poolPromise;
        
        // دریافت تمام ماه‌های سال (از جمله بازه‌های پیش‌فرض)
        const result = await pool
            .request()
            .input('year', sql.Int, parseInt(year))
            .execute('sp_GetYearMonthPeriods');

        res.json(result.recordset);
    } catch (err) {
        console.error('Error in getAllMonthPeriods:', err.message);
        res.status(500).send('خطای سرور در دریافت بازه‌های ماه');
    }
};

/**
 * Get month period for a specific year and month
 * GET /api/admin/month-periods/:year/:month
 */
const getMonthPeriod = async (req, res) => {
    const { year, month } = req.params;

    if (!year || !month) {
        return res.status(400).send('سال و ماه الزامی است');
    }

    if (month < 1 || month > 12) {
        return res.status(400).send('ماه باید بین 1 تا 12 باشد');
    }

    try {
        const pool = await poolPromise;
        
        const result = await pool
            .request()
            .input('year', sql.Int, parseInt(year))
            .input('month', sql.Int, parseInt(month))
            .execute('sp_GetMonthPeriod');

        if (result.recordset.length === 0) {
            return res.status(404).send('بازه ماه یافت نشد');
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error in getMonthPeriod:', err.message);
        res.status(500).send('خطای سرور در دریافت بازه ماه');
    }
};

/**
 * Create a new month period
 * POST /api/admin/month-periods
 * Body: { Year, Month, StartDay, StartMonth, EndDay, EndMonth, CurrentJalaliYear, CurrentJalaliMonth }
 */
const createMonthPeriod = async (req, res) => {
    const { 
        Year, 
        Month, 
        StartDay, 
        StartMonth, 
        EndDay, 
        EndMonth,
        CurrentJalaliYear,
        CurrentJalaliMonth 
    } = req.body;

    // Validation
    if (!Year || !Month || !StartDay || !StartMonth || !EndDay || !EndMonth) {
        return res.status(400).send('تمام فیلدها الزامی است');
    }

    if (Month < 1 || Month > 12 || StartMonth < 1 || StartMonth > 12 || EndMonth < 1 || EndMonth > 12) {
        return res.status(400).send('ماه باید بین 1 تا 12 باشد');
    }

    if (StartDay < 1 || EndDay < 1) {
        return res.status(400).send('روز باید بزرگتر از 0 باشد');
    }

    try {
        const pool = await poolPromise;

        // بررسی اینکه ماه برای ویرایش مجاز است (فقط ماه جاری و آینده)
        const editableCheck = await pool
            .request()
            .input('year', sql.Int, Year)
            .input('month', sql.Int, Month)
            .input('currentYear', sql.Int, CurrentJalaliYear || 1404)
            .input('currentMonth', sql.Int, CurrentJalaliMonth || 1)
            .query(`
                SELECT dbo.fn_IsMonthEditable(@year, @month, @currentYear, @currentMonth) as IsEditable
            `);

        if (!editableCheck.recordset[0].IsEditable) {
            return res.status(400).send('فقط می‌توانید ماه جاری و ماه‌های آینده را تنظیم کنید');
        }

        // بررسی اینکه آیا قبلاً تنظیمی وجود دارد
        const existCheck = await pool
            .request()
            .input('year', sql.Int, Year)
            .input('month', sql.Int, Month)
            .query('SELECT COUNT(*) as count FROM MonthPeriodSettings WHERE Year = @year AND Month = @month');

        if (existCheck.recordset[0].count > 0) {
            return res.status(400).send('بازه این ماه قبلاً تنظیم شده است. از PUT برای ویرایش استفاده کنید');
        }

        // بررسی صحت بازه (StartDate <= EndDate)
        // تبدیل به روز از اول سال برای مقایسه
        const startDayOfYear = (StartMonth - 1) * 31 + StartDay;  // تقریبی
        const endDayOfYear = (EndMonth - 1) * 31 + EndDay;        // تقریبی
        
        if (startDayOfYear > endDayOfYear) {
            return res.status(400).send('تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد');
        }

        // ایجاد بازه جدید
        await pool
            .request()
            .input('year', sql.Int, Year)
            .input('month', sql.Int, Month)
            .input('startDay', sql.Int, StartDay)
            .input('startMonth', sql.Int, StartMonth)
            .input('endDay', sql.Int, EndDay)
            .input('endMonth', sql.Int, EndMonth)
            .query(`
                INSERT INTO MonthPeriodSettings (Year, Month, StartDay, StartMonth, EndDay, EndMonth)
                VALUES (@year, @month, @startDay, @startMonth, @endDay, @endMonth)
            `);

        res.status(201).json({
            Year,
            Month,
            StartDay,
            StartMonth,
            EndDay,
            EndMonth,
            message: 'بازه ماه با موفقیت ایجاد شد'
        });
    } catch (err) {
        console.error('Error in createMonthPeriod:', err.message);
        
        if (err.number === 2627) { // Unique constraint violation
            return res.status(400).send('بازه این ماه قبلاً تنظیم شده است');
        }
        
        res.status(500).send('خطای سرور در ایجاد بازه ماه');
    }
};

/**
 * Update an existing month period
 * PUT /api/admin/month-periods/:year/:month
 * Body: { StartDay, StartMonth, EndDay, EndMonth, CurrentJalaliYear, CurrentJalaliMonth }
 */
const updateMonthPeriod = async (req, res) => {
    const { year, month } = req.params;
    const { 
        StartDay, 
        StartMonth, 
        EndDay, 
        EndMonth,
        CurrentJalaliYear,
        CurrentJalaliMonth 
    } = req.body;

    if (!StartDay || !StartMonth || !EndDay || !EndMonth) {
        return res.status(400).send('تمام فیلدها الزامی است');
    }

    if (StartMonth < 1 || StartMonth > 12 || EndMonth < 1 || EndMonth > 12) {
        return res.status(400).send('ماه باید بین 1 تا 12 باشد');
    }

    try {
        const pool = await poolPromise;

        // بررسی اینکه ماه برای ویرایش مجاز است
        const editableCheck = await pool
            .request()
            .input('year', sql.Int, parseInt(year))
            .input('month', sql.Int, parseInt(month))
            .input('currentYear', sql.Int, CurrentJalaliYear || 1404)
            .input('currentMonth', sql.Int, CurrentJalaliMonth || 1)
            .query(`
                SELECT dbo.fn_IsMonthEditable(@year, @month, @currentYear, @currentMonth) as IsEditable
            `);

        if (!editableCheck.recordset[0].IsEditable) {
            return res.status(400).send('فقط می‌توانید ماه جاری و ماه‌های آینده را ویرایش کنید');
        }

        // بررسی وجود رکورد
        const existCheck = await pool
            .request()
            .input('year', sql.Int, parseInt(year))
            .input('month', sql.Int, parseInt(month))
            .query('SELECT COUNT(*) as count FROM MonthPeriodSettings WHERE Year = @year AND Month = @month');

        if (existCheck.recordset[0].count === 0) {
            return res.status(404).send('بازه این ماه یافت نشد. از POST برای ایجاد استفاده کنید');
        }

        // بررسی صحت بازه
        const startDayOfYear = (StartMonth - 1) * 31 + StartDay;
        const endDayOfYear = (EndMonth - 1) * 31 + EndDay;
        
        if (startDayOfYear > endDayOfYear) {
            return res.status(400).send('تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد');
        }

        // ویرایش رکورد
        await pool
            .request()
            .input('year', sql.Int, parseInt(year))
            .input('month', sql.Int, parseInt(month))
            .input('startDay', sql.Int, StartDay)
            .input('startMonth', sql.Int, StartMonth)
            .input('endDay', sql.Int, EndDay)
            .input('endMonth', sql.Int, EndMonth)
            .query(`
                UPDATE MonthPeriodSettings
                SET StartDay = @startDay,
                    StartMonth = @startMonth,
                    EndDay = @endDay,
                    EndMonth = @endMonth
                WHERE Year = @year AND Month = @month
            `);

        res.json({
            Year: parseInt(year),
            Month: parseInt(month),
            StartDay,
            StartMonth,
            EndDay,
            EndMonth,
            message: 'بازه ماه با موفقیت بروزرسانی شد'
        });
    } catch (err) {
        console.error('Error in updateMonthPeriod:', err.message);
        res.status(500).send('خطای سرور در بروزرسانی بازه ماه');
    }
};

/**
 * Delete a month period (revert to default)
 * DELETE /api/admin/month-periods/:year/:month
 */
const deleteMonthPeriod = async (req, res) => {
    const { year, month } = req.params;
    const { CurrentJalaliYear, CurrentJalaliMonth } = req.body;

    try {
        const pool = await poolPromise;

        // بررسی اینکه ماه برای ویرایش مجاز است
        const editableCheck = await pool
            .request()
            .input('year', sql.Int, parseInt(year))
            .input('month', sql.Int, parseInt(month))
            .input('currentYear', sql.Int, CurrentJalaliYear || 1404)
            .input('currentMonth', sql.Int, CurrentJalaliMonth || 1)
            .query(`
                SELECT dbo.fn_IsMonthEditable(@year, @month, @currentYear, @currentMonth) as IsEditable
            `);

        if (!editableCheck.recordset[0].IsEditable) {
            return res.status(400).send('فقط می‌توانید ماه جاری و ماه‌های آینده را حذف کنید');
        }

        const result = await pool
            .request()
            .input('year', sql.Int, parseInt(year))
            .input('month', sql.Int, parseInt(month))
            .query('DELETE FROM MonthPeriodSettings WHERE Year = @year AND Month = @month');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send('بازه این ماه یافت نشد');
        }

        res.json({ message: 'بازه ماه حذف شد و به حالت پیش‌فرض بازگشت' });
    } catch (err) {
        console.error('Error in deleteMonthPeriod:', err.message);
        res.status(500).send('خطای سرور در حذف بازه ماه');
    }
};

module.exports = {
    getAllMonthPeriods,
    getMonthPeriod,
    createMonthPeriod,
    updateMonthPeriod,
    deleteMonthPeriod
};
