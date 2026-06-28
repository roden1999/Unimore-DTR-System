const { getPool, sql } = require("../config/db");

const findByEmployeeNo = async (employeeNo) => {
    const pool = getPool();
    const result = await pool.request()
        .input("EmployeeNo", sql.NVarChar, employeeNo)
        .query("SELECT * FROM Employees WHERE EmployeeNo = @EmployeeNo AND IsDeleted = 0");
    return result.recordset[0] || null;
};

const findById = async (id) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Id", sql.Int, id)
        .query("SELECT * FROM Employees WHERE Id = @Id");
    return result.recordset[0] || null;
};

const getAll = async () => {
    const pool = getPool();
    const result = await pool.request()
        .query("SELECT * FROM Employees WHERE IsDeleted = 0 ORDER BY LastName");
    return result.recordset;
};

const getByIds = async (ids) => {
    const pool = getPool();
    const idList = ids.join(",");
    const result = await pool.request()
        .query(`SELECT * FROM Employees WHERE Id IN (${idList}) AND IsDeleted = 0 ORDER BY LastName`);
    return result.recordset;
};

const getByDepartmentIds = async (departmentIds) => {
    const pool = getPool();
    const idList = departmentIds.join(",");
    const result = await pool.request()
        .query(`SELECT * FROM Employees WHERE DepartmentId IN (${idList}) AND IsDeleted = 0 ORDER BY LastName`);
    return result.recordset;
};

const getByIdsAndDepartments = async (employeeIds, departmentIds) => {
    const pool = getPool();
    const empList = employeeIds.join(",");
    const depList = departmentIds.join(",");
    const result = await pool.request()
        .query(`SELECT * FROM Employees WHERE Id IN (${empList}) AND DepartmentId IN (${depList}) AND IsDeleted = 0 ORDER BY LastName`);
    return result.recordset;
};

const getPaginated = async (offset, limit, departmentIds = []) => {
    const pool = getPool();
    let query = "SELECT * FROM Employees WHERE IsDeleted = 0";
    if (departmentIds.length > 0) {
        query += ` AND DepartmentId IN (${departmentIds.join(",")})`;
    }
    query += ` ORDER BY LastName OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    const result = await pool.request().query(query);
    return result.recordset;
};

const getPaginatedByIds = async (ids, offset, limit) => {
    const pool = getPool();
    const idList = ids.join(",");
    const result = await pool.request()
        .query(`SELECT * FROM Employees WHERE Id IN (${idList}) AND IsDeleted = 0
                ORDER BY LastName OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`);
    return result.recordset;
};

const countAll = async (departmentIds = []) => {
    const pool = getPool();
    let query = "SELECT COUNT(*) AS total FROM Employees WHERE IsDeleted = 0";
    if (departmentIds.length > 0) {
        query += ` AND DepartmentId IN (${departmentIds.join(",")})`;
    }
    const result = await pool.request().query(query);
    return result.recordset[0].total;
};

const create = async ({ employeeNo, firstName, middleName, lastName, suffix, departmentId, contactNo, gender, address }) => {
    const pool = getPool();
    const result = await pool.request()
        .input("EmployeeNo", sql.NVarChar, employeeNo)
        .input("FirstName", sql.NVarChar, firstName)
        .input("MiddleName", sql.NVarChar, middleName || "")
        .input("LastName", sql.NVarChar, lastName)
        .input("Suffix", sql.NVarChar, suffix || "")
        .input("DepartmentId", sql.Int, departmentId)
        .input("ContactNo", sql.NVarChar, contactNo || "")
        .input("Gender", sql.NVarChar, gender || "")
        .input("Address", sql.NVarChar, address || "")
        .query(`INSERT INTO Employees (EmployeeNo, FirstName, MiddleName, LastName, Suffix, DepartmentId, ContactNo, Gender, Address, IsDeleted)
                OUTPUT INSERTED.Id, INSERTED.EmployeeNo, INSERTED.FirstName
                VALUES (@EmployeeNo, @FirstName, @MiddleName, @LastName, @Suffix, @DepartmentId, @ContactNo, @Gender, @Address, 0)`);
    return result.recordset[0];
};

const update = async (id, { employeeNo, firstName, middleName, lastName, suffix, departmentId, contactNo, gender, address }) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Id", sql.Int, id)
        .input("EmployeeNo", sql.NVarChar, employeeNo)
        .input("FirstName", sql.NVarChar, firstName)
        .input("MiddleName", sql.NVarChar, middleName || "")
        .input("LastName", sql.NVarChar, lastName)
        .input("Suffix", sql.NVarChar, suffix || "")
        .input("DepartmentId", sql.Int, departmentId)
        .input("ContactNo", sql.NVarChar, contactNo || "")
        .input("Gender", sql.NVarChar, gender || "")
        .input("Address", sql.NVarChar, address || "")
        .query(`UPDATE Employees SET EmployeeNo=@EmployeeNo, FirstName=@FirstName, MiddleName=@MiddleName,
                LastName=@LastName, Suffix=@Suffix, DepartmentId=@DepartmentId, ContactNo=@ContactNo,
                Gender=@Gender, Address=@Address
                OUTPUT INSERTED.* WHERE Id = @Id`);
    return result.recordset[0];
};

const softDelete = async (id) => {
    const pool = getPool();
    await pool.request()
        .input("Id", sql.Int, id)
        .query("UPDATE Employees SET IsDeleted = 1 WHERE Id = @Id");
};

module.exports = {
    findByEmployeeNo, findById, getAll, getByIds, getByDepartmentIds,
    getByIdsAndDepartments, getPaginated, getPaginatedByIds, countAll,
    create, update, softDelete
};
