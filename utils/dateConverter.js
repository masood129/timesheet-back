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

module.exports = {
    jalaliToGregorian,
    gregorianToJalali,
    getJalaliMonthRange,
    formatJalaliDate
};