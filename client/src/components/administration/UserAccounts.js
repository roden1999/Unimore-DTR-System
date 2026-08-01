import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Avatar, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
    DialogTitle, Grid, IconButton, InputAdornment, MenuItem, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography
} from '@material-ui/core';
import { Autocomplete, Alert } from '@material-ui/lab';
import { Block, CheckCircle, Edit, FileCopy, Lock, PersonAdd, Refresh, Search, Security, VpnKey } from '@material-ui/icons';
import { ToastContainer, toast } from 'react-toastify';
import EmployeeAvatar from '../common/EmployeeAvatar';
import axios from 'axios';
import moment from 'moment';
import 'react-toastify/dist/ReactToastify.css';

const ROLES = ['Employee', 'Management', 'HR', 'HR Staff', 'Maintenance', 'Device Manager', 'Production', 'Accounting', 'IT', 'QA', 'Dispatch', 'Sales', 'UTESLA'];
const blankForm = { employee: null, userName: '', role: 'Employee' };
const messageOf = error => error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : 'Unable to process the request.');

const roleColor = role => ({
    Employee: ['#E0F2FE', '#0369A1'], HR: ['#DBEAFE', '#1D4ED8'], 'HR Staff': ['#DCFCE7', '#15803D'],
    Management: ['#FEE2E2', '#B91C1C'], Maintenance: ['#CFFAFE', '#0E7490'], Production: ['#FEF3C7', '#B45309'],
    Accounting: ['#EDE9FE', '#6D28D9'], IT: ['#DBEAFE', '#1D4ED8'], QA: ['#D1FAE5', '#047857'],
    Dispatch: ['#FFEDD5', '#C2410C'], Sales: ['#E0F2FE', '#0369A1'], UTESLA: ['#CCFBF1', '#0F766E'], Administrator: ['#EDE9FE', '#6D28D9'],
}[role] || ['#F3F4F6', '#4B5563']);

