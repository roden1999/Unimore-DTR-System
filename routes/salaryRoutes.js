const router = require("express").Router();
const { upsertSalary, updateSalary, listSalaries, salaryOptions, deleteSalary } = require("../controllers/salaryController");

router.post("/", upsertSalary);
router.put("/:id", updateSalary);
router.post("/list", listSalaries);
router.get("/options", salaryOptions);
router.delete("/:id", deleteSalary);

module.exports = router;
