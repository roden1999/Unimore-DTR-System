const toolModel = require("../../models/inventory/toolModel");

const PER_PAGE = 12;

// react-select gives an array (isMulti) or a single {value} object.
const toValues = (sel) => {
    if (!sel) return [];
    if (Array.isArray(sel)) return sel.map(s => s.value);
    if (typeof sel === "object" && "value" in sel) return [sel.value];
    return [];
};

const shapeTool = (t) => ({
    _id: t.Id,
    SerialNo: t.SerialNo,
    Name: t.Name,
    Brand: t.Brand,
    Category: t.Category,
    DatePurchased: t.DatePurchased,
    Location: t.Location,
    Description: t.Description,
    Status: t.Status,
    Available: t.Available,
});

const listTools = async (request, response) => {
    try {
        const page = request.body.page ? parseInt(request.body.page) : 1;
        const ids = toValues(request.body.selectedTools);
        const brands = toValues(request.body.brandFilter);
        const categories = toValues(request.body.categoryFilter);
        const statuses = toValues(request.body.statusFilter);
        const rows = await toolModel.list({
            ids, brands, categories, statuses,
            offset: (page - 1) * PER_PAGE, limit: PER_PAGE,
        });
        response.status(200).json(rows.map(shapeTool));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const totalTools = async (request, response) => {
    try {
        response.status(200).json(await toolModel.count({}));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const searchOptions = async (request, response) => {
    try {
        const rows = await toolModel.searchOptions({
            brands: toValues(request.body.brandFilter),
            categories: toValues(request.body.categoryFilter),
            statuses: toValues(request.body.statusFilter),
        });
        response.status(200).json(rows.map(r => ({ _id: r.Id, Name: r.Name, SerialNo: r.SerialNo })));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const availableOptions = async (request, response) => {
    try {
        const rows = await toolModel.availableForBorrow();
        response.status(200).json(rows.map(r => ({ _id: r.Id, Name: r.Name, SerialNo: r.SerialNo })));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const brandOptions = async (request, response) => {
    try {
        const rows = await toolModel.brandOptions();
        response.status(200).json(rows.map(r => ({ brand: r.Brand })));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const listOfAllTools = async (request, response) => {
    try {
        const rows = await toolModel.getAllForPdf();
        response.status(200).json(rows.map(shapeTool));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const createTool = async (request, response) => {
    try {
        if (!request.body.serialNo) return response.status(400).send("Serial No. is required.");
        if (!request.body.name) return response.status(400).send("Name is required.");
        const existing = await toolModel.findBySerial(request.body.serialNo);
        if (existing) return response.status(400).send("Serial No. already exists.");
        const tool = await toolModel.create(request.body);
        response.status(200).json({ tool: tool.Name });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const updateTool = async (request, response) => {
    try {
        const updated = await toolModel.update(request.params.id, request.body);
        response.status(200).json({ tool: updated.Name });
    } catch (error) {
        response.status(500).json({ error: "Error" });
    }
};

const deleteTool = async (request, response) => {
    try {
        await toolModel.softDelete(request.params.id);
        response.status(200).json({ message: "Tool deleted" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

module.exports = {
    listTools, totalTools, searchOptions, availableOptions, brandOptions,
    listOfAllTools, createTool, updateTool, deleteTool
};
