const sparePartModel = require("../../models/inventory/sparePartModel");

const PER_PAGE = 10;

const toValues = (sel) => {
    if (!sel) return [];
    if (Array.isArray(sel)) return sel.map(s => s.value);
    if (typeof sel === "object" && "value" in sel) return [sel.value];
    return [];
};

const shape = (s) => ({
    _id: s.Id,
    Name: s.Name,
    Quantity: s.Quantity,
    Machine: s.Machine,
    Description: s.Description,
    Remarks: s.Remarks,
    Status: s.Status,
});

const listSpareParts = async (request, response) => {
    try {
        const page = request.body.page ? parseInt(request.body.page) : 1;
        const machine = request.body.machine || "";
        const ids = toValues(request.body.selectedSp);
        const rows = await sparePartModel.list({ machine, ids, offset: (page - 1) * PER_PAGE, limit: PER_PAGE });
        response.status(200).json(rows.map(shape));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const searchOptions = async (request, response) => {
    try {
        const rows = await sparePartModel.searchOptions(request.body.machine || "");
        response.status(200).json(rows.map(r => ({ _id: r.Id, Name: r.Name, Status: r.Status })));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

// Kept the original endpoint name (spareParts/sp-tools): returns the total count.
const total = async (request, response) => {
    try {
        response.status(200).json(await sparePartModel.count(request.body.machine || ""));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const createSparePart = async (request, response) => {
    try {
        if (!request.body.name) return response.status(400).send("Name is required.");
        if (!request.body.machine) return response.status(400).send("Machine is required.");
        const s = await sparePartModel.create(request.body);
        response.status(200).json({ sp: s.Name });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const updateSparePart = async (request, response) => {
    try {
        const updated = await sparePartModel.update(request.params.id, request.body);
        response.status(200).json({ sp: updated.Name });
    } catch (error) {
        response.status(500).json({ error: "Error" });
    }
};

const deleteSparePart = async (request, response) => {
    try {
        await sparePartModel.softDelete(request.params.id);
        response.status(200).json({ message: "Spare part deleted" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

module.exports = { listSpareParts, searchOptions, total, createSparePart, updateSparePart, deleteSparePart };
