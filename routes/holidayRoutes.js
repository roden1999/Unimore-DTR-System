const router = require("express").Router();
const { createHoliday, updateHoliday, listHolidays, deleteHoliday } = require("../controllers/holidayController");

router.post("/", createHoliday);
router.put("/:id", updateHoliday);
router.get("/list", listHolidays);
router.delete("/:id", deleteHoliday);

module.exports = router;
