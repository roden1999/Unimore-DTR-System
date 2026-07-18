const moment = require("moment");
const projectModel = require("../../models/inventory/projectModel");
const recordModel = require("../../models/inventory/recordModel");

const PER_PAGE = 20;
const FORM_TYPE = "Tools";

const toValues = (sel) => {
    if (!sel) return [];
    if (Array.isArray(sel)) return sel.map(s => s.value);
    if (typeof sel === "object" && "value" in sel) return [sel.value];
    return [];
};

const shapeBorrowedTool = (r) => ({
    _id: r.Id,
    ToolId: r.ToolId,
    ToolName: r.ToolName,
    SerialNo: r.SerialNo,
    EmployeeId: r.EmployeeId,
    EmployeeName: r.EmployeeName,
    DateBorrowed: r.DateBorrowed,
    DateReturned: r.DateReturned,
    Status: r.Status,
    Remarks: r.Remarks,
});

const listProjects = async (request, response) => {
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
            const records = await recordModel.getByProject(p.Id);
            data.push({
                _id: p.Id,
                ProjectName: p.ProjectName,
                Description: p.Description,
                Status: p.Status,
                Date: p.Date,
                BorrowedTools: records.map(shapeBorrowedTool),
            });
        }
        response.status(200).json(data);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const totalForm = async (request, response) => {
    try {
        response.status(200).json(await projectModel.count(FORM_TYPE));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const searchOptions = async (request, response) => {
    try {
        const rows = await projectModel.searchOptions(FORM_TYPE);
        response.status(200).json(rows.map(r => ({ _id: r.Id, ProjectName: r.ProjectName, Date: r.Date })));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const createProject = async (request, response) => {
    try {
        if (!request.body.projectName) return response.status(400).send("Project Name is required.");
        const p = await projectModel.create({ ...request.body, formType: FORM_TYPE });
        response.status(200).json({ project: p.ProjectName });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const updateProject = async (request, response) => {
    try {
        const updated = await projectModel.update(request.params.id, request.body);
        response.status(200).json({ project: updated.ProjectName });
    } catch (error) {
        response.status(500).json({ error: "Error" });
    }
};

const deleteProject = async (request, response) => {
    try {
        await projectModel.softDelete(request.params.id);
        response.status(200).json({ message: "Project deleted" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

module.exports = { listProjects, totalForm, searchOptions, createProject, updateProject, deleteProject };
