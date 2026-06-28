const { getPool, sql } = require("../config/db");

const findByDate = async (date) => {
    const pool = getPool();
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    const result = await pool.request()
        .input("Start", sql.DateTime, start)
        .input("End", sql.DateTime, end)
        .query("SELECT * FROM HolidaySchedules WHERE Date >= @Start AND Date <= @End AND IsDeleted = 0");
    return result.recordset[0] || null;
};

const findByDateRange = async (fromDate, toDate) => {
    const pool = getPool();
    const result = await pool.request()
        .input("FromDate", sql.DateTime, new Date(fromDate))
        .input("ToDate", sql.DateTime, new Date(toDate))
        .query("SELECT * FROM HolidaySchedules WHERE Date >= @FromDate AND Date <= @ToDate AND IsDeleted = 0");
    return result.recordset;
};

const findById = async (id) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Id", sql.Int, id)
        .query("SELECT * FROM HolidaySchedules WHERE Id = @Id");
    return result.recordset[0] || null;
};

const getAll = async () => {
    const pool = getPool();
    const result = await pool.request()
        .query("SELECT * FROM HolidaySchedules WHERE IsDeleted = 0 ORDER BY Date");
    return result.recordset;
};

const create = async ({ date, title, type }) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Date", sql.DateTime, new Date(date))
        .input("Title", sql.NVarChar, title)
        .input("Type", sql.NVarChar, type)
        .query(`INSERT INTO HolidaySchedules (Date, Title, Type, IsDeleted)
                OUTPUT INSERTED.Id, INSERTED.Date
                VALUES (@Date, @Title, @Type, 0)`);
    return result.recordset[0];
};

const update = async (id, { date, title, type }) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Id", sql.Int, id)
        .input("Date", sql.DateTime, new Date(date))
        .input("Title", sql.NVarChar, title)
        .input("Type", sql.NVarChar, type)
        .query(`UPDATE HolidaySchedules SET Date=@Date, Title=@Title, Type=@Type
                OUTPUT INSERTED.* WHERE Id = @Id`);
    return result.recordset[0];
};

const softDelete = async (id) => {
    const pool = getPool();
    await pool.request()
        .input("Id", sql.Int, id)
        .query("UPDATE HolidaySchedules SET IsDeleted = 1 WHERE Id = @Id");
};

module.exports = { findByDate, findByDateRange, findById, getAll, create, update, softDelete };
