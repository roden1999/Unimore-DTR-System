const fs = require('fs');
const path = require('path');
const { getPool, sql } = require('../config/db');

let schemaReady = false;
const ensureSchema = async () => {
    if (schemaReady) return;
    await getPool().request().batch(fs.readFileSync(path.join(__dirname, '..', 'database', 'sales_schema.sql'), 'utf8'));
    schemaReady = true;
};

const value = v => v === '' || v === undefined ? null : v;
const bind = (request, fields, data) => {
    const names = [];
    Object.entries(fields).forEach(([name, type]) => {
        if (data[name] !== undefined) { request.input(name, type, value(data[name])); names.push(name); }
    });
    return names;
};
const badRequest = message => { const error = new Error(message); error.status = 400; throw error; };
const conflict = message => { const error = new Error(message); error.status = 409; throw error; };

const customerFields = {
    CustomerCode: sql.NVarChar(40), CustomerName: sql.NVarChar(180), CustomerType: sql.NVarChar(40),
    ContactPerson: sql.NVarChar(150), ContactNo: sql.NVarChar(80), Email: sql.NVarChar(180),
    BillingAddress: sql.NVarChar(500), DeliveryAddress: sql.NVarChar(500), TaxIdentificationNo: sql.NVarChar(80),
    CreditTerms: sql.NVarChar(80), Notes: sql.NVarChar(700), IsActive: sql.Bit,
};
const productFields = {
    ProductCode: sql.NVarChar(50), ProductName: sql.NVarChar(180), Category: sql.NVarChar(80),
    Description: sql.NVarChar(500), PricingUnit: sql.NVarChar(40), BasePrice: sql.Decimal(18, 2),
    IsMadeToOrder: sql.Bit, SpecificationFields: sql.NVarChar(500), Notes: sql.NVarChar(700), IsActive: sql.Bit,
};
const inquiryFields = {
    InquiryNo: sql.NVarChar(60), CustomerId: sql.Int, InquiryDate: sql.Date, ValidUntil: sql.Date,
    FulfillmentType: sql.NVarChar(40), DeliveryAddress: sql.NVarChar(500), TaxMode: sql.NVarChar(30),
    TaxRate: sql.Decimal(8, 3), SubTotal: sql.Decimal(18, 2), DiscountAmount: sql.Decimal(18, 2),
    TaxAmount: sql.Decimal(18, 2), GrandTotal: sql.Decimal(18, 2), Status: sql.NVarChar(30), Notes: sql.NVarChar(1000),
};
const orderFields = {
    JobOrderNo: sql.NVarChar(60), InquiryId: sql.Int, CustomerId: sql.Int, CustomerReference: sql.NVarChar(100),
    OrderDate: sql.Date, RequiredDate: sql.Date, FulfillmentType: sql.NVarChar(40), DeliveryAddress: sql.NVarChar(500),
    WorkflowStage: sql.NVarChar(40), ProductionBatchNo: sql.NVarChar(60), TaxMode: sql.NVarChar(30),
    TaxRate: sql.Decimal(8, 3), SubTotal: sql.Decimal(18, 2), DiscountAmount: sql.Decimal(18, 2),
    TaxAmount: sql.Decimal(18, 2), GrandTotal: sql.Decimal(18, 2), PaymentStatus: sql.NVarChar(30),
    AmountPaid: sql.Decimal(18, 2), Notes: sql.NVarChar(1000), SpecialInstructions: sql.NVarChar(1000),
};

