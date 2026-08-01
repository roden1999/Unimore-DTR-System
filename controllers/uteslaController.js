const model = require('../models/uteslaModel');

const handle = fn => async (req, res) => {
    try { await fn(req, res); }
    catch (error) {
        console.error('UTESLA request failed:', error.message);
        res.status(error.status || 500).json({ message: error.message || 'UTESLA request failed.' });
    }
};

const dashboard = handle(async (_req, res) => res.json(await model.dashboard()));
const settings = handle(async (_req, res) => res.json(await model.getSettings()));
const updateSettings = handle(async (req, res) => res.json(await model.updateSettings(req.body, req.user)));
const employeeOptions = handle(async (_req, res) => {
    const rows = await model.availableEmployees();
    res.json(rows.map(row => ({ id: row.Id, employeeNo: row.EmployeeNo, employeeName: [row.FirstName,row.MiddleName,row.LastName,row.Suffix].filter(Boolean).join(' '), image: row.Image || '', department: row.Department || '' })));
});
const members = handle(async (_req, res) => res.json(await model.listMembers()));
const createMember = handle(async (req, res) => res.status(201).json(await model.createMember(req.body)));
const updateMember = handle(async (req, res) => {
    const row = await model.updateMember(req.params.id, req.body);
    if (!row) return res.status(404).json({ message: 'Member not found.' });
    res.json(row);
});
const savings = handle(async (req, res) => res.json(await model.listSavings(req.query.memberId ? Number(req.query.memberId) : null)));
const postSavings = handle(async (req, res) => res.status(201).json(await model.postSavings(req.body, req.user)));
const loans = handle(async (_req, res) => res.json(await model.listLoans()));
const loan = handle(async (req, res) => {
    const details = await model.getLoan(req.params.id);
    if (!details) return res.status(404).json({ message: 'Loan not found.' });
    res.json(details);
});
const createLoan = handle(async (req, res) => res.status(201).json(await model.createLoan(req.body, req.user)));
const decideLoan = handle(async (req, res) => res.json(await model.decideLoan(req.params.id, req.body.decision, req.body.reason, req.user)));
const releaseLoan = handle(async (req, res) => res.json(await model.releaseLoan(req.params.id, req.body.firstDueDate, req.user)));
const postPayment = handle(async (req, res) => res.status(201).json(await model.postPayment(req.params.id, req.body, req.user)));
const dividends = handle(async (_req, res) => res.json(await model.listDividends()));
const previewDividend = handle(async (req, res) => res.json(await model.dividendPreview(req.body.PeriodEnd, req.body.PoolAmount)));
const postDividend = handle(async (req, res) => res.status(201).json(await model.postDividend(req.body, req.user)));

module.exports = { dashboard, settings, updateSettings, employeeOptions, members, createMember, updateMember, savings, postSavings, loans, loan, createLoan, decideLoan, releaseLoan, postPayment, dividends, previewDividend, postDividend };
