const moment = require("moment");
const timelogModel = require("../models/timelogModel");
const dtrCorrectionModel = require("../models/dtrCorrectionModel");
const holidayModel = require("../models/holidayModel");
const departmentModel = require("../models/departmentModel");

const buildDateRange = (dateStr, h, m, s) => {
    const d = new Date(dateStr);
    d.setHours(h, m, s, 0);
    return d;
};

const computeDayEntry = async (emp, dateStr, schedules) => {
    const day = moment(dateStr).format("dddd");

    let depIn = "";
    let depOut = "";
    for (const s of schedules) {
        if (s.DayName === day) {
            depIn = s.TimeStart;
            depOut = s.TimeEnd;
        }
    }

    const holiday = await holidayModel.findByDate(dateStr);
    const dtr = await dtrCorrectionModel.findByEmployeeNoAndDate(emp.EmployeeNo, dateStr);

    const dayStart5am = buildDateRange(dateStr, 5, 0, 0);
    const dayEnd = buildDateRange(dateStr, 23, 59, 59);
    const nextDate = moment(dateStr).add(1, "d").toDate();
    const nextDayOTEnd = buildDateRange(nextDate, 4, 59, 59);

    let timeIn = "";
    let timeOut = "";
    let breakOut = "";
    let breakIn = "";
    let reason = "";

    const timeInRecord = await timelogModel.getTimeIn(emp.EmployeeNo, dayStart5am, dayEnd);
    const timeOutRecord = await timelogModel.getTimeOut(emp.EmployeeNo, buildDateRange(dateStr, 0, 0, 0), dayEnd);
    const nxtDayOT = await timelogModel.getNextDayOT(emp.EmployeeNo, buildDateRange(nextDate, 0, 0, 0), nextDayOTEnd);

    const breakMode = day !== "Saturday" ? "E" : "S";
    const breakH = day !== "Saturday" ? 12 : 10;
    const breakEndH = day !== "Saturday" ? 13 : 11;
    const breakOutRecord = await timelogModel.getBreakOut(emp.EmployeeNo, buildDateRange(dateStr, breakH, 0, 0), buildDateRange(dateStr, breakEndH, 15, 59), breakMode);
    const breakInRecord = await timelogModel.getBreakIn(emp.EmployeeNo, buildDateRange(dateStr, breakH, 1, 0), buildDateRange(dateStr, breakEndH, 15, 59), breakMode);

    if (dtr) {
        if (dtr.Remarks === "Overtime") {
            timeIn = timeInRecord ? moment(timeInRecord.DateTime).format("h:mm A") : "";
            timeOut = nxtDayOT ? moment(nxtDayOT.DateTime).format("h:mm A") : (timeOutRecord ? moment(timeOutRecord.DateTime).format("h:mm A") : "");
        } else {
            timeIn = dtr.TimeIn ? moment(dtr.TimeIn, "h:mm A").format("h:mm A") : "";
            timeOut = dtr.TimeOut ? moment(dtr.TimeOut, "h:mm A").format("h:mm A") : "";
        }
        reason = dtr.Reason || "";
    } else {
        timeIn = timeInRecord ? moment(timeInRecord.DateTime).format("h:mm A") : "";
        timeOut = nxtDayOT ? moment(nxtDayOT.DateTime).format("h:mm A") : (timeOutRecord ? moment(timeOutRecord.DateTime).format("h:mm A") : "");
    }

    breakOut = breakOutRecord ? moment(breakOutRecord.DateTime).format("h:mm A") : "";
    breakIn = breakInRecord ? moment(breakInRecord.DateTime).format("h:mm A") : "";

    const convertedDate = moment(dateStr).format("MM/DD/YYYY");
    const todt = nxtDayOT ? moment(nextDate).format("MM/DD/YYYY") : convertedDate;

    const convertedTI = moment(`${convertedDate} ${timeIn}`).toDate();
    const convertedTO = moment(`${todt} ${timeOut}`).toDate();
    const convertedDTI = moment(`${convertedDate} ${depIn}`).toDate();
    const convertedLateDTI = moment(`${convertedDate} ${depIn}`).add(15, "minutes").toDate();
    const convertedDTO = moment(`${todt} ${depOut}`).toDate();

    let remarks = "";
    let late = 0;
    let ut = 0;
    let ot = 0;
    let hoursWork = 0;

    if (timeIn && new Date(convertedTI) > new Date(convertedLateDTI) && day !== "Sunday") {
        const msec = new Date(convertedTI) - new Date(convertedDTI);
        late = Math.floor(msec / 60000) / 60;
    }

    if (timeOut && new Date(convertedTO) < new Date(convertedDTO) && day !== "Sunday" && !nxtDayOT) {
        const msec = Math.abs(new Date(convertedDTO) - new Date(convertedTO));
        ut = Math.floor(msec / 60000) / 60;
        remarks = "Undertime";
    }

    if (timeIn && timeOut && day !== "Sunday") {
        const d1 = new Date(convertedLateDTI) >= new Date(convertedTI) ? new Date(convertedDTI) : new Date(convertedTI);
        const d2 = new Date(convertedDTO) <= new Date(convertedTO) ? new Date(convertedDTO) : new Date(convertedTO);
        const hw = Math.floor((d2 - d1) / 60000 / 60);
        hoursWork = hw > 5 ? hw : hw;
    }

    if (dtr) remarks = dtr.Remarks || remarks;

    if (remarks === "Overtime" && day !== "Sunday") {
        if (timeIn && timeOut && !nxtDayOT) {
            const d1 = depIn <= timeIn ? new Date(convertedDTI) : new Date(convertedTI);
            const d2 = depOut >= timeOut ? new Date(convertedDTO) : new Date(convertedTO);
            hoursWork = (d2 - d1) / 36e5 + dtr.OtHours;
            ot = dtr.OtHours;
        } else if (nxtDayOT) {
            const dateTwo = moment(nextDate).format("DD MMM, YYYY") + " " + moment(convertedTO).format("h:mm A");
            const hrswrk = Math.abs(new Date(dateTwo) - new Date(convertedTI));
            const nsecOt = Math.abs(new Date(dateTwo) - new Date(convertedDTO));
            hoursWork = hrswrk / 36e5;
            ot = nsecOt / 36e5;
        }
    }

    if (remarks !== "Overtime" && new Date(convertedTO) > new Date(convertedDTO) && !dtr && day !== "Sunday" ||
        remarks !== "Overtime" && nxtDayOT && !dtr && day !== "Sunday") {
        ot = 0;
        remarks = "OT For Approval";
    }

    const specialRemarks = [
        "Working Rest Day", "Working Regular Holiday", "Working Special Holiday",
        "Working Regular Holiday Rest Day", "Working Special Holiday Rest Day", "Offset"
    ];

    let totalHw = 0;
    let totalHwOt = 0;
    if (specialRemarks.includes(remarks) && timeIn && timeOut) {
        const msec = Math.abs(new Date(convertedTO) - new Date(convertedTI));
        const hw = msec / 36e5 - (dtr ? dtr.BreakTimeHrs : 0);
        hoursWork = hw;
        totalHw = hoursWork > 8 ? 8 : hoursWork;
        totalHwOt = hoursWork > 8.5 ? hoursWork - 8 : 0;
        ot = totalHwOt;
        ut = 0;
    }

    if (["SL w/ Pay", "VL w/ Pay", "Personal Leave", "Emergency Leave"].includes(remarks)) hoursWork = 8;
    if (["SL w/o Pay", "VL w/o Pay"].includes(remarks)) hoursWork = 0;

    if (!remarks && timeIn && moment(timeIn, "h:mm A").hour() + moment(timeIn, "h:mm A").minutes() / 60 >
        moment(depIn, "h:mm").hour() + (moment(depIn, "h:mm").minutes() + 15) / 60 && day !== "Sunday") {
        remarks = "Late";
    }

    if (!timeIn && !timeOut) remarks = "Absent";
    if (!timeIn && timeOut && day !== "Sunday") remarks = "Absent";
    if (timeIn && !timeOut && day !== "Sunday") remarks = "Absent";

    if (day === "Sunday" && !dtr) {
        timeIn = ""; timeOut = ""; hoursWork = 0; late = 0; ut = 0; ot = 0;
        remarks = "Rest Day";
    }

    if (holiday && !dtr) {
        timeIn = ""; timeOut = ""; hoursWork = 8; late = 0; ut = 0; ot = 0;
        remarks = holiday.Type;
        reason = holiday.Title;
    }

    if (dtr && dtr.Remarks === "Manual Timelog" && timeIn && timeOut) {
        hoursWork = dtr.HoursWork;
        ot = dtr.OtHours;
        ut = dtr.Undertime;
        timeIn = moment(dtr.TimeIn, "h:mm A").format("h:mm A");
        timeOut = moment(dtr.TimeOut, "h:mm A").format("h:mm A");
    }

    return {
        timeIn: moment(timeIn, "h:mm A").isValid() ? moment(timeIn, "h:mm A").format("h:mm A") : "",
        breakOut: moment(breakOut, "h:mm A").isValid() ? moment(breakOut, "h:mm A").format("h:mm A") : "",
        breakIn: breakIn === breakOut ? "" : (moment(breakIn, "h:mm A").isValid() ? moment(breakIn, "h:mm A").format("h:mm A") : ""),
        timeOut: moment(timeOut, "h:mm A").isValid() ? moment(timeOut, "h:mm A").format("h:mm A") : "",
        timeStartEnd: day !== "Sunday" ? `${moment(depIn, "h:mm A").format("h:mm A")} - ${moment(depOut, "h:mm A").format("h:mm A")}` : "",
        dateTime: moment(dateStr).toDate(),
        day,
        hoursWork,
        late,
        ut,
        ot,
        remarks,
        reason,
        totalHw,
        totalHwOt,
    };
};

