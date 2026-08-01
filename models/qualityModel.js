const fs = require('fs');
const path = require('path');
const { getPool, sql } = require('../config/db');
const workflow = require('./workflowModel');

let schemaReady = false;
const ensureSchema = async () => {
    if (schemaReady) return;
    await getPool().request().batch(fs.readFileSync(path.join(__dirname, '..', 'database', 'quality_schema.sql'), 'utf8'));
    schemaReady = true;
};

const resources = {
    inspections: {
        table: 'QualityInspections', entity: 'Quality Inspection', order: 'InspectionDate DESC,Id DESC',
        required: ['InspectionNo', 'InspectionType', 'ProductName', 'InspectionDate'],
        fields: { InspectionNo: sql.NVarChar(60), InspectionType: sql.NVarChar(40), ReferenceType: sql.NVarChar(80), ReferenceNo: sql.NVarChar(120), ProductName: sql.NVarChar(180), SupplierOrSource: sql.NVarChar(180), Quantity: sql.Decimal(18,3), Unit: sql.NVarChar(30), InspectionDate: sql.Date, InspectorName: sql.NVarChar(150), GaugeActual: sql.Decimal(18,4), WidthActual: sql.Decimal(18,4), ThicknessActual: sql.Decimal(18,4), WeightActual: sql.Decimal(18,4), Result: sql.NVarChar(30), Findings: sql.NVarChar(1000), Notes: sql.NVarChar(700) },
    },
    ncrs: {
        table: 'NonConformanceReports', entity: 'Non-Conformance Report', order: 'CreatedAt DESC',
        required: ['NCRNo', 'DefectType', 'Description'],
        fields: { NCRNo: sql.NVarChar(60), InspectionId: sql.Int, ReferenceNo: sql.NVarChar(120), DefectType: sql.NVarChar(120), Description: sql.NVarChar(1000), QuantityAffected: sql.Decimal(18,3), Severity: sql.NVarChar(30), Disposition: sql.NVarChar(60), Owner: sql.NVarChar(150), TargetDate: sql.Date, Status: sql.NVarChar(30), Evidence: sql.NVarChar(sql.MAX) },
        join: ' LEFT JOIN QualityInspections i ON i.Id=q.InspectionId', extra: ',i.InspectionNo,i.ProductName InspectionProduct',
    },
    actions: {
        table: 'CorrectiveActions', entity: 'Corrective Action', order: 'CreatedAt DESC',
        required: ['CARNo', 'CorrectiveAction'],
        fields: { CARNo: sql.NVarChar(60), NCRId: sql.Int, RootCause: sql.NVarChar(1000), ImmediateCorrection: sql.NVarChar(1000), CorrectiveAction: sql.NVarChar(1000), Owner: sql.NVarChar(150), DueDate: sql.Date, Status: sql.NVarChar(30), VerificationNotes: sql.NVarChar(1000), VerifiedBy: sql.NVarChar(150), VerifiedAt: sql.Date },
        join: ' LEFT JOIN NonConformanceReports n ON n.Id=q.NCRId', extra: ',n.NCRNo,n.DefectType',
    },
    standards: {
        table: 'QualityStandards', entity: 'Quality Standard', order: 'ProductName,ParameterName',
        required: ['StandardCode', 'ProductName', 'ParameterName'],
        fields: { StandardCode: sql.NVarChar(60), ProductName: sql.NVarChar(180), ParameterName: sql.NVarChar(120), NominalValue: sql.Decimal(18,4), MinimumValue: sql.Decimal(18,4), MaximumValue: sql.Decimal(18,4), Unit: sql.NVarChar(40), InspectionMethod: sql.NVarChar(300), IsActive: sql.Bit, Notes: sql.NVarChar(700) },
    },
};

