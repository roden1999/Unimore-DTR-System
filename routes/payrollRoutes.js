const router = require("express").Router();
const { payrollList } = require("../controllers/payrollController");

router.post("/payroll-list", payrollList);

module.exports = router;
