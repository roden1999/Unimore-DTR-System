import React, { useState, useEffect } from 'react';
import {
    Paper, Grid, Button, TextField, List, ListItem, ListItemText, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
    DialogActions, IconButton, Chip, Typography, CircularProgress, MenuItem
} from '@material-ui/core';
import { Add, Edit, Delete, Reply, CheckCircle, PictureAsPdf } from '@material-ui/icons';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';
import { exportProjectTools } from './pdfExport';

const axios = require('axios');
const STATUSES = ['On Going', 'Finished'];

function ToolFormsPage() {
    const apihost = window.apihost;
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');

    const [projects, setProjects] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loader, setLoader] = useState(false);
    const [reload, setReload] = useState(false);

    const [formOpen, setFormOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({});
    const [confirmDel, setConfirmDel] = useState(null);

    const [toolOpts, setToolOpts] = useState([]);
    const [empOpts, setEmpOpts] = useState([]);
    const [borrowOpen, setBorrowOpen] = useState(false);
    const [tool, setTool] = useState(null);
    const [emp, setEmp] = useState(null);
    const [dateBorrowed, setDateBorrowed] = useState(moment().format('YYYY-MM-DD'));
    const [remarks, setRemarks] = useState('');
    const [returnRec, setReturnRec] = useState(null);

    useEffect(() => {
        setLoader(true);
        axios.post(apihost + 'inventory/projects/list', { page: 1 })
            .then((r) => setProjects(Array.isArray(r.data) ? r.data : [])).catch(() => setProjects([]))
            .finally(() => setLoader(false));
    }, [reload]);

    useEffect(() => {
        axios.get(apihost + 'inventory/tools/search-options-st').then((r) =>
            setToolOpts((r.data || []).map((x) => ({ label: `${x.Name} | ${x.SerialNo}`, value: x._id })))).catch(() => {});
        axios.get(apihost + 'inventory/employees/search-options').then((r) =>
            setEmpOpts((r.data || []).map((x) => ({ label: `${x.FirstName} ${x.MiddleName} ${x.LastName}`, value: x._id })))).catch(() => {});
    }, [reload]);

    const selected = projects.find((p) => p._id === selectedId);
    const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const openAdd = () => { setEditId(null); setForm({ Date: moment().format('YYYY-MM-DD'), Status: 'On Going' }); setFormOpen(true); };
    const openEdit = (p) => { setEditId(p._id); setForm({ ProjectName: p.ProjectName, Description: p.Description || '', Date: moment(p.Date).format('YYYY-MM-DD'), Status: p.Status || 'On Going' }); setFormOpen(true); };

    const saveForm = () => {
        const done = () => { setFormOpen(false); setReload((r) => !r); };
        if (editId) {
            axios.put(apihost + 'inventory/projects/' + editId, form)
                .then((r) => { toast.success((r.data.project || 'Project') + ' saved.', { position: 'top-center' }); done(); })
                .catch((e) => toast.error(typeof e.response?.data === 'string' ? e.response.data : 'Error', { position: 'top-center' }));
        } else {
            axios.post(apihost + 'inventory/projects', { projectName: form.ProjectName, description: form.Description, date: form.Date, status: form.Status })
                .then((r) => { toast.success((r.data.project || 'Project') + ' saved.', { position: 'top-center' }); done(); })
                .catch((e) => toast.error(typeof e.response?.data === 'string' ? e.response.data : 'Error', { position: 'top-center' }));
        }
    };
    const doDelete = () => {
        axios.delete(apihost + 'inventory/projects/' + confirmDel)
            .then(() => { toast.info('Form deleted.', { position: 'top-center' }); setConfirmDel(null); if (confirmDel === selectedId) setSelectedId(null); setReload((r) => !r); })
            .catch(() => setConfirmDel(null));
    };

    const resetBorrow = () => { setTool(null); setEmp(null); setDateBorrowed(moment().format('YYYY-MM-DD')); setRemarks(''); };
    const borrow = () => {
        if (!tool || !emp) return toast.warn('Select a tool and borrower.', { position: 'top-center' });
        axios.post(apihost + 'inventory/records', { toolId: tool.value, employeeId: emp.value, project: selectedId, dateBorrowed, remarks, processedBy: user.Name })
            .then(() => { toast.success('Tool added to project.', { position: 'top-center' }); setBorrowOpen(false); resetBorrow(); setReload((r) => !r); })
            .catch((e) => toast.error(typeof e.response?.data === 'string' ? e.response.data : 'Error', { position: 'top-center' }));
    };
    const doReturn = () => {
        axios.put(apihost + 'inventory/records/' + returnRec, { ReceivedBy: user.Name, Remarks: '', Status: 'Returned' })
            .then(() => { toast.success('Tool returned.', { position: 'top-center' }); setReturnRec(null); setReload((r) => !r); })
            .catch(() => setReturnRec(null));
    };

    return (
        <Grid container spacing={2}>
            <ToastContainer />
            <Grid item xs={12} md={4}>
                <Paper style={{ borderRadius: 14, maxHeight: '82vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#F1F5FF' }}>
                        <Typography variant="subtitle1" style={{ fontWeight: 700 }}>Projects</Typography>
                        <Button size="small" variant="contained" color="primary" startIcon={<Add />} onClick={openAdd}>Add Form</Button>
                    </div>
                    {loader && <div style={{ textAlign: 'center', padding: 24 }}><CircularProgress size={26} /></div>}
                    <List>
                        {!loader && projects.length === 0 && <ListItem><ListItemText primary="No project found." /></ListItem>}
                        {projects.map((p) => (
                            <ListItem button key={p._id} selected={p._id === selectedId} onClick={() => setSelectedId(p._id)}>
                                <ListItemText
                                    primary={p.ProjectName}
                                    secondary={<>{moment(p.Date).format('MMMM DD, YYYY')}<br />{p.Description}</>} />
                                {p.Status && <Chip size="small" label={p.Status} style={{ backgroundColor: p.Status !== 'On Going' ? '#DCFCE7' : '#DBEAFE', color: p.Status !== 'On Going' ? '#16A34A' : '#1D4ED8' }} />}
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(p); }}><Edit fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setConfirmDel(p._id); }}><Delete fontSize="small" /></IconButton>
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            </Grid>

            <Grid item xs={12} md={8}>
                <Paper style={{ padding: 20, borderRadius: 14, minHeight: '82vh' }}>
                    {!selected ? (
                        <Typography variant="h6" style={{ textAlign: 'center', marginTop: '25%', color: '#94A3B8' }}>
                            Select a project to view its borrowed tools.
                        </Typography>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <Typography variant="h6">{selected.ProjectName}</Typography>
                                <div>
                                    <Button variant="outlined" startIcon={<PictureAsPdf />} style={{ marginRight: 8 }} onClick={() => exportProjectTools(selected)}>Export PDF</Button>
                                    <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => setBorrowOpen(true)}>Borrow Tool</Button>
                                </div>
                            </div>
                            <TableContainer style={{ maxHeight: '66vh' }}>
                                <Table stickyHeader size="small">
                                    <TableHead><TableRow>
                                        {['Tool', 'Serial No.', 'Borrower', 'Date Borrowed', 'Returned', 'Date Returned', 'Remarks', 'Action'].map((h) => (
                                            <TableCell key={h} align={h === 'Action' ? 'right' : 'left'}>{h}</TableCell>))}
                                    </TableRow></TableHead>
                                    <TableBody>
                                        {(selected.BorrowedTools || []).length === 0 && <TableRow><TableCell colSpan={8} align="center">No tools borrowed.</TableCell></TableRow>}
                                        {(selected.BorrowedTools || []).map((y) => (
                                            <TableRow key={y._id} hover>
                                                <TableCell>{y.ToolName}</TableCell>
                                                <TableCell>{y.SerialNo}</TableCell>
                                                <TableCell>{y.EmployeeName}</TableCell>
                                                <TableCell>{moment(y.DateBorrowed).format('MMM DD, YYYY')}</TableCell>
                                                <TableCell>{y.Status === 'Returned' ? <CheckCircle fontSize="small" style={{ color: '#16A34A' }} /> : ''}</TableCell>
                                                <TableCell>{y.DateReturned ? moment(y.DateReturned).format('MM/DD/YYYY | h:mm a') : ''}</TableCell>
                                                <TableCell>{y.Remarks}</TableCell>
                                                <TableCell align="right">
                                                    {y.Status !== 'Returned' &&
                                                        <IconButton size="small" onClick={() => setReturnRec(y._id)}><Reply fontSize="small" /></IconButton>}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}
                </Paper>
            </Grid>

            <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>{editId ? 'Edit Form' : 'Add Form'}</DialogTitle>
                <DialogContent>
                    <TextField label="Project Name" fullWidth value={form.ProjectName || ''} onChange={(e) => setF('ProjectName', e.target.value)} style={{ marginBottom: 12 }} />
                    <TextField label="Description" fullWidth value={form.Description || ''} onChange={(e) => setF('Description', e.target.value)} style={{ marginBottom: 12 }} />
                    <TextField type="date" label="Date" InputLabelProps={{ shrink: true }} fullWidth value={form.Date || ''} onChange={(e) => setF('Date', e.target.value)} style={{ marginBottom: 12 }} />
                    <TextField select label="Status" fullWidth value={form.Status || ''} onChange={(e) => setF('Status', e.target.value)}>
                        {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFormOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={saveForm}>Save</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={borrowOpen} onClose={() => setBorrowOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Borrow Tool</DialogTitle>
                <DialogContent>
                    <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: '#555' }}>Tool</div>
                        <Select options={toolOpts} value={tool} onChange={setTool} placeholder="Tool..." /></div>
                    <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: '#555' }}>Borrower</div>
                        <Select options={empOpts} value={emp} onChange={setEmp} placeholder="Borrower..." /></div>
                    <TextField type="date" label="Date Borrowed" InputLabelProps={{ shrink: true }} fullWidth value={dateBorrowed} onChange={(e) => setDateBorrowed(e.target.value)} style={{ marginBottom: 12 }} />
                    <TextField label="Remarks" fullWidth value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                    <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginTop: 8 }}>Processed By: {user.Name}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBorrowOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={borrow}>Submit</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(returnRec)} onClose={() => setReturnRec(null)}>
                <DialogTitle>Return Tool</DialogTitle>
                <DialogContent><Typography>Confirm returning this tool?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setReturnRec(null)}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={doReturn}>Return</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(confirmDel)} onClose={() => setConfirmDel(null)}>
                <DialogTitle>Delete Form</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete this form?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDel(null)}>Cancel</Button>
                    <Button variant="contained" color="secondary" onClick={doDelete}>Delete</Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
}

export default ToolFormsPage;
