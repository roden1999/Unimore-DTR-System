const { getPool, sql } = require("../config/db");

// Active override for a single employee on a single date.
// Used by the DTR calculator. When none is found the employee
// falls back to their department's original schedule.
const getActiveForEmployeeDate = async (employeeId, date) => {
    const pool = getPool();
    const result = await pool.request()
        .input("EmployeeId", sql.Int, employeeId)
        .input("Date", sql.Date, new Date(date))
        .query(`SELECT TOP 1 o.*, s.Name AS ShiftName, s.TimeStart, s.TimeEnd, s.CrossesMidnight
                FROM EmployeeShiftOverrides o
                INNER JOIN Shifts s ON s.Id = o.ShiftId
                WHERE o.EmployeeId = @EmployeeId AND o.IsDeleted = 0
                AND @Date BETWEEN o.StartDate AND o.EndDate
                ORDER BY o.StartDate DESC`);
    return result.recordset[0] || null;
};

// All active overrides for an employee across a date range (loaded
// once per employee so the calculator does not query per day).
const getForEmployeeInRange = async (employeeId, fromDate, toDate) => {
    const pool = getPool();
    const result = await pool.request()
        .input("EmployeeId", sql.Int, employeeId)
        .input("FromDate", sql.Date, new Date(fromDate))
        .input("ToDate", sql.Date, new Date(toDate))
        .query(`SELECT o.*, s.Name AS ShiftName, s.TimeStart, s.TimeEnd, s.CrossesMidnight
                FROM EmployeeShiftOverrides o
                INNER JOIN Shifts s ON s.Id = o.ShiftId
                WHERE o.EmployeeId = @EmployeeId AND o.IsDeleted = 0
                AND o.StartDate <= @ToDate AND o.EndDate >= @FromDate
                ORDER BY o.StartDate ASC`);
    return result.recordset;
};

// Overrides that overlap [startDate, endDate] for an employee.
// Used to warn HR before creating a conflicting assignment.
const findOverlapping = async (employeeId, startDate, endDate) => {
    const pool = getPool();
    const result = await pool.request()
        .input("EmployeeId", sql.Int, employeeId)
        .input("StartDate", sql.Date, new Date(startDate))
        .input("EndDate", sql.Date, new Date(endDate))
        .query(`SELECT o.*, s.Name AS ShiftName
                FROM EmployeeShiftOverrides o
                INNER JOIN Shifts s ON s.Id = o.ShiftId
                WHERE o.EmployeeId = @EmployeeId AND o.IsDeleted = 0
                AND o.StartDate <= @EndDate AND o.EndDate >= @StartDate`);
    return result.recordset;
};

const create = async ({ employeeId, shiftId, startDate, endDate, note }) => {
    const pool = getPool();
    const result = await pool.request()
        .input("EmployeeId", sql.Int, employeeId)
        .input("ShiftId", sql.Int, shiftId)
        .input("StartDate", sql.Date, new Date(startDate))
        .input("EndDate", sql.Date, new Date(endDate))
        .input("Note", sql.NVarChar, note || null)
        .query(`INSERT INTO EmployeeShiftOverrides (EmployeeId, ShiftId, StartDate, EndDate, Note, IsDeleted)
                OUTPUT INSERTED.Id
                VALUES (@EmployeeId, @ShiftId, @StartDate, @EndDate, @Note, 0)`);
    return result.recordset[0];
};

const softDelete = async (id) => {
    const pool = getPool();
    await pool.request()
        .input("Id", sql.Int, id)
        .query("UPDATE EmployeeShiftOverrides SET IsDeleted = 1 WHERE Id = @Id");
};

// Soft-delete every active override for an employee that overlaps the
// range. Used when HR chooses to replace an existing assignment.
const softDeleteOverlapping = async (employeeId, startDate, endDate) => {
    const pool = getPool();
    await pool.request()
        .input("EmployeeId", sql.Int, employeeId)
        .input("StartDate", sql.Date, new Date(startDate))
        .input("EndDate", sql.Date, new Date(endDate))
        .query(`UPDATE EmployeeShiftOverrides SET IsDeleted = 1
                WHERE EmployeeId = @EmployeeId AND IsDeleted = 0
                AND StartDate <= @EndDate AND EndDate >= @StartDate`);
};

const getByEmployeeIds = async (employeeIds) => {
    const pool = getPool();
    const idList = employeeIds.join(",");
    const result = await pool.request()
        .query(`SELECT o.*, s.Name AS ShiftName, s.TimeStart, s.TimeEnd
                FROM EmployeeShiftOverrides o
                INNER JOIN Shifts s ON s.Id = o.ShiftId
                WHERE o.EmployeeId IN (${idList}) AND o.IsDeleted = 0
                ORDER BY o.StartDate DESC`);
    return result.recordset;
};

const getAllActive = async () => {
    const pool = getPool();
    const result = await pool.request()
        .query(`SELECT o.*, s.Name AS ShiftName, s.TimeStart, s.TimeEnd
                FROM EmployeeShiftOverrides o
                INNER JOIN Shifts s ON s.Id = o.ShiftId
                WHERE o.IsDeleted = 0 AND o.EndDate >= CAST(GETDATE() AS DATE)
                ORDER BY o.StartDate DESC`);
    return result.recordset;
};

module.exports = {
    getActiveForEmployeeDate, getForEmployeeInRange, findOverlapping,
    create, softDelete, softDeleteOverlapping, getByEmployeeIds, getAllActive
};
