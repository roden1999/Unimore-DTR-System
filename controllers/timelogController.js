const moment = require("moment");
const XLSX = require("xlsx");
const employeeModel = require("../models/employeeModel");
const timelogModel = require("../models/timelogModel");
const dtrCorrectionModel = require("../models/dtrCorrectionModel");
const { computeEmployeeDTR } = require("../utils/dtrCalculator");

const PER_PAGE = 20;
const DTR_PER_PAGE = 5;

const uploadXls = async (request, response) => {
    try {
        if (!request.files) return response.status(400).json({ msg: "No file uploaded" });

        const file = request.files.file;
        const fileName = file.name;
        const savePath = `${__dirname}/../app_data/importedfiles/${fileName}`;

        file.mv(savePath, async (err) => {
            if (err) return response.status(500).json({ error: err.message });

            const wb = XLSX.readFile(savePath);
            const csvData = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]], { raw: false, dateNF: "MM-DD-YYYY", header: 1, defval: "" });
            const lines = csvData.split("\n");
            const headers = lines[0].split(",");
            const result = [];

            for (let i = 1; i < lines.length; i++) {
                const obj = {};
                const cols = lines[i].split(",");
                for (let j = 0; j < headers.length; j++) obj[headers[j]] = cols[j];
                if (obj.EnNo && obj.DaiGong) result.push(obj);
            }

            if (result.length === 0) return response.status(400).json({ error: "Please select file before importing!" });

            for (const row of result) {
                const dateTime = moment(row.DaiGong);
                if (!dateTime.isValid()) return response.status(400).json({ error: `Invalid Date in row: ${row.EnNo}` });

                const emp = await employeeModel.findByEmployeeNo(row.EnNo);
                await timelogModel.insert({
                    employeeNo: row.EnNo,
                    timeInOut: row.Mode,
                    dateTime: dateTime.toDate(),
                    employeeName: emp ? `${emp.FirstName} ${emp.MiddleName} ${emp.LastName}` : "",
                });
            }

            response.status(200).json({ logs: "Logs successfully imported." });
        });
    } catch (err) {
        response.status(500).json({ error: err.message });
    }
};

