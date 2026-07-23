import React, { useState, useEffect } from 'react';
import {
    Paper, Button, Grid, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, Dialog, DialogTitle, DialogContent,
    DialogActions, IconButton, Chip, Typography, CircularProgress, MenuItem
} from '@material-ui/core';
import { Add, Edit, Delete, PictureAsPdf } from '@material-ui/icons';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';
import { exportTools } from './pdfExport';

const axios = require('axios');
const PER_PAGE = 12;
const CATEGORIES = ['Electric Tool', 'Manual Tool'];
const STATUSES = ['Good', 'For Repair', 'For Replacement'];

const statusColor = (s) => (s === 'Good' ? '#16A34A' : s === 'For Repair' ? '#F59E0B' : '#DC2626');

function ToolsPage() {
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loader, setLoader] = useState(false);
    const [reload, setReload] = useState(false);

    const [searchOptions, setSearchOptions] = useState([]);
    const [brandOptions, setBrandOptions] = useState([]);
    const [selected, setSelected] = useState([]);
    const [brandFilter, setBrandFilter] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null);

    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({});
    const [confirmDel, setConfirmDel] = useState(null);

    const apihost = window.apihost;

    useEffect(() => {
        setLoader(true);
        axios.post(apihost + 'inventory/tools/list', {
            selectedTools: selected, brandFilter, categoryFilter, statusFilter, page: page + 1,
        }).then((r) => setData(Array.isArray(r.data) ? r.data : []))
            .catch(() => setData([]))
            .finally(() => setLoader(false));
    }, [selected, brandFilter, categoryFilter, statusFilter, page, reload]);

    useEffect(() => {
        axios.get(apihost + 'inventory/tools/total-tools').then((r) => setTotal(r.data || 0)).catch(() => {});
        axios.post(apihost + 'inventory/tools/search-options', {}).then((r) => {
            setSearchOptions((r.data || []).map((x) => ({ label: `${x.Name} | ${x.SerialNo}`, value: x._id })));
        }).catch(() => {});
        axios.get(apihost + 'inventory/tools/brand-options').then((r) => {
            setBrandOptions((r.data || []).map((x) => ({ label: x.brand || 'No Brand', value: x.brand })));
        }).catch(() => {});
    }, [reload]);

    const openAdd = () => { setEditId(null); setForm({ Category: 'Manual Tool', Status: 'Good' }); setOpen(true); };
    const openEdit = (t) => {
        setEditId(t._id);
        setForm({
            SerialNo: t.SerialNo, Name: t.Name, Brand: t.Brand || '', Category: t.Category || 'Manual Tool',
            DatePurchased: t.DatePurchased ? moment(t.DatePurchased).format('YYYY-MM-DD') : '',
            Location: t.Location || '', Description: t.Description || '', Status: t.Status || 'Good',
        });
        setOpen(true);
    };
    const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const save = () => {
        const done = () => { setOpen(false); setReload((r) => !r); };
        if (editId) {
            axios.put(apihost + 'inventory/tools/' + editId, form)
                .then((r) => { toast.success((r.data.tool || 'Tool') + ' updated.', { position: 'top-center' }); done(); })
                .catch((e) => toast.error(typeof e.response?.data === 'string' ? e.response.data : 'Error', { position: 'top-center' }));
        } else {
            axios.post(apihost + 'inventory/tools', {
                serialNo: form.SerialNo, name: form.Name, brand: form.Brand, category: form.Category,
                datePurchased: form.DatePurchased, location: form.Location, description: form.Description, status: form.Status,
            }).then((r) => { toast.success((r.data.tool || 'Tool') + ' saved.', { position: 'top-center' }); done(); })
                .catch((e) => toast.error(typeof e.response?.data === 'string' ? e.response.data : 'Error', { position: 'top-center' }));
        }
    };

    const doDelete = () => {
        axios.delete(apihost + 'inventory/tools/' + confirmDel)
            .then(() => { toast.info('Tool deleted.', { position: 'top-center' }); setConfirmDel(null); setReload((r) => !r); })
            .catch(() => setConfirmDel(null));
    };

    const exportPdf = () => {
        axios.get(apihost + 'inventory/tools/list-of-all-tools')
            .then((r) => exportTools(Array.isArray(r.data) ? r.data : []))
            .catch(() => toast.error('Failed to export.', { position: 'top-center' }));
    };

    return (
        <Paper style={{ padding: 20, borderRadius: 14 }}>
            <ToastContainer />
            <Grid container spacing={2} alignItems="center" style={{ marginBottom: 12 }}>
                <Grid item><Button variant="contained" color="primary" startIcon={<Add />} onClick={openAdd}>Add Tool</Button></Grid>
                <Grid item xs><Select isMulti isClearable placeholder="Search tools..." options={searchOptions}
                    value={selected} onChange={(v) => setSelected(v || [])} /></Grid>
                <Grid item style={{ minWidth: 160 }}><Select isClearable placeholder="Brand" options={brandOptions}
                    value={brandFilter} onChange={setBrandFilter} /></Grid>
                <Grid item style={{ minWidth: 160 }}><Select isClearable placeholder="Category"
                    options={CATEGORIES.map((c) => ({ label: c, value: c }))} value={categoryFilter} onChange={setCategoryFilter} /></Grid>
                <Grid item style={{ minWidth: 160 }}><Select isClearable placeholder="Status"
                    options={STATUSES.map((s) => ({ label: s, value: s }))} value={statusFilter} onChange={setStatusFilter} /></Grid>
                <Grid item><Button variant="outlined" startIcon={<PictureAsPdf />} onClick={exportPdf}>Export PDF</Button></Grid>
            </Grid>

            <TableContainer style={{ maxHeight: '68vh' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {['Name', 'Serial No.', 'Brand', 'Category', 'Date Purchased', 'Status', 'Location', 'Description', 'Available', 'Action'].map((h) => (
                                <TableCell key={h} align={h === 'Action' ? 'right' : 'left'}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loader && <TableRow><TableCell colSpan={10} align="center"><CircularProgress size={28} /></TableCell></TableRow>}
                        {!loader && data.length === 0 && <TableRow><TableCell colSpan={10} align="center">No data found.</TableCell></TableRow>}
                        {!loader && data.map((t) => (
                            <TableRow key={t._id} hover>
                                <TableCell>{t.Name}</TableCell>
                                <TableCell>{t.SerialNo}</TableCell>
                                <TableCell>{t.Brand || 'No Brand'}</TableCell>
                                <TableCell>{t.Category}</TableCell>
                                <TableCell>{t.DatePurchased ? moment(t.DatePurchased).format('MM/DD/YYYY') : 'No Date'}</TableCell>
                                <TableCell><span style={{ color: statusColor(t.Status), fontWeight: 600 }}>{t.Status}</span></TableCell>
                                <TableCell>{t.Location}</TableCell>
                                <TableCell>{t.Description}</TableCell>
                                <TableCell>
                                    <Chip size="small" label={t.Available}
                                        style={{ backgroundColor: t.Available === 'On Hand' ? '#DCFCE7' : '#FEE2E2', color: t.Available === 'On Hand' ? '#16A34A' : '#DC2626', fontWeight: 600 }} />
                                </TableCell>
                                <TableCell align="right" style={{ whiteSpace: 'nowrap' }}>
                                    <IconButton size="small" onClick={() => openEdit(t)}><Edit fontSize="small" /></IconButton>
                                    <IconButton size="small" onClick={() => setConfirmDel(t._id)}><Delete fontSize="small" /></IconButton>
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
                <DialogTitle>{editId ? 'Edit Tool' : 'Add Tool'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={6}><TextField label="Serial No." fullWidth value={form.SerialNo || ''} onChange={(e) => setF('SerialNo', e.target.value)} /></Grid>
                        <Grid item xs={6}><TextField label="Name" fullWidth value={form.Name || ''} onChange={(e) => setF('Name', e.target.value)} /></Grid>
                        <Grid item xs={6}><TextField label="Brand" fullWidth value={form.Brand || ''} onChange={(e) => setF('Brand', e.target.value)} /></Grid>
                        <Grid item xs={6}><TextField select label="Category" fullWidth value={form.Category || ''} onChange={(e) => setF('Category', e.target.value)}>
                            {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></Grid>
                        <Grid item xs={6}><TextField type="date" label="Date Purchased" InputLabelProps={{ shrink: true }} fullWidth value={form.DatePurchased || ''} onChange={(e) => setF('DatePurchased', e.target.value)} /></Grid>
                        <Grid item xs={6}><TextField select label="Status" fullWidth value={form.Status || ''} onChange={(e) => setF('Status', e.target.value)}>
                            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
                        <Grid item xs={6}><TextField label="Location" fullWidth value={form.Location || ''} onChange={(e) => setF('Location', e.target.value)} /></Grid>
                        <Grid item xs={6}><TextField label="Description" fullWidth value={form.Description || ''} onChange={(e) => setF('Description', e.target.value)} /></Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={save}>Save</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(confirmDel)} onClose={() => setConfirmDel(null)}>
                <DialogTitle>Delete Tool</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete this tool?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDel(null)}>Cancel</Button>
                    <Button variant="contained" color="secondary" onClick={doDelete}>Delete</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

export default ToolsPage;
