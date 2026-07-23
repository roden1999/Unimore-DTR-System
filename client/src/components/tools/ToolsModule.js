import React, { useState, useEffect, useContext } from 'react';
import {
    AppBar, CssBaseline, Divider, Drawer, IconButton, Menu, MenuItem,
    List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography,
    Hidden, Tooltip, Avatar, Badge
} from '@material-ui/core';
import {
    Build, Category, Memory, SwapHoriz, Assignment, Description,
    People, AccountCircle, Home
} from '@material-ui/icons';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles } from '@material-ui/core/styles';

import ToolsPage from './ToolsPage';
import ConsumablesPage from './ConsumablesPage';
import SparePartsPage from './SparePartsPage';
import RecordsPage from './RecordsPage';
import ToolFormsPage from './ToolFormsPage';
import ConsumableFormsPage from './ConsumableFormsPage';
import EmployeesPage from './EmployeesPage';
import User from '../user';
import UserContext from '../context/userContext';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
    root: { display: 'flex' },
    appBar: { zIndex: theme.zIndex.drawer + 1 },
    appBarShift: { marginLeft: drawerWidth, width: `calc(100% - ${drawerWidth}px)` },
    menuButton: { marginRight: theme.spacing(2) },
    drawerPaper: { width: drawerWidth, backgroundColor: '#FFFFFF' },
    toolbar: theme.mixins.toolbar,
    content: {
        flexGrow: 1, padding: theme.spacing(3), backgroundColor: '#F4F6FB',
        minHeight: '100vh', marginLeft: 0, transition: 'margin .3s',
    },
    contentShift: { marginLeft: drawerWidth },
    navItem: {
        margin: '4px 12px', borderRadius: 10, color: '#4B5563',
        '& .MuiListItemIcon-root': { minWidth: 40, color: '#6B7280' },
    },
    navItemActive: {
        backgroundColor: 'rgba(6,182,212,0.12)', color: '#0E7490',
        '& .MuiListItemIcon-root': { color: '#06B6D4' },
        '& .MuiListItemText-primary': { fontWeight: 600 },
    },
    userAvatar: {
        width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.25)',
        color: '#fff', fontSize: 15, fontWeight: 600,
    },
    customBadge: { backgroundColor: '#1AEC02', color: 'white' },
}));

const PATH_TO_PAGE = {
    '/tools/tools': 'Tools',
    '/tools/consumables': 'Consumables',
    '/tools/spare-parts': 'Machine Spare Parts',
    '/tools/records': 'Borrowed / Returned',
    '/tools/tool-forms': 'Tool Forms',
    '/tools/consumable-forms': 'Consumable Forms',
    '/tools/employees': 'Employees',
    '/tools/users': 'Users',
};

function ToolsModule({ path, navigate, onExitModule }) {
    const classes = useStyles();
    const { setUserData } = useContext(UserContext);

    const [mobileOpen, setMobileOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);

    const pageName = PATH_TO_PAGE[path] || 'Tools';

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        setRole(user?.role || '');
        setName(user?.Name || '');
    }, []);

    const safeWindow = (typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 1024;
    const go = (to) => { navigate(to); if (safeWindow < 960) setMobileOpen(false); };
    const logOut = () => { setUserData({ token: undefined, user: undefined }); sessionStorage.clear(); };

    const navItems = [
        { label: 'Tools', path: '/tools/tools', icon: <Build /> },
        { label: 'Consumables', path: '/tools/consumables', icon: <Category /> },
        { label: 'Machine Spare Parts', path: '/tools/spare-parts', icon: <Memory /> },
        { label: 'Borrowed / Returned', path: '/tools/records', icon: <SwapHoriz /> },
        { label: 'Tool Forms', path: '/tools/tool-forms', icon: <Assignment /> },
        { label: 'Consumable Forms', path: '/tools/consumable-forms', icon: <Description /> },
        { label: 'Employees', path: '/tools/employees', icon: <People /> },
    ];
    if (role === 'Administrator') navItems.push({ label: 'Users', path: '/tools/users', icon: <People /> });

    const drawer = (
        <div>
            <div className={classes.toolbar} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img src="unimore-logo-landscape.png" width="190" height="56" alt="" style={{ objectFit: 'contain' }} />
            </div>
            <Divider />
            <Typography variant="caption" style={{ padding: '16px 20px 4px', display: 'block', color: '#9CA3AF', letterSpacing: 1 }}>
                TOOLS &amp; CONSUMABLES
            </Typography>
            <List>
                {navItems.map((item) => (
                    <ListItem button key={item.label} onClick={() => go(item.path)}
                        className={`${classes.navItem} ${path === item.path ? classes.navItemActive : ''}`}>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} />
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return (
        <div className={classes.root}>
            <CssBaseline />
            <AppBar position="fixed" className={drawerOpen ? classes.appBarShift : classes.appBar}>
                <Toolbar>
                    <IconButton color="inherit" edge="start" className={classes.menuButton}
                        onClick={() => (safeWindow < 960 ? setMobileOpen(!mobileOpen) : setDrawerOpen(!drawerOpen))}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" style={{ flexGrow: 1 }}>{pageName}</Typography>
                    <Tooltip title="Back to Modules">
                        <IconButton color="inherit" onClick={() => onExitModule && onExitModule()}><Home /></IconButton>
                    </Tooltip>
                    <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <Badge variant="dot" classes={{ badge: classes.customBadge }}>
                            <Avatar className={classes.userAvatar}>{name ? name.charAt(0).toUpperCase() : <AccountCircle />}</Avatar>
                        </Badge>
                        <ListItemText style={{ marginLeft: 10 }} primary={name}
                            secondary={<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{role}</span>} />
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                        <MenuItem onClick={logOut}>Logout</MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Hidden mdUp>
                <Drawer variant="temporary" anchor="left" open={mobileOpen} onClose={() => setMobileOpen(!mobileOpen)}
                    classes={{ paper: classes.drawerPaper }} ModalProps={{ keepMounted: true }}>
                    {drawer}
                </Drawer>
            </Hidden>
            <Hidden smDown>
                <Drawer variant="persistent" open={drawerOpen} anchor="left" classes={{ paper: classes.drawerPaper }}>
                    {drawer}
                </Drawer>
            </Hidden>

            <main className={`${classes.content} ${drawerOpen ? classes.contentShift : ''}`}>
                <div className={classes.toolbar} />
                {pageName === 'Tools' && <ToolsPage />}
                {pageName === 'Consumables' && <ConsumablesPage />}
                {pageName === 'Machine Spare Parts' && <SparePartsPage />}
                {pageName === 'Borrowed / Returned' && <RecordsPage />}
                {pageName === 'Tool Forms' && <ToolFormsPage />}
                {pageName === 'Consumable Forms' && <ConsumableFormsPage />}
                {pageName === 'Employees' && <EmployeesPage />}
                {pageName === 'Users' && role === 'Administrator' && <User />}
            </main>
        </div>
    );
}

export default ToolsModule;
