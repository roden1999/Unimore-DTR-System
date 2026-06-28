const { getPool, sql } = require("../config/db");

const findByName = async (name) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Department", sql.NVarChar, name)
        .query("SELECT * FROM Departments WHERE Department = @Department AND IsDeleted = 0");
    return result.recordset[0] || null;
};

const findById = async (id) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Id", sql.Int, id)
        .query(`SELECT d.*, ds.DayName, ds.TimeStart, ds.TimeEnd
                FROM Departments d
                LEFT JOIN DepartmentSchedules ds ON d.Id = ds.DepartmentId
                WHERE d.Id = @Id AND d.IsDeleted = 0`);
    return result.recordset;
};

const findByIdRaw = async (id) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Id", sql.Int, id)
        .query("SELECT * FROM Departments WHERE Id = @Id");
    return result.recordset[0] || null;
};

const getAll = async () => {
    const pool = getPool();
    const result = await pool.request()
        .query("SELECT * FROM Departments WHERE IsDeleted = 0 ORDER BY Department");
    return result.recordset;
};

const getByIds = async (ids) => {
    const pool = getPool();
    const idList = ids.join(",");
    const result = await pool.request()
        .query(`SELECT * FROM Departments WHERE Id IN (${idList}) AND IsDeleted = 0 ORDER BY Department`);
    return result.recordset;
};

const getSchedules = async (departmentId) => {
    const pool = getPool();
    const result = await pool.request()
        .input("DepartmentId", sql.Int, departmentId)
        .query("SELECT * FROM DepartmentSchedules WHERE DepartmentId = @DepartmentId ORDER BY SortOrder");
    return result.recordset;
};

const create = async ({ department, dayNightShift }) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Department", sql.NVarChar, department)
        .input("DayNightShift", sql.Bit, dayNightShift ? 1 : 0)
        .query(`INSERT INTO Departments (Department, DayNightShift, IsDeleted)
                OUTPUT INSERTED.Id, INSERTED.Department
                VALUES (@Department, @DayNightShift, 0)`);
    return result.recordset[0];
};

const createSchedule = async (departmentId, dayName, timeStart, timeEnd, sortOrder) => {
    const pool = getPool();
    await pool.request()
        .input("DepartmentId", sql.Int, departmentId)
        .input("DayName", sql.NVarChar, dayName)
        .input("TimeStart", sql.NVarChar, timeStart)
        .input("TimeEnd", sql.NVarChar, timeEnd)
        .input("SortOrder", sql.Int, sortOrder)
        .query(`INSERT INTO DepartmentSchedules (DepartmentId, DayName, TimeStart, TimeEnd, SortOrder)
                VALUES (@DepartmentId, @DayName, @TimeStart, @TimeEnd, @SortOrder)`);
};

const update = async (id, { department, dayNightShift }) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Id", sql.Int, id)
        .input("Department", sql.NVarChar, department)
        .input("DayNightShift", sql.Bit, dayNightShift ? 1 : 0)
        .query(`UPDATE Departments SET Department = @Department, DayNightShift = @DayNightShift
                OUTPUT INSERTED.* WHERE Id = @Id`);
    return result.recordset[0];
};

const deleteSchedules = async (departmentId) => {
    const pool = getPool();
    await pool.request()
        .input("DepartmentId", sql.Int, departmentId)
        .query("DELETE FROM DepartmentSchedules WHERE DepartmentId = @DepartmentId");
};

const softDelete = async (id) => {
    const pool = getPool();
    await pool.request()
        .input("Id", sql.Int, id)
        .query("UPDATE Departments SET IsDeleted = 1 WHERE Id = @Id");
};

module.exports = {
    findByName, findById, findByIdRaw, getAll, getByIds, getSchedules,
    create, createSchedule, update, deleteSchedules, softDelete
};
