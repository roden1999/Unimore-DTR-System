const { getPool, sql } = require("../config/db");

const insert = async ({ employeeNo, timeInOut, dateTime, employeeName }) => {
    const pool = getPool();
    const result = await pool.request()
        .input("EmployeeNo", sql.NVarChar, employeeNo)
        .input("TimeInOut", sql.NVarChar, timeInOut)
        .input("DateTime", sql.DateTime, new Date(dateTime))
        .input("EmployeeName", sql.NVarChar, employeeName || "")
        .query(`INSERT INTO TimeLogs (EmployeeNo, TimeInOut, DateTime, EmployeeName)
                OUTPUT INSERTED.Id
                VALUES (@EmployeeNo, @TimeInOut, @DateTime, @EmployeeName)`);
    return result.recordset[0];
};

const getByEmployeeNosAndDateRange = async (employeeNos, fromDate, toDate) => {
    const pool = getPool();
    const noList = employeeNos.map(n => `'${n.replace(/'/g, "''")}'`).join(",");
    const result = await pool.request()
        .input("FromDate", sql.DateTime, new Date(fromDate))
        .input("ToDate", sql.DateTime, new Date(toDate))
        .query(`SELECT * FROM TimeLogs
                WHERE EmployeeNo IN (${noList})
                AND DateTime >= @FromDate AND DateTime < DATEADD(day, 1, @ToDate)
                ORDER BY DateTime DESC`);
    return result.recordset;
};

const getByDateRange = async (fromDate, toDate, offset, limit) => {
    const pool = getPool();
    const result = await pool.request()
        .input("FromDate", sql.DateTime, new Date(fromDate))
        .input("ToDate", sql.DateTime, new Date(toDate))
        .query(`SELECT * FROM TimeLogs
                WHERE DateTime >= @FromDate AND DateTime < DATEADD(day, 1, @ToDate)
                ORDER BY DateTime DESC
                OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`);
    return result.recordset;
};

const countByEmployeeNosAndDateRange = async (employeeNos, fromDate, toDate) => {
    const pool = getPool();
    const noList = employeeNos.map(n => `'${n.replace(/'/g, "''")}'`).join(",");
    const result = await pool.request()
        .input("FromDate", sql.DateTime, new Date(fromDate))
        .input("ToDate", sql.DateTime, new Date(toDate))
        .query(`SELECT COUNT(*) AS total FROM TimeLogs
                WHERE EmployeeNo IN (${noList})
                AND DateTime >= @FromDate AND DateTime < DATEADD(day, 1, @ToDate)`);
    return result.recordset[0].total;
};

const countByDateRange = async (fromDate, toDate) => {
    const pool = getPool();
    const result = await pool.request()
        .input("FromDate", sql.DateTime, new Date(fromDate))
        .input("ToDate", sql.DateTime, new Date(toDate))
        .query(`SELECT COUNT(*) AS total FROM TimeLogs
                WHERE DateTime >= @FromDate AND DateTime < DATEADD(day, 1, @ToDate)`);
    return result.recordset[0].total;
};

const getTimeIn = async (employeeNo, dayStart, dayEnd) => {
    const pool = getPool();
    const result = await pool.request()
        .input("EmployeeNo", sql.NVarChar, employeeNo)
        .input("Start", sql.DateTime, dayStart)
        .input("End", sql.DateTime, dayEnd)
        .query(`SELECT TOP 1 * FROM TimeLogs
                WHERE EmployeeNo = @EmployeeNo AND TimeInOut = 'S'
                AND DateTime >= @Start AND DateTime <= @End
                ORDER BY DateTime ASC`);
    return result.recordset[0] || null;
};

const getTimeOut = async (employeeNo, dayStart, dayEnd) => {
    const pool = getPool();
    const result = await pool.request()
        .input("EmployeeNo", sql.NVarChar, employeeNo)
        .input("Start", sql.DateTime, dayStart)
        .input("End", sql.DateTime, dayEnd)
        .query(`SELECT TOP 1 * FROM TimeLogs
                WHERE EmployeeNo = @EmployeeNo AND TimeInOut = 'E'
                AND DateTime >= @Start AND DateTime <= @End
                ORDER BY DateTime DESC`);
    return result.recordset[0] || null;
};

const getBreakOut = async (employeeNo, breakStart, breakEnd, mode) => {
    const pool = getPool();
    const result = await pool.request()
        .input("EmployeeNo", sql.NVarChar, employeeNo)
        .input("Start", sql.DateTime, breakStart)
        .input("End", sql.DateTime, breakEnd)
        .input("Mode", sql.NVarChar, mode)
        .query(`SELECT TOP 1 * FROM TimeLogs
                WHERE EmployeeNo = @EmployeeNo AND TimeInOut = @Mode
                AND DateTime >= @Start AND DateTime <= @End
                ORDER BY DateTime ASC`);
    return result.recordset[0] || null;
};

const getBreakIn = async (employeeNo, breakStart, breakEnd, mode) => {
    const pool = getPool();
    const result = await pool.request()
        .input("EmployeeNo", sql.NVarChar, employeeNo)
        .input("Start", sql.DateTime, breakStart)
        .input("End", sql.DateTime, breakEnd)
        .input("Mode", sql.NVarChar, mode)
        .query(`SELECT TOP 1 * FROM TimeLogs
                WHERE EmployeeNo = @EmployeeNo AND TimeInOut = @Mode
                AND DateTime >= @Start AND DateTime <= @End
                ORDER BY DateTime DESC`);
    return result.recordset[0] || null;
};

const getNextDayOT = async (employeeNo, nextDayStart, nextDayEnd) => {
    const pool = getPool();
    const result = await pool.request()
        .input("EmployeeNo", sql.NVarChar, employeeNo)
        .input("Start", sql.DateTime, nextDayStart)
        .input("End", sql.DateTime, nextDayEnd)
        .query(`SELECT TOP 1 * FROM TimeLogs
                WHERE EmployeeNo = @EmployeeNo AND TimeInOut = 'S'
                AND DateTime >= @Start AND DateTime <= @End
                ORDER BY DateTime DESC`);
    return result.recordset[0] || null;
};

module.exports = {
    insert, getByEmployeeNosAndDateRange, getByDateRange,
    countByEmployeeNosAndDateRange, countByDateRange,
    getTimeIn, getTimeOut, getBreakOut, getBreakIn, getNextDayOT
};
