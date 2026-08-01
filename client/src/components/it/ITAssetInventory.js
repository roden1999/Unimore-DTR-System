import React, { useCallback, useEffect, useState } from 'react';
import {
    Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    Grid, IconButton, InputAdornment, MenuItem, Snackbar, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, Tooltip, Typography
} from '@material-ui/core';
import { Add, Delete, Edit, Refresh, Search } from '@material-ui/icons';
import { Alert } from '@material-ui/lab';
import axios from 'axios';
import moment from 'moment';
import EmployeeAvatar from '../common/EmployeeAvatar';

export const CATEGORIES = ['Desktop PC', 'Laptop', 'Peripheral', 'CCTV Camera', 'Router & Network', 'Other'];
const STATUSES = ['In Stock', 'Deployed', 'Under Repair', 'Retired', 'Lost'];
const CONDITIONS = ['New', 'Excellent', 'Good', 'Fair', 'Poor', 'For Disposal'];
const blank = { AssetTag: '', Category: 'Desktop PC', AssetType: '', Brand: '', Model: '', SerialNo: '', HostName: '', Specifications: '', IPAddress: '', MACAddress: '', Location: '', AssignedEmployeeId: '', PurchaseDate: '', WarrantyExpiry: '', Vendor: '', Cost: '', Status: 'In Stock', Condition: 'Good', Notes: '' };

