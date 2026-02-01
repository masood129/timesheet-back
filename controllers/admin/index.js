// User Management
const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserRole
} = require('./userManagementController');

// Project Management
const {
    getAllProjects: adminGetAllProjects,
    getProjectById: adminGetProjectById,
    createProject: adminCreateProject,
    updateProject: adminUpdateProject,
    deleteProject: adminDeleteProject,
    getProjectUsers,
    addUserToProject,
    removeUserFromProject
} = require('./projectManagementController');

// Group Management
const {
    getAllGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupMembers,
    addUserToGroup,
    removeUserFromGroup,
    setGroupManager
} = require('./groupManagementController');

// Report Management
const {
    getAllMonthlyReports,
    getAllDailyDetails,
    getSystemStatistics,
    getUserActivitySummary,
    updateReportStatus,
    approveReport,
    rejectReport,
    getReportById: adminGetReportById,
    deleteReport
} = require('./reportManagementController');

// System Configuration
const {
    getAllContractHours,
    getUserContractHours,
    updateUserContractHours,
    deleteUserContractHours,
    getSystemConfig
} = require('./systemConfigController');

// Month Period Settings
const {
    getAllMonthPeriods: adminGetAllMonthPeriods,
    getMonthPeriod: adminGetMonthPeriod,
    createMonthPeriod,
    updateMonthPeriod,
    deleteMonthPeriod
} = require('./monthPeriodSettingsController');

// Logs Management
const {
    getLogCategories,
    getLogsByCategory,
    searchLogs,
    downloadLog
} = require('./logs.controller');

// Dashboard Settings
const {
    getDashboardSettings,
    saveDashboardSettings,
    resetDashboardSettings
} = require('./dashboardSettingsController');

module.exports = {
    // User Management
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserRole,
    
    // Project Management
    adminGetAllProjects,
    adminGetProjectById,
    adminCreateProject,
    adminUpdateProject,
    adminDeleteProject,
    getProjectUsers,
    addUserToProject,
    removeUserFromProject,
    
    // Group Management
    getAllGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupMembers,
    addUserToGroup,
    removeUserFromGroup,
    setGroupManager,
    
    // Report Management
    getAllMonthlyReports,
    getAllDailyDetails,
    getSystemStatistics,
    getUserActivitySummary,
    updateReportStatus,
    approveReport,
    rejectReport,
    adminGetReportById,
    deleteReport,
    
    // System Configuration
    getAllContractHours,
    getUserContractHours,
    updateUserContractHours,
    deleteUserContractHours,
    getSystemConfig,
    
    // Month Period Settings
    adminGetAllMonthPeriods,
    adminGetMonthPeriod,
    createMonthPeriod,
    updateMonthPeriod,
    deleteMonthPeriod,
    
    // Logs Management
    getLogCategories,
    getLogsByCategory,
    searchLogs,
    downloadLog,
    
    // Dashboard Settings
    getDashboardSettings,
    saveDashboardSettings,
    resetDashboardSettings
};
