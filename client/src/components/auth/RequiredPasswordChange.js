import React, { useContext, useMemo, useState } from 'react';
import {
    Box, Button, Card, CardContent, CircularProgress, LinearProgress, TextField, Typography
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { Lock } from '@material-ui/icons';
import { useTheme } from '@material-ui/core/styles';
import axios from 'axios';
import UserContext from '../context/userContext';

export default function RequiredPasswordChange() {
    const theme = useTheme();
    const { userData, setUserData } = useContext(UserContext);
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const rules = useMemo(() => [
        ['At least 10 characters', form.newPassword.length >= 10],
        ['One uppercase and one lowercase letter', /[A-Z]/.test(form.newPassword) && /[a-z]/.test(form.newPassword)],
        ['One number', /[0-9]/.test(form.newPassword)],
        ['One special character', /[^A-Za-z0-9]/.test(form.newPassword)],
        ['Passwords match', Boolean(form.newPassword) && form.newPassword === form.confirmPassword],
    ], [form]);
    const score = rules.filter(rule => rule[1]).length;

    const submit = async event => {
        event.preventDefault();
        setError(''); setSaving(true);
        try {
            await axios.put(window.apihost + 'users/me/password', form);
            sessionStorage.clear();
            delete axios.defaults.headers.common['auth-token'];
            setUserData({ token: undefined, user: undefined });
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Password change was not completed.');
        } finally { setSaving(false); }
    };

    return <Box style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, background: theme.palette.type === 'dark' ? 'linear-gradient(135deg,#111827,#312E81)' : 'linear-gradient(135deg,#4F73FF,#4BC0C8)' }}>
        <Card style={{ width: '100%', maxWidth: 500, borderRadius: 18 }}><CardContent style={{ padding: 32 }}>
            <div style={{ width: 54, height: 54, borderRadius: 14, background: 'rgba(99,102,241,.14)', color: '#6366F1', display: 'grid', placeItems: 'center', marginBottom: 16 }}><Lock /></div>
            <Typography variant="h5" style={{ fontWeight: 800 }}>Create your permanent password</Typography>
            <Typography color="textSecondary" style={{ marginTop: 6, marginBottom: 20 }}>Welcome, {userData.user?.Name}. Your administrator issued a temporary password. Set a private password before accessing your account.</Typography>
            {error && <Alert severity="error" style={{ marginBottom: 16 }}>{error}</Alert>}
            <form onSubmit={submit}>
                <TextField required type="password" variant="outlined" fullWidth label="Temporary password" autoComplete="current-password" value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} style={{ marginBottom: 14 }} />
                <TextField required type="password" variant="outlined" fullWidth label="New password" autoComplete="new-password" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} style={{ marginBottom: 14 }} />
                <TextField required type="password" variant="outlined" fullWidth label="Confirm new password" autoComplete="new-password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
                <LinearProgress variant="determinate" value={score * 20} color={score === rules.length ? 'primary' : 'secondary'} style={{ marginTop: 18, height: 7, borderRadius: 4 }} />
                <div style={{ marginTop: 10, marginBottom: 20 }}>{rules.map(rule => <Typography key={rule[0]} variant="caption" display="block" style={{ color: rule[1] ? '#16A34A' : theme.palette.text.secondary }}>• {rule[0]}</Typography>)}</div>
                <Button disabled={saving || score !== rules.length} type="submit" fullWidth variant="contained" color="primary" style={{ padding: 12 }}>{saving ? <CircularProgress size={24} /> : 'Save Password and Sign In Again'}</Button>
            </form>
            <Typography variant="caption" color="textSecondary" display="block" style={{ textAlign: 'center', marginTop: 14 }}>After saving, sign in again using your new password.</Typography>
        </CardContent></Card>
    </Box>;
}
