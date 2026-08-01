import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    IconButton, MenuItem, Snackbar, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Tooltip, Typography
} from '@material-ui/core';
import { Add, Delete, Edit, Refresh } from '@material-ui/icons';
import { Alert } from '@material-ui/lab';
import axios from 'axios';
import moment from 'moment';

const statusColor = status => status === 'Approved' || status === 'Completed' || status === 'Locked' ? 'primary' : status === 'Rejected' || status === 'Cancelled' ? 'secondary' : 'default';

export default function WorkflowBoard({ resource, title, subtitle, fields, columns }) {
    const empty = useMemo(() => fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || '' }), {}), [fields]);
    const [rows, setRows] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [form, setForm] = useState(empty);
    const [editing, setEditing] = useState(null);
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);
    const endpoint = window.apihost + `workflow/${resource}`;
    const load = useCallback(() => axios.get(endpoint).then(r => setRows(Array.isArray(r.data) ? r.data : [])).catch(e => setMessage({ type: 'error', text: e.response?.data?.message || 'Could not load records.' })), [endpoint]);
    useEffect(load, [load]);
    useEffect(() => {
        if (fields.some(f => f.type === 'employee')) axios.get(window.apihost + 'employees/options').then(r => setEmployees(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    }, [fields]);
    const showForm = row => {
        setEditing(row || null);
        setForm(row ? fields.reduce((acc, field) => ({ ...acc, [field.name]: field.type === 'date' && row[field.name] ? moment(row[field.name]).format('YYYY-MM-DD') : (row[field.name] ?? '') }), {}) : empty);
        setOpen(true);
    };
    const save = async e => {
        e.preventDefault(); setBusy(true);
        try {
            if (editing) await axios.put(`${endpoint}/${editing.Id}`, form); else await axios.post(endpoint, form);
            setOpen(false); setMessage({ type: 'success', text: `${title} saved.` }); load();
        } catch (error) { setMessage({ type: 'error', text: error.response?.data?.message || 'Unable to save record.' }); }
        finally { setBusy(false); }
    };
    const remove = async row => {
        if (!window.confirm(`Delete ${title.toLowerCase()} #${row.Id}?`)) return;
        try { await axios.delete(`${endpoint}/${row.Id}`); load(); }
        catch (error) { setMessage({ type: 'error', text: error.response?.data?.message || 'Unable to delete record.' }); }
    };
    const submitForQA = async row => {
        if (!window.confirm(`Submit production batch ${row.BatchNo} for QA inspection?`)) return;
        try { await axios.put(`${endpoint}/${row.Id}`, { QAStatus: 'Pending Inspection' }); setMessage({ type: 'success', text: `Batch ${row.BatchNo} submitted to Quality Assurance.` }); load(); }
        catch (error) { setMessage({ type: 'error', text: error.response?.data?.message || 'Unable to submit batch for QA.' }); }
    };
    const renderValue = (row, column) => {
        const value = row[column.name];
        if (column.type === 'status') return <Chip size="small" label={value || '—'} color={statusColor(value)} />;
        if (column.type === 'date') return value ? moment(value).format('MMM D, YYYY') : '—';
        return value ?? '—';
    };
    return <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            <div><Typography variant="h5" style={{ fontWeight: 700 }}>{title}</Typography><Typography color="textSecondary">{subtitle}</Typography></div>
            <div><Tooltip title="Refresh"><IconButton onClick={load}><Refresh /></IconButton></Tooltip><Button color="primary" variant="contained" startIcon={<Add />} onClick={() => showForm(null)}>Add {title}</Button></div>
        </div>
        <Card><CardContent style={{ padding: 0 }}><TableContainer style={{ maxHeight: 'calc(100vh - 220px)' }}><Table stickyHeader size="small">
            <TableHead><TableRow>{columns.map(c => <TableCell key={c.name} style={{ fontWeight: 700, minWidth: c.width }}>{c.label}</TableCell>)}<TableCell align="right" style={{ fontWeight: 700 }}>Actions</TableCell></TableRow></TableHead>
            <TableBody>{!rows.length && <TableRow><TableCell colSpan={columns.length + 1} align="center" style={{ padding: 40 }}>No records yet.</TableCell></TableRow>}
                {rows.map(row => <TableRow hover key={row.Id}>{columns.map(c => <TableCell key={c.name}>{renderValue(row, c)}</TableCell>)}<TableCell align="right" style={{ whiteSpace: 'nowrap' }}>{resource === 'traceability' && ['Not Submitted','Rejected','On Hold'].includes(row.QAStatus || 'Not Submitted') && <Button size="small" color="primary" onClick={() => submitForQA(row)}>{row.QAStatus === 'Not Submitted' || !row.QAStatus ? 'Submit QA' : 'Resubmit'}</Button>}<IconButton size="small" onClick={() => showForm(row)}><Edit fontSize="small" /></IconButton><IconButton size="small" onClick={() => remove(row)}><Delete fontSize="small" /></IconButton></TableCell></TableRow>)}
            </TableBody>
        </Table></TableContainer></CardContent></Card>
        <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="sm"><form onSubmit={save}><DialogTitle>{editing ? 'Edit' : 'Add'} {title}</DialogTitle><DialogContent>
            {fields.map(field => field.type === 'employee' ? <TextField key={field.name} select required={field.required} fullWidth margin="dense" variant="outlined" label={field.label} value={form[field.name]} onChange={e => setForm({ ...form, [field.name]: Number(e.target.value) })}>{employees.map(emp => <MenuItem key={emp.id} value={emp.id}>{emp.employeeNo} — {emp.employeeName}</MenuItem>)}</TextField>
                : <TextField key={field.name} select={field.type === 'select'} required={field.required} fullWidth margin="dense" variant="outlined" multiline={field.type === 'multiline'} rows={field.type === 'multiline' ? 3 : undefined} type={field.type === 'select' || field.type === 'multiline' ? 'text' : field.type || 'text'} label={field.label} value={form[field.name]} onChange={e => setForm({ ...form, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value })} InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}>{field.options?.map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)}</TextField>)}
        </DialogContent><DialogActions><Button onClick={() => setOpen(false)} disabled={busy}>Cancel</Button><Button type="submit" color="primary" variant="contained" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button></DialogActions></form></Dialog>
        <Snackbar open={Boolean(message)} autoHideDuration={5000} onClose={() => setMessage(null)}><Alert severity={message?.type || 'info'} onClose={() => setMessage(null)}>{message?.text}</Alert></Snackbar>
    </div>;
}
