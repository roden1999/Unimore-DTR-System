const { getPool, sql } = require("../../config/db");

const list = async ({ machine = "", ids = [], offset = 0, limit = 10 }) => {
    const pool = getPool();
    const clauses = ["IsDeleted = 0"];
    if (machine) clauses.push(`Machine = '${String(machine).replace(/'/g, "''")}'`);
    if (ids.length) clauses.push(`Id IN (${ids.map(Number).filter(Boolean).join(",") || 0})`);
    const paged = ids.length ? "" : `OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    const result = await pool.request().query(
        `SELECT * FROM SpareParts WHERE ${clauses.join(" AND ")} ORDER BY Name ${paged}`);
    return result.recordset;
};

const count = async (machine = "") => {
    const pool = getPool();
    const where = machine ? `IsDeleted = 0 AND Machine = '${String(machine).replace(/'/g, "''")}'` : "IsDeleted = 0";
    const result = await pool.request().query(`SELECT COUNT(*) AS total FROM SpareParts WHERE ${where}`);
    return result.recordset[0].total;
};

const searchOptions = async (machine = "") => {
    const pool = getPool();
    const where = machine ? `IsDeleted = 0 AND Machine = '${String(machine).replace(/'/g, "''")}'` : "IsDeleted = 0";
    const result = await pool.request().query(`SELECT Id, Name, Status FROM SpareParts WHERE ${where} ORDER BY Name`);
    return result.recordset;
};

const create = async (s) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Name", sql.NVarChar, s.name)
        .input("Quantity", sql.Int, Number(s.quantity) || 0)
        .input("Machine", sql.NVarChar, s.machine)
        .input("Description", sql.NVarChar, s.description || null)
        .input("Remarks", sql.NVarChar, s.remarks || null)
        .input("Status", sql.NVarChar, s.status)
        .query(`INSERT INTO SpareParts (Name, Quantity, Machine, Description, Remarks, Status, IsDeleted)
                OUTPUT INSERTED.Id, INSERTED.Name
                VALUES (@Name, @Quantity, @Machine, @Description, @Remarks, @Status, 0)`);
    return result.recordset[0];
};

const update = async (id, s) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Id", sql.Int, id)
        .input("Name", sql.NVarChar, s.Name)
        .input("Quantity", sql.Int, Number(s.Quantity) || 0)
        .input("Description", sql.NVarChar, s.Description || null)
        .input("Remarks", sql.NVarChar, s.Remarks || null)
        .input("Status", sql.NVarChar, s.Status)
        .query(`UPDATE SpareParts SET Name=@Name, Quantity=@Quantity, Description=@Description,
                Remarks=@Remarks, Status=@Status OUTPUT INSERTED.Name WHERE Id=@Id`);
    return result.recordset[0];
};

const softDelete = async (id) => {
    const pool = getPool();
    await pool.request().input("Id", sql.Int, id)
        .query("UPDATE SpareParts SET IsDeleted = 1 WHERE Id = @Id");
};

module.exports = { list, count, searchOptions, create, update, softDelete };
