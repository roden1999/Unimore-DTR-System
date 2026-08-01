const skelpModel = require("../../models/production/skelpModel");

const STATUS_VALUES = ["Unprocessed", "Partial Processed", "Fully Processed", "Reject"];

const asText = (value) => value == null ? "" : String(value).trim();
const asNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};
const asDate = (value, fallback = null) => {
    if (!value) return fallback;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

const normalize = (body = {}) => ({
    SkelpNo: asText(body.SkelpNo ?? body.skelpNo),
    SlitFormNo: asText(body.SlitFormNo ?? body.slitFormNo),
    Date: asDate(body.Date ?? body.date, new Date()),
    ProdFormNo: asText(body.ProdFormNo ?? body.prodFormNo),
    HSPrime: asText(body.HSPrime ?? body.hsPrime),
    Thickness: asNumber(body.Thickness ?? body.thickness),
    Width: asNumber(body.Width ?? body.width),
    Weight: asNumber(body.Weight ?? body.weight),
    WeightBefProc: asNumber(body.WeightBefProc ?? body.weightBefProc),
    FGtoProduce: asText(body.FGtoProduce ?? body.fgToProduce),
    LengthofFg: asNumber(body.LengthofFg ?? body.lengthOfFg),
    Remarks: asText(body.Remarks ?? body.remarks),
    Status: STATUS_VALUES.includes(body.Status ?? body.status)
        ? (body.Status ?? body.status) : "Unprocessed",
    DateProcessed: asDate(body.DateProcessed ?? body.dateProcessed, null),
    Operator: asText(body.Operator ?? body.operator),
    OtherRemarks: asText(body.OtherRemarks ?? body.otherRemarks),
    Location: asText(body.Location ?? body.location),
});

const round = (value) => Number.isFinite(value) ? Number(value.toFixed(2)) : 0;

const shape = (row) => {
    const estimatedLength = row.Thickness && row.Width
        ? row.Weight / (row.Thickness * row.Width * 7.85 * 0.000001) / 1000
        : 0;
    const estimatedQuantity = row.LengthofFg
        ? estimatedLength / (row.LengthofFg / 1000)
        : 0;
    return {
        id: String(row.Id),
        skelpNo: row.SkelpNo,
        slitFormNo: row.SlitFormNo || "",
        date: row.Date,
        prodFormNo: row.ProdFormNo || "",
        hsPrime: row.HSPrime || "",
        thickness: row.Thickness || 0,
        width: row.Width || 0,
        weight: row.Weight || 0,
        weightMT: round((row.Weight || 0) / 1000),
        weightBefProc: row.WeightBefProc || 0,
        estLength: round(estimatedLength),
        estQtyProduce: round(estimatedQuantity),
        fgToProduce: row.FGtoProduce || "",
        lengthOfFg: row.LengthofFg || 0,
        remarks: row.Remarks || "",
        status: row.Status || "Unprocessed",
        dateProcessed: row.DateProcessed,
        operator: row.Operator || "",
        otherRemarks: row.OtherRemarks || "",
        location: row.Location || "",
    };
};

const validate = (item) => {
    if (!item.SkelpNo) return "Skelp No. is required.";
    if (item.Thickness < 0 || item.Width < 0 || item.Weight < 0 ||
        item.WeightBefProc < 0 || item.LengthofFg < 0) {
        return "Numeric inventory values cannot be negative.";
    }
    return null;
};

const list = async (_request, response) => {
    try {
        response.json((await skelpModel.list()).map(shape));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const get = async (request, response) => {
    try {
        const row = await skelpModel.findById(request.params.id);
        if (!row) return response.status(404).json({ error: "Inventory record not found." });
        response.json(shape(row));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const create = async (request, response) => {
    try {
        const item = normalize(request.body);
        const error = validate(item);
        if (error) return response.status(400).json({ error });
        response.status(201).json(shape(await skelpModel.create(item)));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const importRows = async (request, response) => {
    try {
        if (!Array.isArray(request.body) || !request.body.length) {
            return response.status(400).json({ error: "At least one inventory row is required." });
        }
        if (request.body.length > 1000) {
            return response.status(400).json({ error: "A maximum of 1,000 rows can be imported at once." });
        }
        const items = request.body.map(normalize);
        const invalidIndex = items.findIndex((item) => validate(item));
        if (invalidIndex >= 0) {
            return response.status(400).json({
                error: `Row ${invalidIndex + 2}: ${validate(items[invalidIndex])}`,
            });
        }
        await skelpModel.createMany(items);
        response.status(201).json({ imported: items.length });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const update = async (request, response) => {
    try {
        const item = normalize(request.body);
        const error = validate(item);
        if (error) return response.status(400).json({ error });
        const row = await skelpModel.update(request.params.id, item);
        if (!row) return response.status(404).json({ error: "Inventory record not found." });
        response.json(shape(row));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const remove = async (request, response) => {
    try {
        const row = await skelpModel.remove(request.params.id);
        if (!row) return response.status(404).json({ error: "Inventory record not found." });
        response.json({ message: "Inventory record deleted." });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

module.exports = { list, get, create, importRows, update, remove };
