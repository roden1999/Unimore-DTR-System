const router = require("express").Router();
const { loginValidation } = require("../utils/validation");
const userModel = require("../models/user");
const bcrypt = require("bcryptjs");
const { SignJWT, jwtVerify } = require("jose");
require("dotenv/config");

// helper function to convert secret key
const getSecretKey = () => new TextEncoder().encode(process.env.SECRET_TOKEN);

// Login Route
router.post("/", async (request, response) => {
	try {
		const { error } = loginValidation(request.body);
		if (error) return response.status(400).send(error.details[0].message);

		const user = await userModel.findOne({ UserName: request.body.userName });
		if (!user)
			return response.status(400).json({ message: "Account does not exist" });

		const validPassword = await bcrypt.compare(
			request.body.password,
			user.Password
		);
		if (!validPassword)
			return response.status(400).json({ message: "Invalid Password" });

		// Create JWT token (Node 25 compatible)
		const token = await new SignJWT({
			_id: user._id,
			UserName: user.UserName,
			Name: user.Name,
			role: user.role
		})
			.setProtectedHeader({ alg: "HS256" })
			.setExpirationTime("7d")
			.sign(getSecretKey());

		response.status(200).json({
			token,
			user: {
				Name: user.Name,
				userName: user.UserName,
				role: user.Role,
			},
		});
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

// Token validation route
router.post("/tokenIsValid", async (request, response) => {
	try {
		const token = request.header("auth-token");
		if (!token) return response.json(false);

		const { payload } = await jwtVerify(token, getSecretKey());
		if (!payload) return response.json(false);

		const user = await userModel.findById(payload._id);
		if (!user) return response.json(false);

		return response.json(true);
	} catch (err) {
		// Token invalid or expired
		return response.json(false);
	}
});

module.exports = router;
