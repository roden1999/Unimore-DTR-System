const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const { registrationValidation, registrationEditValidation } = require("../utils/validation");

const createUser = async (request, response) => {
    try {
        const { error } = registrationValidation(request.body);
        if (error) return response.status(400).send(error.details[0].message);

        const existing = await userModel.findByUsername(request.body.userName);
        if (existing) return response.status(400).send("Username already exist");

        if (request.body.password !== request.body.confirmPassword)
            return response.status(400).send("The Confirm Password confirmation does not match.");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(request.body.password, salt);

        const user = await userModel.create({
            userName: request.body.userName,
            name: request.body.name,
            role: request.body.role,
            hashedPassword,
        });

        response.status(200).json({ user: user.UserName });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const updateUser = async (request, response) => {
    try {
        const { error } = registrationEditValidation(request.body);
        if (error) return response.status(400).send(error.details[0].message);

        const existing = await userModel.findByUsername(request.body.userName);
        if (existing && existing.Id !== parseInt(request.params.id))
            return response.status(400).send("Username already exist");

        const updated = await userModel.update(request.params.id, {
            userName: request.body.userName,
            name: request.body.name,
            role: request.body.role,
        });

        response.status(200).json({ user: updated.Name });
    } catch (error) {
        response.status(500).json({ error: "Error" });
    }
};

const changePassword = async (request, response) => {
    try {
        if (!request.body.Password)
            return response.status(400).send("Password cannot be empty.");

        if (request.body.Password !== request.body.ConfirmPassword)
            return response.status(400).send("The Confirm Password confirmation does not match.");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(request.body.Password, salt);

        const updated = await userModel.updatePassword(request.params.id, hashedPassword);
        response.status(200).json({ user: updated.Name });
    } catch (error) {
        response.status(500).json({ error: "Error" });
    }
};

const listUsers = async (request, response) => {
    try {
        const selectedUsers = request.body;
        if (Object.keys(selectedUsers).length > 0) {
            const ids = Object.values(selectedUsers).map(u => u.value);
            const users = await userModel.getByIds(ids);
            return response.status(200).json(users);
        }
        const users = await userModel.getAll();
        response.status(200).json(users);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const searchOptions = async (request, response) => {
    try {
        const users = await userModel.getAll();
        response.status(200).json(users);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const deleteUser = async (request, response) => {
    try {
        await userModel.remove(request.params.id);
        response.status(200).json({ message: "User deleted" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

module.exports = { createUser, updateUser, changePassword, listUsers, searchOptions, deleteUser };
