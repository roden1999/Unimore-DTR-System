const router = require("express").Router();
const verifyToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
router.use(verifyToken, requirePermission('hr.manage'));
const { assignOverride, listOverrides, deleteOverride } = require("../controllers/shiftOverrideController");

router.post("/assign", assignOverride);
router.post("/list", listOverrides);
router.delete("/:id", deleteOverride);

module.exports = router;
