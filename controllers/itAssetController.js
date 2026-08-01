const model = require('../models/itAssetModel');
const workflow = require('../models/workflowModel');

const errorResponse = (res, error) => {
    if (error.number === 2601 || error.number === 2627) return res.status(409).json({ message: 'Asset tag is already in use.' });
    return res.status(500).json({ message: error.message });
};
const list = async (req, res) => { try { res.json(await model.list(req.query)); } catch (e) { errorResponse(res, e); } };
const dashboard = async (_req, res) => { try { res.json(await model.dashboard()); } catch (e) { errorResponse(res, e); } };
const create = async (req, res) => {
    try {
        if (!req.body.AssetTag || !req.body.Category) return res.status(400).json({ message: 'Asset tag and category are required.' });
        const row = await model.create(req.body, req.user?._id);
        await workflow.addAudit({ user: req.user, action: 'CREATE', module: 'IT Asset Management', entityType: 'IT Asset', entityId: row.Id, description: `${row.AssetTag} added to IT inventory`, newValues: row });
        res.status(201).json(row);
    } catch (e) { errorResponse(res, e); }
};
const update = async (req, res) => {
    try {
        if (!req.body.AssetTag || !req.body.Category) return res.status(400).json({ message: 'Asset tag and category are required.' });
        const old = await model.findById(req.params.id); if (!old) return res.status(404).json({ message: 'Asset not found.' });
        const row = await model.update(req.params.id, req.body);
        await workflow.addAudit({ user: req.user, action: 'UPDATE', module: 'IT Asset Management', entityType: 'IT Asset', entityId: row.Id, description: `${row.AssetTag} updated`, oldValues: old, newValues: row });
        res.json(row);
    } catch (e) { errorResponse(res, e); }
};
const remove = async (req, res) => {
    try {
        const old = await model.findById(req.params.id); if (!old) return res.status(404).json({ message: 'Asset not found.' });
        await model.remove(req.params.id);
        await workflow.addAudit({ user: req.user, action: 'DELETE', module: 'IT Asset Management', entityType: 'IT Asset', entityId: old.Id, description: `${old.AssetTag} retired from inventory`, oldValues: old });
        res.json({ message: 'Asset removed.' });
    } catch (e) { errorResponse(res, e); }
};
module.exports = { list, dashboard, create, update, remove };
