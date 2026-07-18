const { getPool, sql } = require("../../config/db");

// Projects are shared between Tool Forms and Consumable Forms,
// distinguished by FormType ('Tools' | 'Consumables').

const list = async ({ formType, ids = [], fromDate, toDate, offset = 0, limit = 20 }) => {
    const pool = getPool();
    const clauses = ["IsDeleted = 0", `FormType = @FormType`];
    if (ids.length) clauses.push(`Id IN (${ids.map(Number).filter(Boolean).join(",") || 0})`);
    const req = pool.request().input("FormType", sql.NVarChar, formType);
    if (fromDate && toDate) {
        clauses.push("Date >= @FromDate AND Date <= @ToDate");
        req.input("FromDate", sql.Date, new Date(fromDate)).input("ToDate", sql.Date, new Date(toDate));
    }
    const paged = ids.length ? "" : `OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    const result = await req.query(
        `SELECT * FROM Projects WHERE ${clauses.join(" AND ")} ORDER BY Date DESC ${paged}`);
    return result.recordset;
};

const count = async (formType) => {
    const pool = getPool();
    const result = await pool.request().input("FormType", sql.NVarChar, formType)
        .query("SELECT COUNT(*) AS total FROM Projects WHERE IsDeleted = 0 AND FormType = @FormType");
    return result.recordset[0].total;
};

const searchOptions = async (formType) => {
    const pool = getPool();
    const result = await pool.request().input("FormType", sql.NVarChar, formType)
        .query("SELECT Id, ProjectName, Date FROM Projects WHERE IsDeleted = 0 AND FormType = @FormType ORDER BY Date DESC");
    return result.recordset;
};

const findById = async (id) => {
    const pool = getPool();
    const result = await pool.request().input("Id", sql.Int, id)
        .query("SELECT * FROM Projects WHERE Id = @Id");
    return result.recordset[0] || null;
};

const create = async (p) => {
    const pool = getPool();
    const result = await pool.request()
        .input("ProjectName", sql.NVarChar, p.projectName)
        .input("Description", sql.NVarChar, p.description || null)
        .input("Date", sql.Date, p.date ? new Date(p.date) : new Date())
        .input("FormType", sql.NVarChar, p.formType)
        .input("Status", sql.NVarChar, p.status || null)
        .query(`INSERT INTO Projects (ProjectName, Description, Date, FormType, Status, IsDeleted)
                OUTPUT INSERTED.Id, INSERTED.ProjectName
                VALUES (@ProjectName, @Description, @Date, @FormType, @Status, 0)`);
    return result.recordset[0];
};

const update = async (id, p) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Id", sql.Int, id)
        .input("ProjectName", sql.NVarChar, p.ProjectName)
        .input("Description", sql.NVarChar, p.Description || null)
        .input("Date", sql.Date, p.Date ? new Date(p.Date) : new Date())
        .input("Status", sql.NVarChar, p.Status || null)
        .query(`UPDATE Projects SET ProjectName=@ProjectName, Description=@Description, Date=@Date, Status=@Status
                OUTPUT INSERTED.ProjectName WHERE Id=@Id`);
    return result.recordset[0];
};

const softDelete = async (id) => {
    const pool = getPool();
    await pool.request().input("Id", sql.Int, id)
        .query("UPDATE Projects SET IsDeleted = 1 WHERE Id = @Id");
};

module.exports = { list, count, searchOptions, findById, create, update, softDelete };
