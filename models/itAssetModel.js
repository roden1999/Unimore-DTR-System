const fs = require('fs');
const path = require('path');
const { getPool, sql } = require('../config/db');

let schemaReady = false;
const ensureSchema = async () => {
    if (schemaReady) return;
    const script = fs.readFileSync(path.join(__dirname, '..', 'database', 'it_assets_schema.sql'), 'utf8');
    await getPool().request().batch(script);
    schemaReady = true;
};

const fields = {
    AssetTag: sql.NVarChar(60), Category: sql.NVarChar(60), AssetType: sql.NVarChar(100), Brand: sql.NVarChar(100),
    Model: sql.NVarChar(150), SerialNo: sql.NVarChar(150), HostName: sql.NVarChar(150), Specifications: sql.NVarChar(sql.MAX),
    IPAddress: sql.NVarChar(80), MACAddress: sql.NVarChar(80), Location: sql.NVarChar(180), AssignedEmployeeId: sql.Int,
    PurchaseDate: sql.Date, WarrantyExpiry: sql.Date, Vendor: sql.NVarChar(180), Cost: sql.Decimal(18, 2),
    Status: sql.NVarChar(40), Condition: sql.NVarChar(40), Notes: sql.NVarChar(700),
};

const bind = (request, data) => {
    Object.entries(fields).forEach(([name, type]) => request.input(name, type, data[name] === '' || data[name] === undefined ? null : data[name]));
    return request;
};

const list = async ({ category, status, search }) => {
    await ensureSchema();
    const request = getPool().request(); const clauses = ['a.IsDeleted=0'];
    if (category) { request.input('Category', sql.NVarChar(60), category); clauses.push('a.Category=@Category'); }
    if (status) { request.input('StatusFilter', sql.NVarChar(40), status); clauses.push('a.[Status]=@StatusFilter'); }
    if (search) {
        request.input('Search', sql.NVarChar(200), `%${search}%`);
        clauses.push(`(a.AssetTag LIKE @Search OR a.AssetType LIKE @Search OR a.Brand LIKE @Search OR a.Model LIKE @Search OR a.SerialNo LIKE @Search OR a.HostName LIKE @Search OR a.Location LIKE @Search)`);
    }
    return (await request.query(`SELECT a.*, CONCAT(e.FirstName,' ',ISNULL(e.MiddleName,''),' ',e.LastName) AssignedEmployee,
        e.EmployeeNo AssignedEmployeeNo, e.Image AssignedEmployeeImage
        FROM ITAssets a LEFT JOIN Employees e ON e.Id=a.AssignedEmployeeId
        WHERE ${clauses.join(' AND ')} ORDER BY a.AssetTag`)).recordset;
};

const findById = async id => {
    await ensureSchema();
    return (await getPool().request().input('Id', sql.Int, id).query('SELECT * FROM ITAssets WHERE Id=@Id AND IsDeleted=0')).recordset[0] || null;
};

const create = async (data, userId) => {
    await ensureSchema();
    data = { Status: 'In Stock', Condition: 'Good', ...data };
    const request = bind(getPool().request(), data).input('CreatedBy', sql.Int, userId || null);
    return (await request.query(`INSERT INTO ITAssets (${Object.keys(fields).map(name => `[${name}]`).join(',')},CreatedBy) OUTPUT INSERTED.*
        VALUES (${Object.keys(fields).map(name => '@' + name).join(',')},@CreatedBy)`)).recordset[0];
};

const update = async (id, data) => {
    await ensureSchema();
    const request = bind(getPool().request(), data).input('Id', sql.Int, id);
    return (await request.query(`UPDATE ITAssets SET ${Object.keys(fields).map(name => `[${name}]=@${name}`).join(',')},UpdatedAt=SYSUTCDATETIME()
        OUTPUT INSERTED.* WHERE Id=@Id AND IsDeleted=0`)).recordset[0] || null;
};

const remove = async id => {
    await ensureSchema();
    return (await getPool().request().input('Id', sql.Int, id).query('UPDATE ITAssets SET IsDeleted=1,UpdatedAt=SYSUTCDATETIME() OUTPUT INSERTED.Id WHERE Id=@Id AND IsDeleted=0')).recordset[0] || null;
};

const dashboard = async () => {
    await ensureSchema();
    const result = await getPool().request().query(`
        SELECT COUNT(*) TotalAssets, SUM(CASE WHEN [Status]='Deployed' THEN 1 ELSE 0 END) Deployed,
          SUM(CASE WHEN [Status]='In Stock' THEN 1 ELSE 0 END) InStock,
          SUM(CASE WHEN [Status]='Under Repair' THEN 1 ELSE 0 END) UnderRepair,
          SUM(CASE WHEN WarrantyExpiry IS NOT NULL AND WarrantyExpiry BETWEEN CAST(GETDATE() AS DATE) AND DATEADD(DAY,60,CAST(GETDATE() AS DATE)) THEN 1 ELSE 0 END) WarrantyExpiring
        FROM ITAssets WHERE IsDeleted=0;
        SELECT Category,COUNT(*) AssetCount FROM ITAssets WHERE IsDeleted=0 GROUP BY Category ORDER BY AssetCount DESC;
        SELECT TOP 8 Id,AssetTag,Category,Brand,Model,[Status],WarrantyExpiry FROM ITAssets WHERE IsDeleted=0 AND
          ([Status]='Under Repair' OR (WarrantyExpiry IS NOT NULL AND WarrantyExpiry<=DATEADD(DAY,60,CAST(GETDATE() AS DATE))))
          ORDER BY CASE WHEN [Status]='Under Repair' THEN 0 ELSE 1 END,WarrantyExpiry;
    `);
    return { summary: result.recordsets[0][0], categories: result.recordsets[1], attention: result.recordsets[2] };
};

module.exports = { ensureSchema, list, findById, create, update, remove, dashboard };
