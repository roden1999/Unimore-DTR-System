const router = require("express").Router();
const { createDepartment, updateDepartment, listDepartments, departmentOptions, deleteDepartment } = require("../controllers/departmentController");

router.post("/", createDepartment);
router.put("/:id", updateDepartment);
router.post("/list", listDepartments);
router.get("/options", departmentOptions);
router.delete("/:id", deleteDepartment);

module.exports = router;
