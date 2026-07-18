const { getPool, sql } = require("../config/db");

const getAll = async () => {
    const pool = getPool();
    const result = await pool.request()
        .query("SELECT * FROM Shifts WHERE IsDeleted = 0 ORDER BY Name");
    return result.recordset;
};

const findById = async (id) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Id", sql.Int, id)
        .query("SELECT * FROM Shifts WHERE Id = @Id");
    return result.recordset[0] || null;
};

const findByName = async (name) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Name", sql.NVarChar, name)
        .query("SELECT * FROM Shifts WHERE Name = @Name AND IsDeleted = 0");
    return result.recordset[0] || null;
};

const create = async ({ name, timeStart, timeEnd, crossesMidnight }) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Name", sql.NVarChar, name)
        .input("TimeStart", sql.NVarChar, timeStart)
        .input("TimeEnd", sql.NVarChar, timeEnd)
        .input("CrossesMidnight", sql.Bit, crossesMidnight ? 1 : 0)
        .query(`INSERT INTO Shifts (Name, TimeStart, TimeEnd, CrossesMidnight, IsDeleted)
                OUTPUT INSERTED.Id, INSERTED.Name
                VALUES (@Name, @TimeStart, @TimeEnd, @CrossesMidnight, 0)`);
    return result.recordset[0];
};

const update = async (id, { name, timeStart, timeEnd, crossesMidnight }) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Id", sql.Int, id)
        .input("Name", sql.NVarChar, name)
        .input("TimeStart", sql.NVarChar, timeStart)
        .input("TimeEnd", sql.NVarChar, timeEnd)
        .input("CrossesMidnight", sql.Bit, crossesMidnight ? 1 : 0)
        .query(`UPDATE Shifts SET Name=@Name, TimeStart=@TimeStart, TimeEnd=@TimeEnd, CrossesMidnight=@CrossesMidnight
                OUTPUT INSERTED.* WHERE Id = @Id`);
    return result.recordset[0];
};

const softDelete = async (id) => {
    const pool = getPool();
    await pool.request()
        .input("Id", sql.Int, id)
        .query("UPDATE Shifts SET IsDeleted = 1 WHERE Id = @Id");
};

module.exports = { getAll, findById, findByName, create, update, softDelete };