const getSettings = async () => {
    await ensureSchema();
    const result = await getPool().request().query('SELECT SettingKey,SettingValue,Description FROM SalesSettings ORDER BY SettingKey; SELECT * FROM SalesWorkflowStages ORDER BY SortOrder;');
    const settings = result.recordsets[0].reduce((all, row) => ({ ...all, [row.SettingKey]: row.SettingValue }), {});
    return { settings, definitions: result.recordsets[0], stages: result.recordsets[1] };
};
const saveSettings = async (data, userId) => {
    await ensureSchema();
    const allowed = ['CurrencySymbol', 'DefaultTaxMode', 'DefaultTaxRate', 'RequireQARelease', 'AllowStockFulfillment'];
    for (const key of allowed) if (data.settings && data.settings[key] !== undefined) {
        await getPool().request().input('Key', sql.NVarChar(80), key).input('Value', sql.NVarChar(sql.MAX), String(data.settings[key]))
            .input('UserId', sql.Int, userId || null).query('UPDATE SalesSettings SET SettingValue=@Value,UpdatedAt=SYSUTCDATETIME(),UpdatedBy=@UserId WHERE SettingKey=@Key');
    }
    for (const stage of (data.stages || [])) {
        await getPool().request().input('Key', sql.NVarChar(40), stage.StageKey).input('Label', sql.NVarChar(100), stage.StageLabel)
            .input('Active', sql.Bit, stage.IsActive === undefined ? true : stage.IsActive)
            .query('UPDATE SalesWorkflowStages SET StageLabel=@Label,IsActive=@Active WHERE StageKey=@Key');
    }
    return getSettings();
};

const listSimple = async (kind, search = '') => {
    await ensureSchema();
    const isCustomer = kind === 'customers';
    const table = isCustomer ? 'SalesCustomers' : 'SalesProducts';
    const columns = isCustomer ? '(CustomerCode LIKE @Search OR CustomerName LIKE @Search OR ContactPerson LIKE @Search OR ContactNo LIKE @Search)' : '(ProductCode LIKE @Search OR ProductName LIKE @Search OR Category LIKE @Search)';
    const request = getPool().request().input('Search', sql.NVarChar(220), `%${search || ''}%`);
    return (await request.query(`SELECT * FROM ${table} WHERE IsDeleted=0 AND ${columns} ORDER BY ${isCustomer ? 'CustomerName' : 'Category,ProductName'}`)).recordset;
};
const findSimple = async (kind, id) => {
    const table = kind === 'customers' ? 'SalesCustomers' : 'SalesProducts';
    return (await getPool().request().input('Id', sql.Int, id).query(`SELECT * FROM ${table} WHERE Id=@Id AND IsDeleted=0`)).recordset[0] || null;
};
const createSimple = async (kind, data, userId) => {
    await ensureSchema();
    const customer = kind === 'customers', fields = customer ? customerFields : productFields, table = customer ? 'SalesCustomers' : 'SalesProducts';
    if (customer && (!data.CustomerCode || !data.CustomerName)) badRequest('Customer code and customer name are required.');
    if (!customer && (!data.ProductCode || !data.ProductName || !data.Category || !data.PricingUnit)) badRequest('Product code, name, category and pricing unit are required.');
    const request = getPool().request().input('CreatedBy', sql.Int, userId || null), names = bind(request, fields, data);
    return (await request.query(`INSERT INTO ${table} (${names.map(n => `[${n}]`).join(',')},CreatedBy) OUTPUT INSERTED.* VALUES (${names.map(n => '@' + n).join(',')},@CreatedBy)`)).recordset[0];
};
const updateSimple = async (kind, id, data) => {
    await ensureSchema();
    const customer = kind === 'customers', fields = customer ? customerFields : productFields, table = customer ? 'SalesCustomers' : 'SalesProducts';
    const request = getPool().request().input('Id', sql.Int, id), names = bind(request, fields, data);
    if (!names.length) return findSimple(kind, id);
    return (await request.query(`UPDATE ${table} SET ${names.map(n => `[${n}]=@${n}`).join(',')},UpdatedAt=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE Id=@Id AND IsDeleted=0`)).recordset[0] || null;
};
const removeSimple = async (kind, id) => {
    const table = kind === 'customers' ? 'SalesCustomers' : 'SalesProducts';
    return (await getPool().request().input('Id', sql.Int, id).query(`UPDATE ${table} SET IsDeleted=1,IsActive=0,UpdatedAt=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE Id=@Id AND IsDeleted=0`)).recordset[0] || null;
};

