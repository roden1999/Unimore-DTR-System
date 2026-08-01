const model = require('../models/workflowModel');

const handle = (fn) => async (req, res) => {
    try { await fn(req, res); }
    catch (error) { res.status(error.status || (error.message.startsWith('Required:') ? 400 : 500)).json({ message: error.message }); }
};

const list = handle(async (req, res) => res.json(await model.list(req.params.resource)));
const create = handle(async (req, res) => res.status(201).json(await model.create(req.params.resource, req.body, req.user)));
const update = handle(async (req, res) => {
    const row = await model.update(req.params.resource, req.params.id, req.body, req.user);
    if (!row) return res.status(404).json({ message: 'Record not found' });
    res.json(row);
});
const remove = handle(async (req, res) => {
    if (!await model.remove(req.params.resource, req.params.id, req.user)) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record deleted' });
});
const approvals = handle(async (req, res) => res.json(await model.listApprovals(req.query.status, req.query.module, req.user)));
const decide = handle(async (req, res) => {
    const row = await model.decideApproval(req.params.id, req.body.status, req.body.note, req.user);
    if (!row) return res.status(409).json({ message: 'This request has already been reviewed.' });
    res.json(row);
});
const audit = handle(async (req, res) => res.json(await model.listAudit(Number(req.query.limit || 200))));
const notifications = handle(async (req, res) => res.json(await model.listNotifications(req.user)));
const readNotification = handle(async (req, res) => { await model.markNotificationRead(req.params.id, req.user); res.json({ message: 'Notification marked as read' }); });
const dashboard = handle(async (_req, res) => res.json(await model.dashboard()));

module.exports = { list, create, update, remove, approvals, decide, audit, notifications, readNotification, dashboard };
