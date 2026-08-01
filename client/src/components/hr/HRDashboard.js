import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import {
    Card, CardContent, CircularProgress, Grid, LinearProgress, Paper, Table,
    TableBody, TableCell, TableHead, TableRow, Typography
} from '@material-ui/core';
import { Business, Cake, EventBusy, People, PersonAddDisabled } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import EmployeeAvatar from '../common/EmployeeAvatar';

const useStyles = makeStyles((theme) => ({
    root: { minWidth: 0 },
    metric: { height: '100%' },
    metricContent: { display: 'flex', alignItems: 'center', gap: theme.spacing(2) },
    metricIcon: { width: 48, height: 48, borderRadius: 12, display: 'grid', placeItems: 'center', background: theme.palette.action.hover, color: theme.palette.primary.main },
    panel: { padding: theme.spacing(2), height: '100%' },
    person: { display: 'flex', gap: theme.spacing(1.5), alignItems: 'center', padding: theme.spacing(1), borderBottom: `1px solid ${theme.palette.divider}` },
    departmentRow: { marginTop: theme.spacing(1.5) },
}));

function MetricCard({ icon, label, value }) {
    const classes = useStyles();
    return <Card className={classes.metric}><CardContent className={classes.metricContent}><div className={classes.metricIcon}>{icon}</div><div><Typography variant="caption" color="textSecondary">{label}</Typography><Typography variant="h5">{value}</Typography></div></CardContent></Card>;
}

function HRDashboard() {
    const classes = useStyles();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get(window.apihost + 'employees/dashboard').then((response) => setData(response.data)).catch((requestError) => setError(requestError.response?.data?.error || requestError.message));
    }, []);

    if (!data && !error) return <div style={{ textAlign: 'center', padding: 80 }}><CircularProgress /></div>;
    if (error) return <Paper className={classes.panel}><Typography color="error">{error}</Typography></Paper>;

    const maxDepartment = Math.max(1, ...data.departmentDistribution.map((item) => Number(item.employeeCount)));
    return (
        <div className={classes.root}>
            <Typography variant="h5" gutterBottom>HR Dashboard</Typography>
            <Typography color="textSecondary" style={{ marginBottom: 18 }}>Workforce and attendance overview for {moment().format('MMMM YYYY')}</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} lg={3}><MetricCard icon={<People />} label="Active Employees" value={data.activeEmployees} /></Grid>
                <Grid item xs={12} sm={6} lg={3}><MetricCard icon={<PersonAddDisabled />} label="Resigned Employees" value={data.resignedEmployees} /></Grid>
                <Grid item xs={12} sm={6} lg={3}><MetricCard icon={<Business />} label="Departments" value={data.totalDepartments} /></Grid>
                <Grid item xs={12} sm={6} lg={3}><MetricCard icon={<EventBusy />} label="DTR Corrections This Month" value={data.correctionsThisMonth} /></Grid>

                <Grid item xs={12} lg={7}>
                    <Paper className={classes.panel}>
                        <Typography variant="h6" gutterBottom>Top 10 Tardiness</Typography>
                        <Table size="small"><TableHead><TableRow><TableCell>Employee</TableCell><TableCell align="right">Late Hours</TableCell><TableCell align="right">Undertime</TableCell><TableCell align="right">Absent Days</TableCell></TableRow></TableHead><TableBody>
                            {!data.topTardiness.length && <TableRow><TableCell colSpan={4} align="center">No tardiness recorded this month.</TableCell></TableRow>}
                            {data.topTardiness.map((employee) => <TableRow key={employee.id}><TableCell><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><EmployeeAvatar image={employee.image} name={employee.employeeName} size={34} /><span>{employee.employeeName}<br /><Typography variant="caption" color="textSecondary">{employee.employeeNo}</Typography></span></div></TableCell><TableCell align="right">{employee.lateHours.toFixed(2)}</TableCell><TableCell align="right">{employee.undertimeHours.toFixed(2)}</TableCell><TableCell align="right">{employee.absentDays}</TableCell></TableRow>)}
                        </TableBody></Table>
                    </Paper>
                </Grid>
                <Grid item xs={12} lg={5}>
                    <Paper className={classes.panel}>
                        <Typography variant="h6"><Cake fontSize="small" style={{ verticalAlign: 'middle', marginRight: 8 }} />Upcoming Birthdays</Typography>
                        {!data.upcomingBirthdays.length && <Typography color="textSecondary" style={{ padding: 16 }}>Add employee birthdays to see upcoming celebrations.</Typography>}
                        {data.upcomingBirthdays.map((employee) => <div className={classes.person} key={employee.id}><EmployeeAvatar image={employee.image} name={employee.employeeName} /><div style={{ flex: 1 }}><Typography variant="body2"><strong>{employee.employeeName}</strong></Typography><Typography variant="caption" color="textSecondary">{moment(employee.nextBirthday).format('MMM D')} · turns {moment(employee.nextBirthday).diff(moment(employee.birthDate), 'years')}</Typography></div></div>)}
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper className={classes.panel}>
                        <Typography variant="h6">Active Employees by Department</Typography>
                        <Grid container spacing={2}>{data.departmentDistribution.map((department) => <Grid item xs={12} sm={6} md={4} key={department.id}><div className={classes.departmentRow}><div style={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">{department.department}</Typography><Typography variant="body2"><strong>{department.employeeCount}</strong></Typography></div><LinearProgress variant="determinate" value={(Number(department.employeeCount) / maxDepartment) * 100} style={{ height: 8, borderRadius: 8, marginTop: 6 }} /></div></Grid>)}</Grid>
                    </Paper>
                </Grid>
            </Grid>
        </div>
    );
}

export default HRDashboard;