const configFor = resource => { const config = resources[resource]; if (!config) { const e = new Error('Unknown quality resource.'); e.status=404; throw e; } return config; };
const bind = (request, config, data) => {
    const names = [];
    Object.entries(config.fields).forEach(([name,type]) => {
        if (data[name] !== undefined) { request.input(name,type,data[name] === '' ? null : data[name]); names.push(name); }
    });
    return names;
};
const list = async resource => {
    await ensureSchema(); const c=configFor(resource);
    return (await getPool().request().query(`SELECT q.*${c.extra || ''} FROM ${c.table} q${c.join || ''} WHERE q.IsDeleted=0 ORDER BY q.${c.order}`)).recordset;
};
const find = async (resource,id) => { await ensureSchema(); const c=configFor(resource); return (await getPool().request().input('Id',sql.Int,id).query(`SELECT * FROM ${c.table} WHERE Id=@Id AND IsDeleted=0`)).recordset[0] || null; };
const create = async (resource,data,user) => {
    await ensureSchema(); const c=configFor(resource); const missing=c.required.filter(n => data[n]===undefined || data[n]===null || data[n]==='');
    if(missing.length){const e=new Error(`Required: ${missing.join(', ')}`);e.status=400;throw e;}
    const request=getPool().request().input('CreatedBy',sql.Int,user?._id || null); const names=bind(request,c,data);
    const row=(await request.query(`INSERT INTO ${c.table} (${names.map(n=>`[${n}]`).join(',')},CreatedBy) OUTPUT INSERTED.* VALUES (${names.map(n=>'@'+n).join(',')},@CreatedBy)`)).recordset[0];
    await workflow.addAudit({user,action:'CREATE',module:'Quality Assurance',entityType:c.entity,entityId:row.Id,description:`${c.entity} ${row.InspectionNo || row.NCRNo || row.CARNo || row.StandardCode} created`,newValues:row});
    if(resource==='inspections') await syncProduction(row,user);
    if(resource==='ncrs') await workflow.createNotification({targetRole:'Production',title:`New NCR: ${row.NCRNo}`,message:`${row.DefectType} requires review and disposition.`,type:'warning',module:'Quality Assurance',link:'/production/traceability'});
    return row;
};
const update = async (resource,id,data,user) => {
    await ensureSchema(); const c=configFor(resource); const old=await find(resource,id); if(!old)return null;
    const request=getPool().request().input('Id',sql.Int,id); const names=bind(request,c,data); if(!names.length)return old;
    const row=(await request.query(`UPDATE ${c.table} SET ${names.map(n=>`[${n}]=@${n}`).join(',')},UpdatedAt=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE Id=@Id AND IsDeleted=0`)).recordset[0];
    await workflow.addAudit({user,action:'UPDATE',module:'Quality Assurance',entityType:c.entity,entityId:id,description:`${c.entity} updated`,oldValues:old,newValues:row});
    if(resource==='inspections') await syncProduction(row,user);
    return row;
};
const remove = async (resource,id,user) => {
    await ensureSchema(); const c=configFor(resource); const old=await find(resource,id); if(!old)return false;
    await getPool().request().input('Id',sql.Int,id).query(`UPDATE ${c.table} SET IsDeleted=1,UpdatedAt=SYSUTCDATETIME() WHERE Id=@Id`);
    await workflow.addAudit({user,action:'DELETE',module:'Quality Assurance',entityType:c.entity,entityId:id,description:`${c.entity} removed`,oldValues:old}); return true;
};
const syncProduction = async (inspection,user) => {
    if(!['Production','Final'].includes(inspection.InspectionType) || !inspection.ReferenceNo) return;
    const qaStatus=inspection.InspectionType==='Final' && inspection.Result==='Passed' ? 'Released' : inspection.Result;
    const result=await getPool().request().input('ReferenceNo',sql.NVarChar(120),inspection.ReferenceNo).input('QAStatus',sql.NVarChar(30),qaStatus || 'Pending').input('InspectionId',sql.Int,inspection.Id)
        .query('UPDATE ProductionTraceability SET QAStatus=@QAStatus,QAInspectionId=@InspectionId,UpdatedAt=SYSUTCDATETIME() OUTPUT INSERTED.Id,INSERTED.BatchNo WHERE BatchNo=@ReferenceNo');
    if(result.recordset.length && ['Rejected','On Hold'].includes(qaStatus)) await workflow.createNotification({targetRole:'Production',title:`Batch ${inspection.ReferenceNo}: ${qaStatus}`,message:inspection.Findings || 'QA action is required.',type:'warning',module:'Quality Assurance',link:'/production/traceability'});
    if(result.recordset.length && qaStatus==='Released') {
        const sales=await getPool().request().input('BatchNo',sql.NVarChar(60),inspection.ReferenceNo).query("IF OBJECT_ID('SalesOrders','U') IS NOT NULL UPDATE SalesOrders SET WorkflowStage='READY_DISPATCH',ReadyAt=SYSUTCDATETIME(),UpdatedAt=SYSUTCDATETIME() OUTPUT INSERTED.Id,INSERTED.JobOrderNo WHERE ProductionBatchNo=@BatchNo AND IsDeleted=0 AND WorkflowStage='FOR_QA'");
        for(const order of sales.recordset || []) {
            await workflow.createNotification({targetRole:'Dispatch',title:`Order ready: ${order.JobOrderNo}`,message:`QA released batch ${inspection.ReferenceNo}; the order can now be imported for pickup or delivery.`,type:'success',module:'Sales & Job Orders',link:'/dispatch/orders'});
            await workflow.createNotification({targetRole:'Sales',title:`QA released ${order.JobOrderNo}`,message:`Batch ${inspection.ReferenceNo} passed final inspection.`,type:'success',module:'Quality Assurance',link:'/sales/orders'});
        }
    }
};
const productionBatches = async () => { await ensureSchema(); return (await getPool().request().query(`SELECT Id,BatchNo,FinishedProduct,Quantity,ProductionDate,Status,QAStatus FROM ProductionTraceability ORDER BY ProductionDate DESC,Id DESC`)).recordset; };
const dashboard = async () => {
    await ensureSchema(); const result=await getPool().request().query(`
      SELECT COUNT(*) TotalInspections,SUM(CASE WHEN Result='Pending' THEN 1 ELSE 0 END) Pending,
       SUM(CASE WHEN Result='Passed' THEN 1 ELSE 0 END) Passed,SUM(CASE WHEN Result='On Hold' THEN 1 ELSE 0 END) OnHold,
       SUM(CASE WHEN Result='Rejected' THEN 1 ELSE 0 END) Rejected FROM QualityInspections WHERE IsDeleted=0 AND InspectionDate>=DATEFROMPARTS(YEAR(GETDATE()),MONTH(GETDATE()),1);
      SELECT COUNT(*) OpenNCRs FROM NonConformanceReports WHERE IsDeleted=0 AND Status NOT IN ('Closed','Cancelled');
      SELECT COUNT(*) OverdueActions FROM CorrectiveActions WHERE IsDeleted=0 AND Status NOT IN ('Verified','Closed','Cancelled') AND DueDate<CAST(GETDATE() AS DATE);
      SELECT TOP 8 Id,InspectionNo,InspectionType,ReferenceNo,ProductName,InspectionDate,Result FROM QualityInspections WHERE IsDeleted=0 ORDER BY InspectionDate DESC,Id DESC;
      SELECT TOP 8 Id,NCRNo,DefectType,Severity,Owner,TargetDate,Status FROM NonConformanceReports WHERE IsDeleted=0 AND Status NOT IN ('Closed','Cancelled') ORDER BY CASE Severity WHEN 'Critical' THEN 1 WHEN 'Major' THEN 2 ELSE 3 END,TargetDate;
    `); return {summary:result.recordsets[0][0],openNCRs:result.recordsets[1][0].OpenNCRs||0,overdueActions:result.recordsets[2][0].OverdueActions||0,recentInspections:result.recordsets[3],openNcrList:result.recordsets[4]};
};
module.exports={ensureSchema,resources,list,find,create,update,remove,productionBatches,dashboard};