const computeEmployeeDTR = async (emp, fromDate, toDate) => {
    const dept = await departmentModel.findByIdRaw(emp.DepartmentId);
    const schedules = await departmentModel.getSchedules(emp.DepartmentId);

    let totalDays = 0, totalHrsWork = 0, totalRestday = 0, totalRestdayOt = 0;
    let totalHoliday = 0, totalHolidayOt = 0, totalSpecialHoliday = 0, totalSpecialHolidayOt = 0;
    let totalHolidayRestday = 0, totalHolidayRestdayOt = 0, totalSpecialHolidayRestday = 0, totalSpecialHolidayRestdayOt = 0;
    let totalLate = 0, totalUT = 0, totalOT = 0, totalAbsent = 0;

    const timeLogs = [];
    const theDate = new Date(fromDate);

    while (theDate <= new Date(toDate)) {
        const dateStr = moment(theDate).format("YYYY-MM-DD");
        const entry = await computeDayEntry(emp, dateStr, schedules);

        const { remarks, hoursWork, late, ut, ot, totalHw, totalHwOt } = entry;
        const isAbsent = ["Absent", "SL w/o Pay", "VL w/o Pay"].includes(remarks);
        const isRestOrAbsent = isAbsent || remarks === "Rest Day";

        totalDays = isRestOrAbsent ? totalDays : totalDays + 1;
        totalHrsWork += hoursWork;
        totalLate += late;
        totalUT += ut;
        totalAbsent = isAbsent ? totalAbsent + 1 : totalAbsent;
        totalOT = remarks === "Overtime" ? totalOT + ot : totalOT;

        totalRestday += remarks === "Working Rest Day" ? totalHw : 0;
        totalRestdayOt += remarks === "Working Rest Day" ? totalHwOt : 0;
        totalHoliday += remarks === "Working Regular Holiday" ? totalHw : 0;
        totalHolidayOt += remarks === "Working Regular Holiday" ? totalHwOt : 0;
        totalSpecialHoliday += remarks === "Working Special Holiday" ? totalHw : (remarks === "Special Holiday" ? 8 : 0);
        totalSpecialHolidayOt += remarks === "Working Special Holiday" ? totalHwOt : 0;
        totalHolidayRestday += remarks === "Working Regular Holiday Rest Day" ? totalHw : (remarks === "Regular Holiday" ? 8 : 0);
        totalHolidayRestdayOt += remarks === "Working Regular Holiday Rest Day" ? totalHwOt : 0;
        totalSpecialHolidayRestday += remarks === "Working Special Holiday Rest Day" ? totalHw : (remarks === "Special Holiday Rest Day" ? 8 : 0);
        totalSpecialHolidayRestdayOt += remarks === "Working Special Holiday Rest Day" ? totalHwOt : 0;

        timeLogs.push({
            ...entry,
            hoursWork: hoursWork.toFixed(2),
            late: late.toFixed(2),
            UT: ut.toFixed(2),
            OT: ot.toFixed(2),
        });

        theDate.setDate(theDate.getDate() + 1);
    }

    return {
        dept,
        timeLogs,
        totalDays,
        totalHrsWork,
        totalRestday,
        totalRestdayOt,
        totalHoliday,
        totalHolidayOt,
        totalSpecialHoliday,
        totalSpecialHolidayOt,
        totalHolidayRestday,
        totalHolidayRestdayOt,
        totalSpecialHolidayRestday,
        totalSpecialHolidayRestdayOt,
        totalLate,
        totalUT,
        totalOT,
        totalAbsent,
    };
};

module.exports = { computeEmployeeDTR };