const nextNumber = async (prefix, transaction) => {
    const request = transaction ? new sql.Request(transaction) : getPool().request();
    const row = (await request.query('SELECT NEXT VALUE FOR dbo.SalesDocumentSequence AS Seq')).recordset[0];
    return `${prefix}-${String(row.Seq).padStart(6, '0')}`;
};
const normalizeItems = (items, allowStock = true) => {
    if (!Array.isArray(items) || !items.length) badRequest('Add at least one item.');
    return items.map(item => {
        const quantity = Number(item.Quantity || 0), unitPrice = Number(item.UnitPrice || 0), discount = Number(item.DiscountPercent || 0);
        if (!item.ItemDescription || quantity <= 0 || !item.Unit) badRequest('Every item needs a description, quantity greater than zero, and unit.');
        return { ...item, ProductId: value(item.ProductId), Quantity: quantity, UnitPrice: unitPrice, DiscountPercent: discount, LineTotal: Math.round((quantity * unitPrice * (1 - discount / 100)) * 100) / 100, IsMadeToOrder: allowStock && (item.IsMadeToOrder === false || item.IsMadeToOrder === 0) ? 0 : 1 };
    });
};
const totals = (data, items) => {
    const subTotal = items.reduce((sum, item) => sum + item.LineTotal, 0), discount = Number(data.DiscountAmount || 0), taxable = Math.max(0, subTotal - discount);
    const rate = Number(data.TaxRate || 0), mode = data.TaxMode || 'VAT Exclusive';
    const tax = mode === 'VAT Exclusive' ? taxable * rate / 100 : mode === 'VAT Inclusive' && rate ? taxable * rate / (100 + rate) : 0;
    return { ...data, SubTotal: subTotal, DiscountAmount: discount, TaxAmount: Math.round(tax * 100) / 100, GrandTotal: Math.round((mode === 'VAT Exclusive' ? taxable + tax : taxable) * 100) / 100 };
};
const saveItems = async (transaction, table, foreignKey, id, items, replace = false) => {
    if (replace) await new sql.Request(transaction).input('Id', sql.Int, id).query(`DELETE FROM ${table} WHERE ${foreignKey}=@Id`);
    for (const item of items) await new sql.Request(transaction).input('DocumentId', sql.Int, id).input('ProductId', sql.Int, item.ProductId)
        .input('ItemDescription', sql.NVarChar(250), item.ItemDescription).input('Specification', sql.NVarChar(1000), value(item.Specification))
        .input('Quantity', sql.Decimal(18, 3), item.Quantity).input('Unit', sql.NVarChar(40), item.Unit)
        .input('UnitPrice', sql.Decimal(18, 2), item.UnitPrice).input('DiscountPercent', sql.Decimal(8, 3), item.DiscountPercent)
        .input('LineTotal', sql.Decimal(18, 2), item.LineTotal).input('IsMadeToOrder', sql.Bit, item.IsMadeToOrder)
        .input('Notes', sql.NVarChar(500), value(item.Notes)).query(`INSERT INTO ${table}(${foreignKey},ProductId,ItemDescription,Specification,Quantity,Unit,UnitPrice,DiscountPercent,LineTotal,IsMadeToOrder,Notes) VALUES(@DocumentId,@ProductId,@ItemDescription,@Specification,@Quantity,@Unit,@UnitPrice,@DiscountPercent,@LineTotal,@IsMadeToOrder,@Notes)`);
};
const listDocuments = async (kind, filters = {}) => {
    await ensureSchema();
    const inquiry = kind === 'inquiries', table = inquiry ? 'SalesInquiries' : 'SalesOrders', itemTable = inquiry ? 'SalesInquiryItems' : 'SalesOrderItems', fk = inquiry ? 'InquiryId' : 'SalesOrderId';
    const request = getPool().request(), clauses = ['d.IsDeleted=0'];
    if (filters.search) { request.input('Search', sql.NVarChar(240), `%${filters.search}%`); clauses.push(`(${inquiry ? 'd.InquiryNo' : 'd.JobOrderNo'} LIKE @Search OR c.CustomerName LIKE @Search OR ISNULL(d.Notes,'') LIKE @Search)`); }
    if (filters.status) { request.input('Status', sql.NVarChar(40), filters.status); clauses.push(`${inquiry ? 'd.Status' : 'd.WorkflowStage'}=@Status`); }
    const documents = (await request.query(`SELECT d.*,c.CustomerCode,c.CustomerName,c.ContactPerson,c.ContactNo,c.Email,c.DeliveryAddress CustomerDeliveryAddress${inquiry ? '' : ',s.StageLabel,s.Color,s.ResponsibleModule'} FROM ${table} d INNER JOIN SalesCustomers c ON c.Id=d.CustomerId ${inquiry ? '' : 'LEFT JOIN SalesWorkflowStages s ON s.StageKey=d.WorkflowStage'} WHERE ${clauses.join(' AND ')} ORDER BY ${inquiry ? 'd.InquiryDate' : 'd.OrderDate'} DESC,d.Id DESC`)).recordset;
    if (!documents.length) return [];
    const items = (await getPool().request().query(`SELECT i.*,p.ProductCode,p.Category FROM ${itemTable} i LEFT JOIN SalesProducts p ON p.Id=i.ProductId ORDER BY i.Id`)).recordset;
    const grouped = items.reduce((all, item) => ({ ...all, [item[fk]]: [...(all[item[fk]] || []), item] }), {});
    return documents.map(document => ({ ...document, Items: grouped[document.Id] || [] }));
};
const findDocument = async (kind, id) => (await listDocuments(kind, {})).find(row => row.Id === Number(id)) || null;