export default function ITAssetInventory({ initialCategory = '' }) {
    const [rows, setRows] = useState([]); const [employees, setEmployees] = useState([]);
    const [category, setCategory] = useState(initialCategory); const [status, setStatus] = useState(''); const [search, setSearch] = useState('');
    const [form, setForm] = useState(blank); const [editing, setEditing] = useState(null); const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(null);
    const endpoint = window.apihost + 'it-assets';
    const load = useCallback(() => {
        const query = new URLSearchParams(); if (category) query.set('category', category); if (status) query.set('status', status); if (search.trim()) query.set('search', search.trim());
        axios.get(`${endpoint}?${query}`).then(r => setRows(Array.isArray(r.data) ? r.data : [])).catch(e => setMessage({ type: 'error', text: e.response?.data?.message || 'Unable to load IT assets.' }));
    }, [category, status, search, endpoint]);
    useEffect(load, [load]);
    useEffect(() => setCategory(initialCategory), [initialCategory]);
    useEffect(() => { axios.get(window.apihost + 'employees/options').then(r => setEmployees(r.data || [])).catch(() => {}); }, []);
    const showForm = row => {
        setEditing(row || null);
        setForm(row ? Object.keys(blank).reduce((acc, key) => ({ ...acc, [key]: ['PurchaseDate', 'WarrantyExpiry'].includes(key) && row[key] ? moment(row[key]).format('YYYY-MM-DD') : (row[key] ?? '') }), {}) : { ...blank });
        setOpen(true);
    };
    const save = async e => {
        e.preventDefault(); setBusy(true);
        try { if (editing) await axios.put(`${endpoint}/${editing.Id}`, form); else await axios.post(endpoint, form); setOpen(false); setMessage({ type: 'success', text: 'IT asset saved.' }); load(); }
        catch (error) { setMessage({ type: 'error', text: error.response?.data?.message || 'Unable to save asset.' }); }
        finally { setBusy(false); }
    };
    const remove = async row => { if (!window.confirm(`Remove ${row.AssetTag} from active inventory?`)) return; try { await axios.delete(`${endpoint}/${row.Id}`); load(); } catch (e) { setMessage({ type: 'error', text: e.response?.data?.message || 'Unable to remove asset.' }); } };
    const field = (name, label, props = {}) => <TextField fullWidth margin="dense" variant="outlined" label={label} value={form[name]} onChange={e => setForm({ ...form, [name]: e.target.value })} {...props} />;
    return <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}><div><Typography variant="h5" style={{ fontWeight: 700 }}>IT Asset Inventory</Typography><Typography color="textSecondary">Central register for computers, peripherals, surveillance and network equipment.</Typography></div><div><Tooltip title="Refresh"><IconButton onClick={load}><Refresh /></IconButton></Tooltip><Button color="primary" variant="contained" startIcon={<Add />} onClick={() => showForm(null)}>Add Asset</Button></div></div>
        <Card style={{ marginBottom: 16 }}><CardContent><Grid container spacing={2}><Grid item xs={12} md={5}><TextField fullWidth variant="outlined" size="small" placeholder="Search tag, serial, model, hostname or location" value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} /></Grid><Grid item xs={12} sm={6} md={4}><TextField select fullWidth variant="outlined" size="small" label="Category" value={category} onChange={e => setCategory(e.target.value)}><MenuItem value="">All Categories</MenuItem>{CATEGORIES.map(x => <MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField></Grid><Grid item xs={12} sm={6} md={3}><TextField select fullWidth variant="outlined" size="small" label="Status" value={status} onChange={e => setStatus(e.target.value)}><MenuItem value="">All Statuses</MenuItem>{STATUSES.map(x => <MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField></Grid></Grid></CardContent></Card>
        <Card><CardContent style={{ padding: 0 }}><TableContainer style={{ maxHeight: 'calc(100vh - 260px)' }}><Table stickyHeader size="small"><TableHead><TableRow>{['Asset Tag','Category / Type','Brand / Model','Serial / Hostname','Assigned To','Location','Status','Condition','Warranty','Actions'].map(h => <TableCell key={h} style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>)}</TableRow></TableHead><TableBody>{!rows.length && <TableRow><TableCell colSpan={10} align="center" style={{ padding: 40 }}>No matching IT assets found.</TableCell></TableRow>}{rows.map(row => <TableRow hover key={row.Id}><TableCell style={{ fontWeight: 700 }}>{row.AssetTag}</TableCell><TableCell><div>{row.Category}</div><Typography variant="caption" color="textSecondary">{row.AssetType || '—'}</Typography></TableCell><TableCell><div>{[row.Brand,row.Model].filter(Boolean).join(' ') || '—'}</div></TableCell><TableCell><div>{row.SerialNo || '—'}</div><Typography variant="caption" color="textSecondary">{row.HostName || ''}</Typography></TableCell><TableCell>{row.AssignedEmployee ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><EmployeeAvatar image={row.AssignedEmployeeImage} name={row.AssignedEmployee} size={30} /><span>{row.AssignedEmployee}</span></div> : 'Unassigned'}</TableCell><TableCell>{row.Location || '—'}</TableCell><TableCell><Chip size="small" label={row.Status} color={row.Status === 'Under Repair' || row.Status === 'Lost' ? 'secondary' : row.Status === 'Deployed' ? 'primary' : 'default'} /></TableCell><TableCell>{row.Condition}</TableCell><TableCell style={{ whiteSpace: 'nowrap' }}>{row.WarrantyExpiry ? moment(row.WarrantyExpiry).format('MMM D, YYYY') : '—'}</TableCell><TableCell style={{ whiteSpace: 'nowrap' }}><IconButton size="small" onClick={() => showForm(row)}><Edit fontSize="small" /></IconButton><IconButton size="small" onClick={() => remove(row)}><Delete fontSize="small" /></IconButton></TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card>
        <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="md"><form onSubmit={save}><DialogTitle>{editing ? 'Edit IT Asset' : 'Register IT Asset'}</DialogTitle><DialogContent><Grid container spacing={2}>
            <Grid item xs={12} sm={6}>{field('AssetTag','Asset Tag',{ required: true })}</Grid><Grid item xs={12} sm={6}>{field('Category','Category',{ select: true, required: true, children: CATEGORIES.map(x => <MenuItem key={x} value={x}>{x}</MenuItem>) })}</Grid>
            <Grid item xs={12} sm={6}>{field('AssetType','Asset Type')}</Grid><Grid item xs={12} sm={3}>{field('Brand','Brand')}</Grid><Grid item xs={12} sm={3}>{field('Model','Model')}</Grid>
            <Grid item xs={12} sm={6}>{field('SerialNo','Serial Number')}</Grid><Grid item xs={12} sm={6}>{field('HostName','Hostname / Device Name')}</Grid>
            <Grid item xs={12}>{field('Specifications','Specifications',{ multiline: true, rows: 2 })}</Grid>
            <Grid item xs={12} sm={6}>{field('IPAddress','IP Address')}</Grid><Grid item xs={12} sm={6}>{field('MACAddress','MAC Address')}</Grid>
            <Grid item xs={12} sm={6}>{field('Location','Location')}</Grid><Grid item xs={12} sm={6}>{field('AssignedEmployeeId','Assigned Employee',{ select: true, children: [<MenuItem key="none" value="">Unassigned</MenuItem>, ...employees.map(emp => <MenuItem key={emp.id} value={emp.id}>{emp.employeeNo} — {emp.employeeName}</MenuItem>)] })}</Grid>
            <Grid item xs={12} sm={6}>{field('Status','Lifecycle Status',{ select: true, children: STATUSES.map(x => <MenuItem key={x} value={x}>{x}</MenuItem>) })}</Grid><Grid item xs={12} sm={6}>{field('Condition','Condition',{ select: true, children: CONDITIONS.map(x => <MenuItem key={x} value={x}>{x}</MenuItem>) })}</Grid>
            <Grid item xs={12} sm={4}>{field('PurchaseDate','Purchase Date',{ type: 'date', InputLabelProps: { shrink: true } })}</Grid><Grid item xs={12} sm={4}>{field('WarrantyExpiry','Warranty Expiry',{ type: 'date', InputLabelProps: { shrink: true } })}</Grid><Grid item xs={12} sm={4}>{field('Cost','Acquisition Cost',{ type: 'number', inputProps: { min: 0, step: '.01' } })}</Grid>
            <Grid item xs={12}>{field('Vendor','Vendor / Supplier')}</Grid><Grid item xs={12}>{field('Notes','Notes',{ multiline: true, rows: 2 })}</Grid>
        </Grid></DialogContent><DialogActions><Button onClick={() => setOpen(false)} disabled={busy}>Cancel</Button><Button type="submit" color="primary" variant="contained" disabled={busy}>{busy ? 'Saving…' : 'Save Asset'}</Button></DialogActions></form></Dialog>
        <Snackbar open={Boolean(message)} autoHideDuration={5000} onClose={() => setMessage(null)}><Alert severity={message?.type || 'info'} onClose={() => setMessage(null)}>{message?.text}</Alert></Snackbar>
    </div>;
}
