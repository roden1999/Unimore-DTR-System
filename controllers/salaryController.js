const salaryModel = require("../models/salaryModel");
const employeeModel = require("../models/employeeModel");
const departmentModel = require("../models/departmentModel");
const { salaryValidation } = require("../utils/validation");

const PER_PAGE = 20;

const upsertSalary = async (request, response) => {
    try {
        const { error } = salaryValidation(request.body);
        if (error) return response.status(400).send(error.details[0].message);

        const employeeId = parseInt(request.body.employeeId);
        const existing = await salaryModel.findByEmployeeId(employeeId);

        const data = {
            salary: request.body.salary,
            sss: request.body.sss,
            phic: request.body.phic,
            hdmf: request.body.hdmf,
            sssLoan: request.body.sssLoan,
            pagibigLoan: request.body.pagibigLoan,
            careHealthPlus: request.body.careHealthPlus,
            cashAdvance: request.body.cashAdvance,
            safetyShoes: request.body.safetyShoes,
        };

        if (existing) {
            await salaryModel.update(employeeId, data);
            return response.status(200).json({ salary: "employee's salary successfully edited." });
        }

        await salaryModel.create({ employeeId, ...data });
        response.status(200).json({ salary: "Salary successfully saved." });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const updateSalary = async (request, response) => {
    try {
        const { error } = salaryValidation(request.body);
        if (error) return response.status(400).send(error.details[0].message);

        await salaryModel.update(parseInt(request.params.id), {
            salary: request.body.salary,
            sss: request.body.sss,
            phic: request.body.phic,
            hdmf: request.body.hdmf,
            sssLoan: request.body.sssLoan,
            pagibigLoan: request.body.pagibigLoan,
            careHealthPlus: request.body.careHealthPlus,
            cashAdvance: request.body.cashAdvance,
            safetyShoes: request.body.safetyShoes,
        });

        response.status(200).json({ message: "Salary updated." });
    } catch (error) {
        response.status(500).json({ error: "Error" });
    }
};

const listSalaries = async (request, response) => {
    try {
        const page = request.body.page !== "" ? parseInt(request.body.page) : 0;
        const offset = page * PER_PAGE;
        const empIds = Object.values(request.body.selectedEmployee || {}).map(e => e.value);
        const depIds = Object.values(request.body.selectedDepartment || {}).map(d => d.value);

        let employees;
        if (empIds.length > 0) {
            employees = depIds.length > 0
                ? await employeeModel.getByIdsAndDepartments(empIds, depIds)
                : await employeeModel.getByIds(empIds);
        } else {
            employees = await employeeModel.getPaginated(offset, PER_PAGE, depIds);
        }

        const result = [];
        for (const emp of employees) {
            const salary = await salaryModel.findByEmployeeId(emp.Id);
            const dept = await departmentModel.findByIdRaw(emp.DepartmentId);

            result.push({
                id: emp.Id,
                employeeNo: emp.EmployeeNo,
                employeeName: `${emp.LastName}, ${emp.FirstName} ${emp.MiddleName} ${emp.Suffix}`.trim(),
                department: dept ? dept.Department : "",
                salaryId: salary ? salary.Id : "No Salary",
                salary: salary ? salary.Salary : 0,
                sss: salary ? salary.Sss : 0,
                phic: salary ? salary.Phic : 0,
                hdmf: salary ? salary.Hdmf : 0,
                sssLoan: salary ? salary.SssLoan : 0,
                pagibigLoan: salary ? salary.PagibigLoan : 0,
                careHealthPlus: salary ? salary.CareHealthPlus : 0,
                cashAdvance: salary ? salary.CashAdvance : 0,
                safetyShoes: salary ? salary.SafetyShoes : 0,
            });
        }

        response.status(200).json(result);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const salaryOptions = async (request, response) => {
    try {
        const employees = await employeeModel.getAll();
        response.status(200).json(employees);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const deleteSalary = async (request, response) => {
    try {
        await salaryModel.remove(request.params.id);
        response.status(200).json({ message: "Salary record deleted" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

module.exports = { upsertSalary, updateSalary, listSalaries, salaryOptions, deleteSalary };
