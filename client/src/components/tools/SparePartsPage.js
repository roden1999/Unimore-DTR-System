import React, { useState, useEffect } from 'react';
import {
    Paper, Grid, Button, TextField, List, ListItem, ListItemText, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TablePagination, Dialog, DialogTitle,
    DialogContent, DialogActions, IconButton, Chip, Typography, CircularProgress, MenuItem
} from '@material-ui/core';
import { Add, Edit, Delete, Memory } from '@material-ui/icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const axios = require('axios');
const PER_PAGE = 10;
const MACHINES = ['WEBDECK', 'FLATDECK', 'RIBTYPE', 'OLD CORRUGATED', 'NEW CORRUGATED', 'TILE SPAN',
    'SLIT & SHEAR', 'SHEARLINE', 'NEW HIGHSPEED DF', 'OLD DF 98-92', 'CZ', 'BEAM STUD', 'BEAM BOX',
    'C CHANNEL', 'STUD & TRACKS', 'STUD 76', 'WALL ANGLE', 'SPANDREL', 'DRUM CORRUGATED',
    'HAT TYPE BATTEN', 'HAT TYPE', 'SLITTER', 'MANUAL SLITTER', 'OVERHEAD CRANE', 'SUSPENDED BAR',
    'RIDGE CAP', 'AUTO UNCOILER 1', 'AUTO UNCOILER 2'];
const STATUSES = ['Available', 'Not Available'];

