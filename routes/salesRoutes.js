const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const controller = require('../controllers/salesController');

router.use(verifyToken);

router.get('/production/orders', requirePermission('production.manage'), controller.productionOrders);
router.get('/production/batches', requirePermission('production.manage'), controller.productionBatches);
router.get('/production/settings', requirePermission('production.manage'), controller.productionSettings);
router.patch('/production/orders/:id', requirePermission('production.manage'), controller.updateProduction);
router.get('/dispatch/ready', requirePermission('dispatch.manage'), controller.readyForDispatch);
router.post('/dispatch/ready/:id', requirePermission('dispatch.manage'), controller.createDispatch);

router.get('/dashboard', requirePermission('sales.manage'), controller.dashboard);
router.get('/settings', requirePermission('sales.manage'), controller.settings);
router.put('/settings', requirePermission('sales.manage'), controller.saveSettings);
router.get('/:kind(customers|products)', requirePermission('sales.manage'), controller.listSimple);
router.post('/:kind(customers|products)', requirePermission('sales.manage'), controller.createSimple);
router.put('/:kind(customers|products)/:id', requirePermission('sales.manage'), controller.updateSimple);
router.delete('/:kind(customers|products)/:id', requirePermission('sales.manage'), controller.removeSimple);
router.get('/inquiries/list', requirePermission('sales.manage'), controller.listInquiries);
router.post('/inquiries', requirePermission('sales.manage'), controller.createInquiry);
router.put('/inquiries/:id', requirePermission('sales.manage'), controller.updateInquiry);
router.delete('/inquiries/:id', requirePermission('sales.manage'), controller.removeInquiry);
router.post('/inquiries/:id/convert', requirePermission('sales.manage'), controller.convertInquiry);
router.get('/orders/list', requirePermission('sales.manage'), controller.listOrders);
router.post('/orders', requirePermission('sales.manage'), controller.createOrder);
router.put('/orders/:id', requirePermission('sales.manage'), controller.updateOrder);
router.delete('/orders/:id', requirePermission('sales.manage'), controller.removeOrder);

module.exports = router;
