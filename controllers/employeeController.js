const employeeModel = require("../models/employeeModel");
const departmentModel = require("../models/departmentModel");
const { employeeValidation } = require("../utils/validation");

const PER_PAGE = 20;

const buildEmployeeResponse = async (emp) => {
    const dept = await departmentModel.findByIdRaw(emp.DepartmentId);
    return {
        _id: emp.Id,
        employeeNo: emp.EmployeeNo,
        firstName: emp.FirstName,
        middleName: emp.MiddleName,
        lastName: emp.LastName,
        suffix: emp.Suffix,
        deptId: dept ? dept.Id : null,
        department: dept ? dept.Department : "",
        contactNo: emp.ContactNo,
        gender: emp.Gender,
        address: emp.Address,
    };
};

const createEmployee = async (request, response) => {
    try {
        const { error } = employeeValidation(request.body);
        if (error) return response.status(400).send(error.details[0].message);

        const existing = await employeeModel.findByEmployeeNo(request.body.employeeNo);
        if (existing) return response.status(400).json({ message: "Employee No. is already taken." });

        const emp = await employeeModel.create({
            employeeNo: request.body.employeeNo,
            firstName: request.body.firstName,
            middleName: request.body.middleName,
            lastName: request.body.lastName,
            suffix: request.body.suffix,
            departmentId: request.body.department,
            contactNo: request.body.contactNo,
            gender: request.body.gender,
            address: request.body.address,
        });

        response.status(200).json({ employee: `${emp.EmployeeNo} - ${emp.FirstName}` });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const updateEmployee = async (request, response) => {
    try {
        const updated = await employeeModel.update(request.params.id, {
            employeeNo: request.body.employeeNo,
            firstName: request.body.firstName,
            middleName: request.body.middleName,
            lastName: request.body.lastName,
            suffix: request.body.suffix,
            departmentId: request.body.department,
            contactNo: request.body.contactNo,
            gender: request.body.gender,
            address: request.body.address,
        });

        response.status(200).json({
            employee: `${updated.EmployeeNo} - ${updated.FirstName} ${updated.MiddleName} ${updated.LastName}`,
        });
    } catch (error) {
        response.status(500).json({ error: "Error" });
    }
};

const listEmployees = async (request, response) => {
    try {
        const page = request.body.page !== "" ? parseInt(request.body.page) : 0;
        const offset = page * PER_PAGE;
        const selectedEmployee = request.body.selectedEmployee || {};
        const selectedDepartment = request.body.selectedDepartment || {};

        const empIds = Object.values(selectedEmployee).map(e => e.value);
        const depIds = Object.values(selectedDepartment).map(d => d.value);

        let employees;
        if (empIds.length > 0) {
            employees = depIds.length > 0
                ? await employeeModel.getByIdsAndDepartments(empIds, depIds)
                : await employeeModel.getByIds(empIds);
        } else {
            employees = await employeeModel.getPaginated(offset, PER_PAGE, depIds);
        }

        const result = await Promise.all(employees.map(buildEmployeeResponse));
        response.status(200).json(result);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const totalEmployees = async (request, response) => {
    try {
        const depIds = Object.values(request.body.selectedDepartment || {}).map(d => d.value);
        const total = await employeeModel.countAll(depIds);
        response.status(200).json(total);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const employeeOptions = async (request, response) => {
    try {
        const employees = await employeeModel.getAll();
        response.status(200).json(employees.map(e => ({
            id: e.Id,
            employeeNo: e.EmployeeNo,
            employeeName: `${e.FirstName} ${e.MiddleName} ${e.LastName}`.trim(),
        })));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const employeeOptionsByDepartment = async (request, response) => {
    try {
        const depIds = Object.values(request.body.selectedDepartment || {}).map(d => d.value);
        const employees = depIds.length > 0
            ? await employeeModel.getByDepartmentIds(depIds)
            : await employeeModel.getAll();
        response.status(200).json(employees.map(e => ({
            _id: e.Id,
            employeeNo: e.EmployeeNo,
            firstName: e.FirstName,
            middleName: e.MiddleName,
            lastName: e.LastName,
            suffix: e.Suffix,
        })));
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

const deleteEmployee = async (request, response) => {
    try {
        await employeeModel.softDelete(request.params.id);
        response.status(200).json({ message: "Employee deleted" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
};

module.exports = {
    createEmployee, updateEmployee, listEmployees, totalEmployees,
    employeeOptions, employeeOptionsByDepartment, deleteEmployee
};
