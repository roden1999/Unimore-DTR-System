const router = require("express").Router();
const { createEmployee, updateEmployee, listEmployees, totalEmployees, employeeOptions, employeeOptionsByDepartment, deleteEmployee } = require("../controllers/employeeController");

router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.post("/list", listEmployees);
router.post("/total-employees", totalEmployees);
router.get("/options", employeeOptions);
router.post("/employee-options", employeeOptionsByDepartment);
router.delete("/:id", deleteEmployee);

module.exports = router;
