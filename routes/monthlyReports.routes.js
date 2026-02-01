const express = require('express');
const router = express.Router();
const monthlyReportsController = require('../controllers/monthlyReports');

// Draft routes
router.get('/my-drafts', monthlyReportsController.getMyDrafts);
router.delete('/exit-draft/:reportId', monthlyReportsController.exitDraft);
router.post('/:year/:month', monthlyReportsController.createMonthlyReportGregorian);
router.post('/jalali/:year/:month', monthlyReportsController.createMonthlyReportJalali);

// Approval routes
router.put('/:reportId/submit-to-group-manager', monthlyReportsController.submitToGroupManager);
router.put('/:reportId/approve-group-manager', monthlyReportsController.approveGroupManager);
router.put('/:reportId/approve-general-manager', monthlyReportsController.approveGeneralManager);
router.put('/:reportId/approve-finance', monthlyReportsController.approveFinance);
router.put('/:reportId/reject-to-draft', monthlyReportsController.rejectToDraft);
router.put('/monthly-reports/report', monthlyReportsController.managerGetReportById);

// Gym cost routes
router.post('/monthly-gym-costs', monthlyReportsController.saveMonthlyGymCost);
router.post('/jalali-monthly-gym-costs', monthlyReportsController.saveMonthlyGymCostJalali);

// Report retrieval routes
router.get('/report-ids/jalali/:year/:month', monthlyReportsController.getReportIdsJalali);
router.get('/check-submitted/jalali/:year/:month', monthlyReportsController.checkSubmittedJalali);
router.get('/:reportId', monthlyReportsController.getReportById);
router.get('/group/:year/:month', monthlyReportsController.getGroupReportsGregorian);
router.get('/jalali/group/:year/:month', monthlyReportsController.getGroupReportsJalali);
router.get('/group/range/:startYear/:startMonth/:endYear/:endMonth', monthlyReportsController.getGroupRangeReports);

module.exports = router;