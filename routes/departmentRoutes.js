const router = require("express").Router();
const verifyToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
router.use(verifyToken);
const { createDepartment, updateDepartment, listDepartments, departmentOptions, deleteDepartment } = require("../controllers/departmentController");

router.post("/", requirePermission('hr.manage'), createDepartment);
router.put("/:id", requirePermission('hr.manage'), updateDepartment);
router.post("/list", listDepartments);
router.get("/options", departmentOptions);
router.delete("/:id", requirePermission('hr.manage'), deleteDepartment);

module.exports = router;
