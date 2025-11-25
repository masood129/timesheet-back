const { getDailyDetails } = require('./daily.controller');
const { getJalaliMonthlyDetails, getMonthlyDetails } = require('./monthly.controller');
const { getRangeDetails } = require('./range.controller');
const { getUserJalaliMonthlyDetails, exportUserJalaliMonthlyToExcel } = require('./user.controller');

module.exports = {
    getJalaliMonthlyDetails,
    getRangeDetails,
    getDailyDetails,
    getMonthlyDetails,
    getUserJalaliMonthlyDetails,
    exportUserJalaliMonthlyToExcel
};