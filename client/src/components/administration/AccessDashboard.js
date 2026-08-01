import React, { useEffect, useState } from 'react';
import {
    Button, Card, CardContent, Chip, CircularProgress, Grid, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Typography
} from '@material-ui/core';
import { CheckCircle, Lock, People, PersonAdd, Security, Warning } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import EmployeeAvatar from '../common/EmployeeAvatar';
import axios from 'axios';
import moment from 'moment';

const useStyles = makeStyles(theme => ({
    metric: { height: '100%', borderRadius: 14, background: theme.palette.background.paper },
    metricBody: { display: 'flex', alignItems: 'center', gap: 14 },
    icon: { width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(99,102,241,.13)', color: '#6366F1' },
    panel: { padding: 20, borderRadius: 14, background: theme.palette.background.paper },
    step: { display: 'flex', gap: 12, marginTop: 14, alignItems: 'flex-start' },
    number: { minWidth: 28, height: 28, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#6366F1', color: '#fff', fontWeight: 700 },
}));

const Metric = ({ label, value, icon }) => {
    const classes = useStyles();
    return <Card elevation={0} className={classes.metric}><CardContent className={classes.metricBody}>
        <div className={classes.icon}>{icon}</div><div><Typography variant="h5" style={{ fontWeight: 800 }}>{value ?? 0}</Typography><Typography color="textSecondary" variant="body2">{label}</Typography></div>
    </CardContent></Card>;
};

export default function AccessDashboard({ navigate }) {
    const classes = useStyles();
    const [data, setData] = useState(null);
    useEffect(() => { axios.get(window.apihost + 'users/dashboard').then(r => setData(r.data)).catch(() => setData({ summary: {}, recentAccounts: [] })); }, []);
    if (!data) return <div style={{ textAlign: 'center', padding: 80 }}><CircularProgress /></div>;
    const s = data.summary || {};
    return <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={2}><Metric label="Total accounts" value={s.TotalAccounts} icon={<People />} /></Grid>
        <Grid item xs={12} sm={6} lg={2}><Metric label="Active" value={s.ActiveAccounts} icon={<CheckCircle />} /></Grid>
        <Grid item xs={12} sm={6} lg={2}><Metric label="Inactive" value={s.InactiveAccounts} icon={<Warning />} /></Grid>
        <Grid item xs={12} sm={6} lg={2}><Metric label="Password pending" value={s.PendingPasswordChange} icon={<PersonAdd />} /></Grid>
        <Grid item xs={12} sm={6} lg={2}><Metric label="Temporarily locked" value={s.LockedAccounts} icon={<Lock />} /></Grid>
        <Grid item xs={12} sm={6} lg={2}><Metric label="Legacy unlinked" value={s.UnlinkedLegacyAccounts} icon={<Security />} /></Grid>

        <Grid item xs={12} lg={8}>
            <Paper className={classes.panel} elevation={0}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}><Typography variant="h6" style={{ flexGrow: 1 }}>Recently managed accounts</Typography><Button color="primary" onClick={() => navigate('/administration/accounts')}>Manage accounts</Button></div>
                <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Employee</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell>Last login</TableCell></TableRow></TableHead>
                    <TableBody>{(data.recentAccounts || []).map(row => <TableRow key={row.Id}>
                        <TableCell><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><EmployeeAvatar image={row.EmployeeImage} name={row.Name} size={34} /><div><strong>{row.Name}</strong><br /><Typography variant="caption" color="textSecondary">{row.EmployeeNo || row.UserName}</Typography></div></div></TableCell>
                        <TableCell>{row.Role}</TableCell><TableCell><Chip size="small" label={row.MustChangePassword ? 'Password change pending' : 'Ready'} color={row.MustChangePassword ? 'secondary' : 'default'} /></TableCell>
                        <TableCell>{row.LastLoginAt ? moment(row.LastLoginAt).format('MMM D, YYYY h:mm A') : 'Never'}</TableCell>
                    </TableRow>)}</TableBody>
                </Table></TableContainer>
            </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
            <Paper className={classes.panel} elevation={0}>
                <Typography variant="h6">Secure onboarding process</Typography>
                {[
                    ['Select employee', 'Each standard account is uniquely linked to one active employee record.'],
                    ['Issue credentials', 'The server generates a strong temporary password that is displayed only once.'],
                    ['Employee signs in', 'Temporary access is limited until the employee creates a permanent password.'],
                    ['Manage lifecycle', 'Reset, deactivate, or reactivate accounts while preserving audit history.'],
                ].map((step, index) => <div className={classes.step} key={step[0]}><div className={classes.number}>{index + 1}</div><div><Typography variant="body2"><strong>{step[0]}</strong></Typography><Typography variant="caption" color="textSecondary">{step[1]}</Typography></div></div>)}
            </Paper>
        </Grid>
    </Grid>;
}
