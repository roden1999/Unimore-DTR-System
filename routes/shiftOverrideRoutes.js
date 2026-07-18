const router = require("express").Router();
const { assignOverride, listOverrides, deleteOverride } = require("../controllers/shiftOverrideController");

router.post("/assign", assignOverride);
router.post("/list", listOverrides);
router.delete("/:id", deleteOverride);

module.exports = router;
