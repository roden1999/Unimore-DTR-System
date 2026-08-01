import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, Chip, CircularProgress, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@material-ui/core';
import { AssignmentTurnedIn, Build, Business, Group, History, Schedule, SettingsInputComponent } from '@material-ui/icons';
import axios from 'axios';
import moment from 'moment';

const Metric = ({ label, value, icon, color }) => <Card style={{ height: '100%' }}><CardContent style={{ display: 'flex', alignItems: 'center', gap: 16 }}><div style={{ width: 48, height: 48, borderRadius: 12, display: 'grid', placeItems: 'center', background: `${color}20`, color }}>{icon}</div><div><Typography variant="h4" style={{ fontWeight: 700 }}>{value}</Typography><Typography color="textSecondary">{label}</Typography></div></CardContent></Card>;
const Panel = ({ title, children }) => <Card style={{ height: '100%' }}><CardContent><Typography variant="h6" style={{ fontWeight: 700, marginBottom: 12 }}>{title}</Typography>{children}</CardContent></Card>;

export default function ManagementDashboard() {
    const [data, setData] = useState(null); const [error, setError] = useState('');
    const load = useCallback(() => axios.get(window.apihost + 'workflow/dashboard').then(r => setData(r.data)).catch(e => setError(e.response?.data?.message || 'Unable to load dashboard.')), []);
    useEffect(load, [load]);
    if (error) return <Typography color="error">{error}</Typography>;
    if (!data) return <div style={{ display: 'grid', placeItems: 'center', minHeight: 300 }}><CircularProgress /></div>;
    const metrics = [
        ['Active Employees', data.activeEmployees, <Group />, '#4F73FF'], ['Departments', data.totalDepartments, <Business />, '#06B6D4'],
        ['Pending Approvals', data.pendingApprovals, <AssignmentTurnedIn />, '#F59E0B'], ['Open Work Orders', data.openWorkOrders, <Build />, '#EF4444'],
        ['PM Due in 7 Days', data.dueMaintenance, <Schedule />, '#8B5CF6'], ['Active Production Batches', data.activeBatches, <SettingsInputComponent />, '#10B981'],
    ];
    return <div><Typography variant="h5" style={{ fontWeight: 700 }}>Operations Overview</Typography><Typography color="textSecondary" style={{ marginBottom: 20 }}>Live summary across HR, Maintenance, Production and Accounting.</Typography>
        <Grid container spacing={2}>{metrics.map(([label, value, icon, color]) => <Grid item xs={12} sm={6} lg={4} key={label}><Metric label={label} value={value} icon={icon} color={color} /></Grid>)}</Grid>
        <Grid container spacing={2} style={{ marginTop: 4 }}><Grid item xs={12} lg={6}><Panel title="Pending Approvals"><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Request</TableCell><TableCell>Requested by</TableCell><TableCell>Date</TableCell></TableRow></TableHead><TableBody>{!data.approvals.length && <TableRow><TableCell colSpan={3}>Nothing waiting for approval.</TableCell></TableRow>}{data.approvals.map(row => <TableRow key={row.Id}><TableCell>{row.EntityType} #{row.EntityId}</TableCell><TableCell>{row.RequestedByName}</TableCell><TableCell>{moment(row.RequestedAt).format('MMM D')}</TableCell></TableRow>)}</TableBody></Table></TableContainer></Panel></Grid>
        <Grid item xs={12} lg={6}><Panel title="Priority Work Orders"><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Work order</TableCell><TableCell>Asset</TableCell><TableCell>Priority</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{!data.workOrders.length && <TableRow><TableCell colSpan={4}>No open work orders.</TableCell></TableRow>}{data.workOrders.map(row => <TableRow key={row.WorkOrderNo}><TableCell>{row.WorkOrderNo}</TableCell><TableCell>{row.AssetName}</TableCell><TableCell>{row.Priority}</TableCell><TableCell><Chip size="small" label={row.Status} /></TableCell></TableRow>)}</TableBody></Table></TableContainer></Panel></Grid>
        <Grid item xs={12}><Panel title="Recent Activity"><TableContainer><Table size="small"><TableHead><TableRow><TableCell>When</TableCell><TableCell>User</TableCell><TableCell>Module</TableCell><TableCell>Activity</TableCell></TableRow></TableHead><TableBody>{!data.recentActivity.length && <TableRow><TableCell colSpan={4}>Activity will appear here as records are changed.</TableCell></TableRow>}{data.recentActivity.map(row => <TableRow key={row.Id}><TableCell>{moment(row.CreatedAt).fromNow()}</TableCell><TableCell>{row.UserName}</TableCell><TableCell>{row.Module}</TableCell><TableCell><History fontSize="small" style={{ verticalAlign: 'middle', marginRight: 6 }} />{row.Description}</TableCell></TableRow>)}</TableBody></Table></TableContainer></Panel></Grid></Grid>
    </div>;
}
