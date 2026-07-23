import React, { useState, useEffect } from 'react';
import {
    Paper, Grid, Button, TextField, InputAdornment, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Avatar, Chip, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, Typography, CircularProgress, MenuItem, Tooltip
} from '@material-ui/core';
import { PersonAdd, Edit, Delete, VpnKey, Search } from '@material-ui/icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const axios = require('axios');
const ROLES = ['Administrator', 'HR', 'HR Staff', 'Device Manager'];

const roleColor = (r) => {
    switch (r) {
        case 'Administrator': return { bg: '#EDE9FE', fg: '#6D28D9' };
        case 'HR': return { bg: '#DBEAFE', fg: '#1D4ED8' };
        case 'HR Staff': return { bg: '#DCFCE7', fg: '#15803D' };
        default: return { bg: '#FEF3C7', fg: '#B45309' };
    }
};

function User() {
    const apihost = window.apihost;
    const [users, setUsers] = useState([]);
    const [loader, setLoader] = useState(false);
    const [reload, setReload] = useState(false);
    const [search, setSearch] = useState('');

    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ role: 'HR Staff' });
    const [pwId, setPwId] = useState(null);
    const [pw, setPw] = useState({});
    const [confirmDel, setConfirmDel] = useState(null);

    useEffect(() => {
        setLoader(true);
        axios.post(apihost + 'users/list', {})
            .then((r) => setUsers(Array.isArray(r.data) ? r.data : []))
            .catch(() => setUsers([]))
            .finally(() => setLoader(false));
    }, [reload]);

    const list = users
        .map((x) => ({ id: x._id, userName: x.UserName, name: x.Name, role: x.Role }))
        .filter((u) => !search || (u.name + u.userName).toLowerCase().includes(search.toLowerCase()));

    const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const openAdd = () => { setEditId(null); setForm({ role: 'HR Staff' }); setOpen(true); };
    const openEdit = (u) => { setEditId(u.id); setForm({ userName: u.userName, name: u.name, role: u.role }); setOpen(true); };

    const save = () => {
        const done = () => { setOpen(false); setReload((r) => !r); };
        const err = (e) => toast.error(typeof e.response?.data === 'string' ? e.response.data : 'Error', { position: 'top-center' });
        if (editId) {
            axios.put(apihost + 'users/' + editId, { userName: form.userName, name: form.name, role: form.role })
                .then(() => { toast.success('User updated.', { position: 'top-center' }); done(); }).catch(err);
        } else {
            axios.post(apihost + 'users/', {
                userName: form.userName, name: form.name, role: form.role,
                password: form.password, confirmPassword: form.confirmPassword,
            }).then(() => { toast.success('User created.', { position: 'top-center' }); done(); }).catch(err);
        }
    };

    const changePassword = () => {
        axios.put(apihost + 'users/change-password/' + pwId, { Password: pw.password, ConfirmPassword: pw.confirmPassword })
            .then(() => { toast.success('Password changed.', { position: 'top-center' }); setPwId(null); setPw({}); })
            .catch((e) => toast.error(typeof e.response?.data === 'string' ? e.response.data : 'Error', { position: 'top-center' }));
    };

    const doDelete = () => {
        axios.delete(apihost + 'users/' + confirmDel)
            .then(() => { toast.info('User deleted.', { position: 'top-center' }); setConfirmDel(null); setReload((r) => !r); })
            .catch(() => setConfirmDel(null));
    };

    return (
        <Paper style={{ padding: 24, borderRadius: 14 }}>
            <ToastContainer />
            <Grid container spacing={2} alignItems="center" style={{ marginBottom: 16 }}>
                <Grid item><Typography variant="h6">User Management</Typography></Grid>
                <Grid item xs />
                <Grid item>
                    <TextField size="small" placeholder="Search users" value={search} onChange={(e) => setSearch(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
                </Grid>
                <Grid item>
                    <Button variant="contained" color="primary" startIcon={<PersonAdd />} onClick={openAdd}>Add User</Button>
                </Grid>
            </Grid>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Username</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loader && <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={28} /></TableCell></TableRow>}
                        {!loader && list.length === 0 && <TableRow><TableCell colSpan={4} align="center" style={{ color: '#94A3B8', padding: 40 }}>No users found.</TableCell></TableRow>}
                        {!loader && list.map((u) => {
                            const rc = roleColor(u.role);
                            return (
                                <TableRow key={u.id} hover>
                                    <TableCell>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <Avatar style={{ backgroundColor: rc.fg }}>{(u.name || '?').charAt(0).toUpperCase()}</Avatar>
                                            <span style={{ fontWeight: 600 }}>{u.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{u.userName}</TableCell>
                                    <TableCell><Chip size="small" label={u.role} style={{ backgroundColor: rc.bg, color: rc.fg, fontWeight: 600 }} /></TableCell>
                                    <TableCell align="right" style={{ whiteSpace: 'nowrap' }}>
                                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(u)}><Edit fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="Change Password"><IconButton size="small" onClick={() => { setPwId(u.id); setPw({}); }}><VpnKey fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="Delete"><IconButton size="small" onClick={() => setConfirmDel(u.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add / Edit */}
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>{editId ? 'Edit User' : 'Add User'}</DialogTitle>
                <DialogContent>
                    <TextField label="Full Name" fullWidth value={form.name || ''} onChange={(e) => setF('name', e.target.value)} style={{ marginBottom: 12 }} />
                    <TextField label="Username" fullWidth value={form.userName || ''} onChange={(e) => setF('userName', e.target.value)} style={{ marginBottom: 12 }} />
                    <TextField select label="Role" fullWidth value={form.role || ''} onChange={(e) => setF('role', e.target.value)} style={{ marginBottom: 12 }}>
                        {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                    </TextField>
                    {!editId && <>
                        <TextField type="password" label="Password" fullWidth value={form.password || ''} onChange={(e) => setF('password', e.target.value)} style={{ marginBottom: 12 }} />
                        <TextField type="password" label="Confirm Password" fullWidth value={form.confirmPassword || ''} onChange={(e) => setF('confirmPassword', e.target.value)} />
                    </>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={save}>Save</Button>
                </DialogActions>
            </Dialog>

            {/* Change Password */}
            <Dialog open={Boolean(pwId)} onClose={() => setPwId(null)} fullWidth maxWidth="xs">
                <DialogTitle>Change Password</DialogTitle>
                <DialogContent>
                    <TextField type="password" label="New Password" fullWidth value={pw.password || ''} onChange={(e) => setPw((p) => ({ ...p, password: e.target.value }))} style={{ marginBottom: 12 }} />
                    <TextField type="password" label="Confirm Password" fullWidth value={pw.confirmPassword || ''} onChange={(e) => setPw((p) => ({ ...p, confirmPassword: e.target.value }))} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPwId(null)}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={changePassword}>Save</Button>
                </DialogActions>
            </Dialog>

            {/* Delete */}
            <Dialog open={Boolean(confirmDel)} onClose={() => setConfirmDel(null)}>
                <DialogTitle>Delete User</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete this user?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDel(null)}>Cancel</Button>
                    <Button variant="contained" color="secondary" onClick={doDelete}>Delete</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

export default User;
