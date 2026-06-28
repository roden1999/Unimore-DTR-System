const router = require("express").Router();
const { login, tokenIsValid } = require("../controllers/authController");

router.post("/", login);
router.post("/tokenIsValid", tokenIsValid);

module.exports = router;
