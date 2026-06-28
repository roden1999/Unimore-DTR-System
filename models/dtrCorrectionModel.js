const { getPool, sql } = require("../config/db");

const findByEmployeeNoAndDate = async (employeeNo, date) => {
    const pool = getPool();
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    const result = await pool.request()
        .input("EmployeeNo", sql.NVarChar, employeeNo)
        .input("Start", sql.DateTime, start)
        .input("End", sql.DateTime, end)
        .query(`SELECT TOP 1 * FROM DtrCorrections
                WHERE EmployeeNo = @EmployeeNo AND Date >= @Start AND Date <= @End
                ORDER BY DateApproved DESC`);
    return result.recordset[0] || null;
};

const getByEmployeeNosAndDateRange = async (employeeNos, fromDate, toDate, offset, limit) => {
    const pool = getPool();
    const noList = employeeNos.map(n => `'${n.replace(/'/g, "''")}'`).join(",");
    const result = await pool.request()
        .input("FromDate", sql.DateTime, new Date(fromDate))
        .input("ToDate", sql.DateTime, new Date(toDate))
        .query(`SELECT * FROM DtrCorrections
                WHERE EmployeeNo IN (${noList})
                AND Date >= @FromDate AND Date < DATEADD(day, 1, @ToDate)
                ORDER BY Date DESC
                OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`);
    return result.recordset;
};

const getByDateRange = async (fromDate, toDate, offset, limit) => {
    const pool = getPool();
    const result = await pool.request()
        .input("FromDate", sql.DateTime, new Date(fromDate))
        .input("ToDate", sql.DateTime, new Date(toDate))
        .query(`SELECT * FROM DtrCorrections
                WHERE Date >= @FromDate AND Date < DATEADD(day, 1, @ToDate)
                ORDER BY Date DESC
                OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`);
    return result.recordset;
};

module.exports = { findByEmployeeNoAndDate, getByEmployeeNosAndDateRange, getByDateRange };
