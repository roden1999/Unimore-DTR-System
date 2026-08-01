const model = require('../models/salesModel');
const workflow = require('../models/workflowModel');

const handle = fn => async (req, res) => {
    try { await fn(req, res); }
    catch (error) {
        const duplicate = [2601, 2627].includes(error.number);
        res.status(error.status || (duplicate ? 409 : 500)).json({ message: duplicate ? 'That code or document number is already in use.' : error.message });
    }
};
const audit = (req, action, entityType, row, oldValues, description) => workflow.addAudit({ user: req.user, action, module: 'Sales & Job Orders', entityType, entityId: row?.Id, description, oldValues, newValues: row });

const dashboard = handle(async (_req, res) => res.json(await model.dashboard()));
const settings = handle(async (_req, res) => res.json(await model.getSettings()));
const saveSettings = handle(async (req, res) => {
    const result = await model.saveSettings(req.body, req.user?._id);
    await workflow.addAudit({ user: req.user, action: 'UPDATE', module: 'Sales & Job Orders', entityType: 'Workflow Settings', entityId: 'sales', description: 'Sales workflow settings updated', newValues: req.body });
    res.json(result);
});
const listSimple = handle(async (req, res) => res.json(await model.listSimple(req.params.kind, req.query.search)));
const createSimple = handle(async (req, res) => {
    const row = await model.createSimple(req.params.kind, req.body, req.user?._id), entity = req.params.kind === 'customers' ? 'Customer' : 'Product';
    await audit(req, 'CREATE', entity, row, null, `${entity} ${row.CustomerCode || row.ProductCode} created`); res.status(201).json(row);
});
const updateSimple = handle(async (req, res) => {
    const old = await model.findSimple(req.params.kind, req.params.id); if (!old) return res.status(404).json({ message: 'Record not found.' });
    const row = await model.updateSimple(req.params.kind, req.params.id, req.body), entity = req.params.kind === 'customers' ? 'Customer' : 'Product';
    await audit(req, 'UPDATE', entity, row, old, `${entity} updated`); res.json(row);
});
const removeSimple = handle(async (req, res) => {
    const row = await model.removeSimple(req.params.kind, req.params.id); if (!row) return res.status(404).json({ message: 'Record not found.' });
    await audit(req, 'DELETE', req.params.kind === 'customers' ? 'Customer' : 'Product', row, row, 'Sales master record archived'); res.json({ message: 'Record archived.' });
});

const listInquiries = handle(async (req, res) => res.json(await model.listDocuments('inquiries', req.query)));
const createInquiry = handle(async (req, res) => { const row = await model.createInquiry(req.body, req.user?._id); const full = await model.findDocument('inquiries', row.Id); await audit(req, 'CREATE', 'Customer Inquiry', full, null, `Inquiry ${row.InquiryNo} created`); res.status(201).json(full); });
const updateInquiry = handle(async (req, res) => { const old = await model.findDocument('inquiries', req.params.id); if (!old) return res.status(404).json({ message: 'Inquiry not found.' }); const row = await model.updateInquiry(req.params.id, req.body); const full = await model.findDocument('inquiries', row.Id); await audit(req, 'UPDATE', 'Customer Inquiry', full, old, `Inquiry ${row.InquiryNo} updated`); res.json(full); });
const removeInquiry = handle(async (req, res) => { const old = await model.findDocument('inquiries', req.params.id); const row = await model.removeInquiry(req.params.id); if (!row) return res.status(409).json({ message: 'Converted inquiries cannot be cancelled.' }); await audit(req, 'DELETE', 'Customer Inquiry', row, old, `Inquiry ${row.InquiryNo} cancelled`); res.json({ message: 'Inquiry cancelled.' }); });
const convertInquiry = handle(async (req, res) => {
    const row = await model.convertInquiry(req.params.id, req.body, req.user?._id); if (!row) return res.status(404).json({ message: 'Inquiry not found.' });
    const full = await model.findDocument('orders', row.Id); await audit(req, 'CREATE', 'Sales Job Order', full, null, `Inquiry converted to ${row.JobOrderNo}`);
    await workflow.createNotification({ targetRole: 'Production', title: `New job order: ${row.JobOrderNo}`, message: `${full.CustomerName} order is queued for production.`, type: 'info', module: 'Sales & Job Orders', link: '/production/job-orders' });
    res.status(201).json(full);
});

