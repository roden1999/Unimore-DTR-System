const router = require("express").Router();
const verifyToken = require("../middleware/auth");
const { createUser, updateUser, changePassword, listUsers, searchOptions, deleteUser } = require("../controllers/userController");

router.post("/", createUser);
router.put("/:id", updateUser);
router.put("/change-password/:id", changePassword);
router.post("/list", verifyToken, listUsers);
router.get("/search-options", verifyToken, searchOptions);
router.delete("/:id", deleteUser);

module.exports = router;
