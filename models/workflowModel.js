const fs = require('fs');
const path = require('path');
const { getPool, sql } = require('../config/db');

let schemaReady = false;
const ensureSchema = async () => {
    if (schemaReady) return;
    const script = fs.readFileSync(path.join(__dirname, '..', 'database', 'workflow_schema.sql'), 'utf8');
    await getPool().request().batch(script);
    schemaReady = true;
};

const resources = {
    leaves: {
        table: 'LeaveRequests', module: 'Human Resources', entity: 'Leave Request', approval: true,
        fields: { EmployeeId: sql.Int, LeaveType: sql.NVarChar(50), StartDate: sql.Date, EndDate: sql.Date, Reason: sql.NVarChar(700), Status: sql.NVarChar(20) },
        required: ['EmployeeId', 'LeaveType', 'StartDate', 'EndDate'],
        order: 'CreatedAt DESC', employee: true,
    },
    overtime: {
        table: 'OvertimeRequests', module: 'Human Resources', entity: 'Overtime Request', approval: true,
        fields: { EmployeeId: sql.Int, WorkDate: sql.Date, Hours: sql.Decimal(8, 2), Reason: sql.NVarChar(700), Status: sql.NVarChar(20) },
        required: ['EmployeeId', 'WorkDate', 'Hours'], order: 'CreatedAt DESC', employee: true,
    },
    'work-orders': {
        table: 'MaintenanceWorkOrders', module: 'Maintenance', entity: 'Work Order',
        fields: { WorkOrderNo: sql.NVarChar(40), AssetName: sql.NVarChar(180), Description: sql.NVarChar(700), Priority: sql.NVarChar(20), AssignedTo: sql.NVarChar(150), DueDate: sql.Date, Status: sql.NVarChar(30) },
        required: ['WorkOrderNo', 'AssetName'], order: 'CreatedAt DESC',
    },
    'preventive-maintenance': {
        table: 'PreventiveMaintenance', module: 'Maintenance', entity: 'Preventive Maintenance',
        fields: { AssetName: sql.NVarChar(180), TaskName: sql.NVarChar(250), FrequencyDays: sql.Int, LastServiceDate: sql.Date, NextServiceDate: sql.Date, AssignedTo: sql.NVarChar(150), Status: sql.NVarChar(30) },
        required: ['AssetName', 'TaskName', 'FrequencyDays', 'NextServiceDate'], order: 'NextServiceDate ASC',
    },
    traceability: {
        table: 'ProductionTraceability', module: 'Production', entity: 'Production Batch',
        fields: { BatchNo: sql.NVarChar(60), CoilReference: sql.NVarChar(120), SkelpReference: sql.NVarChar(120), FinishedProduct: sql.NVarChar(180), Quantity: sql.Decimal(18, 3), ProductionDate: sql.Date, Status: sql.NVarChar(30), QAStatus: sql.NVarChar(30), Notes: sql.NVarChar(700) },
        required: ['BatchNo', 'ProductionDate'], order: 'ProductionDate DESC, Id DESC',
    },
    'calculator-history': {
        table: 'CalculatorHistory', module: 'Production', entity: 'Calculation', immutable: true,
        fields: { CalculatorType: sql.NVarChar(40), InputData: sql.NVarChar(sql.MAX), ResultData: sql.NVarChar(sql.MAX) },
        required: ['CalculatorType', 'InputData', 'ResultData'], order: 'CreatedAt DESC',
    },
    'payroll-periods': {
        table: 'PayrollPeriods', module: 'Accounting', entity: 'Payroll Period',
        fields: { PeriodName: sql.NVarChar(100), StartDate: sql.Date, EndDate: sql.Date, Status: sql.NVarChar(20), Notes: sql.NVarChar(700) },
        required: ['PeriodName', 'StartDate', 'EndDate'], order: 'StartDate DESC',
    },
};

const bindFields = (request, config, data, includeStatus = true) => {
    const names = [];
    Object.entries(config.fields).forEach(([name, type]) => {
        if (name === 'Status' && !includeStatus) return;
        if (data[name] !== undefined) {
            request.input(name, type, data[name] === '' ? null : data[name]);
            names.push(name);
        }
    });
    return names;
};

const list = async (resource) => {
    await ensureSchema();
    const config = resources[resource];
    if (!config) throw new Error('Unknown workflow resource');
    const join = config.employee
        ? " LEFT JOIN Employees e ON e.Id = w.EmployeeId LEFT JOIN Departments d ON d.Id = e.DepartmentId"
        : '';
    const employeeFields = config.employee
        ? ", CONCAT(e.LastName, ', ', e.FirstName, ' ', ISNULL(e.MiddleName,'')) AS EmployeeName, e.EmployeeNo, e.Image, d.Department"
        : '';
    const result = await getPool().request().query(`SELECT w.*${employeeFields} FROM ${config.table} w${join} ORDER BY w.${config.order}`);
    return result.recordset;
};

