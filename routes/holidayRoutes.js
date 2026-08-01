const router = require("express").Router();
const verifyToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
router.use(verifyToken, requirePermission('hr.manage'));
const { createHoliday, updateHoliday, listHolidays, deleteHoliday } = require("../controllers/holidayController");

router.post("/", createHoliday);
router.put("/:id", updateHoliday);
router.get("/list", listHolidays);
router.delete("/:id", deleteHoliday);

module.exports = router;
