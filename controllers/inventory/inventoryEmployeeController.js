const empModel = require("../../models/inventory/inventoryEmployeeModel");
const recordModel = require("../../models/inventory/recordModel");

const PER_PAGE = 12;

const toValues = (sel) => {
    if (!sel) return [];
    if (Array.isArray(sel)) return sel.map(s => s.value);
    if (typeof sel === "object" && "value" in sel) return [sel.value];
    return [];
};

const listEmployees = async (request, response) => {
    try {
        const page = request.body.page ? parseInt(request.body.page) : 1;
        const ids = toValues(request.body.selectedEmployee);
        const employees = await empModel.list({ ids, offset: (page - 1) * PER_PAGE, limit: PER_PAGE });

        const data = [];
        for (const e of employees) {
            const open = await recordModel.getOpenByEmployee(e.Id);
            data.push({
                _id: e.Id,
                EmployeeNo: e.EmployeeNo,
                FirstName: e.FirstName,
                MiddleName: e.MiddleName,
                LastName: e.LastName,
                Image: e.Image,
                TotalBorrowed: open.length,
                BorrowedTools: open.map(r => ({ toolName: r.ToolName, serialNo: r.SerialNo })),
            });
        }
        response.status(200).json(data);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const totalEmployees = async (request, response) => {
    try { response.status(200).json(await empModel.count()); }
    catch (error) { response.status(500).json({ error: error.message }); }
};

const searchOptions = async (request, response) => {
    try {
        const rows = await empModel.searchOptions();
        response.status(200).json(rows.map(r => ({
            _id: r.Id, FirstName: r.FirstName, MiddleName: r.MiddleName, LastName: r.LastName,
        })));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const createEmployee = async (request, response) => {
    try {
        if (!request.body.employeeNo) return response.status(400).send("Employee No. is required.");
        const existing = await empModel.findByEmployeeNo(request.body.employeeNo);
        if (existing) return response.status(400).send("Employee No. already exists.");
        const e = await empModel.create(request.body);
        response.status(200).json({ employee: `${e.EmployeeNo} - ${e.FirstName}` });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const updateEmployee = async (request, response) => {
    try {
        const updated = await empModel.update(request.params.id, request.body);
        if (request.body.Image !== undefined) await empModel.setImage(request.params.id, request.body.Image);
        response.status(200).json({ employee: `${updated.EmployeeNo} - ${updated.FirstName}` });
    } catch (error) {
        response.status(500).json({ error: "Error" });
    }
};

const deleteEmployee = async (request, response) => {
    try {
        await empModel.softDelete(request.params.id);
        response.status(200).json({ message: "Employee deleted" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

module.exports = { listEmployees, totalEmployees, searchOptions, createEmployee, updateEmployee, deleteEmployee };