export default function UserAccounts() {
    const [users, setUsers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [dialog, setDialog] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(blankForm);
    const [resetUser, setResetUser] = useState(null);
    const [statusUser, setStatusUser] = useState(null);
    const [credentials, setCredentials] = useState(null);

    const loadUsers = useCallback(() => {
        setLoading(true);
        axios.post(window.apihost + 'users/list', {}).then(r => setUsers(Array.isArray(r.data) ? r.data : []))
            .catch(error => toast.error(messageOf(error), { position: 'top-center' })).finally(() => setLoading(false));
    }, []);
    useEffect(loadUsers, [loadUsers]);

    const loadEmployees = async currentUserId => {
        const suffix = currentUserId ? `?currentUserId=${currentUserId}` : '';
        const response = await axios.get(window.apihost + 'users/available-employees' + suffix);
        const options = Array.isArray(response.data) ? response.data : [];
        setEmployees(options);
        return options;
    };

    const rows = useMemo(() => users.filter(user => {
        const haystack = [user.Name, user.UserName, user.EmployeeNo, user.Department, user.Role].join(' ').toLowerCase();
        return !search || haystack.includes(search.toLowerCase());
    }), [users, search]);

    const openCreate = async () => {
        try { await loadEmployees(); setEditId(null); setForm(blankForm); setDialog(true); }
        catch (error) { toast.error(messageOf(error), { position: 'top-center' }); }
    };
    const openEdit = async user => {
        try {
            const options = await loadEmployees(user._id);
            setEditId(user._id);
            setForm({ employee: options.find(e => e.id === user.EmployeeId) || null, userName: user.UserName, role: user.Role });
            setDialog(true);
        } catch (error) { toast.error(messageOf(error), { position: 'top-center' }); }
    };

    const selectEmployee = employee => setForm(current => ({
        ...current, employee,
        userName: !editId && employee ? String(employee.employeeNo || '').toLowerCase().replace(/[^a-z0-9._-]/g, '') : current.userName,
    }));

    const save = async () => {
        if (!form.employee) return toast.error('Select an employee.', { position: 'top-center' });
        setSaving(true);
        try {
            const payload = { employeeId: form.employee.id, userName: form.userName.trim(), role: form.role };
            if (editId) {
                await axios.put(window.apihost + 'users/' + editId, payload);
                toast.success('Employee account updated.', { position: 'top-center' });
            } else {
                const response = await axios.post(window.apihost + 'users/', payload);
                setCredentials({ ...response.data.user, temporaryPassword: response.data.temporaryPassword, reason: 'New account' });
            }
            setDialog(false); setForm(blankForm); loadUsers();
        } catch (error) { toast.error(messageOf(error), { position: 'top-center' }); }
        finally { setSaving(false); }
    };

    const resetPassword = async () => {
        setSaving(true);
        try {
            const response = await axios.post(window.apihost + `users/${resetUser._id}/reset-password`);
            setCredentials({ ...response.data.user, temporaryPassword: response.data.temporaryPassword, reason: 'Password reset' });
            setResetUser(null); loadUsers();
        } catch (error) { toast.error(messageOf(error), { position: 'top-center' }); }
        finally { setSaving(false); }
    };

    const changeStatus = async () => {
        setSaving(true);
        try {
            await axios.patch(window.apihost + `users/${statusUser._id}/status`, { isActive: !statusUser.IsActive });
            toast.success(`Account ${statusUser.IsActive ? 'deactivated' : 'reactivated'}.`, { position: 'top-center' });
            setStatusUser(null); loadUsers();
        } catch (error) { toast.error(messageOf(error), { position: 'top-center' }); }
        finally { setSaving(false); }
    };

    const copyCredentials = async () => {
        const text = `Username: ${credentials.userName}\nTemporary password: ${credentials.temporaryPassword}`;
        try { await navigator.clipboard.writeText(text); toast.success('Credentials copied.', { position: 'top-center' }); }
        catch (_error) { toast.info('Select and copy the credentials manually.', { position: 'top-center' }); }
    };

    return <Paper style={{ padding: 24, borderRadius: 14 }} elevation={0}>
        <ToastContainer />
        <Grid container spacing={2} alignItems="center" style={{ marginBottom: 18 }}>
            <Grid item><div><Typography variant="h6">Employee Account Lifecycle</Typography><Typography variant="body2" color="textSecondary">Create, reset, deactivate, and reactivate employee-linked access.</Typography></div></Grid>
            <Grid item xs />
            <Grid item xs={12} sm="auto"><TextField fullWidth size="small" variant="outlined" placeholder="Search accounts" value={search} onChange={e => setSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} /></Grid>
            <Grid item><Tooltip title="Refresh"><IconButton onClick={loadUsers}><Refresh /></IconButton></Tooltip></Grid>
            <Grid item><Button variant="contained" color="primary" startIcon={<PersonAdd />} onClick={openCreate}>Create Employee Account</Button></Grid>
        </Grid>

        <Alert severity="info" style={{ marginBottom: 16 }}>The <strong>superadmin</strong> account is protected and remains independent from employee records. Newly created accounts must be linked to one active employee.</Alert>
        <TableContainer><Table>
            <TableHead><TableRow><TableCell>Employee / Account</TableCell><TableCell>Username</TableCell><TableCell>Role</TableCell><TableCell>Access status</TableCell><TableCell>Last login</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
            <TableBody>
                {loading && <TableRow><TableCell colSpan={6} align="center" style={{ padding: 50 }}><CircularProgress size={28} /></TableCell></TableRow>}
                {!loading && rows.length === 0 && <TableRow><TableCell colSpan={6} align="center" style={{ padding: 50 }}><Typography color="textSecondary">No accounts found.</Typography></TableCell></TableRow>}
                {!loading && rows.map(user => {
                    const [bg, fg] = roleColor(user.Role);
                    const locked = user.LockedUntil && moment(user.LockedUntil).isAfter(moment());
                    return <TableRow key={user._id} hover>
                        <TableCell><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {user.IsSystemAccount ? <Avatar style={{ background: '#6366F1' }}><Security /></Avatar> : <EmployeeAvatar image={user.EmployeeImage} name={user.Name} />}
                            <div><Typography variant="body2"><strong>{user.Name}</strong></Typography><Typography variant="caption" color="textSecondary">{user.IsSystemAccount ? 'Protected system account' : user.EmployeeNo ? `${user.EmployeeNo} · ${user.Department || 'No department'}` : 'Legacy account · employee link required'}</Typography></div>
                        </div></TableCell>
                        <TableCell>{user.UserName}</TableCell>
                        <TableCell><Chip size="small" label={user.Role} style={{ background: bg, color: fg, fontWeight: 700 }} /></TableCell>
                        <TableCell><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <Chip size="small" icon={user.IsActive ? <CheckCircle /> : <Block />} label={user.IsActive ? 'Active' : 'Inactive'} color={user.IsActive ? 'primary' : 'default'} />
                            {user.MustChangePassword && <Chip size="small" icon={<VpnKey />} label="Password change required" color="secondary" />}
                            {locked && <Chip size="small" icon={<Lock />} label="Locked" />}
                        </div></TableCell>
                        <TableCell>{user.LastLoginAt ? moment(user.LastLoginAt).format('MMM D, YYYY h:mm A') : 'Never'}</TableCell>
                        <TableCell align="right" style={{ whiteSpace: 'nowrap' }}>
                            <Tooltip title={user.IsSystemAccount ? 'Protected system account' : 'Edit account'}><span><IconButton size="small" disabled={user.IsSystemAccount} onClick={() => openEdit(user)}><Edit fontSize="small" /></IconButton></span></Tooltip>
                            <Tooltip title={user.IsSystemAccount ? 'Protected system account' : 'Generate temporary password'}><span><IconButton size="small" disabled={user.IsSystemAccount || !user.IsActive} onClick={() => setResetUser(user)}><VpnKey fontSize="small" /></IconButton></span></Tooltip>
                            <Tooltip title={user.IsSystemAccount ? 'Protected system account' : user.IsActive ? 'Deactivate' : 'Reactivate'}><span><IconButton size="small" disabled={user.IsSystemAccount} onClick={() => setStatusUser(user)}>{user.IsActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}</IconButton></span></Tooltip>
                        </TableCell>
                    </TableRow>;
                })}
            </TableBody>
        </Table></TableContainer>

        <Dialog open={dialog} onClose={() => !saving && setDialog(false)} fullWidth maxWidth="sm">
            <DialogTitle>{editId ? 'Edit Employee Account' : 'Create Employee Account'}</DialogTitle>
            <DialogContent>
                <Alert severity="info" style={{ marginBottom: 18 }}>{editId ? 'The display name and image come from the linked employee record.' : 'A strong temporary password will be generated automatically and shown once after creation.'}</Alert>
                <Autocomplete options={employees} value={form.employee} onChange={(_event, value) => selectEmployee(value)} getOptionLabel={option => `${option.employeeNo} - ${option.employeeName}`} getOptionSelected={(option, value) => option.id === value.id}
                    renderOption={option => <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><EmployeeAvatar image={option.image} name={option.employeeName} size={32} /><div>{option.employeeName}<br /><Typography variant="caption" color="textSecondary">{option.employeeNo} · {option.department || 'No department'}</Typography></div></div>}
                    renderInput={params => <TextField {...params} label="Employee" variant="outlined" margin="normal" required />} />
                <TextField label="Username" variant="outlined" fullWidth margin="normal" value={form.userName} onChange={e => setForm({ ...form, userName: e.target.value })} helperText="3-50 characters: letters, numbers, dot, underscore, or hyphen." />
                <TextField select label="System role" variant="outlined" fullWidth margin="normal" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} helperText="Employee is the safest role for future mobile self-service access.">
                    {ROLES.map(role => <MenuItem key={role} value={role}>{role}</MenuItem>)}
                </TextField>
            </DialogContent>
            <DialogActions><Button disabled={saving} onClick={() => setDialog(false)}>Cancel</Button><Button disabled={saving} variant="contained" color="primary" onClick={save}>{saving ? <CircularProgress size={22} /> : editId ? 'Save Changes' : 'Create Account'}</Button></DialogActions>
        </Dialog>

        <Dialog open={Boolean(resetUser)} onClose={() => !saving && setResetUser(null)} maxWidth="xs" fullWidth>
            <DialogTitle>Reset Employee Password</DialogTitle><DialogContent><Typography>Generate a new temporary password for <strong>{resetUser?.Name}</strong>?</Typography><Alert severity="warning" style={{ marginTop: 16 }}>All existing sessions will be revoked. The employee must change the new temporary password at the next login.</Alert></DialogContent>
            <DialogActions><Button disabled={saving} onClick={() => setResetUser(null)}>Cancel</Button><Button disabled={saving} variant="contained" color="primary" onClick={resetPassword}>{saving ? <CircularProgress size={22} /> : 'Reset Password'}</Button></DialogActions>
        </Dialog>

        <Dialog open={Boolean(statusUser)} onClose={() => !saving && setStatusUser(null)} maxWidth="xs" fullWidth>
            <DialogTitle>{statusUser?.IsActive ? 'Deactivate Account' : 'Reactivate Account'}</DialogTitle><DialogContent><Typography>{statusUser?.IsActive ? 'The employee will immediately lose access and all sessions will be revoked.' : 'The employee will regain access using the current password. Reset it separately if necessary.'}</Typography></DialogContent>
            <DialogActions><Button disabled={saving} onClick={() => setStatusUser(null)}>Cancel</Button><Button disabled={saving} variant="contained" color={statusUser?.IsActive ? 'secondary' : 'primary'} onClick={changeStatus}>{saving ? <CircularProgress size={22} /> : statusUser?.IsActive ? 'Deactivate' : 'Reactivate'}</Button></DialogActions>
        </Dialog>

        <Dialog open={Boolean(credentials)} onClose={() => setCredentials(null)} maxWidth="xs" fullWidth>
            <DialogTitle>{credentials?.reason} Credentials</DialogTitle><DialogContent>
                <Alert severity="warning" style={{ marginBottom: 18 }}>Copy these credentials now. For security, the temporary password cannot be retrieved after this window closes.</Alert>
                <Typography variant="caption" color="textSecondary">EMPLOYEE</Typography><Typography style={{ marginBottom: 12 }}><strong>{credentials?.name}</strong></Typography>
                <TextField label="Username" value={credentials?.userName || ''} fullWidth variant="outlined" InputProps={{ readOnly: true }} style={{ marginBottom: 14 }} />
                <TextField label="Temporary password" value={credentials?.temporaryPassword || ''} fullWidth variant="outlined" InputProps={{ readOnly: true, style: { fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 } }} />
            </DialogContent><DialogActions><Button startIcon={<FileCopy />} onClick={copyCredentials}>Copy Credentials</Button><Button variant="contained" color="primary" onClick={() => setCredentials(null)}>I Have Saved It</Button></DialogActions>
        </Dialog>
    </Paper>;
}
