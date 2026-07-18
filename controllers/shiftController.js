const moment = require("moment");
const shiftModel = require("../models/shiftModel");

// Determine whether a shift's end time falls on the next day
// (e.g. 8:00 pm -> 5:00 am). Times are stored as "h:mm a" strings.
const computeCrossesMidnight = (timeStart, timeEnd) => {
    const start = moment(timeStart, ["h:mm a", "H:mm"]);
    const end = moment(timeEnd, ["h:mm a", "H:mm"]);
    if (!start.isValid() || !end.isValid()) return false;
    return end.hour() * 60 + end.minute() <= start.hour() * 60 + start.minute();
};

const listShifts = async (request, response) => {
    try {
        const shifts = await shiftModel.getAll();
        response.status(200).json(shifts);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const createShift = async (request, response) => {
    try {
        const { name, timeStart, timeEnd } = request.body;
        if (!name) return response.status(400).send("Shift name is required.");
        if (!timeStart || !timeEnd) return response.status(400).send("Time Start and Time End are required.");

        const existing = await shiftModel.findByName(name);
        if (existing) return response.status(400).json({ message: "Shift name already exists." });

        const shift = await shiftModel.create({
            name,
            timeStart,
            timeEnd,
            crossesMidnight: computeCrossesMidnight(timeStart, timeEnd),
        });

        response.status(200).json({ shift: shift.Name });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const updateShift = async (request, response) => {
    try {
        const { name, timeStart, timeEnd } = request.body;
        const updated = await shiftModel.update(request.params.id, {
            name,
            timeStart,
            timeEnd,
            crossesMidnight: computeCrossesMidnight(timeStart, timeEnd),
        });
        response.status(200).json(updated);
    } catch (error) {
        response.status(500).json({ error: "Error" });
    }
};

const deleteShift = async (request, response) => {
    try {
        await shiftModel.softDelete(request.params.id);
        response.status(200).json({ message: "Shift deleted" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

module.exports = { listShifts, createShift, updateShift, deleteShift };
