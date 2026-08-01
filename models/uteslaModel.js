const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getPool, sql } = require('../config/db');

let schemaReady = false;
const ensureSchema = async () => {
    if (schemaReady) return;
    const script = fs.readFileSync(path.join(__dirname, '..', 'database', 'utesla_schema.sql'), 'utf8');
    await getPool().request().batch(script);
    schemaReady = true;
};

const fail = (message, status = 400) => { const error = new Error(message); error.status = status; throw error; };
const amount = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const referenceNo = prefix => `${prefix}-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
const addMonths = (date, months) => { const result = new Date(date); result.setMonth(result.getMonth() + months); return result; };

const signedSavings = alias => `CASE WHEN ${alias}.TransactionType IN ('Deposit','Interest Credit','Adjustment Credit') THEN ${alias}.Amount ELSE -${alias}.Amount END`;

const getSettings = async () => {
    await ensureSchema();
    return (await getPool().request().query('SELECT * FROM UteslaSettings WHERE Id=1')).recordset[0];
};

const updateSettings = async (data, user) => {
    await ensureSchema();
    const numeric = ['DefaultAnnualLoanRate', 'DefaultTermMonths', 'MaximumTermMonths', 'MaximumLoanMultiple', 'MinimumContribution'];
    numeric.forEach(key => { if (!Number.isFinite(Number(data[key])) || Number(data[key]) < 0) fail(`${key} must be a valid positive value.`); });
    if (!['Reducing Balance', 'Flat Rate'].includes(data.DefaultInterestMethod)) fail('Select a valid default interest method.');
    if (Number(data.DefaultTermMonths) > Number(data.MaximumTermMonths)) fail('Default term cannot exceed maximum term.');
    const result = await getPool().request()
        .input('OrganizationName', sql.NVarChar, data.OrganizationName || 'UTESLA Cooperative')
        .input('CurrencyCode', sql.NVarChar, data.CurrencyCode || 'PHP')
        .input('DefaultAnnualLoanRate', sql.Decimal(9, 4), data.DefaultAnnualLoanRate)
        .input('DefaultInterestMethod', sql.NVarChar, data.DefaultInterestMethod)
        .input('DefaultTermMonths', sql.Int, data.DefaultTermMonths)
        .input('MaximumTermMonths', sql.Int, data.MaximumTermMonths)
        .input('MaximumLoanMultiple', sql.Decimal(9, 2), data.MaximumLoanMultiple)
        .input('MinimumContribution', sql.Decimal(18, 2), data.MinimumContribution)
        .input('AllowSavingsWithdrawals', sql.Bit, data.AllowSavingsWithdrawals === true)
        .input('EnforceFundAvailability', sql.Bit, data.EnforceFundAvailability === true)
        .input('UpdatedBy', sql.Int, user?._id || null)
        .query(`UPDATE UteslaSettings SET OrganizationName=@OrganizationName,CurrencyCode=@CurrencyCode,
                DefaultAnnualLoanRate=@DefaultAnnualLoanRate,DefaultInterestMethod=@DefaultInterestMethod,
                DefaultTermMonths=@DefaultTermMonths,MaximumTermMonths=@MaximumTermMonths,
                MaximumLoanMultiple=@MaximumLoanMultiple,MinimumContribution=@MinimumContribution,
                AllowSavingsWithdrawals=@AllowSavingsWithdrawals,EnforceFundAvailability=@EnforceFundAvailability,
                UpdatedBy=@UpdatedBy,UpdatedAt=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE Id=1`);
    return result.recordset[0];
};

const availableEmployees = async () => {
    await ensureSchema();
    return (await getPool().request().query(`SELECT e.Id,e.EmployeeNo,e.FirstName,e.MiddleName,e.LastName,e.Suffix,e.Image,d.Department
        FROM Employees e LEFT JOIN Departments d ON d.Id=e.DepartmentId
        LEFT JOIN UteslaMembers m ON m.EmployeeId=e.Id AND m.IsDeleted=0
        WHERE e.IsDeleted=0 AND m.Id IS NULL ORDER BY e.LastName,e.FirstName`)).recordset;
};

const listMembers = async () => {
    await ensureSchema();
    return (await getPool().request().query(`SELECT m.*,e.EmployeeNo,e.FirstName,e.MiddleName,e.LastName,e.Suffix,e.Image,d.Department,
        COALESCE(s.SavingsBalance,0) SavingsBalance,COALESCE(l.ActiveLoanBalance,0) ActiveLoanBalance,
        COALESCE(l.ActiveLoans,0) ActiveLoans
        FROM UteslaMembers m JOIN Employees e ON e.Id=m.EmployeeId LEFT JOIN Departments d ON d.Id=e.DepartmentId
        OUTER APPLY (SELECT SUM(${signedSavings('t')}) SavingsBalance FROM UteslaSavingsTransactions t WHERE t.MemberId=m.Id AND t.IsVoided=0) s
        OUTER APPLY (SELECT COUNT(*) ActiveLoans,SUM(sc.Balance) ActiveLoanBalance FROM UteslaLoans ln
          OUTER APPLY (SELECT SUM(PrincipalDue-PrincipalPaid) Balance FROM UteslaLoanSchedules WHERE LoanId=ln.Id) sc
          WHERE ln.MemberId=m.Id AND ln.IsDeleted=0 AND ln.Status IN ('Approved','Active')) l
        WHERE m.IsDeleted=0 ORDER BY e.LastName,e.FirstName`)).recordset;
};

const getMember = async (id, request = getPool().request()) => {
    return (await request.input('MemberId', sql.Int, id).query(`SELECT m.*,e.EmployeeNo,e.FirstName,e.MiddleName,e.LastName,e.Suffix,e.Image,e.IsDeleted EmployeeIsDeleted,d.Department,
        COALESCE((SELECT SUM(${signedSavings('t')}) FROM UteslaSavingsTransactions t WHERE t.MemberId=m.Id AND t.IsVoided=0),0) SavingsBalance
        FROM UteslaMembers m JOIN Employees e ON e.Id=m.EmployeeId LEFT JOIN Departments d ON d.Id=e.DepartmentId
        WHERE m.Id=@MemberId AND m.IsDeleted=0`)).recordset[0] || null;
};

const createMember = async (data) => {
    await ensureSchema();
    const employeeId = Number(data.EmployeeId);
    if (!Number.isInteger(employeeId)) fail('Select an employee.');
    const joinedDate = data.JoinedDate ? new Date(data.JoinedDate) : new Date();
    const monthlyContribution = amount(data.MonthlyContribution || 0);
    if (monthlyContribution < 0) fail('Monthly contribution cannot be negative.');
    const memberNo = String(data.MemberNo || referenceNo('UTM')).trim();
    try {
        const result = await getPool().request().input('EmployeeId', sql.Int, employeeId).input('MemberNo', sql.NVarChar, memberNo)
            .input('JoinedDate', sql.Date, joinedDate).input('MonthlyContribution', sql.Decimal(18, 2), monthlyContribution)
            .input('Notes', sql.NVarChar, data.Notes || null)
            .query(`INSERT INTO UteslaMembers(MemberNo,EmployeeId,Status,JoinedDate,MonthlyContribution,Notes)
                OUTPUT INSERTED.* SELECT @MemberNo,e.Id,'Active',@JoinedDate,@MonthlyContribution,@Notes FROM Employees e
                WHERE e.Id=@EmployeeId AND e.IsDeleted=0`);
        if (!result.recordset[0]) fail('Active employee not found.', 404);
        return result.recordset[0];
    } catch (error) {
        if ([2601, 2627].includes(error.number)) fail('This employee or member number is already registered.', 409);
        throw error;
    }
};

const updateMember = async (id, data) => {
    await ensureSchema();
    if (!['Active', 'Suspended', 'Exited'].includes(data.Status)) fail('Select a valid membership status.');
    const contribution = amount(data.MonthlyContribution || 0);
    if (contribution < 0) fail('Monthly contribution cannot be negative.');
    const result = await getPool().request().input('Id', sql.Int, id).input('Status', sql.NVarChar, data.Status)
        .input('MonthlyContribution', sql.Decimal(18, 2), contribution).input('Notes', sql.NVarChar, data.Notes || null)
        .query(`UPDATE UteslaMembers SET Status=@Status,MonthlyContribution=@MonthlyContribution,Notes=@Notes,UpdatedAt=SYSUTCDATETIME()
                OUTPUT INSERTED.* WHERE Id=@Id AND IsDeleted=0`);
    return result.recordset[0] || null;
};

const listSavings = async memberId => {
    await ensureSchema();
    const request = getPool().request();
    let where = 'WHERE t.IsVoided=0';
    if (memberId) { request.input('MemberId', sql.Int, memberId); where += ' AND t.MemberId=@MemberId'; }
    return (await request.query(`SELECT t.*,m.MemberNo,e.EmployeeNo,e.FirstName,e.LastName,e.Image
        FROM UteslaSavingsTransactions t JOIN UteslaMembers m ON m.Id=t.MemberId JOIN Employees e ON e.Id=m.EmployeeId
        ${where} ORDER BY t.TransactionDate DESC,t.Id DESC`)).recordset;
};

const postSavings = async (data, user) => {
    await ensureSchema();
    const type = data.TransactionType;
    if (!['Deposit', 'Withdrawal', 'Adjustment Credit', 'Adjustment Debit'].includes(type)) fail('Select a valid savings transaction type.');
    const value = amount(data.Amount);
    if (!(value > 0)) fail('Amount must be greater than zero.');
    const settings = await getSettings();
    if (type === 'Withdrawal' && !settings.AllowSavingsWithdrawals) fail('Savings withdrawals are disabled by UTESLA policy.', 409);
    const member = await getMember(Number(data.MemberId));
    if (!member || member.Status !== 'Active') fail('Only active members can post savings transactions.', 409);
    if (['Withdrawal', 'Adjustment Debit'].includes(type) && value > Number(member.SavingsBalance)) fail('Transaction exceeds the member savings balance.', 409);
    const result = await getPool().request().input('TransactionNo', sql.NVarChar, referenceNo('UTS'))
        .input('MemberId', sql.Int, data.MemberId).input('TransactionDate', sql.Date, data.TransactionDate || new Date())
        .input('TransactionType', sql.NVarChar, type).input('Amount', sql.Decimal(18, 2), value)
        .input('ReferenceNo', sql.NVarChar, data.ReferenceNo || null).input('Notes', sql.NVarChar, data.Notes || null)
        .input('PostedBy', sql.Int, user?._id || null)
        .query(`INSERT INTO UteslaSavingsTransactions(TransactionNo,MemberId,TransactionDate,TransactionType,Amount,ReferenceNo,Notes,PostedBy)
                OUTPUT INSERTED.* VALUES(@TransactionNo,@MemberId,@TransactionDate,@TransactionType,@Amount,@ReferenceNo,@Notes,@PostedBy)`);
    return result.recordset[0];
};

const listLoans = async () => {
    await ensureSchema();
    return (await getPool().request().query(`SELECT l.*,m.MemberNo,e.EmployeeNo,e.FirstName,e.MiddleName,e.LastName,e.Image,d.Department,
        COALESCE(sc.PrincipalOutstanding,l.Principal) PrincipalOutstanding,COALESCE(sc.InterestOutstanding,0) InterestOutstanding,
        COALESCE(p.TotalPaid,0) TotalPaid
        FROM UteslaLoans l JOIN UteslaMembers m ON m.Id=l.MemberId JOIN Employees e ON e.Id=m.EmployeeId LEFT JOIN Departments d ON d.Id=e.DepartmentId
        OUTER APPLY (SELECT SUM(PrincipalDue-PrincipalPaid) PrincipalOutstanding,SUM(InterestDue-InterestPaid) InterestOutstanding FROM UteslaLoanSchedules WHERE LoanId=l.Id) sc
        OUTER APPLY (SELECT SUM(Amount-ExcessAmount) TotalPaid FROM UteslaLoanPayments WHERE LoanId=l.Id AND IsVoided=0) p
        WHERE l.IsDeleted=0 ORDER BY l.ApplicationDate DESC,l.Id DESC`)).recordset;
};

const getLoan = async id => {
    await ensureSchema();
    const request = getPool().request().input('LoanId', sql.Int, id);
    const result = await request.query(`SELECT l.*,m.MemberNo,e.EmployeeNo,e.FirstName,e.MiddleName,e.LastName,e.Image,d.Department
        FROM UteslaLoans l JOIN UteslaMembers m ON m.Id=l.MemberId JOIN Employees e ON e.Id=m.EmployeeId LEFT JOIN Departments d ON d.Id=e.DepartmentId
        WHERE l.Id=@LoanId AND l.IsDeleted=0;
        SELECT * FROM UteslaLoanSchedules WHERE LoanId=@LoanId ORDER BY InstallmentNo;
        SELECT * FROM UteslaLoanPayments WHERE LoanId=@LoanId AND IsVoided=0 ORDER BY PaymentDate DESC,Id DESC;`);
    return result.recordsets[0][0] ? { loan: result.recordsets[0][0], schedule: result.recordsets[1], payments: result.recordsets[2] } : null;
};

const createLoan = async (data, user) => {
    await ensureSchema();
    const settings = await getSettings();
    const member = await getMember(Number(data.MemberId));
    if (!member || member.Status !== 'Active') fail('Select an active UTESLA member.');
    const principal = amount(data.Principal);
    const rate = Number(data.AnnualInterestRate ?? settings.DefaultAnnualLoanRate);
    const term = Number(data.TermMonths ?? settings.DefaultTermMonths);
    const method = data.InterestMethod || settings.DefaultInterestMethod;
    if (!(principal > 0)) fail('Loan principal must be greater than zero.');
    if (!(rate >= 0 && rate <= 100)) fail('Annual interest rate must be between 0 and 100 percent.');
    if (!Number.isInteger(term) || term < 1 || term > settings.MaximumTermMonths) fail(`Loan term must be between 1 and ${settings.MaximumTermMonths} months.`);
    if (!['Reducing Balance', 'Flat Rate'].includes(method)) fail('Select a valid interest calculation method.');
    const maxLoan = amount(Number(member.SavingsBalance) * Number(settings.MaximumLoanMultiple));
    if (principal > maxLoan) fail(`Requested principal exceeds the current policy limit of ${maxLoan.toFixed(2)} based on member savings.`, 409);
    if (!String(data.Purpose || '').trim()) fail('Loan purpose is required.');
    const result = await getPool().request().input('LoanNo', sql.NVarChar, referenceNo('UTL')).input('MemberId', sql.Int, data.MemberId)
        .input('ApplicationDate', sql.Date, data.ApplicationDate || new Date()).input('Principal', sql.Decimal(18, 2), principal)
        .input('AnnualInterestRate', sql.Decimal(9, 4), rate).input('InterestMethod', sql.NVarChar, method)
        .input('TermMonths', sql.Int, term).input('Purpose', sql.NVarChar, data.Purpose.trim())
        .input('Notes', sql.NVarChar, data.Notes || null).input('CreatedBy', sql.Int, user?._id || null)
        .query(`INSERT INTO UteslaLoans(LoanNo,MemberId,ApplicationDate,Principal,AnnualInterestRate,InterestMethod,TermMonths,Purpose,Notes,CreatedBy)
                OUTPUT INSERTED.* VALUES(@LoanNo,@MemberId,@ApplicationDate,@Principal,@AnnualInterestRate,@InterestMethod,@TermMonths,@Purpose,@Notes,@CreatedBy)`);
    return result.recordset[0];
};

const decideLoan = async (id, decision, reason, user) => {
    await ensureSchema();
    if (!['Approved', 'Rejected'].includes(decision)) fail('Decision must be Approved or Rejected.');
    if (decision === 'Rejected' && !String(reason || '').trim()) fail('Enter a rejection reason.');
    const result = await getPool().request().input('Id', sql.Int, id).input('Decision', sql.NVarChar, decision)
        .input('Reason', sql.NVarChar, reason || null).input('UserId', sql.Int, user?._id || null)
        .query(`UPDATE UteslaLoans SET Status=@Decision,ApprovedBy=CASE WHEN @Decision='Approved' THEN @UserId ELSE NULL END,
                ApprovedAt=CASE WHEN @Decision='Approved' THEN SYSUTCDATETIME() ELSE NULL END,RejectionReason=@Reason,UpdatedAt=SYSUTCDATETIME()
                OUTPUT INSERTED.* WHERE Id=@Id AND Status='Pending Approval' AND IsDeleted=0`);
    if (!result.recordset[0]) fail('Only a pending loan can be reviewed.', 409);
    return result.recordset[0];
};

const calculateSchedule = (loan, firstDueDate) => {
    const principal = Number(loan.Principal), months = Number(loan.TermMonths), monthlyRate = Number(loan.AnnualInterestRate) / 1200;
    let balance = principal;
    const rows = [];
    let payment = 0;
    if (loan.InterestMethod === 'Reducing Balance') payment = monthlyRate === 0 ? principal / months : principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    else payment = (principal + principal * Number(loan.AnnualInterestRate) / 100 * months / 12) / months;
    for (let index = 1; index <= months; index += 1) {
        const interest = loan.InterestMethod === 'Reducing Balance' ? amount(balance * monthlyRate) : amount(principal * Number(loan.AnnualInterestRate) / 100 / 12);
        let principalDue = amount(payment - interest);
        if (index === months || principalDue > balance) principalDue = amount(balance);
        rows.push({ installment: index, dueDate: addMonths(firstDueDate, index - 1), beginning: amount(balance), principal: principalDue, interest, total: amount(principalDue + interest) });
        balance = amount(balance - principalDue);
    }
    return rows;
};

const dashboard = async () => {
    await ensureSchema();
    const result = await getPool().request().query(`
      SELECT COUNT(*) TotalMembers,SUM(CASE WHEN Status='Active' THEN 1 ELSE 0 END) ActiveMembers FROM UteslaMembers WHERE IsDeleted=0;
      SELECT COALESCE(SUM(${signedSavings('t')}),0) TotalSavings FROM UteslaSavingsTransactions t WHERE t.IsVoided=0;
      SELECT COUNT(*) ActiveLoans,COALESCE(SUM(s.PrincipalOutstanding),0) PrincipalOutstanding,COALESCE(SUM(s.InterestOutstanding),0) InterestOutstanding
        FROM UteslaLoans l OUTER APPLY(SELECT SUM(PrincipalDue-PrincipalPaid) PrincipalOutstanding,SUM(InterestDue-InterestPaid) InterestOutstanding FROM UteslaLoanSchedules WHERE LoanId=l.Id)s
        WHERE l.IsDeleted=0 AND l.Status='Active';
      SELECT COALESCE(SUM(InterestApplied),0) InterestCollected FROM UteslaLoanPayments WHERE IsVoided=0;
      SELECT COALESCE(SUM(PoolAmount),0) DistributedInterest FROM UteslaDividendRuns;
      SELECT COALESCE((SELECT SUM(CASE WHEN TransactionType IN('Deposit','Adjustment Credit') THEN Amount WHEN TransactionType IN('Withdrawal','Adjustment Debit') THEN -Amount ELSE 0 END) FROM UteslaSavingsTransactions WHERE IsVoided=0),0)
           + COALESCE((SELECT SUM(Amount-ExcessAmount) FROM UteslaLoanPayments WHERE IsVoided=0),0)
           - COALESCE((SELECT SUM(Principal) FROM UteslaLoans WHERE Status IN('Active','Paid') AND ReleasedAt IS NOT NULL AND IsDeleted=0),0) AvailableFunds;
      SELECT TOP 8 l.Id,l.LoanNo,l.Principal,l.Status,l.ApplicationDate,e.FirstName,e.LastName,e.Image,m.MemberNo
        FROM UteslaLoans l JOIN UteslaMembers m ON m.Id=l.MemberId JOIN Employees e ON e.Id=m.EmployeeId WHERE l.IsDeleted=0 ORDER BY l.Id DESC;
    `);
    return { members: result.recordsets[0][0], savings: result.recordsets[1][0], loans: result.recordsets[2][0], earnings: result.recordsets[3][0], distributions: result.recordsets[4][0], funds: result.recordsets[5][0], recentLoans: result.recordsets[6] };
};

const releaseLoan = async (id, firstDueDate, user) => {
    await ensureSchema();
    const details = await getLoan(id);
    if (!details || details.loan.Status !== 'Approved') fail('Only an approved loan can be released.', 409);
    const settings = await getSettings();
    const summary = await dashboard();
    if (settings.EnforceFundAvailability && Number(details.loan.Principal) > Number(summary.funds.AvailableFunds)) fail('UTESLA does not currently have enough available lending funds to release this loan.', 409);
    const dueDate = firstDueDate ? new Date(firstDueDate) : addMonths(new Date(), 1);
    const schedule = calculateSchedule(details.loan, dueDate);
    const transaction = new sql.Transaction(getPool());
    await transaction.begin();
    try {
        const updated = (await new sql.Request(transaction).input('Id', sql.Int, id).input('FirstDueDate', sql.Date, dueDate).input('UserId', sql.Int, user?._id || null)
            .query(`UPDATE UteslaLoans SET Status='Active',FirstDueDate=@FirstDueDate,ReleasedBy=@UserId,ReleasedAt=SYSUTCDATETIME(),UpdatedAt=SYSUTCDATETIME()
                    OUTPUT INSERTED.* WHERE Id=@Id AND Status='Approved'`)).recordset[0];
        if (!updated) fail('Loan status changed before release. Refresh and try again.', 409);
        for (const row of schedule) {
            await new sql.Request(transaction).input('LoanId', sql.Int, id).input('InstallmentNo', sql.Int, row.installment).input('DueDate', sql.Date, row.dueDate)
                .input('BeginningBalance', sql.Decimal(18,2), row.beginning).input('PrincipalDue', sql.Decimal(18,2), row.principal)
                .input('InterestDue', sql.Decimal(18,2), row.interest).input('TotalDue', sql.Decimal(18,2), row.total)
                .query(`INSERT INTO UteslaLoanSchedules(LoanId,InstallmentNo,DueDate,BeginningBalance,PrincipalDue,InterestDue,TotalDue)
                        VALUES(@LoanId,@InstallmentNo,@DueDate,@BeginningBalance,@PrincipalDue,@InterestDue,@TotalDue)`);
        }
        await transaction.commit(); return updated;
    } catch (error) { await transaction.rollback(); throw error; }
};

const postPayment = async (loanId, data, user) => {
    await ensureSchema();
    const paymentAmount = amount(data.Amount);
    if (!(paymentAmount > 0)) fail('Payment amount must be greater than zero.');
    const details = await getLoan(loanId);
    if (!details || details.loan.Status !== 'Active') fail('Payments can only be posted to active loans.', 409);
    const outstanding = details.schedule.reduce((sum, row) => sum + Number(row.PrincipalDue-row.PrincipalPaid) + Number(row.InterestDue-row.InterestPaid), 0);
    if (outstanding <= 0) fail('This loan has no outstanding balance.', 409);
    let remaining = paymentAmount, principalApplied = 0, interestApplied = 0;
    const allocations = [];
    details.schedule.forEach(row => {
        if (remaining <= 0) return;
        const interestDue = amount(Number(row.InterestDue) - Number(row.InterestPaid));
        const interest = Math.min(remaining, interestDue); remaining = amount(remaining - interest); interestApplied = amount(interestApplied + interest);
        const principalDue = amount(Number(row.PrincipalDue) - Number(row.PrincipalPaid));
        const principal = Math.min(remaining, principalDue); remaining = amount(remaining - principal); principalApplied = amount(principalApplied + principal);
        if (interest || principal) allocations.push({ id: row.Id, interest, principal, fullyPaid: amount(interestDue-interest) === 0 && amount(principalDue-principal) === 0 });
    });
    const transaction = new sql.Transaction(getPool()); await transaction.begin();
    try {
        for (const allocation of allocations) await new sql.Request(transaction).input('Id', sql.Int, allocation.id)
            .input('Interest', sql.Decimal(18,2), allocation.interest).input('Principal', sql.Decimal(18,2), allocation.principal)
            .input('Status', sql.NVarChar, allocation.fullyPaid ? 'Paid' : 'Partial')
            .query(`UPDATE UteslaLoanSchedules SET InterestPaid=InterestPaid+@Interest,PrincipalPaid=PrincipalPaid+@Principal,Status=@Status WHERE Id=@Id`);
        const payment = (await new sql.Request(transaction).input('PaymentNo', sql.NVarChar, referenceNo('UTP')).input('LoanId', sql.Int, loanId)
            .input('PaymentDate', sql.Date, data.PaymentDate || new Date()).input('Amount', sql.Decimal(18,2), paymentAmount)
            .input('PrincipalApplied', sql.Decimal(18,2), principalApplied).input('InterestApplied', sql.Decimal(18,2), interestApplied)
            .input('ExcessAmount', sql.Decimal(18,2), remaining).input('PaymentMethod', sql.NVarChar, data.PaymentMethod || 'Cash')
            .input('ReferenceNo', sql.NVarChar, data.ReferenceNo || null).input('Notes', sql.NVarChar, data.Notes || null).input('PostedBy', sql.Int, user?._id || null)
            .query(`INSERT INTO UteslaLoanPayments(PaymentNo,LoanId,PaymentDate,Amount,PrincipalApplied,InterestApplied,ExcessAmount,PaymentMethod,ReferenceNo,Notes,PostedBy)
                    OUTPUT INSERTED.* VALUES(@PaymentNo,@LoanId,@PaymentDate,@Amount,@PrincipalApplied,@InterestApplied,@ExcessAmount,@PaymentMethod,@ReferenceNo,@Notes,@PostedBy)`)).recordset[0];
        const balance = amount(outstanding - principalApplied - interestApplied);
        if (balance <= 0) await new sql.Request(transaction).input('Id', sql.Int, loanId).query("UPDATE UteslaLoans SET Status='Paid',UpdatedAt=SYSUTCDATETIME() WHERE Id=@Id");
        await transaction.commit(); return payment;
    } catch (error) { await transaction.rollback(); throw error; }
};

const dividendPreview = async (periodEnd, poolAmount) => {
    await ensureSchema();
    const pool = amount(poolAmount);
    if (!(pool > 0)) fail('Distribution pool must be greater than zero.');
    const result = await getPool().request().input('PeriodEnd', sql.Date, periodEnd || new Date()).query(`SELECT m.Id MemberId,m.MemberNo,e.EmployeeNo,e.FirstName,e.LastName,e.Image,
        SUM(${signedSavings('t')}) SavingsBalance FROM UteslaMembers m JOIN Employees e ON e.Id=m.EmployeeId
        JOIN UteslaSavingsTransactions t ON t.MemberId=m.Id AND t.IsVoided=0 AND t.TransactionDate<=@PeriodEnd
        WHERE m.IsDeleted=0 AND m.Status='Active' GROUP BY m.Id,m.MemberNo,e.EmployeeNo,e.FirstName,e.LastName,e.Image HAVING SUM(${signedSavings('t')})>0`);
    const total = amount(result.recordset.reduce((sum, row) => sum + Number(row.SavingsBalance), 0));
    if (total <= 0) fail('No positive eligible savings balances were found for this period.', 409);
    let allocated = 0;
    const allocations = result.recordset.map((row, index, rows) => {
        const share = index === rows.length - 1 ? amount(pool - allocated) : amount(pool * Number(row.SavingsBalance) / total);
        allocated = amount(allocated + share); return { ...row, AllocatedAmount: share };
    });
    const earnings = await getPool().request().query(`SELECT COALESCE((SELECT SUM(InterestApplied) FROM UteslaLoanPayments WHERE IsVoided=0),0)-COALESCE((SELECT SUM(PoolAmount) FROM UteslaDividendRuns),0) AvailableInterest`);
    return { eligibleSavings: total, poolAmount: pool, availableInterest: amount(earnings.recordset[0].AvailableInterest), allocations };
};

const postDividend = async (data, user) => {
    const preview = await dividendPreview(data.PeriodEnd, data.PoolAmount);
    if (preview.poolAmount > preview.availableInterest) fail('Distribution pool exceeds loan interest collected and not yet distributed.', 409);
    if (new Date(data.PeriodStart) > new Date(data.PeriodEnd)) fail('Period start must be on or before period end.');
    const transaction = new sql.Transaction(getPool()); await transaction.begin();
    try {
        const run = (await new sql.Request(transaction).input('RunNo', sql.NVarChar, referenceNo('UTD')).input('PeriodStart', sql.Date, data.PeriodStart)
            .input('PeriodEnd', sql.Date, data.PeriodEnd).input('PoolAmount', sql.Decimal(18,2), preview.poolAmount)
            .input('EligibleSavings', sql.Decimal(18,2), preview.eligibleSavings).input('MemberCount', sql.Int, preview.allocations.length)
            .input('Notes', sql.NVarChar, data.Notes || null).input('PostedBy', sql.Int, user?._id || null)
            .query(`INSERT INTO UteslaDividendRuns(RunNo,PeriodStart,PeriodEnd,PoolAmount,EligibleSavings,MemberCount,Notes,PostedBy)
                    OUTPUT INSERTED.* VALUES(@RunNo,@PeriodStart,@PeriodEnd,@PoolAmount,@EligibleSavings,@MemberCount,@Notes,@PostedBy)`)).recordset[0];
        for (const allocation of preview.allocations) {
            await new sql.Request(transaction).input('RunId', sql.Int, run.Id).input('MemberId', sql.Int, allocation.MemberId)
                .input('Balance', sql.Decimal(18,2), allocation.SavingsBalance).input('Amount', sql.Decimal(18,2), allocation.AllocatedAmount)
                .query(`INSERT INTO UteslaDividendAllocations(DividendRunId,MemberId,SavingsBalance,AllocatedAmount) VALUES(@RunId,@MemberId,@Balance,@Amount);
                        INSERT INTO UteslaSavingsTransactions(TransactionNo,MemberId,TransactionDate,TransactionType,Amount,Notes,DividendRunId,PostedBy)
                        VALUES(CONCAT('UTI-',@RunId,'-',@MemberId),@MemberId,CAST(SYSUTCDATETIME() AS DATE),'Interest Credit',@Amount,'UTESLA pooled interest distribution',@RunId,${Number(user?._id) || 'NULL'});`);
        }
        await transaction.commit(); return { ...run, allocations: preview.allocations };
    } catch (error) { await transaction.rollback(); throw error; }
};

const listDividends = async () => {
    await ensureSchema();
    return (await getPool().request().query('SELECT * FROM UteslaDividendRuns ORDER BY PeriodEnd DESC,Id DESC')).recordset;
};

module.exports = { ensureSchema, getSettings, updateSettings, availableEmployees, listMembers, createMember, updateMember, listSavings, postSavings, listLoans, getLoan, createLoan, decideLoan, releaseLoan, postPayment, dividendPreview, postDividend, listDividends, dashboard };
