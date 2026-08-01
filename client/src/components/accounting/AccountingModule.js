import React, { useContext, useEffect, useState } from 'react';
import {
    AppBar, Avatar, Badge, CssBaseline, Divider, Drawer, Hidden, IconButton,
    List, ListItem, ListItemIcon, ListItemText, Menu, MenuItem, Toolbar,
    Tooltip, Typography
} from '@material-ui/core';
import { AccountBalance, AccountCircle, AttachMoney, Home, Receipt, Lock } from '@material-ui/icons';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles } from '@material-ui/core/styles';

import SalaryAndDeductions from '../salaryAndDeductions';
import Payroll from '../payroll';
import UserContext from '../context/userContext';
import NotificationBell from '../common/NotificationBell';
import WorkflowBoard from '../workflows/WorkflowBoard';
import { payrollPeriodConfig } from '../workflows/workflowConfigs';

const drawerWidth = 240;
const useStyles = makeStyles((theme) => ({
    root: { display: 'flex' },
    appBar: { zIndex: theme.zIndex.drawer + 1 },
    appBarShift: { marginLeft: drawerWidth, width: `calc(100% - ${drawerWidth}px)` },
    menuButton: { marginRight: theme.spacing(2) },
    drawerPaper: { width: drawerWidth, backgroundColor: theme.palette.background.paper },
    toolbar: theme.mixins.toolbar,
    content: { flexGrow: 1, minWidth: 0, padding: theme.spacing(3), backgroundColor: theme.palette.background.default, minHeight: '100vh', transition: 'margin .3s' },
    contentShift: { marginLeft: drawerWidth },
    navItem: { margin: '4px 12px', borderRadius: 10, color: theme.palette.text.secondary, '& .MuiListItemIcon-root': { minWidth: 40, color: theme.palette.text.secondary } },
    navItemActive: { backgroundColor: 'rgba(139,92,246,0.12)', color: '#6D28D9', '& .MuiListItemIcon-root': { color: '#8B5CF6' }, '& .MuiListItemText-primary': { fontWeight: 600 } },
    userAvatar: { width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 15, fontWeight: 600 },
    customBadge: { backgroundColor: '#1AEC02', color: 'white' },
}));

const PATH_TO_PAGE = {
    '/accounting/salary': 'Salary & Deductions',
    '/accounting/payroll': 'Payroll',
    '/accounting/payroll-periods': 'Payroll Periods',
};

function AccountingModule({ path, navigate, onExitModule }) {
    const classes = useStyles();
    const { setUserData } = useContext(UserContext);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const pageName = PATH_TO_PAGE[path] || 'Salary & Deductions';

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        setRole(user?.role || '');
        setName(user?.Name || '');
    }, []);

    const safeWindow = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1024;
    const go = (to) => { navigate(to); if (safeWindow < 960) setMobileOpen(false); };
    const logOut = () => { setUserData({ token: undefined, user: undefined }); sessionStorage.clear(); };
    const navItems = [
        { label: 'Salary & Deductions', path: '/accounting/salary', icon: <AttachMoney /> },
        { label: 'Payroll', path: '/accounting/payroll', icon: <Receipt /> },
        { label: 'Payroll Periods', path: '/accounting/payroll-periods', icon: <Lock /> },
    ];

    const drawer = (
        <div>
            <div className={classes.toolbar} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><img src="/unimore-logo-landscape.png" width="190" height="56" alt="" style={{ objectFit: 'contain' }} /></div>
            <Divider />
            <Typography variant="caption" style={{ padding: '16px 20px 4px', display: 'block', color: '#9CA3AF', letterSpacing: 1 }}>ACCOUNTING</Typography>
            <List>{navItems.map((item) => <ListItem button key={item.path} onClick={() => go(item.path)} className={`${classes.navItem} ${path === item.path ? classes.navItemActive : ''}`}><ListItemIcon>{item.icon}</ListItemIcon><ListItemText primary={item.label} /></ListItem>)}</List>
        </div>
    );

    return (
        <div className={classes.root}>
            <CssBaseline />
            <AppBar position="fixed" className={drawerOpen ? classes.appBarShift : classes.appBar}><Toolbar>
                <IconButton color="inherit" edge="start" className={classes.menuButton} onClick={() => (safeWindow < 960 ? setMobileOpen(!mobileOpen) : setDrawerOpen(!drawerOpen))}><MenuIcon /></IconButton>
                <AccountBalance style={{ marginRight: 10 }} /><Typography variant="h6" style={{ flexGrow: 1 }}>{pageName}</Typography>
                <Tooltip title="Back to Modules"><IconButton color="inherit" onClick={() => onExitModule && onExitModule()}><Home /></IconButton></Tooltip>
                <NotificationBell navigate={navigate} />
                <IconButton color="inherit" onClick={(event) => setAnchorEl(event.currentTarget)}><Badge variant="dot" classes={{ badge: classes.customBadge }}><Avatar className={classes.userAvatar}>{name ? name.charAt(0).toUpperCase() : <AccountCircle />}</Avatar></Badge><ListItemText style={{ marginLeft: 10 }} primary={name} secondary={<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{role}</span>} /></IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}><MenuItem onClick={logOut}>Logout</MenuItem></Menu>
            </Toolbar></AppBar>
            <Hidden mdUp><Drawer variant="temporary" anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)} classes={{ paper: classes.drawerPaper }} ModalProps={{ keepMounted: true }}>{drawer}</Drawer></Hidden>
            <Hidden smDown><Drawer variant="persistent" open={drawerOpen} anchor="left" classes={{ paper: classes.drawerPaper }}>{drawer}</Drawer></Hidden>
            <main className={`${classes.content} ${drawerOpen ? classes.contentShift : ''}`}><div className={classes.toolbar} />{pageName === 'Salary & Deductions' && <SalaryAndDeductions />}{pageName === 'Payroll' && <Payroll />}{pageName === 'Payroll Periods' && <WorkflowBoard {...payrollPeriodConfig} />}</main>
        </div>
    );
}

export default AccountingModule;
