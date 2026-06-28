const { getPool, sql } = require("../config/db");

const findByUsername = async (username) => {
    const pool = getPool();
    const result = await pool.request()
        .input("UserName", sql.NVarChar, username)
        .query("SELECT * FROM Users WHERE UserName = @UserName");
    return result.recordset[0] || null;
};

const findById = async (id) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Id", sql.Int, id)
        .query("SELECT * FROM Users WHERE Id = @Id");
    return result.recordset[0] || null;
};

const getAll = async () => {
    const pool = getPool();
    const result = await pool.request()
        .query("SELECT Id, UserName, Name, Role FROM Users ORDER BY UserName");
    return result.recordset;
};

const getByIds = async (ids) => {
    const pool = getPool();
    const idList = ids.join(",");
    const result = await pool.request()
        .query(`SELECT Id, UserName, Name, Role FROM Users WHERE Id IN (${idList}) ORDER BY UserName`);
    return result.recordset;
};

const create = async ({ userName, name, role, hashedPassword }) => {
    const pool = getPool();
    const result = await pool.request()
        .input("UserName", sql.NVarChar, userName)
        .input("Name", sql.NVarChar, name)
        .input("Role", sql.NVarChar, role)
        .input("Password", sql.NVarChar, hashedPassword)
        .query(`INSERT INTO Users (UserName, Name, Role, Password)
                OUTPUT INSERTED.Id, INSERTED.UserName
                VALUES (@UserName, @Name, @Role, @Password)`);
    return result.recordset[0];
};

const update = async (id, { userName, name, role }) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Id", sql.Int, id)
        .input("UserName", sql.NVarChar, userName)
        .input("Name", sql.NVarChar, name)
        .input("Role", sql.NVarChar, role)
        .query(`UPDATE Users SET UserName = @UserName, Name = @Name, Role = @Role
                OUTPUT INSERTED.Name WHERE Id = @Id`);
    return result.recordset[0];
};

const updatePassword = async (id, hashedPassword) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Id", sql.Int, id)
        .input("Password", sql.NVarChar, hashedPassword)
        .query("UPDATE Users SET Password = @Password OUTPUT INSERTED.Name WHERE Id = @Id");
    return result.recordset[0];
};

const remove = async (id) => {
    const pool = getPool();
    await pool.request()
        .input("Id", sql.Int, id)
        .query("DELETE FROM Users WHERE Id = @Id");
};

module.exports = { findByUsername, findById, getAll, getByIds, create, update, updatePassword, remove };
