const router = require("express").Router();
const verifyToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
router.use(verifyToken, requirePermission('hr.manage'));
const { listShifts, createShift, updateShift, deleteShift } = require("../controllers/shiftController");

router.get("/list", listShifts);
router.post("/", createShift);
router.put("/:id", updateShift);
router.delete("/:id", deleteShift);

module.exports = router;
