const { getPool, sql } = require("../../config/db");

// Low stock when the remaining amount is at or below the critical level.
const CRIT_EXPR = `CASE WHEN (c.Quantity - c.Used) <= c.CriticalLevel THEN 1 ELSE 0 END`;

const list = async ({ ids = [], offset = 0, limit = 12 }) => {
    const pool = getPool();
    const idClause = ids.length ? `AND c.Id IN (${ids.map(Number).filter(Boolean).join(",") || 0})` : "";
    const paged = ids.length ? "" : `OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    const result = await pool.request().query(`
        SELECT c.*, ${CRIT_EXPR} AS CritLevelIndicator
        FROM Consumables c WHERE c.IsDeleted = 0 ${idClause}
        ORDER BY c.Name ${paged}`);
    return result.recordset;
};

const count = async () => {
    const pool = getPool();
    const result = await pool.request().query("SELECT COUNT(*) AS total FROM Consumables WHERE IsDeleted = 0");
    return result.recordset[0].total;
};

const searchOptions = async () => {
    const pool = getPool();
    const result = await pool.request().query(
        "SELECT Id, Name, Quantity, Used FROM Consumables WHERE IsDeleted = 0 ORDER BY Name");
    return result.recordset;
};

const getAllForPdf = async () => {
    const pool = getPool();
    const result = await pool.request().query(
        `SELECT c.*, ${CRIT_EXPR} AS CritLevelIndicator FROM Consumables c WHERE c.IsDeleted = 0 ORDER BY c.Name`);
    return result.recordset;
};

const findById = async (id) => {
    const pool = getPool();
    const result = await pool.request().input("Id", sql.Int, id)
        .query("SELECT * FROM Consumables WHERE Id = @Id");
    return result.recordset[0] || null;
};

const create = async (c) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Name", sql.NVarChar, c.name)
        .input("Brand", sql.NVarChar, c.brand || null)
        .input("Unit", sql.NVarChar, c.unit || null)
        .input("DatePurchased", sql.Date, c.datePurchased ? new Date(c.datePurchased) : null)
        .input("Description", sql.NVarChar, c.description || null)
        .input("Quantity", sql.Decimal(18, 2), Number(c.quantity) || 0)
        .input("Used", sql.Decimal(18, 2), Number(c.used) || 0)
        .input("CriticalLevel", sql.Decimal(18, 2), Number(c.critLevel) || 0)
        .query(`INSERT INTO Consumables (Name, Brand, Unit, DatePurchased, Description, Quantity, Used, CriticalLevel, IsDeleted)
                OUTPUT INSERTED.Id, INSERTED.Name
                VALUES (@Name, @Brand, @Unit, @DatePurchased, @Description, @Quantity, @Used, @CriticalLevel, 0)`);
    return result.recordset[0];
};

const update = async (id, c) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Id", sql.Int, id)
        .input("Name", sql.NVarChar, c.Name)
        .input("Brand", sql.NVarChar, c.Brand || null)
        .input("Unit", sql.NVarChar, c.Unit || null)
        .input("DatePurchased", sql.Date, c.DatePurchased ? new Date(c.DatePurchased) : null)
        .input("Description", sql.NVarChar, c.Description || null)
        .input("Quantity", sql.Decimal(18, 2), Number(c.Quantity) || 0)
        .input("Used", sql.Decimal(18, 2), Number(c.Used) || 0)
        .input("CriticalLevel", sql.Decimal(18, 2), Number(c.CriticalLevel) || 0)
        .query(`UPDATE Consumables SET Name=@Name, Brand=@Brand, Unit=@Unit, DatePurchased=@DatePurchased,
                Description=@Description, Quantity=@Quantity, Used=@Used, CriticalLevel=@CriticalLevel
                OUTPUT INSERTED.Name WHERE Id=@Id`);
    return result.recordset[0];
};

// Adjust the Used counter by a delta (positive to consume, negative to return).
const adjustUsed = async (id, delta) => {
    const pool = getPool();
    await pool.request()
        .input("Id", sql.Int, id)
        .input("Delta", sql.Decimal(18, 2), delta)
        .query("UPDATE Consumables SET Used = Used + @Delta WHERE Id = @Id");
};

const softDelete = async (id) => {
    const pool = getPool();
    await pool.request().input("Id", sql.Int, id)
        .query("UPDATE Consumables SET IsDeleted = 1 WHERE Id = @Id");
};

module.exports = { list, count, searchOptions, getAllForPdf, findById, create, update, adjustUsed, softDelete };
