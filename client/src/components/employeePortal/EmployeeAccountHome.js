import React, { useContext } from 'react';
import { AppBar, Avatar, Box, Button, Card, CardContent, Grid, Toolbar, Typography } from '@material-ui/core';
import { Announcement, EventNote, ExitToApp, Receipt } from '@material-ui/icons';
import UserContext from '../context/userContext';

export default function EmployeeAccountHome({ onExitModule }) {
    const { setUserData } = useContext(UserContext);
    const user = JSON.parse(sessionStorage.getItem('user')) || {};
    const logout = () => { sessionStorage.clear(); setUserData({ token: undefined, user: undefined }); };
    const features = [
        [<EventNote />, 'Daily Time Record', 'Prepared for the future employee mobile experience.'],
        [<Receipt />, 'Payslips', 'Prepared for secure employee-only payroll viewing.'],
        [<Announcement />, 'Announcements', 'Prepared for company notices and updates.'],
    ];
    return <Box style={{ minHeight: '100vh', background: 'var(--app-bg-default)' }}>
        <AppBar position="static"><Toolbar><Typography variant="h6" style={{ flexGrow: 1 }}>Employee Self-Service</Typography><Button color="inherit" startIcon={<ExitToApp />} onClick={logout}>Logout</Button></Toolbar></AppBar>
        <Box style={{ maxWidth: 980, margin: '0 auto', padding: 28 }}>
            <Card elevation={0} style={{ borderRadius: 16, marginBottom: 24 }}><CardContent style={{ padding: 28, display: 'flex', gap: 18, alignItems: 'center' }}>
                <Avatar src={user.image || undefined} style={{ width: 64, height: 64 }}>{user.Name?.charAt(0)}</Avatar><div><Typography variant="h5" style={{ fontWeight: 800 }}>Your account is ready</Typography><Typography color="textSecondary">{user.Name} · {user.employeeNo || user.userName}</Typography><Typography variant="body2" style={{ marginTop: 6 }}>Your employee identity is securely linked. DTR, payslip, and announcement access can now be added to the future mobile application without creating another account.</Typography></div>
            </CardContent></Card>
            <Typography variant="h6" style={{ marginBottom: 12 }}>Planned self-service capabilities</Typography>
            <Grid container spacing={3}>{features.map(feature => <Grid item xs={12} md={4} key={feature[1]}><Card elevation={0} style={{ height: '100%', borderRadius: 14 }}><CardContent><div style={{ color: '#6366F1', marginBottom: 12 }}>{feature[0]}</div><Typography variant="subtitle1"><strong>{feature[1]}</strong></Typography><Typography variant="body2" color="textSecondary">{feature[2]}</Typography></CardContent></Card></Grid>)}</Grid>
            {onExitModule && <Button style={{ marginTop: 24 }} onClick={onExitModule}>Back to workspaces</Button>}
        </Box>
    </Box>;
}
