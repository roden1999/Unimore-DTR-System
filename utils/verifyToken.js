const { jwtVerify } = require("jose");
const { SECRET_TOKEN } = require("../config");
const employee = require("../models/employees");

module.exports = async function (request, response, next) {
	const token = request.header("auth-token");
	if (!token) return response.status(401).json({ message: "Access Denied" });

	try {
		const { payload } = await jwtVerify(token, new TextEncoder().encode(SECRET_TOKEN));
		request.employee = payload;
		next();
	} catch (error) {
		response.status(400).json({ message: "Invalid Token" });
	}
};
