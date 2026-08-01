const router = require("express").Router();
const verifyToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
router.use(verifyToken);
const { createEmployee, updateEmployee, listEmployees, totalEmployees, employeeOptions, employeeOptionsByDepartment, deleteEmployee, dashboard } = require("../controllers/employeeController");

router.post("/", requirePermission('hr.manage'), createEmployee);
router.put("/:id", requirePermission('hr.manage'), updateEmployee);
router.post("/list", requirePermission('hr.manage'), listEmployees);
router.post("/total-employees", requirePermission('employees.lookup'), totalEmployees);
router.get("/options", requirePermission('employees.lookup'), employeeOptions);
router.post("/employee-options", requirePermission('employees.lookup'), employeeOptionsByDepartment);
router.get("/dashboard", requirePermission('hr.manage'), dashboard);
router.delete("/:id", requirePermission('hr.manage'), deleteEmployee);

module.exports = router;