const create = async (resource, data, user) => {
    await ensureSchema();
    const config = resources[resource];
    if (!config) throw new Error('Unknown workflow resource');
    const missing = config.required.filter((name) => data[name] === undefined || data[name] === null || data[name] === '');
    if (missing.length) throw new Error(`Required: ${missing.join(', ')}`);
    const request = getPool().request().input('CreatedBy', sql.Int, user?._id || null);
    const names = bindFields(request, config, data, false);
    const result = await request.query(`INSERT INTO ${config.table} (${names.join(',')}, CreatedBy) OUTPUT INSERTED.* VALUES (${names.map(n => '@' + n).join(',')}, @CreatedBy)`);
    const row = result.recordset[0];
    await addAudit({ user, action: 'CREATE', module: config.module, entityType: config.entity, entityId: row.Id, description: `${config.entity} created`, newValues: row });
    if (config.approval) await createApproval(config, row, data.Reason || data.Notes, user);
    return row;
};

const update = async (resource, id, data, user) => {
    await ensureSchema();
    const config = resources[resource];
    if (!config) throw new Error('Unknown workflow resource');
    if (config.immutable) { const error = new Error('History records cannot be edited.'); error.status = 409; throw error; }
    const oldResult = await getPool().request().input('Id', sql.Int, id).query(`SELECT * FROM ${config.table} WHERE Id=@Id`);
    const oldRow = oldResult.recordset[0];
    if (!oldRow) return null;
    if (oldRow.Status === 'Locked' && user?.role !== 'Administrator') {
        const error = new Error('This payroll period is locked and cannot be changed.'); error.status = 409; throw error;
    }
    const safeData = { ...data };
    if (config.approval && user?.role !== 'Administrator') delete safeData.Status;
    if (resource === 'traceability' && safeData.QAStatus !== undefined && safeData.QAStatus !== 'Pending Inspection') delete safeData.QAStatus;
    const request = getPool().request().input('Id', sql.Int, id);
    const names = bindFields(request, config, safeData, true);
    if (!names.length) return oldRow;
    let extra = '';
    if (resource === 'payroll-periods' && safeData.Status === 'Locked') {
        request.input('LockedBy', sql.Int, user?._id || null); extra = ', LockedAt=SYSUTCDATETIME(), LockedBy=@LockedBy';
    }
    const result = await request.query(`UPDATE ${config.table} SET ${names.map(n => `${n}=@${n}`).join(',')}, UpdatedAt=SYSUTCDATETIME()${extra} OUTPUT INSERTED.* WHERE Id=@Id`);
    const row = result.recordset[0];
    await addAudit({ user, action: 'UPDATE', module: config.module, entityType: config.entity, entityId: id, description: `${config.entity} updated`, oldValues: oldRow, newValues: row });
    if (resource === 'traceability' && safeData.QAStatus === 'Pending Inspection') {
        await createNotification({ targetRole: 'QA', title: `Batch ready for QA: ${row.BatchNo}`, message: `${row.FinishedProduct || 'Production batch'} was submitted for inspection.`, type: 'approval', module: 'Quality Assurance', link: '/quality/inspections' });
    }
    return row;
};

const remove = async (resource, id, user) => {
    await ensureSchema();
    const config = resources[resource];
    if (!config) throw new Error('Unknown workflow resource');
    const request = getPool().request().input('Id', sql.Int, id);
    const oldResult = await request.query(`SELECT * FROM ${config.table} WHERE Id=@Id`);
    if (!oldResult.recordset[0]) return false;
    if (['Approved', 'Locked'].includes(oldResult.recordset[0].Status) && user?.role !== 'Administrator') {
        const error = new Error('Approved or locked records can only be deleted by an administrator.'); error.status = 409; throw error;
    }
    await getPool().request().input('Id', sql.Int, id).query(`DELETE FROM ${config.table} WHERE Id=@Id`);
    await addAudit({ user, action: 'DELETE', module: config.module, entityType: config.entity, entityId: id, description: `${config.entity} deleted`, oldValues: oldResult.recordset[0] });
    return true;
};

