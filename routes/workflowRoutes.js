const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { requirePermission, requireResourcePermission } = require('../middleware/permission');
const controller = require('../controllers/workflowController');

router.use(verifyToken);
router.get('/notifications', controller.notifications);
router.put('/notifications/:id/read', controller.readNotification);
router.get('/dashboard', requirePermission('management.view'), controller.dashboard);
router.get('/audit', requirePermission('audit.view'), controller.audit);
router.get('/approvals', requirePermission('approvals.review'), controller.approvals);
router.put('/approvals/:id/decision', requirePermission('approvals.review'), controller.decide);
router.get('/:resource', requireResourcePermission, controller.list);
router.post('/:resource', requireResourcePermission, controller.create);
router.put('/:resource/:id', requireResourcePermission, controller.update);
router.delete('/:resource/:id', requireResourcePermission, controller.remove);

module.exports = router;
