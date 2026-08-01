import React, { useState, useEffect, useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
    Card, CardActionArea, Typography, IconButton, Menu, MenuItem, Avatar
} from '@material-ui/core';
import {
    People, Settings, Receipt, Dashboard, ExitToApp, AccountBalance, Computer, VerifiedUser, LocalShipping, Storefront, Security, Person, AccountBalanceWallet
} from '@material-ui/icons';
import UserContext from './context/userContext';

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box',
        background: theme.palette.type === 'dark'
            ? 'linear-gradient(135deg, #1E3A8A, #155E75)'
            : 'linear-gradient(135deg, #4F73FF, #4BC0C8)',
    },
    topBar: {
        position: 'absolute', top: 0, right: 0, padding: 16,
        display: 'flex', alignItems: 'center', color: 'white',
    },
    heading: { color: 'white', fontWeight: 700, textAlign: 'center', letterSpacing: 0.3 },
    sub: { color: 'rgba(255,255,255,0.85)', marginBottom: 36, textAlign: 'center' },
    grid: {
        display: 'grid', gap: 20, width: '100%', maxWidth: 980,
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    },
    card: {
        borderRadius: 16, background: theme.palette.background.paper,
        boxShadow: '0 10px 30px rgba(17,24,39,0.18)',
        transition: 'transform .18s ease, box-shadow .18s ease',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 40px rgba(17,24,39,0.26)' },
    },
    area: { padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minHeight: 150 },
    iconChip: {
        width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center',
        justifyContent: 'center', marginBottom: 14,
    },
    cardTitle: { fontWeight: 700, color: theme.palette.text.primary },
    cardDesc: { color: theme.palette.text.secondary, marginTop: 6, fontSize: 13, lineHeight: 1.35 },
    avatar: { width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 15, fontWeight: 600 },
}));

function ModuleSelection({ onSelectHR, onSelectMaintenance, onSelectProduction, onSelectAccounting, onSelectManagement, onSelectIT, onSelectQuality, onSelectDispatch, onSelectSales, onSelectAdministration, onSelectEmployeePortal, onSelectUtesla }) {
    const classes = useStyles();
    const { setUserData } = useContext(UserContext);

    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (user) { setRole(user.role); setName(user.Name); }
    }, []);

    const logOut = () => { setUserData({ token: undefined, user: undefined }); sessionStorage.clear(); };

    const modules = [
        { title: 'Human Resources', roles: ['HR', 'HR Staff'], desc: 'Employees, attendance, holidays and shifts', icon: <People />, color: '#4F73FF', bg: 'rgba(79,115,255,0.12)', onClick: onSelectHR },
        { title: 'Maintenance', roles: ['Maintenance', 'Device Manager'], desc: 'Inventory, work orders and preventive maintenance', icon: <Settings />, color: '#06B6D4', bg: 'rgba(6,182,212,0.12)', onClick: onSelectMaintenance },
        { title: 'Production', roles: ['Production'], desc: 'Daily receipts, inventory and traceability', icon: <Receipt />, color: '#F59E0B', bg: 'rgba(245,158,11,0.14)', onClick: onSelectProduction },
        { title: 'Accounting', roles: ['Accounting'], desc: 'Salary, deductions, payroll and period locks', icon: <AccountBalance />, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', onClick: onSelectAccounting },
        { title: 'IT Asset Management', roles: ['IT'], desc: 'Technology assets, network devices and NIDEKA biometric logs', icon: <Computer />, color: '#2563EB', bg: 'rgba(37,99,235,0.12)', onClick: onSelectIT },
        { title: 'Quality Assurance', roles: ['QA'], desc: 'Inspections, non-conformance and product release control', icon: <VerifiedUser />, color: '#10B981', bg: 'rgba(16,185,129,0.12)', onClick: onSelectQuality },
        { title: 'Dispatch & Delivery', roles: ['Dispatch'], desc: 'Customer pickup, truck delivery, fleet and proof of delivery', icon: <LocalShipping />, color: '#F97316', bg: 'rgba(249,115,22,0.12)', onClick: onSelectDispatch },
        { title: 'Sales & Job Orders', roles: ['Sales'], desc: 'Customer inquiries, product catalog and production job orders', icon: <Storefront />, color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)', onClick: onSelectSales },
        { title: 'Management Dashboard', roles: ['Management'], desc: 'Audit history and operational overview', icon: <Dashboard />, color: '#EF4444', bg: 'rgba(239,68,68,0.12)', onClick: onSelectManagement },
        { title: 'Identity & Access Management', roles: [], desc: 'Employee accounts, access roles and secure credential lifecycle', icon: <Security />, color: '#6366F1', bg: 'rgba(99,102,241,0.13)', onClick: onSelectAdministration },
        { title: 'UTESLA Cooperative', roles: ['UTESLA'], desc: 'Employee membership, savings, loans and pooled interest', icon: <AccountBalanceWallet />, color: '#0F766E', bg: 'rgba(15,118,110,0.13)', onClick: onSelectUtesla },
        { title: 'Employee Self-Service', roles: ['Employee'], employeeOnly: true, desc: 'Your secure employee account and future mobile services', icon: <Person />, color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)', onClick: onSelectEmployeePortal },
    ].filter(module => module.employeeOnly ? role === 'Employee' : role === 'Administrator' || module.roles.includes(role));

    return (
        <div className={classes.root}>
            <div className={classes.topBar}>
                <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
                    <Avatar className={classes.avatar}>{name ? name.charAt(0).toUpperCase() : ''}</Avatar>
                    <div style={{ marginLeft: 8, textAlign: 'left' }}>
                        <div style={{ fontSize: 14 }}>{name}</div>
                        <div style={{ fontSize: 11, color: '#E0E0E0' }}>{role}</div>
                    </div>
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                    <MenuItem onClick={logOut}><ExitToApp fontSize="small" style={{ marginRight: 8 }} />Logout</MenuItem>
                </Menu>
            </div>

            <Typography variant="h4" className={classes.heading}>Unimore Trading</Typography>
            <Typography variant="subtitle1" className={classes.sub}>Select a workspace to continue</Typography>

            <div className={classes.grid}>
                {modules.map((m) => (
                    <Card key={m.title} className={classes.card} elevation={0}>
                        <CardActionArea className={classes.area} onClick={m.onClick}>
                            <div className={classes.iconChip} style={{ backgroundColor: m.bg, color: m.color }}>
                                {m.icon}
                            </div>
                            <Typography variant="subtitle1" className={classes.cardTitle}>{m.title}</Typography>
                            <Typography className={classes.cardDesc}>{m.desc}</Typography>
                        </CardActionArea>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default ModuleSelection;
