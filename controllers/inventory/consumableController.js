const consumableModel = require("../../models/inventory/consumableModel");

const PER_PAGE = 12;

const toValues = (sel) => {
    if (!sel) return [];
    if (Array.isArray(sel)) return sel.map(s => s.value);
    if (typeof sel === "object" && "value" in sel) return [sel.value];
    return [];
};

const shape = (c) => ({
    _id: c.Id,
    Name: c.Name,
    Brand: c.Brand,
    Unit: c.Unit,
    DatePurchased: c.DatePurchased,
    Description: c.Description,
    Quantity: Number(c.Quantity),
    Used: Number(c.Used),
    CriticalLevel: Number(c.CriticalLevel),
    CritLevelIndicator: !!c.CritLevelIndicator,
});

const listConsumables = async (request, response) => {
    try {
        const page = request.body.page ? parseInt(request.body.page) : 1;
        const ids = toValues(request.body.selectedConsumables);
        const rows = await consumableModel.list({ ids, offset: (page - 1) * PER_PAGE, limit: PER_PAGE });
        response.status(200).json(rows.map(shape));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const totalItem = async (request, response) => {
    try {
        response.status(200).json(await consumableModel.count());
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const searchOptions = async (request, response) => {
    try {
        const rows = await consumableModel.searchOptions();
        response.status(200).json(rows.map(r => ({
            _id: r.Id, Name: r.Name, Quantity: Number(r.Quantity), Used: Number(r.Used),
        })));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const listOfAllConsumables = async (request, response) => {
    try {
        const rows = await consumableModel.getAllForPdf();
        response.status(200).json(rows.map(shape));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const createConsumable = async (request, response) => {
    try {
        if (!request.body.name) return response.status(400).send("Name is required.");
        const c = await consumableModel.create(request.body);
        response.status(200).json({ consumable: c.Name });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const updateConsumable = async (request, response) => {
    try {
        const updated = await consumableModel.update(request.params.id, request.body);
        response.status(200).json({ consumable: updated.Name });
    } catch (error) {
        response.status(500).json({ error: "Error" });
    }
};

const deleteConsumable = async (request, response) => {
    try {
        await consumableModel.softDelete(request.params.id);
        response.status(200).json({ message: "Consumable deleted" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

module.exports = {
    listConsumables, totalItem, searchOptions, listOfAllConsumables,
    createConsumable, updateConsumable, deleteConsumable
};
