const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const controller = require('../controllers/uteslaController');

router.use(verifyToken, requirePermission('utesla.manage'));
router.get('/dashboard', controller.dashboard);
router.get('/settings', controller.settings);
router.put('/settings', controller.updateSettings);
router.get('/employee-options', controller.employeeOptions);
router.get('/members', controller.members);
router.post('/members', controller.createMember);
router.put('/members/:id', controller.updateMember);
router.get('/savings', controller.savings);
router.post('/savings', controller.postSavings);
router.get('/loans', controller.loans);
router.post('/loans', controller.createLoan);
router.get('/loans/:id', controller.loan);
router.post('/loans/:id/decision', controller.decideLoan);
router.post('/loans/:id/release', controller.releaseLoan);
router.post('/loans/:id/payments', controller.postPayment);
router.get('/dividends', controller.dividends);
router.post('/dividends/preview', controller.previewDividend);
router.post('/dividends', controller.postDividend);

module.exports = router;