const listOrders = handle(async (req, res) => res.json(await model.listDocuments('orders', req.query)));
const createOrder = handle(async (req, res) => {
    const row = await model.createOrder(req.body, req.user?._id), full = await model.findDocument('orders', row.Id); await audit(req, 'CREATE', 'Sales Job Order', full, null, `Job order ${row.JobOrderNo} created`);
    await workflow.createNotification({ targetRole: 'Production', title: `New job order: ${row.JobOrderNo}`, message: `${full.CustomerName} order is queued for production.`, type: 'info', module: 'Sales & Job Orders', link: '/production/job-orders' }); res.status(201).json(full);
});
const updateOrder = handle(async (req, res) => { const old = await model.findDocument('orders', req.params.id); if (!old) return res.status(404).json({ message: 'Job order not found.' }); const row = await model.updateOrder(req.params.id, req.body), full = await model.findDocument('orders', row.Id); await audit(req, 'UPDATE', 'Sales Job Order', full, old, `Job order ${row.JobOrderNo} updated`); res.json(full); });
const removeOrder = handle(async (req, res) => { const old = await model.findDocument('orders', req.params.id), row = await model.removeOrder(req.params.id); if (!row) return res.status(409).json({ message: 'Orders already in dispatch or completed cannot be cancelled.' }); await audit(req, 'DELETE', 'Sales Job Order', row, old, `Job order ${row.JobOrderNo} cancelled`); await workflow.createNotification({ targetRole: 'Production', title: `Job order cancelled: ${row.JobOrderNo}`, message: 'Sales cancelled this job order.', type: 'warning', module: 'Sales & Job Orders', link: '/production/job-orders' }); res.json({ message: 'Job order cancelled.' }); });

const productionOrders = handle(async (req, res) => res.json(await model.productionOrders(req.query)));
const productionBatches = handle(async (_req, res) => res.json(await model.productionBatches()));
const productionSettings = handle(async (_req, res) => { const config = await model.getSettings(); res.json({ settings: config.settings, stages: config.stages }); });
const updateProduction = handle(async (req, res) => {
    const old = await model.findDocument('orders', req.params.id); if (!old) return res.status(404).json({ message: 'Job order not found.' });
    const row = await model.updateProduction(req.params.id, req.body), full = await model.findDocument('orders', row.Id); await audit(req, 'UPDATE', 'Sales Job Order Production', full, old, `${row.JobOrderNo} moved to ${full.StageLabel || row.WorkflowStage}`);
    if (row.WorkflowStage === 'FOR_QA') await workflow.createNotification({ targetRole: 'QA', title: `Job order ready for QA: ${row.JobOrderNo}`, message: `Inspect batch ${row.ProductionBatchNo}.`, type: 'approval', module: 'Sales & Job Orders', link: '/quality/inspections' });
    if (row.WorkflowStage === 'READY_DISPATCH') await workflow.createNotification({ targetRole: 'Dispatch', title: `Order ready: ${row.JobOrderNo}`, message: `${full.CustomerName} order is ready for pickup or delivery.`, type: 'success', module: 'Sales & Job Orders', link: '/dispatch/orders' });
    await workflow.createNotification({ targetRole: 'Sales', title: `${row.JobOrderNo}: ${full.StageLabel || row.WorkflowStage}`, message: `Production updated ${full.CustomerName}'s job order.`, type: 'info', module: 'Sales & Job Orders', link: '/sales/orders' }); res.json(full);
});
const readyForDispatch = handle(async (_req, res) => res.json(await model.readyForDispatch()));
const createDispatch = handle(async (req, res) => {
    const old = await model.findDocument('orders', req.params.id), row = await model.createDispatch(req.params.id); if (!row) return res.status(404).json({ message: 'Job order not found.' });
    await audit(req, 'CREATE', 'Dispatch Handoff', { Id: row.Id, ...row }, old, `${old.JobOrderNo} imported as ${row.DispatchNo}`);
    await workflow.createNotification({ targetRole: 'Sales', title: `Dispatch created: ${old.JobOrderNo}`, message: `${row.DispatchNo} is now being handled by Dispatch.`, type: 'info', module: 'Dispatch & Delivery', link: '/sales/orders' }); res.status(201).json(row);
});

module.exports = { dashboard, settings, saveSettings, listSimple, createSimple, updateSimple, removeSimple, listInquiries, createInquiry, updateInquiry, removeInquiry, convertInquiry, listOrders, createOrder, updateOrder, removeOrder, productionOrders, productionBatches, productionSettings, updateProduction, readyForDispatch, createDispatch };
