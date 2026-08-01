const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const userModel = require("../models/userModel");

const ASSIGNABLE_ROLES = [
    "Employee", "Management", "HR", "HR Staff", "Maintenance", "Device Manager",
    "Production", "Accounting", "IT", "QA", "Dispatch", "Sales",
];

const makeTemporaryPassword = (length = 14) => {
    const groups = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%&*"];
    const all = groups.join("");
    const chars = groups.map(group => group[crypto.randomInt(group.length)]);
    while (chars.length < length) chars.push(all[crypto.randomInt(all.length)]);
    for (let i = chars.length - 1; i > 0; i -= 1) {
        const j = crypto.randomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join("");
};

const validatePassword = password => {
    if (typeof password !== "string" || password.length < 10)
        return "Password must contain at least 10 characters.";
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password))
        return "Password must include uppercase, lowercase, number, and special characters.";
    return null;
};

const validateAccountInput = body => {
    if (!Number.isInteger(Number(body.employeeId))) return "Select an employee.";
    if (!/^[A-Za-z0-9._-]{3,50}$/.test(String(body.userName || "")))
        return "Username must be 3-50 characters and use only letters, numbers, dots, underscores, or hyphens.";
    if (!ASSIGNABLE_ROLES.includes(body.role)) return "Select a valid account role.";
    return null;
};

const apiError = (response, error) => {
    if ([2601, 2627].includes(error.number)) return response.status(409).json({ message: "The username or employee already has an account." });
    return response.status(error.status || 500).json({ message: error.message || "Unable to process the account request." });
};

const shapeUser = u => ({
    _id: u.Id, UserName: u.UserName, Name: u.Name, Role: u.Role,
    EmployeeId: u.EmployeeId, EmployeeNo: u.EmployeeNo, EmployeeImage: u.EmployeeImage,
    Department: u.Department, MustChangePassword: Boolean(u.MustChangePassword),
    IsActive: Boolean(u.IsActive), IsSystemAccount: Boolean(u.IsSystemAccount),
    LastLoginAt: u.LastLoginAt, PasswordResetAt: u.PasswordResetAt,
    PasswordChangedAt: u.PasswordChangedAt, FailedLoginAttempts: u.FailedLoginAttempts || 0,
    LockedUntil: u.LockedUntil,
});

const createUser = async (request, response) => {
    try {
        const validationError = validateAccountInput(request.body);
        if (validationError) return response.status(400).json({ message: validationError });

        const employeeId = Number(request.body.employeeId);
        const [employee, employeeAccount, usernameAccount] = await Promise.all([
            userModel.getEmployee(employeeId),
            userModel.findByEmployeeId(employeeId),
            userModel.findByUsername(request.body.userName.trim()),
        ]);
        if (!employee || employee.IsDeleted) return response.status(404).json({ message: "The selected active employee was not found." });
        if (employeeAccount) return response.status(409).json({ message: "This employee already has an account." });
        if (usernameAccount) return response.status(409).json({ message: "Username already exists." });

        const temporaryPassword = makeTemporaryPassword();
        const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
        const user = await userModel.create({
            employeeId,
            userName: request.body.userName.trim(),
            role: request.body.role,
            hashedPassword,
        });
        if (!user) return response.status(400).json({ message: "Unable to create an account for the selected employee." });

        return response.status(201).json({
            message: "Employee account created. Copy the temporary password now; it will not be shown again.",
            user: { id: user.Id, userName: user.UserName, name: user.Name },
            temporaryPassword,
        });
    } catch (error) {
        return apiError(response, error);
    }
};

const updateUser = async (request, response) => {
    try {
        const id = Number(request.params.id);
        const current = await userModel.findById(id);
        if (!current) return response.status(404).json({ message: "Account not found." });
        if (current.IsSystemAccount) return response.status(403).json({ message: "The superadmin system account cannot be edited here." });

        const validationError = validateAccountInput(request.body);
        if (validationError) return response.status(400).json({ message: validationError });
        const employeeId = Number(request.body.employeeId);
        const [employeeAccount, usernameAccount] = await Promise.all([
            userModel.findByEmployeeId(employeeId), userModel.findByUsername(request.body.userName.trim()),
        ]);
        if (employeeAccount && employeeAccount.Id !== id) return response.status(409).json({ message: "This employee already has an account." });
        if (usernameAccount && usernameAccount.Id !== id) return response.status(409).json({ message: "Username already exists." });

        const updated = await userModel.update(id, { employeeId, userName: request.body.userName.trim(), role: request.body.role });
        if (!updated) return response.status(400).json({ message: "Select an active employee before saving." });
        return response.json({ message: "Account updated.", user: updated.Name });
    } catch (error) {
        return apiError(response, error);
    }
};

