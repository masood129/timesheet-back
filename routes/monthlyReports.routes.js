const express = require('express');
const router = express.Router();

const checkRole = require('../middlewares/checkRole');
const validateReportId = require('../middlewares/validateReportId');

const draftsCtl = require('../controllers/monthlyReports/drafts.controller');
const idsCtl = require('../controllers/monthlyReports/ids.controller');
const statusCtl = require('../controllers/monthlyReports/status.controller');
const gymCtl = require('../controllers/monthlyReports/gym.controller');
const createCtl = require('../controllers/monthlyReports/create.controller');
const approvalCtl = require('../controllers/monthlyReports/approval.controller');
const reportsCtl = require('../controllers/monthlyReports/reports.controller');

// drafts
router.get('/my-drafts', checkRole(['user','group_manager','general_manager','finance_manager']), draftsCtl.getMyDrafts);
router.delete('/exit-draft/:reportId', checkRole(['user','group_manager','general_manager','finance_manager']), validateReportId, draftsCtl.exitDraft);

// ids
router.get('/report-ids/jalali/:year/:month', checkRole(['user','group_manager','general_manager','finance_manager']), idsCtl.getReportIdsByJalali);

// status
router.get('/check-submitted/jalali/:year/:month', checkRole(['user','group_manager','general_manager','finance_manager']), statusCtl.checkSubmittedJalali);

// gym
router.post('/monthly-gym-costs', checkRole(['user','group_manager','general_manager','finance_manager']), gymCtl.saveMonthlyGymCost);
router.post('/monthly-gym-costs/jalali', checkRole(['user','group_manager','general_manager','finance_manager']), gymCtl.saveMonthlyGymCostJalali);

// create
router.post('/:year/:month', checkRole(['user','group_manager','general_manager']), createCtl.createGregorian);
router.post('/jalali/:year/:month', checkRole(['user','group_manager','general_manager','finance_manager']), createCtl.createJalali);

// submit / approve / reject
router.put('/:reportId/submit-to-group-manager', checkRole(['user','group_manager','general_manager','finance_manager']), validateReportId, approvalCtl.submitToGroupManager);
router.put('/:reportId/reject-to-draft', checkRole(['group_manager','general_manager','finance_manager']), validateReportId, approvalCtl.rejectToDraft);
router.put('/:reportId/approve-group-manager', checkRole(['group_manager']), validateReportId, approvalCtl.approveGroupManager);
router.put('/:reportId/approve-general-manager', checkRole(['general_manager']), validateReportId, approvalCtl.approveGeneralManager);
router.put('/:reportId/approve-finance', checkRole(['finance_manager']), validateReportId, approvalCtl.approveFinance);

// report retrievals
router.get('/:reportId', validateReportId, reportsCtl.getById);
router.get('/group/:year/:month', checkRole(['group_manager','general_manager','finance_manager']), reportsCtl.getGroup);
router.get('/jalali/group/:year/:month', checkRole(['group_manager','general_manager','finance_manager']), reportsCtl.getJalaliGroup);
router.get('/group/range/:startYear/:startMonth/:endYear/:endMonth', checkRole(['group_manager','general_manager','finance_manager']), reportsCtl.getGroupRange);

module.exports = router;
