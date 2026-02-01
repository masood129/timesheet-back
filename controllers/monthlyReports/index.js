// Draft Controller
const {
    getMyDrafts,
    exitDraft,
    createMonthlyReportGregorian,
    createMonthlyReportJalali
} = require('./draftController');

// Approval Controller
const {
    submitToGroupManager,
    approveGroupManager,
    approveGeneralManager,
    approveFinance,
    rejectToDraft
} = require('./approvalController');

// Gym Cost Controller
const {
    saveMonthlyGymCost,
    saveMonthlyGymCostJalali
} = require('./gymCostController');

// Report Retrieval Controller
const {
    getReportIdsJalali,
    checkSubmittedJalali,
    getReportById,
    getGroupReportsGregorian,
    getGroupReportsJalali,
    getGroupRangeReports
} = require('./reportRetrievalController');

// Manager Report Controller
const {
    getReportById: managerGetReportById
} = require('./managerReportController');

// Month Periods Controller
const {
    getYearMonthPeriods,
    getMonthPeriod
} = require('./monthPeriodsController');

module.exports = {
    // Draft
    getMyDrafts,
    exitDraft,
    createMonthlyReportGregorian,
    createMonthlyReportJalali,
    
    // Approval
    submitToGroupManager,
    approveGroupManager,
    approveGeneralManager,
    approveFinance,
    rejectToDraft,
    
    // Gym Cost
    saveMonthlyGymCost,
    saveMonthlyGymCostJalali,
    
    // Report Retrieval
    getReportIdsJalali,
    checkSubmittedJalali,
    getReportById,
    getGroupReportsGregorian,
    getGroupReportsJalali,
    getGroupRangeReports,
    
    // Manager Report
    managerGetReportById,
    
    // Month Periods
    getYearMonthPeriods,
    getMonthPeriod
};
