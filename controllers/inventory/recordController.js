const recordModel = require("../../models/inventory/recordModel");

const PER_PAGE = 12;

const toValues = (sel) => {
    if (!sel) return [];
    if (Array.isArray(sel)) return sel.map(s => s.value);
    if (typeof sel === "object" && "value" in sel) return [sel.value];
    return [];
};

const shapeBorrowed = (r) => ({
    _id: r.Id,
    SerialNo: r.SerialNo,
    ToolName: r.ToolName,
    EmployeeNo: r.EmployeeNo,
    EmployeeName: r.EmployeeName,
    DateBorrowed: r.DateBorrowed,
    Project: r.ProjectName,
    ProcessedBy: r.ProcessedBy,
    Status: r.Status,
    Remarks: r.Remarks,
});

const shapeReturned = (r) => ({
    ...shapeBorrowed(r),
    DateReturned: r.DateReturned,
    ReceivedBy: r.ReceivedBy,
});

const listBorrowed = async (request, response) => {
    try {
        const page = request.body.page ? parseInt(request.body.page) : 1;
        const toolIds = toValues(request.body.searchTool);
        const rows = await recordModel.listByStatus({
            status: "Borrowed", toolIds, offset: (page - 1) * PER_PAGE, limit: PER_PAGE,
        });
        response.status(200).json(rows.map(shapeBorrowed));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const listReturned = async (request, response) => {
    try {
        const page = request.body.page ? parseInt(request.body.page) : 1;
        const toolIds = toValues(request.body.searchTool);
        const rows = await recordModel.listByStatus({
            status: "Returned", toolIds, offset: (page - 1) * PER_PAGE, limit: PER_PAGE,
        });
        response.status(200).json(rows.map(shapeReturned));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const totalBorrowed = async (request, response) => {
    try { response.status(200).json(await recordModel.countByStatus("Borrowed")); }
    catch (error) { response.status(500).json({ error: error.message }); }
};

const totalReturned = async (request, response) => {
    try { response.status(200).json(await recordModel.countByStatus("Returned")); }
    catch (error) { response.status(500).json({ error: error.message }); }
};

const createRecord = async (request, response) => {
    try {
        const { toolId, employeeId, dateBorrowed, project, processedBy, remarks } = request.body;
        if (!toolId) return response.status(400).send("Please select a tool.");
        if (!employeeId) return response.status(400).send("Please select a borrower.");
        await recordModel.create({
            toolId, employeeId, dateBorrowed,
            projectId: project || null, processedBy, remarks,
        });
        response.status(200).json({ record: "Tool" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

// PUT /:id — used to return a borrowed tool.
const returnRecord = async (request, response) => {
    try {
        await recordModel.markReturned(request.params.id, {
            receivedBy: request.body.ReceivedBy,
            remarks: request.body.Remarks,
        });
        response.status(200).json({ record: "Tool" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const editItem = async (request, response) => {
    try {
        await recordModel.editItem(request.params.id, {
            toolId: request.body.ToolId,
            employeeId: request.body.EmployeeId,
            dateBorrowed: request.body.DateBorrowed,
            remarks: request.body.Remarks,
        });
        response.status(200).json({ record: "Tool" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const deleteRecord = async (request, response) => {
    try {
        await recordModel.remove(request.params.id);
        response.status(200).json({ message: "Record deleted" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

module.exports = {
    listBorrowed, listReturned, totalBorrowed, totalReturned,
    createRecord, returnRecord, editItem, deleteRecord
};
