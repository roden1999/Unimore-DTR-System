const { getPool, sql } = require("../config/db");

const findByEmployeeId = async (employeeId) => {
    const pool = getPool();
    const result = await pool.request()
        .input("EmployeeId", sql.Int, employeeId)
        .query("SELECT * FROM Salaries WHERE EmployeeId = @EmployeeId");
    return result.recordset[0] || null;
};

const findById = async (id) => {
    const pool = getPool();
    const result = await pool.request()
        .input("Id", sql.Int, id)
        .query("SELECT * FROM Salaries WHERE Id = @Id");
    return result.recordset[0] || null;
};

const create = async ({ employeeId, salary, sss, phic, hdmf, sssLoan, pagibigLoan, careHealthPlus, cashAdvance, safetyShoes }) => {
    const pool = getPool();
    const result = await pool.request()
        .input("EmployeeId", sql.Int, employeeId)
        .input("Salary", sql.Decimal(18, 2), salary)
        .input("Sss", sql.Decimal(18, 2), sss || 0)
        .input("Phic", sql.Decimal(18, 2), phic || 0)
        .input("Hdmf", sql.Decimal(18, 2), hdmf || 0)
        .input("SssLoan", sql.Decimal(18, 2), sssLoan || 0)
        .input("PagibigLoan", sql.Decimal(18, 2), pagibigLoan || 0)
        .input("CareHealthPlus", sql.Decimal(18, 2), careHealthPlus || 0)
        .input("CashAdvance", sql.Decimal(18, 2), cashAdvance || 0)
        .input("SafetyShoes", sql.Decimal(18, 2), safetyShoes || 0)
        .query(`INSERT INTO Salaries (EmployeeId, Salary, Sss, Phic, Hdmf, SssLoan, PagibigLoan, CareHealthPlus, CashAdvance, SafetyShoes)
                OUTPUT INSERTED.Id
                VALUES (@EmployeeId, @Salary, @Sss, @Phic, @Hdmf, @SssLoan, @PagibigLoan, @CareHealthPlus, @CashAdvance, @SafetyShoes)`);
    return result.recordset[0];
};

const update = async (employeeId, { salary, sss, phic, hdmf, sssLoan, pagibigLoan, careHealthPlus, cashAdvance, safetyShoes }) => {
    const pool = getPool();
    await pool.request()
        .input("EmployeeId", sql.Int, employeeId)
        .input("Salary", sql.Decimal(18, 2), salary)
        .input("Sss", sql.Decimal(18, 2), sss || 0)
        .input("Phic", sql.Decimal(18, 2), phic || 0)
        .input("Hdmf", sql.Decimal(18, 2), hdmf || 0)
        .input("SssLoan", sql.Decimal(18, 2), sssLoan || 0)
        .input("PagibigLoan", sql.Decimal(18, 2), pagibigLoan || 0)
        .input("CareHealthPlus", sql.Decimal(18, 2), careHealthPlus || 0)
        .input("CashAdvance", sql.Decimal(18, 2), cashAdvance || 0)
        .input("SafetyShoes", sql.Decimal(18, 2), safetyShoes || 0)
        .query(`UPDATE Salaries SET Salary=@Salary, Sss=@Sss, Phic=@Phic, Hdmf=@Hdmf, SssLoan=@SssLoan,
                PagibigLoan=@PagibigLoan, CareHealthPlus=@CareHealthPlus, CashAdvance=@CashAdvance, SafetyShoes=@SafetyShoes
                WHERE EmployeeId = @EmployeeId`);
};

const remove = async (id) => {
    const pool = getPool();
    await pool.request()
        .input("Id", sql.Int, id)
        .query("DELETE FROM Salaries WHERE Id = @Id");
};

module.exports = { findByEmployeeId, findById, create, update, remove };
