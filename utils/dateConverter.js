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
    formatJalaliDate
};