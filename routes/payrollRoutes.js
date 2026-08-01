const router = require("express").Router();
const verifyToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
router.use(verifyToken, requirePermission('accounting.manage'));
const { payrollList } = require("../controllers/payrollController");

router.post("/payroll-list", payrollList);

module.exports = router;
