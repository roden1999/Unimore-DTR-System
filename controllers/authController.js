const bcrypt = require("bcryptjs");
const { SignJWT, jwtVerify } = require("jose");
const userModel = require("../models/userModel");
const { loginValidation } = require("../utils/validation");

const getSecretKey = () => new TextEncoder().encode(process.env.SECRET_TOKEN);

const login = async (request, response) => {
    try {
        const { error } = loginValidation(request.body);
        if (error) return response.status(400).send(error.details[0].message);

        const user = await userModel.findByUsername(request.body.userName);
        if (!user) return response.status(400).json({ message: "Account does not exist" });
        if (!user.IsActive) return response.status(403).json({ message: "This account is inactive. Contact the administrator." });
        if (user.EmployeeIsDeleted && !user.IsSystemAccount)
            return response.status(403).json({ message: "This employee account is no longer active. Contact the administrator." });
        if (user.LockedUntil && new Date(user.LockedUntil) > new Date()) {
            return response.status(423).json({ message: "Account temporarily locked after repeated failed attempts. Try again later or contact the administrator." });
        }

        const validPassword = await bcrypt.compare(request.body.password, user.Password);
        if (!validPassword) {
            const attempt = await userModel.recordFailedLogin(user.Id);
            const remaining = Math.max(0, 5 - Number(attempt?.FailedLoginAttempts || 0));
            return response.status(400).json({
                message: remaining ? `Invalid password. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` : "Account locked for 15 minutes. Contact the administrator if you need a password reset.",
            });
        }

        await userModel.recordSuccessfulLogin(user.Id);
        const token = await new SignJWT({
            _id: user.Id,
            UserName: user.UserName,
            Name: user.Name,
            role: user.Role,
            tokenVersion: Number(user.TokenVersion || 0),
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("7d")
            .sign(getSecretKey());

        return response.status(200).json({
            token,
            user: {
                id: user.Id,
                Name: user.Name,
                userName: user.UserName,
                role: user.Role,
                employeeId: user.EmployeeId,
                employeeNo: user.EmployeeNo,
                image: user.EmployeeImage || "",
                mustChangePassword: Boolean(user.MustChangePassword),
                isSystemAccount: Boolean(user.IsSystemAccount),
            },
        });
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
};

const tokenIsValid = async (request, response) => {
    try {
        const token = request.header("auth-token");
        if (!token) return response.json(false);
        const { payload } = await jwtVerify(token, getSecretKey());
        const user = await userModel.findById(payload._id);
        if (!user || !user.IsActive || user.EmployeeIsDeleted && !user.IsSystemAccount) return response.json(false);
        return response.json(Number(payload.tokenVersion || 0) === Number(user.TokenVersion || 0));
    } catch (_error) {
        return response.json(false);
    }
};

module.exports = { login, tokenIsValid };
