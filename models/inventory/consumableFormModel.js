const { getPool, sql } = require("../../config/db");

// Consumable-form line items, joined to the consumable and borrower.
const SELECT_JOINED = `
    SELECT cf.*, c.Name AS Consumable,
           LTRIM(RTRIM(CONCAT(e.FirstName, ' ', e.MiddleName, ' ', e.LastName))) AS EmployeeName
    FROM ConsumableForms cf
    INNER JOIN Consumables c ON c.Id = cf.ConsumableId
    INNER JOIN Employees e ON e.Id = cf.EmployeeId`;

const getByProject = async (projectId) => {
    const pool = getPool();
    const result = await pool.request().input("ProjectId", sql.Int, projectId)
        .query(`${SELECT_JOINED} WHERE cf.ProjectId = @ProjectId ORDER BY cf.DateIssued DESC`);
    return result.recordset;
};

const findById = async (id) => {
    const pool = getPool();
    const result = await pool.request().input("Id", sql.Int, id)
        .query("SELECT * FROM ConsumableForms WHERE Id = @Id");
    return result.recordset[0] || null;
};

const create = async (cf) => {
    const pool = getPool();
    const result = await pool.request()
        .input("ConsumableId", sql.Int, cf.consumableId)
        .input("EmployeeId", sql.Int, cf.employeeId)
        .input("ProjectId", sql.Int, cf.projectId)
        .input("DateIssued", sql.DateTime, cf.dateIssued ? new Date(cf.dateIssued) : new Date())
        .input("Quantity", sql.Decimal(18, 2), Number(cf.quantity) || 0)
        .input("Status", sql.NVarChar, cf.status || null)
        .input("Remarks", sql.NVarChar, cf.remarks || null)
        .input("IssuedBy", sql.NVarChar, cf.issuedBy || null)
        .query(`INSERT INTO ConsumableForms (ConsumableId, EmployeeId, ProjectId, DateIssued, Quantity, Status, Remarks, IssuedBy)
                OUTPUT INSERTED.Id
                VALUES (@ConsumableId, @EmployeeId, @ProjectId, @DateIssued, @Quantity, @Status, @Remarks, @IssuedBy)`);
    return result.recordset[0];
};

const setQuantity = async (id, quantity) => {
    const pool = getPool();
    await pool.request()
        .input("Id", sql.Int, id)
        .input("Quantity", sql.Decimal(18, 2), quantity)
        .query("UPDATE ConsumableForms SET Quantity = @Quantity WHERE Id = @Id");
};

const editItem = async (id, { employeeId, dateIssued, remarks }) => {
    const pool = getPool();
    await pool.request()
        .input("Id", sql.Int, id)
        .input("EmployeeId", sql.Int, employeeId)
        .input("DateIssued", sql.DateTime, dateIssued ? new Date(dateIssued) : new Date())
        .input("Remarks", sql.NVarChar, remarks || null)
        .query("UPDATE ConsumableForms SET EmployeeId=@EmployeeId, DateIssued=@DateIssued, Remarks=@Remarks WHERE Id=@Id");
};

const remove = async (id) => {
    const pool = getPool();
    await pool.request().input("Id", sql.Int, id).query("DELETE FROM ConsumableForms WHERE Id = @Id");
};

module.exports = { getByProject, findById, create, setQuantity, editItem, remove };
