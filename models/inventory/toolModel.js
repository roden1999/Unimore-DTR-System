const { getPool, sql } = require("../../config/db");

// A tool is "On Hand" unless it currently has an un-returned record.
const AVAILABLE_EXPR = `
    CASE WHEN EXISTS (
        SELECT 1 FROM Records r WHERE r.ToolId = t.Id AND r.Status = 'Borrowed'
    ) THEN 'Borrowed' ELSE 'On Hand' END`;

const buildFilterClause = (ids, brands, categories, statuses) => {
    const clauses = ["t.IsDeleted = 0"];
    if (ids && ids.length) clauses.push(`t.Id IN (${ids.map(Number).filter(Boolean).join(",") || 0})`);
    if (brands && brands.length) clauses.push(`t.Brand IN (${brands.map(b => `'${String(b).replace(/'/g, "''")}'`).join(",")})`);
    if (categories && categories.length) clauses.push(`t.Category IN (${categories.map(c => `'${String(c).replace(/'/g, "''")}'`).join(",")})`);
    if (statuses && statuses.length) clauses.push(`t.Status IN (${statuses.map(s => `'${String(s).replace(/'/g, "''")}'`).join(",")})`);
    return clauses.join(" AND ");
};

const list = async ({ ids = [], brands = [], categories = [], statuses = [], offset = 0, limit = 12 }) => {
    const pool = getPool();
    const where = buildFilterClause(ids, brands, categories, statuses);
    const paged = ids.length > 0 ? "" : `OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    const result = await pool.request().query(`
        SELECT t.*, ${AVAILABLE_EXPR} AS Available
        FROM Tools t WHERE ${where}
        ORDER BY t.Name ${paged}`);
    return result.recordset;
};

const count = async ({ brands = [], categories = [], statuses = [] }) => {
    const pool = getPool();
    const where = buildFilterClause([], brands, categories, statuses);
    const result = await pool.request().query(`SELECT COUNT(*) AS total FROM Tools t WHERE ${where}`);
    return result.recordset[0].total;
};

const searchOptions = async ({ brands = [], categories = [], statuses = [] }) => {
    const pool = getPool();
    const where = buildFilterClause([], brands, categories, statuses);
    const result = await pool.request().query(
        `SELECT t.Id, t.Name, t.SerialNo FROM Tools t WHERE ${where} ORDER BY t.Name`);
    return result.recordset;
};

// Tools that are currently on hand (available to borrow).
const availableForBorrow = async () => {
    const pool = getPool();
    const result = await pool.request().query(`
        SELECT t.Id, t.Name, t.SerialNo FROM Tools t
        WHERE t.IsDeleted = 0 AND NOT EXISTS (
            SELECT 1 FROM Records r WHERE r.ToolId = t.Id AND r.Status = 'Borrowed'
        ) ORDER BY t.Name`);
    return result.recordset;
};

const brandOptions = async () => {
    const pool = getPool();
    const result = await pool.request().query(
        `SELECT DISTINCT Brand FROM Tools WHERE IsDeleted = 0 AND Brand IS NOT NULL AND Brand <> '' ORDER BY Brand`);
    return result.recordset;
};

const getAllForPdf = async () => {
    const pool = getPool();
    const result = await pool.request().query(
        `SELECT t.*, ${AVAILABLE_EXPR} AS Available FROM Tools t WHERE t.IsDeleted = 0 ORDER BY t.Name`);
    return result.recordset;
};

const findById = async (id) => {
    const pool = getPool();
    const result = await pool.request().input("Id", sql.Int, id)
        .query("SELECT * FROM Tools WHERE Id = @Id");
    return result.recordset[0] || null;
};

const findBySerial = async (serialNo) => {
    const pool = getPool();
    const result = await pool.request().input("SerialNo", sql.NVarChar, serialNo)
        .query("SELECT * FROM Tools WHERE SerialNo = @SerialNo AND IsDeleted = 0");
    return result.recordset[0] || null;
};

const create = async (t) => {
    const pool = getPool();
    const result = await pool.request()
        .input("SerialNo", sql.NVarChar, t.serialNo)
        .input("Name", sql.NVarChar, t.name)
        .input("Brand", sql.NVarChar, t.brand || null)
        .input("Category", sql.NVarChar, t.category)
        .input("DatePurchased", sql.Date, t.datePurchased ? new Date(t.datePurchased) : null)
        .input("Location", sql.NVarChar, t.location || null)
        .input("Description", sql.NVarChar, t.description || null)
        .input("Status", sql.NVarChar, t.status || null)
        .query(`INSERT INTO Tools (SerialNo, Name, Brand, Category, DatePurchased, Location, Description, Status, IsDeleted)
                OUTPUT INSERTED.Id, INSERTED.Name
                VALUES (@SerialNo, @Name, @Brand, @Category, @DatePurchased, @Location, @Description, @Status, 0)`);
    return result.recordset[0];
};

const update = async (id, t) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Id", sql.Int, id)
        .input("SerialNo", sql.NVarChar, t.SerialNo)
        .input("Name", sql.NVarChar, t.Name)
        .input("Brand", sql.NVarChar, t.Brand || null)
        .input("Category", sql.NVarChar, t.Category)
        .input("DatePurchased", sql.Date, t.DatePurchased ? new Date(t.DatePurchased) : null)
        .input("Location", sql.NVarChar, t.Location || null)
        .input("Description", sql.NVarChar, t.Description || null)
        .input("Status", sql.NVarChar, t.Status || null)
        .query(`UPDATE Tools SET SerialNo=@SerialNo, Name=@Name, Brand=@Brand, Category=@Category,
                DatePurchased=@DatePurchased, Location=@Location, Description=@Description, Status=@Status
                OUTPUT INSERTED.Name WHERE Id=@Id`);
    return result.recordset[0];
};

const softDelete = async (id) => {
    const pool = getPool();
    await pool.request().input("Id", sql.Int, id)
        .query("UPDATE Tools SET IsDeleted = 1 WHERE Id = @Id");
};

module.exports = {
    list, count, searchOptions, availableForBorrow, brandOptions,
    getAllForPdf, findById, findBySerial, create, update, softDelete
};
