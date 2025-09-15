const express = require('express');
const router = express.Router();
const draftController = require('../controllers/monthlyReports/draftController');
const approvalController = require('../controllers/monthlyReports/approvalController');
const gymCostController = require('../controllers/monthlyReports/gymCostController');
const reportRetrievalController = require('../controllers/monthlyReports/reportRetrievalController');

router.get('/my-drafts', draftController.getMyDrafts);
router.delete('/exit-draft/:reportId', draftController.exitDraft);
router.post('/:year/:month', draftController.createMonthlyReportGregorian);
router.post('/jalali/:year/:month', draftController.createMonthlyReportJalali);

router.put('/:reportId/submit-to-group-manager', approvalController.submitToGroupManager);
router.put('/:reportId/approve-group-manager', approvalController.approveGroupManager);
router.put('/:reportId/approve-general-manager', approvalController.approveGeneralManager);
router.put('/:reportId/approve-finance', approvalController.approveFinance);
router.put('/:reportId/reject-to-draft', approvalController.rejectToDraft);

router.post('/monthly-gym-costs', gymCostController.saveMonthlyGymCost);
router.post('/monthly-gym-costs/jalali', gymCostController.saveMonthlyGymCostJalali);

router.get('/report-ids/jalali/:year/:month', reportRetrievalController.getReportIdsJalali);
router.get('/check-submitted/jalali/:year/:month', reportRetrievalController.checkSubmittedJalali);
router.get('/:reportId', reportRetrievalController.getReportById);
router.get('/group/:year/:month', reportRetrievalController.getGroupReportsGregorian);
router.get('/jalali/group/:year/:month', reportRetrievalController.getGroupReportsJalali);
router.get('/group/range/:startYear/:startMonth/:endYear/:endMonth', reportRetrievalController.getGroupRangeReports);

module.exports = router;