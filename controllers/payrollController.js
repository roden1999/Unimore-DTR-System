const moment = require("moment");
const employeeModel = require("../models/employeeModel");
const salaryModel = require("../models/salaryModel");
const { computeEmployeeDTR } = require("../utils/dtrCalculator");

const PER_PAGE = 5;

const peso = (n) => "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (n) => Number(n || 0).toFixed(2);

const payrollList = async (request, response) => {
    try {
        const page = request.body.page !== "" ? parseInt(request.body.page) : 0;
        const offset = page * PER_PAGE;
        const params = request.body;
        const fromDate = params.fromDate || moment("01/01/2020").toDate();
        const toDate = params.toDate || new Date();
        const payType = params.type;

        const empIds = Object.values(params.selectedEmployee || {}).map(e => e.value);
        const depIds = Object.values(params.selectedDepartment || {}).map(d => d.value);

        let employees;
        if (empIds.length > 0) {
            employees = depIds.length > 0
                ? await employeeModel.getByIdsAndDepartments(empIds, depIds)
                : await employeeModel.getByIds(empIds);
        } else {
            employees = await employeeModel.getPaginated(offset, PER_PAGE, depIds);
        }

        const data = [];
        for (const emp of employees) {
            const dtrResult = await computeEmployeeDTR(emp, fromDate, toDate);
            const { dept, timeLogs, totalDays, totalHrsWork, totalRestday, totalRestdayOt, totalHoliday,
                totalHolidayOt, totalSpecialHoliday, totalSpecialHolidayOt, totalHolidayRestday,
                totalHolidayRestdayOt, totalSpecialHolidayRestday, totalSpecialHolidayRestdayOt,
                totalLate, totalUT, totalOT, totalAbsent } = dtrResult;

            const salary = await salaryModel.findByEmployeeId(emp.Id);
            const monthly = payType === "Full Month" ? 26 : 13;

            const totalMonthly = salary ? parseFloat(salary.Salary) : 0;
            const basicMetalAsia = totalMonthly >= 373 * 26 ? 373 * 26 : totalMonthly;
            const allowanceMetalAsia = totalMonthly > basicMetalAsia ? totalMonthly - basicMetalAsia : 0;
            const dailyRate = (basicMetalAsia + allowanceMetalAsia) / monthly;

            const totalMonthlyBaseOnType = payType === "Full Month" ? totalMonthly : totalMonthly / 2;
            const basic = payType === "Full Month" ? basicMetalAsia : basicMetalAsia / 2;
            const allowance = payType === "Full Month" ? allowanceMetalAsia : allowanceMetalAsia / 2;

            const absensesTardiness = (basic + allowance) / monthly * totalAbsent;
            const netOfTardiness = (basic + allowance) - absensesTardiness;
            const tmonthPayMetalAsia = (basic + allowance - absensesTardiness) / 12;

            const amountOt = (373 / 8 * totalOT * 1.25) + (((totalMonthlyBaseOnType - basic) / monthly) / 8 * totalOT);
            const amountRestday = (totalMonthly / 26) / 8 * totalRestday * 1.3;
            const amountRestdayOt = (373 / 8 * totalRestdayOt * 1.69) + (((totalMonthlyBaseOnType - (373 * monthly)) / monthly) / 8 * totalRestdayOt);
            const amountHoliday = (totalMonthly / 26) / 8 * totalHoliday * 2 / 2;
            const amountHolidayOt = (373 / 8 * totalHolidayOt * 2.6) + (((totalMonthlyBaseOnType - (373 * monthly)) / monthly) / 8 * totalHolidayOt);
            const amountSH = (basicMetalAsia / 26) / 8 * totalSpecialHoliday * 0.3;
            const amountSHOt = (373 / 8 * totalSpecialHolidayOt * 1.69) + (((totalMonthlyBaseOnType - (373 * monthly)) / monthly) / 8 * totalSpecialHolidayOt);
            const amountHolidayRestday = (basicMetalAsia / 26) / 8 * totalHolidayRestday * 2 * 1.3;
            const amountHolidayRestdayOt = (373 / 8 * totalHolidayRestdayOt * 3.38) + (((totalMonthlyBaseOnType - (373 * monthly)) / monthly) / 8 * totalHolidayRestdayOt);
            const amountSHRestday = (basicMetalAsia / 26) / 8 * totalHolidayRestday * 1.5;
            const amountSHRestdayOt = (373 / 8 * totalSpecialHolidayRestdayOt * 1.95) + (((totalMonthlyBaseOnType - (373 * monthly)) / monthly) / 8 * totalSpecialHolidayRestdayOt);
            const tmonthPay = (basic + allowance - absensesTardiness) / 12;

            const sss = !salary || payType === "1st Half" ? 0 : parseFloat(salary.Sss);
            const phic = !salary || payType === "1st Half" ? 0 : parseFloat(salary.Phic);
            const hdmf = !salary || payType === "1st Half" ? 0 : parseFloat(salary.Hdmf);
            const cashAdvance = !salary || payType === "1st Half" ? 0 : parseFloat(salary.CashAdvance);
            const safetyShoes = !salary || payType === "1st Half" ? 0 : parseFloat(salary.SafetyShoes);
            const sssLoan = !salary || payType === "2nd Half" ? 0 : parseFloat(salary.SssLoan);
            const pagibigLoan = !salary || payType === "2nd Half" ? 0 : parseFloat(salary.PagibigLoan);
            const careHealthPlus = !salary || payType === "2nd Half" ? 0 : parseFloat(salary.CareHealthPlus);

            const totalDeduction = sss + phic + hdmf + sssLoan + pagibigLoan + careHealthPlus;
            const totalEarnings = (basic + allowance + amountOt + tmonthPay + amountRestday + amountRestdayOt + amountHoliday + amountHolidayOt + amountSH + amountSHOt) - absensesTardiness;
            const netPay = (totalEarnings - totalDeduction) > 0 ? (totalEarnings - totalDeduction) : 0;

            // Step-by-step breakdown so HR can see and verify the math.
            const notThisCutoff = " (not deducted this cut-off)";
            const computation = [
                {
                    title: "Rate Basis (Metal Asia)",
                    rows: [
                        { label: "Monthly Salary", detail: "as set in Salary & Deductions", amount: peso(totalMonthly) },
                        { label: "Basic (capped at ₱373/day)", detail: `min(${peso(totalMonthly)}, ₱373 × 26)`, amount: peso(basicMetalAsia) },
                        { label: "Allowance", detail: `${peso(totalMonthly)} − ${peso(basicMetalAsia)}`, amount: peso(allowanceMetalAsia) },
                        { label: `Pay divisor (${payType})`, detail: payType === "Full Month" ? "26 (whole month)" : "13 (half month)", amount: String(monthly) },
                        { label: "Daily Rate", detail: `(${peso(basicMetalAsia)} + ${peso(allowanceMetalAsia)}) ÷ ${monthly}`, amount: peso(dailyRate) },
                        { label: "Basic (this cut-off)", detail: payType === "Full Month" ? "full basic" : "basic ÷ 2", amount: peso(basic) },
                        { label: "Allowance (this cut-off)", detail: payType === "Full Month" ? "full allowance" : "allowance ÷ 2", amount: peso(allowance) },
                    ],
                },
                {
                    title: "Attendance (from DTR)",
                    rows: [
                        { label: "Days Worked", detail: "", amount: totalDays.toFixed(0) },
                        { label: "Hours Worked", detail: "", amount: num(totalHrsWork) },
                        { label: "Overtime Hours", detail: "", amount: num(totalOT) },
                        { label: "Late (hrs)", detail: "", amount: num(totalLate) },
                        { label: "Undertime (hrs)", detail: "", amount: num(totalUT) },
                        { label: "Absent (days)", detail: "", amount: String(totalAbsent) },
                        { label: "Rest Day (hrs)", detail: "", amount: num(totalRestday) },
                        { label: "Regular Holiday (hrs)", detail: "", amount: num(totalHoliday) },
                        { label: "Regular Holiday OT (hrs)", detail: "", amount: num(totalHolidayOt) },
                        { label: "Special Holiday (hrs)", detail: "", amount: num(totalSpecialHoliday) },
                    ],
                },
                {
                    title: "Earnings",
                    rows: [
                        { label: "Basic Pay", detail: "basic for the cut-off", amount: peso(basic) },
                        { label: "Allowance", detail: "allowance for the cut-off", amount: peso(allowance) },
                        { label: "Less: Absences / Tardiness", detail: `(${peso(basic)} + ${peso(allowance)}) ÷ ${monthly} × ${totalAbsent} day(s)`, amount: "− " + peso(absensesTardiness) },
                        { label: "Overtime", detail: `(₱373÷8 × ${num(totalOT)} × 1.25) + (((${peso(totalMonthlyBaseOnType)} − ${peso(basic)}) ÷ ${monthly}) ÷ 8 × ${num(totalOT)})`, amount: peso(amountOt) },
                        { label: "Rest Day", detail: `(${peso(totalMonthly)} ÷ 26) ÷ 8 × ${num(totalRestday)} × 1.3`, amount: peso(amountRestday) },
                        { label: "Rest Day OT", detail: `₱373÷8 × ${num(totalRestdayOt)} × 1.69 + …`, amount: peso(amountRestdayOt) },
                        { label: "Regular Holiday", detail: `(${peso(totalMonthly)} ÷ 26) ÷ 8 × ${num(totalHoliday)} × 2 ÷ 2`, amount: peso(amountHoliday) },
                        { label: "Regular Holiday OT", detail: `₱373÷8 × ${num(totalHolidayOt)} × 2.6 + …`, amount: peso(amountHolidayOt) },
                        { label: "Special Holiday", detail: `(${peso(basicMetalAsia)} ÷ 26) ÷ 8 × ${num(totalSpecialHoliday)} × 0.3`, amount: peso(amountSH) },
                        { label: "Special Holiday OT", detail: `₱373÷8 × ${num(totalSpecialHolidayOt)} × 1.69 + …`, amount: peso(amountSHOt) },
                        { label: "13th-Month Accrual", detail: `(${peso(basic)} + ${peso(allowance)} − ${peso(absensesTardiness)}) ÷ 12`, amount: peso(tmonthPay) },
                        { label: "TOTAL EARNINGS", detail: "sum of earnings, less absences/tardiness", amount: peso(totalEarnings), strong: true },
                    ],
                },
                {
                    title: "Deductions",
                    rows: [
                        { label: "SSS", detail: payType === "1st Half" ? notThisCutoff : "", amount: peso(sss) },
                        { label: "PhilHealth", detail: payType === "1st Half" ? notThisCutoff : "", amount: peso(phic) },
                        { label: "Pag-IBIG (HDMF)", detail: payType === "1st Half" ? notThisCutoff : "", amount: peso(hdmf) },
                        { label: "SSS Loan", detail: payType === "2nd Half" ? notThisCutoff : "", amount: peso(sssLoan) },
                        { label: "Pag-IBIG Loan", detail: payType === "2nd Half" ? notThisCutoff : "", amount: peso(pagibigLoan) },
                        { label: "Care Health Plus", detail: payType === "2nd Half" ? notThisCutoff : "", amount: peso(careHealthPlus) },
                        { label: "TOTAL DEDUCTIONS", detail: "SSS + PhilHealth + Pag-IBIG + loans + Care Health Plus", amount: peso(totalDeduction), strong: true },
                    ],
                },
                {
                    title: "Net Pay",
                    rows: [
                        { label: "NET PAY", detail: `${peso(totalEarnings)} − ${peso(totalDeduction)}`, amount: peso(netPay), strong: true },
                    ],
                },
            ];

            data.push({
                _id: emp.Id,
                employeeNo: emp.EmployeeNo,
                employeeName: `${emp.LastName}, ${emp.FirstName} ${emp.MiddleName} ${emp.Suffix}`.trim(),
                department: dept ? dept.Department : "",
                salary: totalMonthly.toFixed(2),
                basicMetalAsia: basicMetalAsia.toFixed(2),
                allowanceMetalAsia: allowanceMetalAsia.toFixed(2),
                dailyRate: dailyRate.toFixed(2),
                timeLogs,
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
                earnings: [{
                    basic: basic.toFixed(2),
                    absensesTardiness: absensesTardiness.toFixed(2),
                    allowance: allowance.toFixed(2),
                    overtime: amountOt.toFixed(2),
                    restday: amountRestday.toFixed(2),
                    restdayOT: amountRestdayOt.toFixed(2),
                    holiday: amountHoliday.toFixed(2),
                    holidayOT: amountHolidayOt.toFixed(2),
                    holidayRestday: amountHolidayRestday.toFixed(2),
                    holidayRestdayOT: amountHolidayRestdayOt.toFixed(2),
                    specialHolidayRestday: amountSHRestday.toFixed(2),
                    specialHolidayRestdayOT: amountSHRestdayOt.toFixed(2),
                    sh: amountSH.toFixed(2),
                    shOt: amountSHOt.toFixed(2),
                    tMonthPay: tmonthPay > 0 ? tmonthPay.toFixed(2) : "0.00",
                }],
                deductions: [{
                    sss: sss.toFixed(2),
                    phic: phic.toFixed(2),
                    hdmf: hdmf.toFixed(2),
                    cashAdvance: cashAdvance.toFixed(2),
                    safetyShoes: safetyShoes.toFixed(2),
                    sssLoan: sssLoan.toFixed(2),
                    pagibigLoan: pagibigLoan.toFixed(2),
                    careHealthPlus: careHealthPlus.toFixed(2),
                }],
                totalEarnings: totalEarnings > 0 ? totalEarnings.toFixed(2) : "0.00",
                totalDeduction: totalDeduction.toFixed(2),
                netOfTardiness: netOfTardiness.toFixed(2),
                totalAbsensesTardiness: absensesTardiness.toFixed(2),
                grossSalary: (netOfTardiness + amountOt).toFixed(2),
                tMonthPayMetalAsia: tmonthPayMetalAsia > 0 ? tmonthPayMetalAsia.toFixed(2) : "0.00",
                netPayMetalAsia: (totalEarnings - totalDeduction) > 0 ? (totalEarnings - totalDeduction).toFixed(2) : "0.00",
                computation,
            });
        }

        response.status(200).json(data);
    } catch (err) {
        response.status(500).json({ error: err.message });
    }
};

module.exports = { payrollList };
