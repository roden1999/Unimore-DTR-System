const router = require("express").Router();
const verifyToken = require("../middleware/auth");
const { requirePermission } = require("../middleware/permission");
const {
    createUser, updateUser, resetPassword, setAccountStatus, changeOwnPassword,
    listUsers, searchOptions, availableEmployees, dashboard,
} = require("../controllers/userController");

router.put("/me/password", verifyToken, changeOwnPassword);

router.use(verifyToken, requirePermission("users.manage"));
router.get("/dashboard", dashboard);
router.get("/available-employees", availableEmployees);
router.post("/list", listUsers);
router.get("/search-options", searchOptions);
router.post("/", createUser);
router.put("/:id", updateUser);
router.post("/:id/reset-password", resetPassword);
router.patch("/:id/status", setAccountStatus);

module.exports = router;