const importLogs = async (request, response) => {
    try {
        const data = request.body.data || [];
        if (data.length === 0) return response.status(400).json({ error: "Please select file before importing!" });

        for (const row of data) {
            const dateTime = moment(row.DaiGong);
            const emp = await employeeModel.findByEmployeeNo(row.EnNo);
            await timelogModel.insert({
                employeeNo: row.EnNo,
                timeInOut: row.Mode,
                dateTime: dateTime.toDate(),
                employeeName: emp ? `${emp.FirstName} ${emp.MiddleName} ${emp.LastName}` : "",
            });
        }

        response.status(200).json({ logs: "Logs successfully imported." });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const rawList = async (request, response) => {
    try {
        const page = request.body.page !== "" ? parseInt(request.body.page) : 0;
        const offset = page * PER_PAGE;
        const fromDate = request.body.fromDate || moment("01/01/2020", "YYYY-MM-DD").toDate();
        const toDate = request.body.toDate || new Date();
        const empNos = Object.values(request.body.selectedLogs || {}).map(l => l.value);

        let logs;
        if (empNos.length > 0) {
            logs = await timelogModel.getByEmployeeNosAndDateRange(empNos, fromDate, toDate);
        } else {
            logs = await timelogModel.getByDateRange(fromDate, toDate, offset, PER_PAGE);
        }

        const result = await Promise.all(logs.map(async (log) => {
            const emp = await employeeModel.findByEmployeeNo(log.EmployeeNo);
            return {
                id: log.Id,
                employeeNo: log.EmployeeNo,
                employeeName: emp ? `${emp.LastName}, ${emp.FirstName} ${emp.MiddleName} ${emp.Suffix}`.trim() : "",
                timeInOut: log.TimeInOut,
                dateTime: log.DateTime,
            };
        }));

        response.status(200).json(result);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const totalLogs = async (request, response) => {
    try {
        const fromDate = request.body.fromDate || moment("01/01/2020", "YYYY-MM-DD").toDate();
        const toDate = request.body.toDate || new Date();
        const empNos = Object.values(request.body.selectedLogs || {}).map(l => l.value);

        const total = empNos.length > 0
            ? await timelogModel.countByEmployeeNosAndDateRange(empNos, fromDate, toDate)
            : await timelogModel.countByDateRange(fromDate, toDate);

        response.status(200).json(total);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const timelogOptions = async (request, response) => {
    try {
        const employees = await employeeModel.getAll();
        const result = employees.map(e => ({
            id: e.Id,
            employeeNo: e.EmployeeNo,
            employeeName: `${e.FirstName} ${e.MiddleName} ${e.LastName}`.trim(),
        }));
        response.status(200).json(result);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const detailedList = async (request, response) => {
    try {
        const page = request.body.page !== "" ? parseInt(request.body.page) : 0;
        const offset = page * DTR_PER_PAGE;
        const fromDate = request.body.fromDate || moment("01/01/2020").toDate();
        const toDate = request.body.toDate || new Date();
        const selectedRemarks = request.body.selectedRemarks;

        const empIds = Object.values(request.body.selectedDetailedLogs || {}).map(e => e.value);
        const depIds = Object.values(request.body.selectedDepartment || {}).map(d => d.value);

        let employees;
        if (empIds.length > 0) {
            employees = depIds.length > 0
                ? await employeeModel.getByIdsAndDepartments(empIds, depIds)
                : await employeeModel.getByIds(empIds);
        } else {
            employees = await employeeModel.getPaginated(offset, DTR_PER_PAGE, depIds);
        }

        const data = [];
        for (const emp of employees) {
            const dtr = await computeEmployeeDTR(emp, fromDate, toDate);
            const { dept, timeLogs, totalDays, totalHrsWork, totalRestday, totalRestdayOt, totalHoliday,
                totalHolidayOt, totalSpecialHoliday, totalSpecialHolidayOt, totalHolidayRestday,
                totalHolidayRestdayOt, totalSpecialHolidayRestday, totalSpecialHolidayRestdayOt,
                totalLate, totalUT, totalOT, totalAbsent } = dtr;

            const filteredLogs = selectedRemarks
                ? timeLogs.filter(l => l.remarks === selectedRemarks.value)
                : timeLogs;

            data.push({
                id: emp.Id,
                employeeNo: emp.EmployeeNo,
                employeeName: `${emp.LastName}, ${emp.FirstName} ${emp.MiddleName} ${emp.Suffix}`.trim(),
                department: dept ? dept.Department : "",
                timeLogs: filteredLogs,
                totalDays: totalDays.toFixed(0),
                totalHoursWork: totalHrsWork.toFixed(2),
                totalRestday: totalRestday.toFixed(2),
                totalRestdayOt: totalRestdayOt.toFixed(2),
                totalHoliday: totalHoliday.toFixed(2),
                totalHolidayOt: totalHolidayOt.toFixed(2),
                totalSpecialHoliday: totalSpecialHoliday.toFixed(2),
                totalSpecialHolidayOt: totalSpecialHolidayOt.toFixed(2),
                totalHolidayRestday: totalHolidayRestday.toFixed(2),
                totalHolidayRestdayOt: totalHolidayRestdayOt.toFixed(2),
                totalSpecialHolidayRestday: totalSpecialHolidayRestday.toFixed(2),
                totalSpecialHolidayRestdayOt: totalSpecialHolidayRestdayOt.toFixed(2),
                totalLate: totalLate.toFixed(2),
                totalUT: totalUT.toFixed(2),
                totalOT: totalOT.toFixed(2),
                totalAbsent,
            });
        }

        response.status(200).json(data);
    } catch (err) {
        response.status(500).json({ error: err.message });
    }
};

const dtrCorrection = async (request, response) => {
    try {
        const page = request.body.page !== "" ? parseInt(request.body.page) : 0;
        const offset = page * DTR_PER_PAGE;
        const fromDate = request.body.fromDate || moment("01/01/2020").toDate();
        const toDate = request.body.toDate || new Date();

        const empNos = Object.values(request.body.selectedDtrcLogs || {}).map(e => e.value);
        const depIds = Object.values(request.body.selectedDepartment || {}).map(d => d.value);

        let employees;
        if (empNos.length > 0) {
            const empIds = [];
            for (const no of empNos) {
                const e = await employeeModel.findByEmployeeNo(no);
                if (e) empIds.push(e.Id);
            }
            employees = depIds.length > 0
                ? await employeeModel.getByIdsAndDepartments(empIds, depIds)
                : await employeeModel.getByIds(empIds);
        } else {
            employees = await employeeModel.getPaginated(offset, DTR_PER_PAGE, depIds);
        }

        const data = [];
        for (const emp of employees) {
            const corrections = empNos.length > 0
                ? await dtrCorrectionModel.getByEmployeeNosAndDateRange([emp.EmployeeNo], fromDate, toDate, 0, 1000)
                : await dtrCorrectionModel.getByDateRange(fromDate, toDate, offset, DTR_PER_PAGE);

            data.push({
                id: emp.Id,
                employeeNo: emp.EmployeeNo,
                employeeName: `${emp.LastName}, ${emp.FirstName} ${emp.MiddleName}`.trim(),
                corrections,
            });
        }

        response.status(200).json(data);
    } catch (err) {
        response.status(500).json({ error: err.message });
    }
};

module.exports = { uploadXls, importLogs, rawList, totalLogs, timelogOptions, detailedList, dtrCorrection };
