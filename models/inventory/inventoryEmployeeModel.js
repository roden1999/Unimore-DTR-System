const { getPool, sql } = require("../../config/db");

// The tools module's view of the shared Employees table: PascalCase
// fields plus Image, used with borrowed-tools aggregation done in the
// controller via recordModel.

const list = async ({ ids = [], offset = 0, limit = 12 }) => {
    const pool = getPool();
    const idClause = ids.length ? `AND Id IN (${ids.map(Number).filter(Boolean).join(",") || 0})` : "";
    const paged = ids.length ? "" : `OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    const result = await pool.request().query(
        `SELECT Id, EmployeeNo, FirstName, MiddleName, LastName, Image
         FROM Employees WHERE IsDeleted = 0 ${idClause} ORDER BY LastName ${paged}`);
    return result.recordset;
};

const count = async () => {
    const pool = getPool();
    const result = await pool.request().query("SELECT COUNT(*) AS total FROM Employees WHERE IsDeleted = 0");
    return result.recordset[0].total;
};

const searchOptions = async () => {
    const pool = getPool();
    const result = await pool.request().query(
        "SELECT Id, FirstName, MiddleName, LastName FROM Employees WHERE IsDeleted = 0 ORDER BY LastName");
    return result.recordset;
};

const findByEmployeeNo = async (employeeNo) => {
    const pool = getPool();
    const result = await pool.request().input("EmployeeNo", sql.NVarChar, employeeNo)
        .query("SELECT * FROM Employees WHERE EmployeeNo = @EmployeeNo AND IsDeleted = 0");
    return result.recordset[0] || null;
};

// Create an employee from the tools module (no department; HR can set it later).
const create = async (e) => {
    const pool = getPool();
    const result = await pool.request()
        .input("EmployeeNo", sql.NVarChar, e.employeeNo)
        .input("FirstName", sql.NVarChar, e.firstName)
        .input("MiddleName", sql.NVarChar, e.middleName || "")
        .input("LastName", sql.NVarChar, e.lastName)
        .input("Image", sql.NVarChar(sql.MAX), e.image || null)
        .query(`INSERT INTO Employees (EmployeeNo, FirstName, MiddleName, LastName, Image, IsDeleted)
                OUTPUT INSERTED.Id, INSERTED.EmployeeNo, INSERTED.FirstName
                VALUES (@EmployeeNo, @FirstName, @MiddleName, @LastName, @Image, 0)`);
    return result.recordset[0];
};

const update = async (id, e) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Id", sql.Int, id)
        .input("EmployeeNo", sql.NVarChar, e.EmployeeNo)
        .input("FirstName", sql.NVarChar, e.FirstName)
        .input("MiddleName", sql.NVarChar, e.MiddleName || "")
        .input("LastName", sql.NVarChar, e.LastName)
        .query(`UPDATE Employees SET EmployeeNo=@EmployeeNo, FirstName=@FirstName, MiddleName=@MiddleName, LastName=@LastName
                OUTPUT INSERTED.EmployeeNo, INSERTED.FirstName WHERE Id=@Id`);
    return result.recordset[0];
};

const setImage = async (id, image) => {
    const pool = getPool();
    await pool.request()
        .input("Id", sql.Int, id)
        .input("Image", sql.NVarChar(sql.MAX), image || null)
        .query("UPDATE Employees SET Image = @Image WHERE Id = @Id");
};

const softDelete = async (id) => {
    const pool = getPool();
    await pool.request().input("Id", sql.Int, id)
        .query("UPDATE Employees SET IsDeleted = 1 WHERE Id = @Id");
};

module.exports = { list, count, searchOptions, findByEmployeeNo, create, update, setImage, softDelete };