const createInquiry = async (data, userId) => {
    await ensureSchema(); const allowStock = String((await getSettings()).settings.AllowStockFulfillment).toLowerCase() === 'true', items = normalizeItems(data.Items, allowStock), normalized = totals({ Status: 'Open', ...data }, items);
    if (!normalized.CustomerId || !normalized.InquiryDate) badRequest('Customer and inquiry date are required.');
    const transaction = new sql.Transaction(getPool()); await transaction.begin();
    try {
        if (!normalized.InquiryNo) normalized.InquiryNo = await nextNumber('INQ', transaction);
        const request = new sql.Request(transaction).input('CreatedBy', sql.Int, userId || null), names = bind(request, inquiryFields, normalized);
        const row = (await request.query(`INSERT INTO SalesInquiries(${names.map(n => `[${n}]`).join(',')},CreatedBy) OUTPUT INSERTED.* VALUES(${names.map(n => '@' + n).join(',')},@CreatedBy)`)).recordset[0];
        await saveItems(transaction, 'SalesInquiryItems', 'InquiryId', row.Id, items); await transaction.commit(); return row;
    } catch (error) { await transaction.rollback(); throw error; }
};
const updateInquiry = async (id, data) => {
    await ensureSchema(); const old = await findDocument('inquiries', id); if (!old) return null;
    if (old.Status === 'Converted') conflict('Converted inquiries cannot be edited. Edit the job order instead.');
    const allowStock = String((await getSettings()).settings.AllowStockFulfillment).toLowerCase() === 'true', items = normalizeItems(data.Items, allowStock), normalized = totals(data, items), transaction = new sql.Transaction(getPool()); await transaction.begin();
    try { const request = new sql.Request(transaction).input('Id', sql.Int, id), names = bind(request, inquiryFields, normalized); const row = (await request.query(`UPDATE SalesInquiries SET ${names.map(n => `[${n}]=@${n}`).join(',')},UpdatedAt=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE Id=@Id AND IsDeleted=0`)).recordset[0]; await saveItems(transaction, 'SalesInquiryItems', 'InquiryId', id, items, true); await transaction.commit(); return row; } catch (error) { await transaction.rollback(); throw error; }
};
const removeInquiry = async id => (await getPool().request().input('Id', sql.Int, id).query("UPDATE SalesInquiries SET IsDeleted=1,Status='Cancelled',UpdatedAt=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE Id=@Id AND IsDeleted=0 AND Status<>'Converted'" )).recordset[0] || null;

