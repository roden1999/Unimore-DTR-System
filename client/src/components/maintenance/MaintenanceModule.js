import React, { useContext, useEffect, useState } from 'react';
import {
    AppBar, Avatar, Badge, Collapse, CssBaseline, Divider, Drawer, Hidden,
    IconButton, List, ListItem, ListItemIcon, ListItemText, Menu, MenuItem,
    Toolbar, Tooltip, Typography
} from '@material-ui/core';
import {
    AccountCircle, Assignment, Build, Category, Description, ExpandLess,
    ExpandMore, Home, Memory, SwapHoriz, EventAvailable, AssignmentLate
} from '@material-ui/icons';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles } from '@material-ui/core/styles';

import ToolsPage from '../tools/ToolsPage';
import ConsumablesPage from '../tools/ConsumablesPage';
import RecordsPage from '../tools/RecordsPage';
import ToolFormsPage from '../tools/ToolFormsPage';
import ConsumableFormsPage from '../tools/ConsumableFormsPage';
import SparePartsPage from '../machineParts/SparePartsPage';
import UserContext from '../context/userContext';
import NotificationBell from '../common/NotificationBell';
import WorkflowBoard from '../workflows/WorkflowBoard';
import { workOrderConfig, pmConfig } from '../workflows/workflowConfigs';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
    root: { display: 'flex' },
    appBar: { zIndex: theme.zIndex.drawer + 1 },
    appBarShift: { marginLeft: drawerWidth, width: `calc(100% - ${drawerWidth}px)` },
    menuButton: { marginRight: theme.spacing(2) },
    drawerPaper: { width: drawerWidth, backgroundColor: theme.palette.background.paper },
    toolbar: theme.mixins.toolbar,
    content: {
        flexGrow: 1, minWidth: 0, padding: theme.spacing(3), backgroundColor: theme.palette.background.default,
        minHeight: '100vh', marginLeft: 0, transition: 'margin .3s',
    },
    contentShift: { marginLeft: drawerWidth },
    navItem: {
        margin: '4px 12px', borderRadius: 10, color: theme.palette.text.secondary,
        '& .MuiListItemIcon-root': { minWidth: 40, color: theme.palette.text.secondary },
    },
    subItem: { paddingLeft: 40, margin: '2px 12px', borderRadius: 10, color: theme.palette.text.secondary },
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
    '/maintenance/inventory/tools': 'Tools',
    '/maintenance/inventory/consumables': 'Consumables',
    '/maintenance/inventory/records': 'Borrowed / Returned',
    '/maintenance/inventory/tool-forms': 'Tool Forms',
    '/maintenance/inventory/consumable-forms': 'Consumable Forms',
    '/maintenance/machine-parts': 'Machine Parts',
    '/maintenance/work-orders': 'Work Orders',
    '/maintenance/preventive-maintenance': 'Preventive Maintenance',
};

