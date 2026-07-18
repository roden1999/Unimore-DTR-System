const moment = require("moment");
const projectModel = require("../../models/inventory/projectModel");
const consumableFormModel = require("../../models/inventory/consumableFormModel");
const consumableModel = require("../../models/inventory/consumableModel");

const PER_PAGE = 20;
const FORM_TYPE = "Consumables";

const toValues = (sel) => {
    if (!sel) return [];
    if (Array.isArray(sel)) return sel.map(s => s.value);
    if (typeof sel === "object" && "value" in sel) return [sel.value];
    return [];
};

const shapeItem = (i) => ({
    _id: i.Id,
    Consumable: i.Consumable,
    Quantity: Number(i.Quantity),
    EmployeeId: i.EmployeeId,
    EmployeeName: i.EmployeeName,
    IssuedBy: i.IssuedBy,
    DateIssued: i.DateIssued,
    Remarks: i.Remarks,
});

const listForms = async (request, response) => {
    try {
        const page = request.body.page ? parseInt(request.body.page) : 1;
        const ids = toValues(request.body.selectedProject);
        const fromDate = request.body.fromDate ? moment(request.body.fromDate, ["MM/DD/YYYY", "YYYY-MM-DD"]).toDate() : null;
        const toDate = request.body.toDate ? moment(request.body.toDate, ["MM/DD/YYYY", "YYYY-MM-DD"]).toDate() : null;

        const projects = await projectModel.list({
            formType: FORM_TYPE, ids, fromDate, toDate,
            offset: (page - 1) * PER_PAGE, limit: PER_PAGE,
        });

        const data = [];
        for (const p of projects) {
            const items = await consumableFormModel.getByProject(p.Id);
            data.push({
                _id: p.Id,
                ProjectName: p.ProjectName,
                Description: p.Description,
                Date: p.Date,
                Status: p.Status,
                Data: items.map(shapeItem),
            });
        }
        response.status(200).json(data);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const totalForm = async (request, response) => {
    try { response.status(200).json(await projectModel.count(FORM_TYPE)); }
    catch (error) { response.status(500).json({ error: error.message }); }
};

const searchOptions = async (request, response) => {
    try {
        const rows = await projectModel.searchOptions(FORM_TYPE);
        response.status(200).json(rows.map(r => ({ _id: r.Id, ProjectName: r.ProjectName, Date: r.Date })));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const addForm = async (request, response) => {
    try {
        if (!request.body.projectName) return response.status(400).send("Project Name is required.");
        const p = await projectModel.create({ ...request.body, formType: FORM_TYPE });
        response.status(200).json({ project: p.ProjectName });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const updateForm = async (request, response) => {
    try {
        const updated = await projectModel.update(request.params.id, request.body);
        response.status(200).json({ project: updated.ProjectName });
    } catch (error) {
        response.status(500).json({ error: "Error" });
    }
};

const deleteForm = async (request, response) => {
    try {
        await projectModel.softDelete(request.params.id);
        response.status(200).json({ message: "Form deleted" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

// Issue a consumable to a project: create the line item and draw down stock.
const addItem = async (request, response) => {
    try {
        const { consumableId, used, employeeId, dateIssued, project, remarks, issuedBy } = request.body;
        if (!consumableId) return response.status(400).send("Please select an item.");
        if (!project) return response.status(400).send("Missing project.");
        const qty = Number(used) || 0;
        await consumableFormModel.create({
            consumableId, employeeId, projectId: project, dateIssued,
            quantity: qty, remarks, issuedBy,
        });
        await consumableModel.adjustUsed(consumableId, qty);
        response.status(200).json({ record: "Item" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const addQuantity = async (request, response) => {
    try {
        const item = await consumableFormModel.findById(request.params.id);
        if (!item) return response.status(404).send("Item not found.");
        const delta = Number(request.body.Used) || 0;
        await consumableFormModel.setQuantity(item.Id, Number(item.Quantity) + delta);
        await consumableModel.adjustUsed(item.ConsumableId, delta);
        response.status(200).json({ record: "Item" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const subtractQuantity = async (request, response) => {
    try {
        const item = await consumableFormModel.findById(request.params.id);
        if (!item) return response.status(404).send("Item not found.");
        const delta = Number(request.body.Used) || 0;
        const newQty = Math.max(0, Number(item.Quantity) - delta);
        const applied = Number(item.Quantity) - newQty;
        await consumableFormModel.setQuantity(item.Id, newQty);
        await consumableModel.adjustUsed(item.ConsumableId, -applied);
        response.status(200).json({ record: "Item" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const editItem = async (request, response) => {
    try {
        await consumableFormModel.editItem(request.params.id, {
            employeeId: request.body.EmployeeId,
            dateIssued: request.body.DateIssued,
            remarks: request.body.Remarks,
        });
        response.status(200).json({ record: "Item" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

// Remove a line item and return its quantity to stock.
const deleteItem = async (request, response) => {
    try {
        const item = await consumableFormModel.findById(request.params.id);
        if (item) {
            await consumableModel.adjustUsed(item.ConsumableId, -Number(item.Quantity));
            await consumableFormModel.remove(item.Id);
        }
        response.status(200).json({ message: "Item removed" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

module.exports = {
    listForms, totalForm, searchOptions, addForm, updateForm, deleteForm,
    addItem, addQuantity, subtractQuantity, editItem, deleteItem
};
