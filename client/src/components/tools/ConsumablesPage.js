import React, { useState, useEffect } from 'react';
import {
    Paper, Button, Grid, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, Dialog, DialogTitle, DialogContent,
    DialogActions, IconButton, Chip, Typography, CircularProgress, MenuItem
} from '@material-ui/core';
import { Add, Edit, Delete } from '@material-ui/icons';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';

const axios = require('axios');
const PER_PAGE = 12;
const UNITS = ['Pieces', 'Box', 'Sets', 'Unit', 'Meters', 'Litters', 'Package', 'Kilogram', 'Miligram', 'Gallon'];

const fmt = (n) => Number(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function ConsumablesPage() {
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loader, setLoader] = useState(false);
    const [reload, setReload] = useState(false);

    const [searchOptions, setSearchOptions] = useState([]);
    const [selected, setSelected] = useState([]);

    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({});
    const [confirmDel, setConfirmDel] = useState(null);

    const apihost = window.apihost;

    useEffect(() => {
        setLoader(true);
        axios.post(apihost + 'inventory/consumables/list', { selectedConsumables: selected, page: page + 1 })
            .then((r) => setData(Array.isArray(r.data) ? r.data : []))
            .catch(() => setData([]))
            .finally(() => setLoader(false));
    }, [selected, page, reload]);

    useEffect(() => {
        axios.get(apihost + 'inventory/consumables/total-item').then((r) => setTotal(r.data || 0)).catch(() => {});
        axios.get(apihost + 'inventory/consumables/search-options').then((r) => {
            setSearchOptions((r.data || []).map((x) => ({ label: x.Name, value: x._id })));
        }).catch(() => {});
    }, [reload]);

    const openAdd = () => { setEditId(null); setForm({ Quantity: 0, Used: 0, CriticalLevel: 0 }); setOpen(true); };
    const openEdit = (c) => {
        setEditId(c._id);
        setForm({
            Name: c.Name, Brand: c.Brand || '', Unit: c.Unit || '',
            DatePurchased: c.DatePurchased ? moment(c.DatePurchased).format('YYYY-MM-DD') : '',
            Description: c.Description || '', Quantity: c.Quantity, Used: c.Used, CriticalLevel: c.CriticalLevel,
        });
        setOpen(true);
    };
    const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const save = () => {
        const done = () => { setOpen(false); setReload((r) => !r); };
        if (editId) {
            axios.put(apihost + 'inventory/consumables/' + editId, form)
                .then((r) => { toast.success((r.data.consumable || 'Item') + ' updated.', { position: 'top-center' }); done(); })
                .catch((e) => toast.error(typeof e.response?.data === 'string' ? e.response.data : 'Error', { position: 'top-center' }));
        } else {
            axios.post(apihost + 'inventory/consumables', {
                name: form.Name, brand: form.Brand, unit: form.Unit, datePurchased: form.DatePurchased,
                description: form.Description, quantity: form.Quantity, used: form.Used, critLevel: form.CriticalLevel,
            }).then((r) => { toast.success((r.data.consumable || 'Item') + ' saved.', { position: 'top-center' }); done(); })
                .catch((e) => toast.error(typeof e.response?.data === 'string' ? e.response.data : 'Error', { position: 'top-center' }));
        }
    };

    const doDelete = () => {
        axios.delete(apihost + 'inventory/consumables/' + confirmDel)
            .then(() => { toast.info('Item deleted.', { position: 'top-center' }); setConfirmDel(null); setReload((r) => !r); })
            .catch(() => setConfirmDel(null));
    };

    const statusChip = (c) => {
        const available = Number(c.Quantity) - Number(c.Used);
        if (available <= 0) return <Chip size="small" label="Out of Stocks" style={{ backgroundColor: '#FEE2E2', color: '#DC2626', fontWeight: 600 }} />;
        return c.CritLevelIndicator
            ? <Chip size="small" label="Low of Stocks" style={{ backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 600 }} />
            : <Chip size="small" label="Good" style={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontWeight: 600 }} />;
    };

    return (
        <Paper style={{ padding: 20, borderRadius: 14 }}>
            <ToastContainer />
            <Grid container spacing={2} alignItems="center" style={{ marginBottom: 12 }}>
                <Grid item><Button variant="contained" color="primary" startIcon={<Add />} onClick={openAdd}>Add Item</Button></Grid>
                <Grid item xs><Select isMulti isClearable placeholder="Search items..." options={searchOptions}
                    value={selected} onChange={(v) => setSelected(v || [])} /></Grid>
            </Grid>

            <TableContainer style={{ maxHeight: '68vh' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {['Name', 'Brand', 'Unit', 'Received', 'Used', 'Available', 'Date Purchased', 'Crit', 'Status', 'Description', 'Action'].map((h) => (
                                <TableCell key={h} align={h === 'Action' ? 'right' : 'left'}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loader && <TableRow><TableCell colSpan={11} align="center"><CircularProgress size={28} /></TableCell></TableRow>}
                        {!loader && data.length === 0 && <TableRow><TableCell colSpan={11} align="center">No data found.</TableCell></TableRow>}
                        {!loader && data.map((c) => (
                            <TableRow key={c._id} hover>
                                <TableCell>{c.Name}</TableCell>
                                <TableCell>{c.Brand || 'No Brand'}</TableCell>
                                <TableCell>{c.Unit}</TableCell>
                                <TableCell>{fmt(c.Quantity)}</TableCell>
                                <TableCell>{fmt(c.Used)}</TableCell>
                                <TableCell>{fmt(Number(c.Quantity) - Number(c.Used))}</TableCell>
                                <TableCell>{c.DatePurchased ? moment(c.DatePurchased).format('MM/DD/YYYY') : 'No Date'}</TableCell>
                                <TableCell>{fmt(c.CriticalLevel)}</TableCell>
                                <TableCell>{statusChip(c)}</TableCell>
                                <TableCell>{c.Description}</TableCell>
                                <TableCell align="right" style={{ whiteSpace: 'nowrap' }}>
                                    <IconButton size="small" onClick={() => openEdit(c)}><Edit fontSize="small" /></IconButton>
                                    <IconButton size="small" onClick={() => setConfirmDel(c._id)}><Delete fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {selected.length === 0 &&
                <TablePagination component="div" count={total} page={page} rowsPerPage={PER_PAGE} rowsPerPageOptions={[PER_PAGE]}
                    onChangePage={(e, p) => setPage(p)} />}

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editId ? 'Edit Item' : 'Add Item'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={6}><TextField label="Name" fullWidth value={form.Name || ''} onChange={(e) => setF('Name', e.target.value)} /></Grid>
                        <Grid item xs={6}><TextField label="Brand" fullWidth value={form.Brand || ''} onChange={(e) => setF('Brand', e.target.value)} /></Grid>
                        <Grid item xs={6}><TextField select label="Unit" fullWidth value={form.Unit || ''} onChange={(e) => setF('Unit', e.target.value)}>
                            {UNITS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}</TextField></Grid>
                        <Grid item xs={6}><TextField type="date" label="Date Purchased" InputLabelProps={{ shrink: true }} fullWidth value={form.DatePurchased || ''} onChange={(e) => setF('DatePurchased', e.target.value)} /></Grid>
                        <Grid item xs={4}><TextField type="number" label="Quantity" fullWidth value={form.Quantity} onChange={(e) => setF('Quantity', e.target.value)} /></Grid>
                        {editId && <Grid item xs={4}><TextField type="number" label="Used" fullWidth value={form.Used} onChange={(e) => setF('Used', e.target.value)} /></Grid>}
                        <Grid item xs={4}><TextField type="number" label="Critical Level" fullWidth value={form.CriticalLevel} onChange={(e) => setF('CriticalLevel', e.target.value)} /></Grid>
                        <Grid item xs={12}><TextField label="Description" fullWidth value={form.Description || ''} onChange={(e) => setF('Description', e.target.value)} /></Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={save}>Save</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(confirmDel)} onClose={() => setConfirmDel(null)}>
                <DialogTitle>Delete Item</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete this item?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDel(null)}>Cancel</Button>
                    <Button variant="contained" color="secondary" onClick={doDelete}>Delete</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

export default ConsumablesPage;
