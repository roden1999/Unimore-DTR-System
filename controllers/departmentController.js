const departmentModel = require("../models/departmentModel");
const { departmentValidation } = require("../utils/validation");

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const buildTimePerDay = (schedules) => {
    return schedules.map(s => ({
        day: s.DayName,
        timeStart: s.TimeStart,
        timeEnd: s.TimeEnd,
    }));
};

const createDepartment = async (request, response) => {
    try {
        const { error } = departmentValidation(request.body);
        if (error) return response.status(400).send(error.details[0].message);

        const existing = await departmentModel.findByName(request.body.department);
        if (existing) return response.status(400).json({ message: "Department already exist." });

        const timePerDay = request.body.timePerDay;
        for (const t of timePerDay) {
            if (!t.timeStart) return response.status(400).json("Time Start must have value.");
            if (!t.timeEnd) return response.status(400).json("Time End must have value.");
        }

        const dept = await departmentModel.create({
            department: request.body.department,
            dayNightShift: request.body.dayNightShift,
        });

        for (let i = 0; i < timePerDay.length; i++) {
            await departmentModel.createSchedule(dept.Id, timePerDay[i].day, timePerDay[i].timeStart, timePerDay[i].timeEnd, i);
        }

        response.status(200).json({ department: dept.Department });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const updateDepartment = async (request, response) => {
    try {
        const id = parseInt(request.params.id);
        const updated = await departmentModel.update(id, {
            department: request.body.department,
            dayNightShift: request.body.dayNightShift,
        });

        if (request.body.timePerDay) {
            await departmentModel.deleteSchedules(id);
            const timePerDay = request.body.timePerDay;
            for (let i = 0; i < timePerDay.length; i++) {
                await departmentModel.createSchedule(id, timePerDay[i].day, timePerDay[i].timeStart, timePerDay[i].timeEnd, i);
            }
        }

        const schedules = await departmentModel.getSchedules(id);
        response.status(200).json({ ...updated, timePerDay: buildTimePerDay(schedules) });
    } catch (error) {
        response.status(500).json({ error: "Error" });
    }
};

const listDepartments = async (request, response) => {
    try {
        let departments;
        if (Object.keys(request.body.selectedDepartment).length > 0) {
            const ids = Object.values(request.body.selectedDepartment).map(d => d.value);
            departments = await departmentModel.getByIds(ids);
        } else {
            departments = await departmentModel.getAll();
        }

        const result = [];
        for (const dept of departments) {
            const schedules = await departmentModel.getSchedules(dept.Id);
            result.push({ ...dept, timePerDay: buildTimePerDay(schedules) });
        }

        response.status(200).json(result);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const departmentOptions = async (request, response) => {
    try {
        const departments = await departmentModel.getAll();
        response.status(200).json(departments);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const deleteDepartment = async (request, response) => {
    try {
        await departmentModel.softDelete(request.params.id);
        response.status(200).json({ message: "Department deleted" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

module.exports = { createDepartment, updateDepartment, listDepartments, departmentOptions, deleteDepartment };