const resetPassword = async (request, response) => {
    try {
        const id = Number(request.params.id);
        const current = await userModel.findById(id);
        if (!current) return response.status(404).json({ message: "Account not found." });
        if (current.IsSystemAccount) return response.status(403).json({ message: "The superadmin password cannot be reset from employee account administration." });
        if (!current.IsActive) return response.status(400).json({ message: "Reactivate the account before resetting its password." });

        const temporaryPassword = makeTemporaryPassword();
        const updated = await userModel.resetPassword(id, await bcrypt.hash(temporaryPassword, 12));
        if (!updated) return response.status(400).json({ message: "Password reset was not completed." });
        return response.json({
            message: "Password reset. Existing sessions were revoked and the employee must change this temporary password.",
            user: { id: updated.Id, userName: updated.UserName, name: updated.Name },
            temporaryPassword,
        });
    } catch (error) {
        return apiError(response, error);
    }
};

const setAccountStatus = async (request, response) => {
    try {
        const id = Number(request.params.id);
        const isActive = request.body.isActive === true;
        if (Number(request.user._id) === id && !isActive)
            return response.status(400).json({ message: "You cannot deactivate your own account." });
        const current = await userModel.findById(id);
        if (!current) return response.status(404).json({ message: "Account not found." });
        if (current.IsSystemAccount) return response.status(403).json({ message: "The superadmin system account cannot be deactivated." });
        const updated = await userModel.setActive(id, isActive);
        return response.json({ message: `Account ${updated.IsActive ? "reactivated" : "deactivated"}. Existing sessions were revoked.` });
    } catch (error) {
        return apiError(response, error);
    }
};

const changeOwnPassword = async (request, response) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = request.body;
        if (newPassword !== confirmPassword) return response.status(400).json({ message: "Password confirmation does not match." });
        const passwordError = validatePassword(newPassword);
        if (passwordError) return response.status(400).json({ message: passwordError });

        const user = await userModel.findById(request.user._id);
        if (!user || !user.IsActive) return response.status(401).json({ message: "Account is unavailable." });
        if (!await bcrypt.compare(currentPassword || "", user.Password))
            return response.status(400).json({ message: "Current or temporary password is incorrect." });
        if (await bcrypt.compare(newPassword, user.Password))
            return response.status(400).json({ message: "Choose a password different from your temporary or current password." });

        await userModel.updateOwnPassword(user.Id, await bcrypt.hash(newPassword, 12));
        return response.json({ message: "Password changed. Please sign in again with your new password." });
    } catch (error) {
        return apiError(response, error);
    }
};

const listUsers = async (request, response) => {
    try {
        const selectedUsers = request.body || {};
        const users = Object.keys(selectedUsers).length
            ? await userModel.getByIds(Object.values(selectedUsers).map(u => u.value))
            : await userModel.getAll();
        return response.json(users.map(shapeUser));
    } catch (error) {
        return apiError(response, error);
    }
};

const searchOptions = async (_request, response) => {
    try { return response.json((await userModel.getAll()).map(shapeUser)); }
    catch (error) { return apiError(response, error); }
};

const availableEmployees = async (request, response) => {
    try {
        const employees = await userModel.getAvailableEmployees(request.query.currentUserId ? Number(request.query.currentUserId) : null);
        return response.json(employees.map(e => ({
            id: e.Id, employeeNo: e.EmployeeNo,
            employeeName: [e.FirstName, e.MiddleName, e.LastName, e.Suffix].filter(Boolean).join(" "),
            image: e.Image || "", department: e.Department || "",
        })));
    } catch (error) { return apiError(response, error); }
};

const dashboard = async (_request, response) => {
    try { return response.json(await userModel.getDashboard()); }
    catch (error) { return apiError(response, error); }
};

module.exports = {
    ASSIGNABLE_ROLES, createUser, updateUser, resetPassword, setAccountStatus,
    changeOwnPassword, listUsers, searchOptions, availableEmployees, dashboard,
};