const createOrder = async (data, userId, transactionOverride = null) => {
    await ensureSchema(); const allowStock = String((await getSettings()).settings.AllowStockFulfillment).toLowerCase() === 'true', items = normalizeItems(data.Items, allowStock), normalized = totals({ WorkflowStage: 'PRODUCTION_QUEUE', PaymentStatus: 'Unbilled', AmountPaid: 0, ...data }, items);
    if (!normalized.CustomerId || !normalized.OrderDate) badRequest('Customer and order date are required.');
    const transaction = transactionOverride || new sql.Transaction(getPool()); if (!transactionOverride) await transaction.begin();
    try {
        if (!normalized.JobOrderNo) normalized.JobOrderNo = await nextNumber('JO', transaction);
        const request = new sql.Request(transaction).input('CreatedBy', sql.Int, userId || null), names = bind(request, orderFields, normalized);
        const row = (await request.query(`INSERT INTO SalesOrders(${names.map(n => `[${n}]`).join(',')},CreatedBy) OUTPUT INSERTED.* VALUES(${names.map(n => '@' + n).join(',')},@CreatedBy)`)).recordset[0];
        await saveItems(transaction, 'SalesOrderItems', 'SalesOrderId', row.Id, items); if (!transactionOverride) await transaction.commit(); return row;
    } catch (error) { if (!transactionOverride) await transaction.rollback(); throw error; }
};
const updateOrder = async (id, data) => {
    await ensureSchema(); const old = await findDocument('orders', id); if (!old) return null;
    if (!['PRODUCTION_QUEUE'].includes(old.WorkflowStage)) conflict('This job order is already being processed. Only payment and workflow teams should update it now.');
    const allowStock = String((await getSettings()).settings.AllowStockFulfillment).toLowerCase() === 'true', items = normalizeItems(data.Items, allowStock), normalized = totals(data, items), transaction = new sql.Transaction(getPool()); await transaction.begin();
    try { const request = new sql.Request(transaction).input('Id', sql.Int, id), names = bind(request, orderFields, normalized); const row = (await request.query(`UPDATE SalesOrders SET ${names.map(n => `[${n}]=@${n}`).join(',')},UpdatedAt=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE Id=@Id AND IsDeleted=0`)).recordset[0]; await saveItems(transaction, 'SalesOrderItems', 'SalesOrderId', id, items, true); await transaction.commit(); return row; } catch (error) { await transaction.rollback(); throw error; }
};
const removeOrder = async id => (await getPool().request().input('Id', sql.Int, id).query("UPDATE SalesOrders SET IsDeleted=1,WorkflowStage='CANCELLED',UpdatedAt=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE Id=@Id AND IsDeleted=0 AND WorkflowStage NOT IN ('DISPATCH','COMPLETED')" )).recordset[0] || null;
const convertInquiry = async (id, data, userId) => {
    await ensureSchema(); const inquiry = await findDocument('inquiries', id); if (!inquiry) return null; if (inquiry.Status === 'Converted') conflict('This inquiry has already been converted.');
    const transaction = new sql.Transaction(getPool()); await transaction.begin();
    try {
        const order = await createOrder({ ...inquiry, ...data, InquiryId: inquiry.Id, JobOrderNo: data.JobOrderNo || '', OrderDate: data.OrderDate, RequiredDate: data.RequiredDate, WorkflowStage: 'PRODUCTION_QUEUE', Items: inquiry.Items }, userId, transaction);
        await new sql.Request(transaction).input('Id', sql.Int, id).query("UPDATE SalesInquiries SET Status='Converted',UpdatedAt=SYSUTCDATETIME() WHERE Id=@Id"); await transaction.commit(); return order;
    } catch (error) { await transaction.rollback(); throw error; }
};

