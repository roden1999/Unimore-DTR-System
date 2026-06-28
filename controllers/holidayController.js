const moment = require("moment");
const holidayModel = require("../models/holidayModel");
const { holidaySchedValidation } = require("../utils/validation");

const createHoliday = async (request, response) => {
    try {
        const { error } = holidaySchedValidation(request.body);
        if (error) return response.status(400).send(error.details[0].message);

        const existing = await holidayModel.findByDate(request.body.date);
        if (existing) return response.status(400).json({ message: "Holiday already assigned on this date." });

        const holiday = await holidayModel.create({
            date: request.body.date,
            title: request.body.title,
            type: request.body.type,
        });

        response.status(200).json({ hs: holiday.Date });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const updateHoliday = async (request, response) => {
    try {
        const updated = await holidayModel.update(request.params.id, {
            date: request.body.date,
            title: request.body.title,
            type: request.body.type,
        });
        response.status(200).json(updated);
    } catch (error) {
        response.status(500).json({ error: "Error" });
    }
};

const listHolidays = async (request, response) => {
    try {
        const holidays = await holidayModel.getAll();
        const data = holidays.map(h => ({
            id: h.Id,
            title: h.Title,
            type: h.Type,
            start: new Date(moment(h.Date).format("MM/DD/YYYY")),
            end: new Date(moment(h.Date).format("MM/DD/YYYY")),
        }));
        response.status(200).json(data);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const deleteHoliday = async (request, response) => {
    try {
        await holidayModel.softDelete(request.params.id);
        response.status(200).json({ message: "Holiday deleted" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

module.exports = { createHoliday, updateHoliday, listHolidays, deleteHoliday };
