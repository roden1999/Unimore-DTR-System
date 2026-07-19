import React, { useState, useEffect } from 'react';
import {
    Paper, Grid, Button, TextField, List, ListItem, ListItemText, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
    DialogActions, IconButton, Chip, Typography, CircularProgress, MenuItem
} from '@material-ui/core';
import { Add, Edit, Delete, RemoveCircle, AddCircle, PictureAsPdf } from '@material-ui/icons';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';
import { exportProjectConsumables } from './pdfExport';

const axios = require('axios');
const STATUSES = ['On Going', 'Finished'];

function ConsumableFormsPage() {
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

    const [consumableOpts, setConsumableOpts] = useState([]);
    const [empOpts, setEmpOpts] = useState([]);
    const [itemOpen, setItemOpen] = useState(false);
    const [consumable, setConsumable] = useState(null);
    const [emp, setEmp] = useState(null);
    const [qty, setQty] = useState(0);
    const [dateIssued, setDateIssued] = useState(moment().format('YYYY-MM-DD'));
    const [remarks, setRemarks] = useState('');

    const [qtyModal, setQtyModal] = useState(null); // {id, mode}
    const [qtyVal, setQtyVal] = useState(0);
    const [confirmItemDel, setConfirmItemDel] = useState(null);

    useEffect(() => {
        setLoader(true);
        axios.post(apihost + 'inventory/consumable-forms/list', { page: 1 })
            .then((r) => setProjects(Array.isArray(r.data) ? r.data : [])).catch(() => setProjects([]))
            .finally(() => setLoader(false));
    }, [reload]);

    useEffect(() => {
        axios.get(apihost + 'inventory/consumables/search-options').then((r) =>
            setConsumableOpts((r.data || []).map((x) => ({ label: `${x.Name} | Available: ${Number(x.Quantity) - Number(x.Used)}`, value: x._id })))).catch(() => {});
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
            axios.put(apihost + 'inventory/consumable-forms/' + editId, form)
                .then((r) => { toast.success((r.data.project || 'Form') + ' saved.', { position: 'top-center' }); done(); })
                .catch((e) => toast.error(typeof e.response?.data === 'string' ? e.response.data : 'Error', { position: 'top-center' }));
        } else {
            axios.post(apihost + 'inventory/consumable-forms/add-form', { projectName: form.ProjectName, description: form.Description, date: form.Date, status: form.Status })
                .then((r) => { toast.success((r.data.project || 'Form') + ' saved.', { position: 'top-center' }); done(); })
                .catch((e) => toast.error(typeof e.response?.data === 'string' ? e.response.data : 'Error', { position: 'top-center' }));
        }
    };
    const doDelete = () => {
        axios.delete(apihost + 'inventory/consumable-forms/' + confirmDel)
            .then(() => { toast.info('Form deleted.', { position: 'top-center' }); setConfirmDel(null); if (confirmDel === selectedId) setSelectedId(null); setReload((r) => !r); })
            .catch(() => setConfirmDel(null));
    };

    const resetItem = () => { setConsumable(null); setEmp(null); setQty(0); setDateIssued(moment().format('YYYY-MM-DD')); setRemarks(''); };
    const addItem = () => {
        if (!consumable) return toast.warn('Select an item.', { position: 'top-center' });
        axios.post(apihost + 'inventory/consumable-forms/add-item', {
            consumableId: consumable.value, used: qty, employeeId: emp ? emp.value : '', dateIssued,
            project: selectedId, remarks, issuedBy: user.Name,
        }).then(() => { toast.success('Item added.', { position: 'top-center' }); setItemOpen(false); resetItem(); setReload((r) => !r); })
            .catch((e) => toast.error(typeof e.response?.data === 'string' ? e.response.data : 'Error', { position: 'top-center' }));
    };

    const applyQty = () => {
        const url = qtyModal.mode === 'add' ? 'add-quantity' : 'subtract-quantity';
        axios.put(apihost + `inventory/consumable-forms/${url}/${qtyModal.id}`, { Used: qtyVal })
            .then(() => { toast.success('Saved.', { position: 'top-center' }); setQtyModal(null); setQtyVal(0); setReload((r) => !r); })
            .catch(() => setQtyModal(null));
    };
    const deleteItem = () => {
        axios.delete(apihost + 'inventory/consumable-forms/item/' + confirmItemDel)
            .then(() => { toast.info('Item removed.', { position: 'top-center' }); setConfirmItemDel(null); setReload((r) => !r); })
            .catch(() => setConfirmItemDel(null));
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
                                <ListItemText primary={p.ProjectName}
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
                            Select a project to view its issued consumables.
                        </Typography>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <Typography variant="h6">{selected.ProjectName}</Typography>
                                <div>
                                    <Button variant="outlined" startIcon={<PictureAsPdf />} style={{ marginRight: 8 }} onClick={() => exportProjectConsumables(selected)}>Export PDF</Button>
                                    <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => setItemOpen(true)}>Add Item</Button>
                                </div>
                            </div>
                            <TableContainer style={{ maxHeight: '66vh' }}>
                                <Table stickyHeader size="small">
                                    <TableHead><TableRow>
                                        {['Item', 'Quantity', 'Borrower', 'Issued By', 'Date Issued', 'Remarks', 'Action'].map((h) => (
                                            <TableCell key={h} align={h === 'Action' ? 'right' : 'left'}>{h}</TableCell>))}
                                    </TableRow></TableHead>
                                    <TableBody>
                                        {(selected.Data || []).length === 0 && <TableRow><TableCell colSpan={7} align="center">No items.</TableCell></TableRow>}
                                        {(selected.Data || []).map((y) => (
                                            <TableRow key={y._id} hover>
                                                <TableCell>{y.Consumable}</TableCell>
                                                <TableCell>
                                                    <IconButton size="small" onClick={() => { setQtyModal({ id: y._id, mode: 'sub' }); setQtyVal(0); }}><RemoveCircle fontSize="small" /></IconButton>
                                                    {y.Quantity}
                                                    <IconButton size="small" onClick={() => { setQtyModal({ id: y._id, mode: 'add' }); setQtyVal(0); }}><AddCircle fontSize="small" /></IconButton>
                                                </TableCell>
                                                <TableCell>{y.EmployeeName}</TableCell>
                                                <TableCell>{y.IssuedBy}</TableCell>
                                                <TableCell>{moment(y.DateIssued).format('MMM DD, YYYY')}</TableCell>
                                                <TableCell>{y.Remarks}</TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small" onClick={() => setConfirmItemDel(y._id)}><Delete fontSize="small" /></IconButton>
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

            <Dialog open={itemOpen} onClose={() => setItemOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Add Item</DialogTitle>
                <DialogContent>
                    <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: '#555' }}>Item</div>
                        <Select options={consumableOpts} value={consumable} onChange={setConsumable} placeholder="Item..." /></div>
                    <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: '#555' }}>Borrower</div>
                        <Select options={empOpts} value={emp} onChange={setEmp} placeholder="Borrower..." /></div>
                    <TextField type="number" label="Quantity" fullWidth value={qty} onChange={(e) => setQty(e.target.value)} style={{ marginBottom: 12 }} />
                    <TextField type="date" label="Date Issued" InputLabelProps={{ shrink: true }} fullWidth value={dateIssued} onChange={(e) => setDateIssued(e.target.value)} style={{ marginBottom: 12 }} />
                    <TextField label="Remarks" fullWidth value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                    <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginTop: 8 }}>Issued By: {user.Name}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setItemOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={addItem}>Submit</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(qtyModal)} onClose={() => setQtyModal(null)} maxWidth="xs">
                <DialogTitle>{qtyModal?.mode === 'add' ? 'Add Quantity' : 'Subtract Quantity'}</DialogTitle>
                <DialogContent>
                    <TextField type="number" label="Quantity" fullWidth value={qtyVal} onChange={(e) => setQtyVal(e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setQtyModal(null)}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={applyQty}>Save</Button>
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

            <Dialog open={Boolean(confirmItemDel)} onClose={() => setConfirmItemDel(null)}>
                <DialogTitle>Remove Item</DialogTitle>
                <DialogContent><Typography>Remove this item and return its quantity to stock?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmItemDel(null)}>Cancel</Button>
                    <Button variant="contained" color="secondary" onClick={deleteItem}>Remove</Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
}

export default ConsumableFormsPage;
