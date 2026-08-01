import React, { useEffect, useState } from 'react';
import { Button, Card, CardContent, Chip, CircularProgress, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@material-ui/core';
import { AccountBalanceWallet, MonetizationOn, People, PieChart, TrendingUp, Warning } from '@material-ui/icons';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import EmployeeAvatar from '../common/EmployeeAvatar';
import axios from 'axios';
import moment from 'moment';
import { money } from './utils';

const useStyles = makeStyles(theme => ({ metric: { height: '100%', borderRadius: 14, background: theme.palette.background.paper }, body: { display: 'flex', gap: 14, alignItems: 'center' }, icon: { width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', color: '#0F766E', background: 'rgba(15,118,110,.13)' }, panel: { padding: 20, borderRadius: 14, background: theme.palette.background.paper } }));
const Metric = ({ label, value, icon }) => { const classes = useStyles(); return <Card className={classes.metric} elevation={0}><CardContent className={classes.body}><div className={classes.icon}>{icon}</div><div><Typography variant="h6" style={{ fontWeight: 800 }}>{value}</Typography><Typography variant="body2" color="textSecondary">{label}</Typography></div></CardContent></Card>; };

export default function UteslaDashboard({ navigate }) {
    const classes = useStyles(); const [data, setData] = useState(null);
    useEffect(() => { axios.get(window.apihost + 'utesla/dashboard').then(response => setData(response.data)).catch(() => setData({ members: {}, savings: {}, loans: {}, earnings: {}, distributions: {}, funds: {}, recentLoans: [] })); }, []);
    if (!data) return <div style={{ textAlign: 'center', padding: 80 }}><CircularProgress /></div>;
    const distributable = Number(data.earnings?.InterestCollected || 0) - Number(data.distributions?.DistributedInterest || 0);
    return <Grid container spacing={3}>
        <Grid item xs={12}><Alert severity="info"><strong>Initial configurable model:</strong> member savings provide the lending pool, borrowers pay interest, and collected interest can be distributed proportionally to eligible savers. Confirm rates, approval authority, withdrawal rules, and payroll-deduction integration with the client before production use.</Alert></Grid>
        <Grid item xs={12} sm={6} lg={2}><Metric label="Active members" value={data.members?.ActiveMembers || 0} icon={<People />} /></Grid>
        <Grid item xs={12} sm={6} lg={2}><Metric label="Member savings" value={money(data.savings?.TotalSavings)} icon={<AccountBalanceWallet />} /></Grid>
        <Grid item xs={12} sm={6} lg={2}><Metric label="Available funds" value={money(data.funds?.AvailableFunds)} icon={<TrendingUp />} /></Grid>
        <Grid item xs={12} sm={6} lg={2}><Metric label="Active loan principal" value={money(data.loans?.PrincipalOutstanding)} icon={<MonetizationOn />} /></Grid>
        <Grid item xs={12} sm={6} lg={2}><Metric label="Interest collected" value={money(data.earnings?.InterestCollected)} icon={<PieChart />} /></Grid>
        <Grid item xs={12} sm={6} lg={2}><Metric label="Interest available to distribute" value={money(distributable)} icon={<Warning />} /></Grid>
        <Grid item xs={12} lg={8}><Paper className={classes.panel} elevation={0}><div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}><Typography variant="h6" style={{ flexGrow: 1 }}>Recent loan applications</Typography><Button color="primary" onClick={() => navigate('/utesla/loans')}>Manage loans</Button></div>
            <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Member</TableCell><TableCell>Loan</TableCell><TableCell>Applied</TableCell><TableCell align="right">Principal</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>
                {(data.recentLoans || []).map(row => <TableRow key={row.Id}><TableCell><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><EmployeeAvatar image={row.Image} name={`${row.FirstName} ${row.LastName}`} size={32} /><div>{row.FirstName} {row.LastName}<br /><Typography variant="caption" color="textSecondary">{row.MemberNo}</Typography></div></div></TableCell><TableCell>{row.LoanNo}</TableCell><TableCell>{moment(row.ApplicationDate).format('MMM D, YYYY')}</TableCell><TableCell align="right">{money(row.Principal)}</TableCell><TableCell><Chip size="small" label={row.Status} /></TableCell></TableRow>)}
                {!data.recentLoans?.length && <TableRow><TableCell colSpan={5} align="center" style={{ padding: 35 }}><Typography color="textSecondary">No loan applications yet.</Typography></TableCell></TableRow>}
            </TableBody></Table></TableContainer></Paper></Grid>
        <Grid item xs={12} lg={4}><Paper className={classes.panel} elevation={0}><Typography variant="h6">Recommended operating sequence</Typography>{['Register an active employee as a UTESLA member.','Post deposits or contribution collections to the savings ledger.','Review loan eligibility and approve or reject the application.','Release approved funds and generate the amortization schedule.','Post repayments; principal replenishes the lending pool and interest becomes distributable.','Preview and post an interest distribution after the agreed period.'].map((text,index)=><div key={text} style={{ display:'flex',gap:10,marginTop:14 }}><div style={{minWidth:26,height:26,borderRadius:13,display:'grid',placeItems:'center',background:'#0F766E',color:'#fff',fontWeight:700}}>{index+1}</div><Typography variant="body2">{text}</Typography></div>)}</Paper></Grid>
    </Grid>;
}