function SparePartsPage() {
    const [machine, setMachine] = useState('');
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loader, setLoader] = useState(false);
    const [reload, setReload] = useState(false);

    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({});
    const [confirmDel, setConfirmDel] = useState(null);
    const apihost = window.apihost;

    useEffect(() => {
        if (!machine) { setData([]); return; }
        setLoader(true);
        axios.post(apihost + 'inventory/spare-parts/list', { machine, page: page + 1 })
            .then((r) => setData(Array.isArray(r.data) ? r.data : []))
            .catch(() => setData([]))
            .finally(() => setLoader(false));
        axios.post(apihost + 'inventory/spare-parts/total', { machine }).then((r) => setTotal(r.data || 0)).catch(() => {});
    }, [machine, page, reload]);

    const openAdd = () => { setEditId(null); setForm({ Quantity: 0, Status: 'Available' }); setOpen(true); };
    const openEdit = (s) => { setEditId(s._id); setForm({ Name: s.Name, Quantity: s.Quantity, Description: s.Description || '', Remarks: s.Remarks || '', Status: s.Status || 'Available' }); setOpen(true); };
    const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const save = () => {
        const done = () => { setOpen(false); setReload((r) => !r); };
        if (editId) {
            axios.put(apihost + 'inventory/spare-parts/' + editId, form)
                .then((r) => { toast.success((r.data.sp || 'Item') + ' updated.', { position: 'top-center' }); done(); })
                .catch((e) => toast.error(typeof e.response?.data === 'string' ? e.response.data : 'Error', { position: 'top-center' }));
        } else {
            axios.post(apihost + 'inventory/spare-parts', { name: form.Name, quantity: form.Quantity, machine, description: form.Description, remarks: form.Remarks, status: form.Status })
                .then((r) => { toast.success((r.data.sp || 'Item') + ' saved.', { position: 'top-center' }); done(); })
                .catch((e) => toast.error(typeof e.response?.data === 'string' ? e.response.data : 'Error', { position: 'top-center' }));
        }
    };
    const doDelete = () => {
        axios.delete(apihost + 'inventory/spare-parts/' + confirmDel)
            .then(() => { toast.info('Deleted.', { position: 'top-center' }); setConfirmDel(null); setReload((r) => !r); })
            .catch(() => setConfirmDel(null));
    };

    return (
        <Grid container spacing={2}>
            <ToastContainer />
            <Grid item xs={12} md={3}>
                <Paper style={{ borderRadius: 14, maxHeight: '82vh', overflowY: 'auto' }}>
                    <Typography variant="subtitle1" style={{ padding: 16, fontWeight: 700, background: '#F1F5FF' }}>
                        <Memory fontSize="small" style={{ verticalAlign: 'middle', marginRight: 6 }} />Machines
                    </Typography>
                    <List dense>
                        {MACHINES.map((m) => (
                            <ListItem button key={m} selected={machine === m} onClick={() => { setMachine(m); setPage(0); }}>
                                <ListItemText primary={m} />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            </Grid>

            <Grid item xs={12} md={9}>
                <Paper style={{ padding: 20, borderRadius: 14, minHeight: '82vh' }}>
                    {!machine ? (
                        <Typography variant="h6" style={{ textAlign: 'center', marginTop: '25%', color: '#94A3B8' }}>
                            Select a machine to view its spare parts.
                        </Typography>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <Typography variant="h6">{machine} Spare Parts</Typography>
                                <Button variant="contained" color="primary" startIcon={<Add />} onClick={openAdd}>Add Spare Part</Button>
                            </div>
                            <TableContainer style={{ maxHeight: '62vh' }}>
                                <Table stickyHeader size="small">
                                    <TableHead><TableRow>
                                        {['Name', 'Quantity', 'Description', 'Remarks', 'Status', 'Action'].map((h) => (
                                            <TableCell key={h} align={h === 'Action' ? 'right' : 'left'}>{h}</TableCell>))}
                                    </TableRow></TableHead>
                                    <TableBody>
                                        {loader && <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={28} /></TableCell></TableRow>}
                                        {!loader && data.length === 0 && <TableRow><TableCell colSpan={6} align="center">No item found.</TableCell></TableRow>}
                                        {!loader && data.map((s) => (
                                            <TableRow key={s._id} hover>
                                                <TableCell>{s.Name}</TableCell>
                                                <TableCell>{s.Quantity}</TableCell>
                                                <TableCell>{s.Description}</TableCell>
                                                <TableCell>{s.Remarks}</TableCell>
                                                <TableCell><Chip size="small" label={s.Status}
                                                    style={{ backgroundColor: s.Status === 'Available' ? '#DCFCE7' : '#FEE2E2', color: s.Status === 'Available' ? '#16A34A' : '#DC2626', fontWeight: 600 }} /></TableCell>
                                                <TableCell align="right" style={{ whiteSpace: 'nowrap' }}>
                                                    <IconButton size="small" onClick={() => openEdit(s)}><Edit fontSize="small" /></IconButton>
                                                    <IconButton size="small" onClick={() => setConfirmDel(s._id)}><Delete fontSize="small" /></IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination component="div" count={total} page={page} rowsPerPage={PER_PAGE} rowsPerPageOptions={[PER_PAGE]} onChangePage={(e, p) => setPage(p)} />
                        </>
                    )}
                </Paper>
            </Grid>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>{editId ? 'Edit Spare Part' : 'Add Spare Part'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12}><TextField label="Name" fullWidth value={form.Name || ''} onChange={(e) => setF('Name', e.target.value)} /></Grid>
                        <Grid item xs={6}><TextField type="number" label="Quantity" fullWidth value={form.Quantity} onChange={(e) => setF('Quantity', e.target.value)} /></Grid>
                        <Grid item xs={6}><TextField select label="Status" fullWidth value={form.Status || ''} onChange={(e) => setF('Status', e.target.value)}>
                            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
                        <Grid item xs={12}><TextField label="Description" fullWidth value={form.Description || ''} onChange={(e) => setF('Description', e.target.value)} /></Grid>
                        <Grid item xs={12}><TextField label="Remarks" fullWidth value={form.Remarks || ''} onChange={(e) => setF('Remarks', e.target.value)} /></Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={save}>Save</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(confirmDel)} onClose={() => setConfirmDel(null)}>
                <DialogTitle>Delete Spare Part</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete this item?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDel(null)}>Cancel</Button>
                    <Button variant="contained" color="secondary" onClick={doDelete}>Delete</Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
}

export default SparePartsPage;
