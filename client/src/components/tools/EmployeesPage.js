import React, { useState, useEffect } from 'react';
import {
    Paper, Grid, Button, TextField, Card, CardContent, CardActions, Avatar,
    Table, TableBody, TableCell, TableHead, TableRow, TablePagination, Dialog,
    DialogTitle, DialogContent, DialogActions, IconButton, Typography, CircularProgress
} from '@material-ui/core';
import { Add, Edit, Delete } from '@material-ui/icons';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const axios = require('axios');
const PER_PAGE = 12;

const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
});

function EmployeesPage() {
    const apihost = window.apihost;
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loader, setLoader] = useState(false);
    const [reload, setReload] = useState(false);

    const [searchOpts, setSearchOpts] = useState([]);
    const [selected, setSelected] = useState([]);

    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({});
    const [confirmDel, setConfirmDel] = useState(null);

    useEffect(() => {
        setLoader(true);
        axios.post(apihost + 'inventory/employees/list', { selectedEmployee: selected, page: page + 1 })
            .then((r) => setData(Array.isArray(r.data) ? r.data : [])).catch(() => setData([]))
            .finally(() => setLoader(false));
    }, [selected, page, reload]);

    useEffect(() => {
        axios.get(apihost + 'inventory/employees/total-employees').then((r) => setTotal(r.data || 0)).catch(() => {});
        axios.get(apihost + 'inventory/employees/search-options').then((r) =>
            setSearchOpts((r.data || []).map((x) => ({ label: `${x.FirstName} ${x.MiddleName} ${x.LastName}`, value: x._id })))).catch(() => {});
    }, [reload]);

    const openAdd = () => { setEditId(null); setForm({}); setOpen(true); };
    const openEdit = (e) => { setEditId(e._id); setForm({ EmployeeNo: e.EmployeeNo, FirstName: e.FirstName, MiddleName: e.MiddleName, LastName: e.LastName, Image: e.Image }); setOpen(true); };
    const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const onFile = async (e) => {
        const file = e.target.files[0];
        if (file) setF('Image', await toBase64(file));
    };

    const save = () => {
        const done = () => { setOpen(false); setReload((r) => !r); };
        if (editId) {
            axios.put(apihost + 'inventory/employees/' + editId, form)
                .then((r) => { toast.success((r.data.employee || 'Employee') + ' updated.', { position: 'top-center' }); done(); })
                .catch((er) => toast.error(typeof er.response?.data === 'string' ? er.response.data : 'Error', { position: 'top-center' }));
        } else {
            axios.post(apihost + 'inventory/employees', {
                employeeNo: form.EmployeeNo, firstName: form.FirstName, middleName: form.MiddleName, lastName: form.LastName, image: form.Image,
            }).then((r) => { toast.success((r.data.employee || 'Employee') + ' saved.', { position: 'top-center' }); done(); })
                .catch((er) => toast.error(typeof er.response?.data === 'string' ? er.response.data : 'Error', { position: 'top-center' }));
        }
    };
    const doDelete = () => {
        axios.delete(apihost + 'inventory/employees/' + confirmDel)
            .then(() => { toast.info('Employee deleted.', { position: 'top-center' }); setConfirmDel(null); setReload((r) => !r); })
            .catch(() => setConfirmDel(null));
    };

    return (
        <Paper style={{ padding: 20, borderRadius: 14 }}>
            <ToastContainer />
            <Grid container spacing={2} alignItems="center" style={{ marginBottom: 12 }}>
                <Grid item><Button variant="contained" color="primary" startIcon={<Add />} onClick={openAdd}>Add Employee</Button></Grid>
                <Grid item xs><Select isMulti isClearable placeholder="Search employees..." options={searchOpts}
                    value={selected} onChange={(v) => setSelected(v || [])} /></Grid>
            </Grid>

            {loader ? <div style={{ textAlign: 'center', padding: 60 }}><CircularProgress /></div> : (
                <Grid container spacing={2}>
                    {data.length === 0 && <Grid item xs={12}><Typography align="center" style={{ color: '#94A3B8', padding: 40 }}>No data found.</Typography></Grid>}
                    {data.map((emp) => (
                        <Grid item xs={12} sm={6} md={3} key={emp._id}>
                            <Card>
                                <CardContent>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Avatar src={emp.Image || undefined} style={{ width: 52, height: 52 }}>
                                            {(emp.FirstName || '?').charAt(0)}
                                        </Avatar>
                                        <div>
                                            <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                                                {`${emp.FirstName} ${emp.MiddleName} ${emp.LastName}`}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">{emp.EmployeeNo}</Typography>
                                        </div>
                                    </div>
                                    <Typography variant="body2" style={{ marginTop: 8 }}>
                                        Borrowed Tools: <strong>{emp.TotalBorrowed}</strong>
                                    </Typography>
                                    {emp.BorrowedTools && emp.BorrowedTools.length > 0 && (
                                        <Table size="small" style={{ marginTop: 8 }}>
                                            <TableHead><TableRow><TableCell>Tool</TableCell><TableCell>Serial No.</TableCell></TableRow></TableHead>
                                            <TableBody>
                                                {emp.BorrowedTools.map((t, i) => (
                                                    <TableRow key={i}><TableCell>{t.toolName}</TableCell><TableCell>{t.serialNo}</TableCell></TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                                <CardActions>
                                    <Button size="small" startIcon={<Edit />} onClick={() => openEdit(emp)}>Edit</Button>
                                    <Button size="small" color="secondary" startIcon={<Delete />} onClick={() => setConfirmDel(emp._id)}>Delete</Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {selected.length === 0 &&
                <TablePagination component="div" count={total} page={page} rowsPerPage={PER_PAGE} rowsPerPageOptions={[PER_PAGE]} onChangePage={(e, p) => setPage(p)} />}

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>{editId ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
                <DialogContent>
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <Avatar src={form.Image || undefined} style={{ width: 72, height: 72, margin: '0 auto' }}>
                            {(form.FirstName || '?').charAt(0)}
                        </Avatar>
                        <Button component="label" size="small" style={{ marginTop: 8 }}>
                            Upload Photo
                            <input type="file" accept=".jpg,.jpeg,.png" hidden onChange={onFile} />
                        </Button>
                    </div>
                    <TextField label="Employee No." fullWidth value={form.EmployeeNo || ''} onChange={(e) => setF('EmployeeNo', e.target.value)} style={{ marginBottom: 12 }} />
                    <TextField label="First Name" fullWidth value={form.FirstName || ''} onChange={(e) => setF('FirstName', e.target.value)} style={{ marginBottom: 12 }} />
                    <TextField label="Middle Name" fullWidth value={form.MiddleName || ''} onChange={(e) => setF('MiddleName', e.target.value)} style={{ marginBottom: 12 }} />
                    <TextField label="Last Name" fullWidth value={form.LastName || ''} onChange={(e) => setF('LastName', e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={save}>Save</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(confirmDel)} onClose={() => setConfirmDel(null)}>
                <DialogTitle>Delete Employee</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete this employee?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDel(null)}>Cancel</Button>
                    <Button variant="contained" color="secondary" onClick={doDelete}>Delete</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

export default EmployeesPage;