function MaintenanceModule({ path, navigate, onExitModule }) {
    const classes = useStyles();
    const { setUserData } = useContext(UserContext);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [inventoryOpen, setInventoryOpen] = useState(path.startsWith('/maintenance/inventory'));
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const pageName = PATH_TO_PAGE[path] || 'Tools';

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        setRole(user?.role || '');
        setName(user?.Name || '');
    }, []);

    const safeWindow = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1024;
    const go = (to) => { navigate(to); if (safeWindow < 960) setMobileOpen(false); };
    const logOut = () => { setUserData({ token: undefined, user: undefined }); sessionStorage.clear(); };
    const subActive = (target) => `${classes.subItem} ${path === target ? classes.navItemActive : ''}`;

    const drawer = (
        <div>
            <div className={classes.toolbar} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img src="/unimore-logo-landscape.png" width="190" height="56" alt="" style={{ objectFit: 'contain' }} />
            </div>
            <Divider />
            <Typography variant="caption" style={{ padding: '16px 20px 4px', display: 'block', color: '#9CA3AF', letterSpacing: 1 }}>MAINTENANCE</Typography>
            <List>
                <ListItem button className={classes.navItem} onClick={() => setInventoryOpen((open) => !open)}>
                    <ListItemIcon><Build /></ListItemIcon>
                    <ListItemText primary="Inventory" />
                    {inventoryOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={inventoryOpen} timeout="auto" unmountOnExit>
                    <List disablePadding>
                        <ListItem button className={subActive('/maintenance/inventory/tools')} onClick={() => go('/maintenance/inventory/tools')}><ListItemIcon><Build /></ListItemIcon><ListItemText primary="Tools" /></ListItem>
                        <ListItem button className={subActive('/maintenance/inventory/consumables')} onClick={() => go('/maintenance/inventory/consumables')}><ListItemIcon><Category /></ListItemIcon><ListItemText primary="Consumables" /></ListItem>
                        <ListItem button className={subActive('/maintenance/inventory/records')} onClick={() => go('/maintenance/inventory/records')}><ListItemIcon><SwapHoriz /></ListItemIcon><ListItemText primary="Borrowed / Returned" /></ListItem>
                        <ListItem button className={subActive('/maintenance/inventory/tool-forms')} onClick={() => go('/maintenance/inventory/tool-forms')}><ListItemIcon><Assignment /></ListItemIcon><ListItemText primary="Tool Forms" /></ListItem>
                        <ListItem button className={subActive('/maintenance/inventory/consumable-forms')} onClick={() => go('/maintenance/inventory/consumable-forms')}><ListItemIcon><Description /></ListItemIcon><ListItemText primary="Consumable Forms" /></ListItem>
                    </List>
                </Collapse>
                <ListItem button className={`${classes.navItem} ${path === '/maintenance/machine-parts' ? classes.navItemActive : ''}`} onClick={() => go('/maintenance/machine-parts')}>
                    <ListItemIcon><Memory /></ListItemIcon><ListItemText primary="Machine Parts" />
                </ListItem>
                <ListItem button className={`${classes.navItem} ${path === '/maintenance/work-orders' ? classes.navItemActive : ''}`} onClick={() => go('/maintenance/work-orders')}><ListItemIcon><AssignmentLate /></ListItemIcon><ListItemText primary="Work Orders" /></ListItem>
                <ListItem button className={`${classes.navItem} ${path === '/maintenance/preventive-maintenance' ? classes.navItemActive : ''}`} onClick={() => go('/maintenance/preventive-maintenance')}><ListItemIcon><EventAvailable /></ListItemIcon><ListItemText primary="Preventive Maintenance" /></ListItem>
            </List>
        </div>
    );

    return (
        <div className={classes.root}>
            <CssBaseline />
            <AppBar position="fixed" className={drawerOpen ? classes.appBarShift : classes.appBar}>
                <Toolbar>
                    <IconButton color="inherit" edge="start" className={classes.menuButton} onClick={() => (safeWindow < 960 ? setMobileOpen(!mobileOpen) : setDrawerOpen(!drawerOpen))}><MenuIcon /></IconButton>
                    <Typography variant="h6" style={{ flexGrow: 1 }}>{pageName}</Typography>
                    <Tooltip title="Back to Modules"><IconButton color="inherit" onClick={() => onExitModule && onExitModule()}><Home /></IconButton></Tooltip>
                    <NotificationBell navigate={navigate} />
                    <IconButton color="inherit" onClick={(event) => setAnchorEl(event.currentTarget)}>
                        <Badge variant="dot" classes={{ badge: classes.customBadge }}><Avatar className={classes.userAvatar}>{name ? name.charAt(0).toUpperCase() : <AccountCircle />}</Avatar></Badge>
                        <ListItemText style={{ marginLeft: 10 }} primary={name} secondary={<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{role}</span>} />
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}><MenuItem onClick={logOut}>Logout</MenuItem></Menu>
                </Toolbar>
            </AppBar>
            <Hidden mdUp><Drawer variant="temporary" anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)} classes={{ paper: classes.drawerPaper }} ModalProps={{ keepMounted: true }}>{drawer}</Drawer></Hidden>
            <Hidden smDown><Drawer variant="persistent" open={drawerOpen} anchor="left" classes={{ paper: classes.drawerPaper }}>{drawer}</Drawer></Hidden>
            <main className={`${classes.content} ${drawerOpen ? classes.contentShift : ''}`}>
                <div className={classes.toolbar} />
                {pageName === 'Tools' && <ToolsPage />}
                {pageName === 'Consumables' && <ConsumablesPage />}
                {pageName === 'Borrowed / Returned' && <RecordsPage />}
                {pageName === 'Tool Forms' && <ToolFormsPage />}
                {pageName === 'Consumable Forms' && <ConsumableFormsPage />}
                {pageName === 'Machine Parts' && <SparePartsPage />}
                {pageName === 'Work Orders' && <WorkflowBoard {...workOrderConfig} />}
                {pageName === 'Preventive Maintenance' && <WorkflowBoard {...pmConfig} />}
            </main>
        </div>
    );
}

export default MaintenanceModule;
