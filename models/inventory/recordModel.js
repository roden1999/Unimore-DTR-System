const { getPool, sql } = require("../../config/db");

// Records are tool borrow/return transactions, joined to the tool,
// borrower (shared Employees) and project for display.
const SELECT_JOINED = `
    SELECT r.*, t.Name AS ToolName, t.SerialNo AS SerialNo,
           e.EmployeeNo AS EmployeeNo,
           LTRIM(RTRIM(CONCAT(e.FirstName, ' ', e.MiddleName, ' ', e.LastName))) AS EmployeeName,
           p.ProjectName AS ProjectName
    FROM Records r
    INNER JOIN Tools t ON t.Id = r.ToolId
    INNER JOIN Employees e ON e.Id = r.EmployeeId
    LEFT JOIN Projects p ON p.Id = r.ProjectId`;

const listByStatus = async ({ status, toolIds = [], offset = 0, limit = 12 }) => {
    const pool = getPool();
    const clauses = [`r.Status = @Status`];
    if (toolIds.length) clauses.push(`r.ToolId IN (${toolIds.map(Number).filter(Boolean).join(",") || 0})`);
    const paged = toolIds.length ? "" : `OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    const result = await pool.request().input("Status", sql.NVarChar, status)
        .query(`${SELECT_JOINED} WHERE ${clauses.join(" AND ")} ORDER BY r.DateBorrowed DESC ${paged}`);
    return result.recordset;
};

const countByStatus = async (status) => {
    const pool = getPool();
    const result = await pool.request().input("Status", sql.NVarChar, status)
        .query("SELECT COUNT(*) AS total FROM Records WHERE Status = @Status");
    return result.recordset[0].total;
};

const getByProject = async (projectId) => {
    const pool = getPool();
    const result = await pool.request().input("ProjectId", sql.Int, projectId)
        .query(`${SELECT_JOINED} WHERE r.ProjectId = @ProjectId ORDER BY r.DateBorrowed DESC`);
    return result.recordset;
};

const getOpenByEmployee = async (employeeId) => {
    const pool = getPool();
    const result = await pool.request().input("EmployeeId", sql.Int, employeeId)
        .query(`${SELECT_JOINED} WHERE r.EmployeeId = @EmployeeId AND r.Status = 'Borrowed' ORDER BY r.DateBorrowed DESC`);
    return result.recordset;
};

const countOpenByEmployee = async (employeeId) => {
    const pool = getPool();
    const result = await pool.request().input("EmployeeId", sql.Int, employeeId)
        .query("SELECT COUNT(*) AS total FROM Records WHERE EmployeeId = @EmployeeId AND Status = 'Borrowed'");
    return result.recordset[0].total;
};

const findById = async (id) => {
    const pool = getPool();
    const result = await pool.request().input("Id", sql.Int, id)
        .query("SELECT * FROM Records WHERE Id = @Id");
    return result.recordset[0] || null;
};

const create = async (r) => {
    const pool = getPool();
    const result = await pool.request()
        .input("ToolId", sql.Int, r.toolId)
        .input("EmployeeId", sql.Int, r.employeeId)
        .input("ProjectId", sql.Int, r.projectId || null)
        .input("DateBorrowed", sql.DateTime, r.dateBorrowed ? new Date(r.dateBorrowed) : new Date())
        .input("Status", sql.NVarChar, "Borrowed")
        .input("ProcessedBy", sql.NVarChar, r.processedBy || null)
        .input("Remarks", sql.NVarChar, r.remarks || null)
        .query(`INSERT INTO Records (ToolId, EmployeeId, ProjectId, DateBorrowed, Status, ProcessedBy, Remarks)
                OUTPUT INSERTED.Id VALUES (@ToolId, @EmployeeId, @ProjectId, @DateBorrowed, @Status, @ProcessedBy, @Remarks)`);
    return result.recordset[0];
};

const markReturned = async (id, { receivedBy, remarks }) => {
    const pool = getPool();
    await pool.request()
        .input("Id", sql.Int, id)
        .input("DateReturned", sql.DateTime, new Date())
        .input("ReceivedBy", sql.NVarChar, receivedBy || null)
        .input("Remarks", sql.NVarChar, remarks || null)
        .query(`UPDATE Records SET DateReturned=@DateReturned, Status='Returned', ReceivedBy=@ReceivedBy, Remarks=@Remarks
                WHERE Id=@Id`);
};

const editItem = async (id, { toolId, employeeId, dateBorrowed, remarks }) => {
    const pool = getPool();
    await pool.request()
        .input("Id", sql.Int, id)
        .input("ToolId", sql.Int, toolId)
        .input("EmployeeId", sql.Int, employeeId)
        .input("DateBorrowed", sql.DateTime, dateBorrowed ? new Date(dateBorrowed) : new Date())
        .input("Remarks", sql.NVarChar, remarks || null)
        .query(`UPDATE Records SET ToolId=@ToolId, EmployeeId=@EmployeeId, DateBorrowed=@DateBorrowed, Remarks=@Remarks
                WHERE Id=@Id`);
};

const remove = async (id) => {
    const pool = getPool();
    await pool.request().input("Id", sql.Int, id).query("DELETE FROM Records WHERE Id = @Id");
};

module.exports = {
    listByStatus, countByStatus, getByProject, getOpenByEmployee, countOpenByEmployee,
    findById, create, markReturned, editItem, remove
};