const addAudit = async ({ user, action, module, entityType, entityId, description, oldValues, newValues, ipAddress }) => {
    await ensureSchema();
    await getPool().request()
        .input('UserId', sql.Int, user?._id || null).input('UserName', sql.NVarChar(150), user?.Name || user?.UserName || 'System')
        .input('Action', sql.NVarChar(40), action).input('Module', sql.NVarChar(60), module)
        .input('EntityType', sql.NVarChar(80), entityType).input('EntityId', sql.NVarChar(80), entityId == null ? null : String(entityId))
        .input('Description', sql.NVarChar(500), description || null)
        .input('OldValues', sql.NVarChar(sql.MAX), oldValues ? JSON.stringify(oldValues) : null)
        .input('NewValues', sql.NVarChar(sql.MAX), newValues ? JSON.stringify(newValues) : null)
        .input('IpAddress', sql.NVarChar(80), ipAddress || null)
        .query(`INSERT INTO AuditLogs (UserId,UserName,Action,Module,EntityType,EntityId,Description,OldValues,NewValues,IpAddress)
                VALUES (@UserId,@UserName,@Action,@Module,@EntityType,@EntityId,@Description,@OldValues,@NewValues,@IpAddress)`);
};

const createNotification = async ({ userId, targetRole, title, message, type = 'info', module, link }) => {
    await ensureSchema();
    await getPool().request().input('UserId', sql.Int, userId || null).input('TargetRole', sql.NVarChar(50), targetRole || null)
        .input('Title', sql.NVarChar(180), title).input('Message', sql.NVarChar(700), message || null)
        .input('Type', sql.NVarChar(30), type).input('Module', sql.NVarChar(60), module || null).input('Link', sql.NVarChar(250), link || null)
        .query('INSERT INTO Notifications (UserId,TargetRole,Title,Message,Type,Module,Link) VALUES (@UserId,@TargetRole,@Title,@Message,@Type,@Module,@Link)');
};

const createApproval = async (config, row, reason, user) => {
    const result = await getPool().request().input('Module', sql.NVarChar(60), config.module).input('EntityType', sql.NVarChar(80), config.entity)
        .input('EntityId', sql.NVarChar(80), String(row.Id)).input('RequestedByUserId', sql.Int, user?._id || null)
        .input('RequestedByName', sql.NVarChar(150), user?.Name || user?.UserName || 'Unknown').input('Reason', sql.NVarChar(700), reason || null)
        .query(`INSERT INTO ApprovalRequests (Module,EntityType,EntityId,RequestedByUserId,RequestedByName,Reason)
                OUTPUT INSERTED.* VALUES (@Module,@EntityType,@EntityId,@RequestedByUserId,@RequestedByName,@Reason)`);
    const approvalRole = config.module === 'Human Resources' ? 'HR' : 'Administrator';
    const approvalLink = config.module === 'Human Resources' ? '/hr/approvals' : '/management/dashboard';
    await createNotification({ targetRole: approvalRole, title: `Approval needed: ${config.entity}`, message: `${user?.Name || 'A user'} submitted ${config.entity} #${row.Id}.`, type: 'approval', module: config.module, link: approvalLink });
    return result.recordset[0];
};

