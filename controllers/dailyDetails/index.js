// Daily Controller
const { getDailyDetails } = require('./daily.controller');

// Monthly Controller
const { getJalaliMonthlyDetails, getMonthlyDetails } = require('./monthly.controller');

// Range Controller
const { getRangeDetails } = require('./range.controller');

// User Controller
const { getUserJalaliMonthlyDetails, exportUserJalaliMonthlyToExcel } = require('./user.controller');

// CRUD Controller
const { createOrUpdateDailyDetails } = require('./crudController');

module.exports = {
    // Retrieval operations
    getJalaliMonthlyDetails,
    getRangeDetails,
    getDailyDetails,
    getMonthlyDetails,
    getUserJalaliMonthlyDetails,
    exportUserJalaliMonthlyToExcel,
    
    // CRUD operations
    createOrUpdateDailyDetails
};
