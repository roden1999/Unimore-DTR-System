import React, { useState, useEffect } from 'react';
import {
    Paper, Grid, Button, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, Dialog, DialogTitle, DialogContent,
    DialogActions, IconButton, Chip, Typography, CircularProgress
} from '@material-ui/core';
import { Add, Delete, Reply } from '@material-ui/icons';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';

const axios = require('axios');
const PER_PAGE = 12;

function RecordsPage() {
    const apihost = window.apihost;
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');

    const [borrowed, setBorrowed] = useState([]);
    const [returned, setReturned] = useState([]);
    const [totalB, setTotalB] = useState(0);
    const [totalR, setTotalR] = useState(0);
    const [pageB, setPageB] = useState(0);
    const [pageR, setPageR] = useState(0);
    const [loader, setLoader] = useState(false);
    const [reload, setReload] = useState(false);

    const [toolOpts, setToolOpts] = useState([]);
    const [empOpts, setEmpOpts] = useState([]);
    const [projOpts, setProjOpts] = useState([]);

    const [addOpen, setAddOpen] = useState(false);
    const [tool, setTool] = useState(null);
    const [emp, setEmp] = useState(null);
    const [proj, setProj] = useState(null);
    const [dateBorrowed, setDateBorrowed] = useState(moment().format('YYYY-MM-DD'));
    const [remarks, setRemarks] = useState('');

    const [returnRec, setReturnRec] = useState(null);
    const [returnRemarks, setReturnRemarks] = useState('');
    const [confirmDel, setConfirmDel] = useState(null);

    useEffect(() => {
        setLoader(true);
        axios.post(apihost + 'inventory/records/list-borrowed', { page: pageB + 1 })
            .then((r) => setBorrowed(Array.isArray(r.data) ? r.data : [])).catch(() => setBorrowed([]))
            .finally(() => setLoader(false));
        axios.get(apihost + 'inventory/records/total-borrowed').then((r) => setTotalB(r.data || 0)).catch(() => {});
    }, [pageB, reload]);

    useEffect(() => {
        axios.post(apihost + 'inventory/records/list-returned', { page: pageR + 1 })
            .then((r) => setReturned(Array.isArray(r.data) ? r.data : [])).catch(() => setReturned([]));
        axios.get(apihost + 'inventory/records/total-returned').then((r) => setTotalR(r.data || 0)).catch(() => {});
    }, [pageR, reload]);

    useEffect(() => {
        axios.get(apihost + 'inventory/tools/search-options-st').then((r) =>
            setToolOpts((r.data || []).map((x) => ({ label: `${x.Name} | ${x.SerialNo}`, value: x._id })))).catch(() => {});
        axios.get(apihost + 'inventory/employees/search-options').then((r) =>
            setEmpOpts((r.data || []).map((x) => ({ label: `${x.FirstName} ${x.MiddleName} ${x.LastName}`, value: x._id })))).catch(() => {});
        axios.get(apihost + 'inventory/projects/search-options').then((r) =>
            setProjOpts((r.data || []).map((x) => ({ label: `${x.ProjectName} - ${moment(x.Date).format('MM/DD/YYYY')}`, value: x._id })))).catch(() => {});
    }, [reload]);

    const resetAdd = () => { setTool(null); setEmp(null); setProj(null); setDateBorrowed(moment().format('YYYY-MM-DD')); setRemarks(''); };
    const borrow = () => {
        if (!tool) return toast.warn('Please select a tool.', { position: 'top-center' });
        if (!emp) return toast.warn('Please select a borrower.', { position: 'top-center' });
        axios.post(apihost + 'inventory/records', {
            toolId: tool.value, employeeId: emp.value, project: proj ? proj.value : '',
            dateBorrowed, remarks, processedBy: user.Name,
        }).then(() => { toast.success('Tool borrowed.', { position: 'top-center' }); setAddOpen(false); resetAdd(); setReload((r) => !r); })
            .catch((e) => toast.error(typeof e.response?.data === 'string' ? e.response.data : 'Error', { position: 'top-center' }));
    };

    const doReturn = () => {
        axios.put(apihost + 'inventory/records/' + returnRec, { ReceivedBy: user.Name, Remarks: returnRemarks, Status: 'Returned' })
            .then(() => { toast.success('Tool returned.', { position: 'top-center' }); setReturnRec(null); setReturnRemarks(''); setReload((r) => !r); })
            .catch(() => setReturnRec(null));
    };
    const doDelete = () => {
        axios.delete(apihost + 'inventory/records/' + confirmDel)
            .then(() => { toast.info('Record deleted.', { position: 'top-center' }); setConfirmDel(null); setReload((r) => !r); })
            .catch(() => setConfirmDel(null));
    };

    return (
        <Paper style={{ padding: 20, borderRadius: 14 }}>
            <ToastContainer />
            <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => setAddOpen(true)}>Borrow Tool</Button>

            <Typography variant="subtitle1" style={{ marginTop: 16, marginBottom: 4 }}>Borrowed</Typography>
            <TableContainer style={{ maxHeight: '32vh' }}>
                <Table stickyHeader size="small">
                    <TableHead><TableRow>
                        {['Tool', 'Serial No.', 'Borrower', 'Date Borrowed', 'Project', 'Processed By', 'Status', 'Remarks', 'Action'].map((h) => (
                            <TableCell key={h} align={h === 'Action' ? 'right' : 'left'}>{h}</TableCell>))}
                    </TableRow></TableHead>
                    <TableBody>
                        {loader && <TableRow><TableCell colSpan={9} align="center"><CircularProgress size={24} /></TableCell></TableRow>}
                        {!loader && borrowed.length === 0 && <TableRow><TableCell colSpan={9} align="center">No data found.</TableCell></TableRow>}
                        {!loader && borrowed.map((r) => (
                            <TableRow key={r._id} hover>
                                <TableCell>{r.ToolName}</TableCell>
                                <TableCell>{r.SerialNo}</TableCell>
                                <TableCell>{r.EmployeeName}</TableCell>
                                <TableCell>{r.DateBorrowed ? moment(r.DateBorrowed).format('MMM DD, YYYY') : ''}</TableCell>
                                <TableCell>{r.Project}</TableCell>
                                <TableCell>{r.ProcessedBy}</TableCell>
                                <TableCell><Chip size="small" label={r.Status} color="primary" /></TableCell>
                                <TableCell>{r.Remarks}</TableCell>
                                <TableCell align="right" style={{ whiteSpace: 'nowrap' }}>
                                    <IconButton size="small" onClick={() => { setReturnRec(r._id); setReturnRemarks(r.Remarks || ''); }}><Reply fontSize="small" /></IconButton>
                                    <IconButton size="small" onClick={() => setConfirmDel(r._id)}><Delete fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination component="div" count={totalB} page={pageB} rowsPerPage={PER_PAGE} rowsPerPageOptions={[PER_PAGE]} onChangePage={(e, p) => setPageB(p)} />

            <Typography variant="subtitle1" style={{ marginTop: 16, marginBottom: 4 }}>Returned</Typography>
            <TableContainer style={{ maxHeight: '32vh' }}>
                <Table stickyHeader size="small">
                    <TableHead><TableRow>
                        {['Tool', 'Serial No.', 'Borrower', 'Date Borrowed', 'Date Returned', 'Received By', 'Status', 'Remarks'].map((h) => (
                            <TableCell key={h}>{h}</TableCell>))}
                    </TableRow></TableHead>
                    <TableBody>
                        {returned.length === 0 && <TableRow><TableCell colSpan={8} align="center">No data found.</TableCell></TableRow>}
                        {returned.map((r) => (
                            <TableRow key={r._id} hover>
                                <TableCell>{r.ToolName}</TableCell>
                                <TableCell>{r.SerialNo}</TableCell>
                                <TableCell>{r.EmployeeName}</TableCell>
                                <TableCell>{r.DateBorrowed ? moment(r.DateBorrowed).format('MMM DD, YYYY') : ''}</TableCell>
                                <TableCell>{r.DateReturned ? moment(r.DateReturned).format('MMM DD, YYYY | h:mm a') : ''}</TableCell>
                                <TableCell>{r.ReceivedBy}</TableCell>
                                <TableCell><Chip size="small" label={r.Status} style={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontWeight: 600 }} /></TableCell>
                                <TableCell>{r.Remarks}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination component="div" count={totalR} page={pageR} rowsPerPage={PER_PAGE} rowsPerPageOptions={[PER_PAGE]} onChangePage={(e, p) => setPageR(p)} />

            <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Borrow Tool</DialogTitle>
                <DialogContent>
                    <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: '#555' }}>Tool</div>
                        <Select options={toolOpts} value={tool} onChange={setTool} placeholder="Tool..." /></div>
                    <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: '#555' }}>Borrower</div>
                        <Select options={empOpts} value={emp} onChange={setEmp} placeholder="Borrower..." /></div>
                    <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: '#555' }}>Project (optional)</div>
                        <Select options={projOpts} value={proj} onChange={setProj} isClearable placeholder="Project..." /></div>
                    <TextField type="date" label="Date Borrowed" InputLabelProps={{ shrink: true }} fullWidth value={dateBorrowed} onChange={(e) => setDateBorrowed(e.target.value)} style={{ marginBottom: 12 }} />
                    <TextField label="Remarks" fullWidth value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                    <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginTop: 8 }}>Processed By: {user.Name}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={borrow}>Submit</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(returnRec)} onClose={() => setReturnRec(null)} fullWidth maxWidth="xs">
                <DialogTitle>Return Tool</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>Confirm returning this tool?</Typography>
                    <TextField label="Remarks" fullWidth value={returnRemarks} onChange={(e) => setReturnRemarks(e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReturnRec(null)}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={doReturn}>Return</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(confirmDel)} onClose={() => setConfirmDel(null)}>
                <DialogTitle>Delete Record</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete this record?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDel(null)}>Cancel</Button>
                    <Button variant="contained" color="secondary" onClick={doDelete}>Delete</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

export default RecordsPage;
