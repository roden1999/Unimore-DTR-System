const { jwtVerify } = require("jose");
const userModel = require("../models/userModel");

const getSecretKey = () => new TextEncoder().encode(process.env.SECRET_TOKEN);

const verifyToken = async (request, response, next) => {
    const token = request.header("auth-token");
    if (!token) return response.status(401).json({ message: "Access Denied: No token provided" });

    try {
        const { payload } = await jwtVerify(token, getSecretKey());
        request.user = payload;
        next();
    } catch (err) {
        response.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = verifyToken;
