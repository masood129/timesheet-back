const {DateTime} = require('luxon');

function isValidDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        return false;
    }
    const trimmedDate = dateString.trim();
    let dt = DateTime.fromFormat(trimmedDate, 'yyyy-MM-dd', {zone: 'Asia/Tehran'});
    if (dt.isValid) {
        return true;
    }
    dt = DateTime.fromISO(trimmedDate, {zone: 'Asia/Tehran'});
    return dt.isValid;
}

function parseDate(dateString) {
    if (!isValidDate(dateString)) return null;
    const trimmedDate = dateString.trim();
    let dt;
    dt = DateTime.fromFormat(trimmedDate, 'yyyy-MM-dd', {zone: 'Asia/Tehran'});
    if (dt.isValid) {
        return dt.toJSDate();
    }
    dt = DateTime.fromISO(trimmedDate, {zone: 'Asia/Tehran'});
    if (dt.isValid) {
        return dt.toJSDate();
    }
    return null;
}

module.exports = { isValidDate, parseDate };