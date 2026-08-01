const router=require('express').Router();const verifyToken=require('../middleware/auth');const{requirePermission}=require('../middleware/permission');const c=require('../controllers/dispatchController');
router.use(verifyToken,requirePermission('dispatch.manage'));
router.get('/dashboard',c.dashboard);router.get('/options/released-batches',c.batches);
router.get('/vehicles',c.listVehicles);router.post('/vehicles',c.createVehicle);router.put('/vehicles/:id',c.updateVehicle);router.delete('/vehicles/:id',c.removeVehicle);
router.get('/orders',c.listOrders);router.post('/orders',c.createOrder);router.put('/orders/:id',c.updateOrder);router.delete('/orders/:id',c.removeOrder);
module.exports=router;
