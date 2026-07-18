const moment = require("moment");
const shiftOverrideModel = require("../models/shiftOverrideModel");
const shiftModel = require("../models/shiftModel");
const employeeModel = require("../models/employeeModel");

// Assign a temporary shift to one or more employees over a date range.
//   Solo assign  -> employeeIds has a single id.
//   Batch assign -> employeeIds has many ids (same shift + range).
// When any target already has an overlapping override and force is not
// set, respond 409 with the list of conflicts so the UI can ask HR
// "employee already has an override in that range - proceed?".
// If force is true the overlapping overrides are replaced.
const assignOverride = async (request, response) => {
    try {
        const { shiftId, startDate, endDate, note, force } = request.body;
        const employeeIds = request.body.employeeIds || [];

        if (!shiftId) return response.status(400).send("Please select a shift.");
        if (!employeeIds.length) return response.status(400).send("Please select at least one employee.");
        if (!startDate || !endDate) return response.status(400).send("Start Date and End Date are required.");
        if (moment(endDate).isBefore(moment(startDate), "day"))
            return response.status(400).send("End Date cannot be before Start Date.");

        const shift = await shiftModel.findById(shiftId);
        if (!shift) return response.status(400).json({ message: "Selected shift does not exist." });

        // Detect conflicts first.
        const conflicts = [];
        for (const empId of employeeIds) {
            const overlapping = await shiftOverrideModel.findOverlapping(empId, startDate, endDate);
            if (overlapping.length > 0) {
                const emp = await employeeModel.findById(empId);
                conflicts.push({
                    employeeId: empId,
                    employeeName: emp ? `${emp.LastName}, ${emp.FirstName} ${emp.MiddleName}`.trim() : `#${empId}`,
                    existing: overlapping.map(o => ({
                        shiftName: o.ShiftName,
                        startDate: moment(o.StartDate).format("MM/DD/YYYY"),
                        endDate: moment(o.EndDate).format("MM/DD/YYYY"),
                    })),
                });
            }
        }

        if (conflicts.length > 0 && !force) {
            return response.status(409).json({
                conflict: true,
                message: "One or more employees already have an override in that date range.",
                conflicts,
            });
        }

        let assigned = 0;
        for (const empId of employeeIds) {
            if (force) {
                await shiftOverrideModel.softDeleteOverlapping(empId, startDate, endDate);
            }
            await shiftOverrideModel.create({ employeeId: empId, shiftId, startDate, endDate, note });
            assigned++;
        }

        response.status(200).json({
            message: `${shift.Name} assigned to ${assigned} employee${assigned === 1 ? "" : "s"}.`,
            assigned,
        });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const listOverrides = async (request, response) => {
    try {
        const empIds = Object.values(request.body.selectedEmployee || {}).map(e => e.value);
        const overrides = empIds.length > 0
            ? await shiftOverrideModel.getByEmployeeIds(empIds)
            : await shiftOverrideModel.getAllActive();

        const result = [];
        for (const o of overrides) {
            const emp = await employeeModel.findById(o.EmployeeId);
            result.push({
                id: o.Id,
                employeeId: o.EmployeeId,
                employeeNo: emp ? emp.EmployeeNo : "",
                employeeName: emp ? `${emp.LastName}, ${emp.FirstName} ${emp.MiddleName}`.trim() : "",
                shiftName: o.ShiftName,
                timeStart: o.TimeStart,
                timeEnd: o.TimeEnd,
                startDate: moment(o.StartDate).format("MM/DD/YYYY"),
                endDate: moment(o.EndDate).format("MM/DD/YYYY"),
                note: o.Note,
            });
        }

        response.status(200).json(result);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const deleteOverride = async (request, response) => {
    try {
        await shiftOverrideModel.softDelete(request.params.id);
        response.status(200).json({ message: "Override removed" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

module.exports = { assignOverride, listOverrides, deleteOverride };