const productionOrders = async filters => listDocuments('orders', { ...filters, status: filters.status || '' });
const productionBatches = async () => { await ensureSchema(); return (await getPool().request().query("SELECT Id,BatchNo,FinishedProduct,Quantity,ProductionDate,QAStatus FROM ProductionTraceability WHERE Status NOT IN ('Cancelled') ORDER BY ProductionDate DESC,Id DESC")).recordset; };
const updateProduction = async (id, data) => {
    await ensureSchema(); const order = await findDocument('orders', id); if (!order) return null;
    const action = data.action; let stage = order.WorkflowStage, extra = '', batchNo = data.ProductionBatchNo || order.ProductionBatchNo || null;
    if (action === 'START') { if (stage !== 'PRODUCTION_QUEUE') conflict('Only queued job orders can be started.'); stage = 'IN_PRODUCTION'; extra = ',ProductionStartedAt=SYSUTCDATETIME()'; }
    else if (action === 'COMPLETE') {
        if (stage !== 'IN_PRODUCTION') conflict('Start the job order before completing production.');
        const settings = (await getSettings()).settings, requireQA = String(settings.RequireQARelease).toLowerCase() === 'true';
        if (requireQA) {
            if (!batchNo) badRequest('Link a production batch before submitting this job order to QA.');
            const batch = (await getPool().request().input('BatchNo', sql.NVarChar(60), batchNo).query('SELECT Id FROM ProductionTraceability WHERE BatchNo=@BatchNo')).recordset[0];
            if (!batch) badRequest('The selected production batch no longer exists.');
            await getPool().request().input('BatchNo', sql.NVarChar(60), batchNo).query("UPDATE ProductionTraceability SET QAStatus='Pending Inspection',UpdatedAt=SYSUTCDATETIME() WHERE BatchNo=@BatchNo"); stage = 'FOR_QA';
        } else stage = 'READY_DISPATCH';
        extra = `,ProductionCompletedAt=SYSUTCDATETIME()${stage === 'READY_DISPATCH' ? ',ReadyAt=SYSUTCDATETIME()' : ''}`;
    } else if (action === 'RETURN_QUEUE') { if (stage !== 'IN_PRODUCTION') conflict('Only an in-progress order can be returned to the queue.'); stage = 'PRODUCTION_QUEUE'; }
    else badRequest('Unknown production action.');
    return (await getPool().request().input('Id', sql.Int, id).input('Stage', sql.NVarChar(40), stage).input('BatchNo', sql.NVarChar(60), batchNo)
        .query(`UPDATE SalesOrders SET WorkflowStage=@Stage,ProductionBatchNo=@BatchNo,UpdatedAt=SYSUTCDATETIME()${extra} OUTPUT INSERTED.* WHERE Id=@Id AND IsDeleted=0`)).recordset[0];
};

const readyForDispatch = async () => listDocuments('orders', { status: 'READY_DISPATCH' });
const createDispatch = async id => {
    await ensureSchema(); const order = await findDocument('orders', id); if (!order) return null;
    if (order.WorkflowStage !== 'READY_DISPATCH') conflict('This job order is not ready for dispatch.');
    if (order.DispatchOrderId) conflict('A dispatch record already exists for this job order.');
    const transaction = new sql.Transaction(getPool()); await transaction.begin();
    try {
        const dispatchNo = `DSP-${order.JobOrderNo}`;
        const row = (await new sql.Request(transaction).input('DispatchNo', sql.NVarChar(60), dispatchNo).input('OrderReference', sql.NVarChar(100), order.JobOrderNo)
            .input('BatchNo', sql.NVarChar(60), value(order.ProductionBatchNo)).input('CustomerName', sql.NVarChar(180), order.CustomerName)
            .input('ContactPerson', sql.NVarChar(150), value(order.ContactPerson)).input('ContactNo', sql.NVarChar(80), value(order.ContactNo))
            .input('FulfillmentType', sql.NVarChar(40), order.FulfillmentType).input('Address', sql.NVarChar(500), value(order.DeliveryAddress || order.CustomerDeliveryAddress))
            .input('Schedule', sql.DateTime2, value(order.RequiredDate)).input('Instructions', sql.NVarChar(700), value(String(order.SpecialInstructions || order.Notes || '').slice(0, 700)))
            .query("INSERT INTO DispatchOrders(DispatchNo,OrderReference,ProductionBatchNo,CustomerName,ContactPerson,ContactNo,FulfillmentType,DeliveryAddress,ScheduledDate,DeliveryFee,FeeStatus,Status,SpecialInstructions) OUTPUT INSERTED.* VALUES(@DispatchNo,@OrderReference,@BatchNo,@CustomerName,@ContactPerson,@ContactNo,@FulfillmentType,@Address,@Schedule,0,'Unbilled','Ready for Dispatch',@Instructions)")).recordset[0];
        for (const item of order.Items) await new sql.Request(transaction).input('OrderId', sql.Int, row.Id).input('Description', sql.NVarChar(250), item.ItemDescription).input('Specification', sql.NVarChar(250), value(String(item.Specification || '').slice(0, 250))).input('Quantity', sql.Decimal(18, 3), item.Quantity).input('Unit', sql.NVarChar(40), item.Unit).input('Notes', sql.NVarChar(500), value(item.Notes)).query('INSERT INTO DispatchItems(DispatchOrderId,ItemDescription,Specification,Quantity,Unit,Notes) VALUES(@OrderId,@Description,@Specification,@Quantity,@Unit,@Notes)');
        await new sql.Request(transaction).input('Id', sql.Int, id).input('DispatchId', sql.Int, row.Id).query("UPDATE SalesOrders SET DispatchOrderId=@DispatchId,WorkflowStage='DISPATCH',UpdatedAt=SYSUTCDATETIME() WHERE Id=@Id");
        await transaction.commit(); return row;
    } catch (error) { await transaction.rollback(); throw error; }
};

