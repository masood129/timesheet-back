const jalaali = require('jalaali-js');

function jalaliToGregorian(jy, jm, jd) {
    return jalaali.toGregorian(jy, jm, jd);
}

function gregorianToJalali(gy, gm, gd) {
    return jalaali.toJalaali(gy, gm, gd);
}

function getJalaliMonthRange(jalaliYear, jalaliMonth) {
    // تبدیل به میلادی برای شروع و پایان ماه
    const startGregorian = jalaliToGregorian(jalaliYear, jalaliMonth, 1);
    const daysInMonth = jalaali.jalaaliMonthLength(jalaliYear, jalaliMonth);
    const endGregorian = jalaliToGregorian(jalaliYear, jalaliMonth, daysInMonth);

    return {
        start: new Date(startGregorian.gy, startGregorian.gm - 1, startGregorian.gd),
        end: new Date(endGregorian.gy, endGregorian.gm - 1, endGregorian.gd)
    };
}

// تابع کمکی برای تبدیل تاریخ میلادی به شمسی
function formatJalaliDate(gregorianDate) {
    if (!gregorianDate) return null;
    const date = new Date(gregorianDate);
    const jalali = gregorianToJalali(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    );
    return `${jalali.jy}/${jalali.jm}/${jalali.jd}`;
}

/**
 * دریافت بازه واقعی ماه بر اساس تنظیمات ادمین
 * این تابع از stored procedure استفاده می‌کند تا بازه سفارشی ادمین را در نظر بگیرد
 * @param {*} pool - SQL connection pool
 * @param {number} jalaliYear - سال شمسی
 * @param {number} jalaliMonth - ماه شمسی (1-12)
 * @returns {Promise<{start: Date, end: Date, periodInfo: object}>}
 */
async function getActualMonthRange(pool, jalaliYear, jalaliMonth) {
    const { sql } = require('../config/db.config');
    
    try {
        // دریافت بازه از stored procedure
        const result = await pool.request()
            .input('year', sql.Int, jalaliYear)
            .input('month', sql.Int, jalaliMonth)
            .execute('sp_GetMonthPeriod');
        
        if (result.recordset.length === 0) {
            // اگر بازه پیدا نشد، از بازه پیش‌فرض استفاده کن
            return {
                ...getJalaliMonthRange(jalaliYear, jalaliMonth),
                periodInfo: null
            };
        }
        
        const period = result.recordset[0];
        
        // تبدیل تاریخ شروع به میلادی
        const startGregorian = jalaliToGregorian(
            period.StartYear,
            period.StartMonth,
            period.StartDay
        );
        
        // تبدیل تاریخ پایان به میلادی
        const endGregorian = jalaliToGregorian(
            period.EndYear,
            period.EndMonth,
            period.EndDay
        );
        
        return {
            start: new Date(startGregorian.gy, startGregorian.gm - 1, startGregorian.gd),
            end: new Date(endGregorian.gy, endGregorian.gm - 1, endGregorian.gd),
            periodInfo: period
        };
    } catch (error) {
        console.error('Error in getActualMonthRange:', error);
        // در صورت خطا، از بازه پیش‌فرض استفاده کن
        return {
            ...getJalaliMonthRange(jalaliYear, jalaliMonth),
            periodInfo: null
        };
    }
}

/*
    1	فروردین	3	مارس (March)
    2	 4اردیبهشت	آوریل (April)
    3	خرداد	5	مه (May)
    4	تیر	    6	    ژوئن (June)
    5	مرداد	7	ژوئیه (July)
    6	شهریور	8	اوت (August)
    7	مهر	    9	سپتامبر (September)
    8	آبان	10	اکتبر (October)
    9	آذر	    11	نوامبر (November)
    10	دی	    12	دسامبر (December)
    11	بهمن	1	ژانویه (January)
    12	اسفند	2	فوریه (February)
*/

module.exports = {
    jalaliToGregorian,
    gregorianToJalali,
    getJalaliMonthRange,
    formatJalaliDate,
    getActualMonthRange
};