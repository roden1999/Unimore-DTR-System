const { jwtVerify } = require("jose");
const userModel = require("../models/userModel");

const getSecretKey = () => new TextEncoder().encode(process.env.SECRET_TOKEN);

const verifyToken = async (request, response, next) => {
    const token = request.header("auth-token");
    if (!token) return response.status(401).json({ message: "Access Denied: No token provided" });

    try {
        const { payload } = await jwtVerify(token, getSecretKey());
        const user = await userModel.findById(payload._id);
        const revoked = Number(payload.tokenVersion || 0) !== Number(user?.TokenVersion || 0);
        if (!user || !user.IsActive || revoked || user.EmployeeIsDeleted && !user.IsSystemAccount)
            return response.status(401).json({ message: "Your session is no longer valid. Please sign in again." });
        request.user = { ...payload, role: user.Role, Name: user.Name, UserName: user.UserName };
        return next();
    } catch (_error) {
        return response.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = verifyToken;