const dashboard = async () => {
    await ensureSchema(); const result = await getPool().request().query(`
      SELECT COUNT(*) TotalCustomers FROM SalesCustomers WHERE IsDeleted=0 AND IsActive=1;
      SELECT COUNT(*) OpenInquiries FROM SalesInquiries WHERE IsDeleted=0 AND Status='Open';
      SELECT COUNT(*) ActiveJobOrders FROM SalesOrders WHERE IsDeleted=0 AND WorkflowStage NOT IN ('COMPLETED','CANCELLED');
      SELECT COUNT(*) ProductionQueue FROM SalesOrders WHERE IsDeleted=0 AND WorkflowStage='PRODUCTION_QUEUE';
      SELECT COUNT(*) ReadyDispatch FROM SalesOrders WHERE IsDeleted=0 AND WorkflowStage='READY_DISPATCH';
      SELECT ISNULL(SUM(GrandTotal),0) OrderValue FROM SalesOrders WHERE IsDeleted=0 AND OrderDate>=DATEFROMPARTS(YEAR(GETDATE()),MONTH(GETDATE()),1) AND WorkflowStage<>'CANCELLED';
      SELECT TOP 10 o.Id,o.JobOrderNo,c.CustomerName,o.RequiredDate,o.GrandTotal,o.WorkflowStage,s.StageLabel,s.Color FROM SalesOrders o INNER JOIN SalesCustomers c ON c.Id=o.CustomerId LEFT JOIN SalesWorkflowStages s ON s.StageKey=o.WorkflowStage WHERE o.IsDeleted=0 AND o.WorkflowStage NOT IN ('COMPLETED','CANCELLED') ORDER BY CASE WHEN o.RequiredDate IS NULL THEN 1 ELSE 0 END,o.RequiredDate,o.Id;
    `); return { totalCustomers: result.recordsets[0][0].TotalCustomers || 0, openInquiries: result.recordsets[1][0].OpenInquiries || 0, activeJobOrders: result.recordsets[2][0].ActiveJobOrders || 0, productionQueue: result.recordsets[3][0].ProductionQueue || 0, readyDispatch: result.recordsets[4][0].ReadyDispatch || 0, orderValue: result.recordsets[5][0].OrderValue || 0, upcoming: result.recordsets[6] };
};

module.exports = { ensureSchema, getSettings, saveSettings, listSimple, findSimple, createSimple, updateSimple, removeSimple, listDocuments, findDocument, createInquiry, updateInquiry, removeInquiry, createOrder, updateOrder, removeOrder, convertInquiry, productionOrders, productionBatches, updateProduction, readyForDispatch, createDispatch, dashboard };