const listApprovals = async (status, module, user) => {
    await ensureSchema();
    const request = getPool().request();
    const clauses = [];
    if (status) { request.input('Status', sql.NVarChar(20), status); clauses.push('Status=@Status'); }
    const scopedModule = user?.role === 'HR' ? 'Human Resources' : module;
    if (scopedModule) { request.input('Module', sql.NVarChar(60), scopedModule); clauses.push('Module=@Module'); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return (await request.query(`SELECT * FROM ApprovalRequests ${where} ORDER BY RequestedAt DESC`)).recordset;
};

const decideApproval = async (id, status, note, user) => {
    await ensureSchema();
    if (!['Approved', 'Rejected'].includes(status)) throw new Error('Decision must be Approved or Rejected');
    const request = getPool().request().input('Id', sql.BigInt, id).input('Status', sql.NVarChar(20), status)
        .input('ReviewNote', sql.NVarChar(700), note || null).input('ReviewedByUserId', sql.Int, user?._id || null)
        .input('ReviewedByName', sql.NVarChar(150), user?.Name || user?.UserName || 'Unknown');
    const scope = user?.role === 'HR' ? " AND Module='Human Resources'" : '';
    const result = await request.query(`UPDATE ApprovalRequests SET Status=@Status,ReviewNote=@ReviewNote,ReviewedByUserId=@ReviewedByUserId,
        ReviewedByName=@ReviewedByName,ReviewedAt=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE Id=@Id AND Status='Pending'${scope}`);
    const approval = result.recordset[0];
    if (!approval) return null;
    const config = Object.values(resources).find(r => r.entity === approval.EntityType);
    if (config) await getPool().request().input('Id', sql.Int, Number(approval.EntityId)).input('Status', sql.NVarChar(20), status)
        .query(`UPDATE ${config.table} SET Status=@Status,UpdatedAt=SYSUTCDATETIME() WHERE Id=@Id`);
    await createNotification({ userId: approval.RequestedByUserId, title: `${approval.EntityType} ${status.toLowerCase()}`, message: note || `Request #${approval.EntityId} was ${status.toLowerCase()}.`, type: status === 'Approved' ? 'success' : 'warning', module: approval.Module });
    await addAudit({ user, action: status.toUpperCase(), module: approval.Module, entityType: approval.EntityType, entityId: approval.EntityId, description: `Approval #${id} ${status.toLowerCase()}`, newValues: approval });
    return approval;
};

const listAudit = async (limit = 200) => {
    await ensureSchema();
    return (await getPool().request().input('Limit', sql.Int, Math.min(Math.max(limit, 1), 500))
        .query('SELECT TOP (@Limit) * FROM AuditLogs ORDER BY CreatedAt DESC')).recordset;
};

const listNotifications = async (user) => {
    await ensureSchema();
    return (await getPool().request().input('UserId', sql.Int, user?._id || null).input('Role', sql.NVarChar(50), user?.role || '')
        .query(`SELECT TOP 50 * FROM Notifications WHERE UserId=@UserId OR TargetRole=@Role OR (UserId IS NULL AND TargetRole IS NULL) ORDER BY CreatedAt DESC`)).recordset;
};

const markNotificationRead = async (id, user) => {
    await ensureSchema();
    await getPool().request().input('Id', sql.BigInt, id).input('UserId', sql.Int, user?._id || null).input('Role', sql.NVarChar(50), user?.role || '')
        .query('UPDATE Notifications SET IsRead=1 WHERE Id=@Id AND (UserId=@UserId OR TargetRole=@Role OR (UserId IS NULL AND TargetRole IS NULL))');
};

const dashboard = async () => {
    await ensureSchema();
    const result = await getPool().request().query(`
        SELECT SUM(CASE WHEN IsDeleted=0 THEN 1 ELSE 0 END) ActiveEmployees, SUM(CASE WHEN IsDeleted=1 THEN 1 ELSE 0 END) ResignedEmployees FROM Employees;
        SELECT COUNT(*) TotalDepartments FROM Departments WHERE IsDeleted=0;
        SELECT COUNT(*) PendingApprovals FROM ApprovalRequests WHERE Status='Pending';
        SELECT COUNT(*) OpenWorkOrders FROM MaintenanceWorkOrders WHERE Status NOT IN ('Completed','Cancelled');
        SELECT COUNT(*) DueMaintenance FROM PreventiveMaintenance WHERE NextServiceDate<=DATEADD(DAY,7,CAST(GETDATE() AS DATE)) AND Status<>'Completed';
        SELECT COUNT(*) PendingHRRequests FROM (SELECT Id FROM LeaveRequests WHERE Status='Pending' UNION ALL SELECT Id FROM OvertimeRequests WHERE Status='Pending') p;
        SELECT COUNT(*) ActiveBatches FROM ProductionTraceability WHERE Status NOT IN ('Completed','Cancelled');
        SELECT COUNT(*) LockedPayrollPeriods FROM PayrollPeriods WHERE Status='Locked';
        SELECT TOP 8 * FROM AuditLogs ORDER BY CreatedAt DESC;
        SELECT TOP 8 * FROM ApprovalRequests WHERE Status='Pending' ORDER BY RequestedAt DESC;
        SELECT TOP 8 WorkOrderNo,AssetName,Priority,DueDate,Status FROM MaintenanceWorkOrders WHERE Status NOT IN ('Completed','Cancelled') ORDER BY CASE Priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 ELSE 3 END, DueDate;
    `);
    return {
        activeEmployees: result.recordsets[0][0].ActiveEmployees || 0, resignedEmployees: result.recordsets[0][0].ResignedEmployees || 0,
        totalDepartments: result.recordsets[1][0].TotalDepartments || 0, pendingApprovals: result.recordsets[2][0].PendingApprovals || 0,
        openWorkOrders: result.recordsets[3][0].OpenWorkOrders || 0, dueMaintenance: result.recordsets[4][0].DueMaintenance || 0,
        pendingHRRequests: result.recordsets[5][0].PendingHRRequests || 0, activeBatches: result.recordsets[6][0].ActiveBatches || 0,
        lockedPayrollPeriods: result.recordsets[7][0].LockedPayrollPeriods || 0, recentActivity: result.recordsets[8], approvals: result.recordsets[9], workOrders: result.recordsets[10],
    };
};

module.exports = { ensureSchema, resources, list, create, update, remove, addAudit, createNotification, listApprovals, decideApproval, listAudit, listNotifications, markNotificationRead, dashboard };
