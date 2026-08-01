import React, { useState, useEffect, useContext } from 'react';
import {
    AppBar, CssBaseline, Divider, Drawer, IconButton, Menu, MenuItem, List, ListItem,
    ListItemIcon, ListItemText, Collapse, Toolbar, Typography, Hidden, Tooltip, Avatar,
    Badge, Fab
} from '@material-ui/core';
import {
    Receipt, ExpandLess, ExpandMore, NoteAdd, ListAlt, AccountCircle, Home, Dialpad,
    Category, Adjust, DonutSmall, BarChart, Straighten, DeviceHub, History, Assignment
} from '@material-ui/icons';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles } from '@material-ui/core/styles';

import CreateDR from './CreateDR';
import DRList from './DRList';
import FloatingCalculator from './FloatingCalculator';
import CoilInventory from './CoilInventory';
import SkelpInventory from './SkelpInventory';
import GaugeChart from './GaugeChart';
import RoofLength from './RoofLength';
import UserContext from '../context/userContext';
import NotificationBell from '../common/NotificationBell';
import WorkflowBoard from '../workflows/WorkflowBoard';
import { traceabilityConfig } from '../workflows/workflowConfigs';
import CalculationHistory from './CalculationHistory';
import SalesJobOrders from './SalesJobOrders';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
    root: { display: 'flex' },
    appBar: { zIndex: theme.zIndex.drawer + 1 },
    appBarShift: { marginLeft: drawerWidth, width: `calc(100% - ${drawerWidth}px)` },
    menuButton: { marginRight: theme.spacing(2) },
    drawerPaper: { width: drawerWidth, backgroundColor: theme.palette.background.paper },
    toolbar: theme.mixins.toolbar,
    content: { flexGrow: 1, minWidth: 0, padding: theme.spacing(3), backgroundColor: theme.palette.background.default, minHeight: '100vh', marginLeft: 0, transition: 'margin .3s' },
    contentShift: { marginLeft: drawerWidth },
    navItem: { margin: '4px 12px', borderRadius: 10, color: theme.palette.text.secondary, '& .MuiListItemIcon-root': { minWidth: 40, color: theme.palette.text.secondary } },
    subItem: { paddingLeft: 40, margin: '2px 12px', borderRadius: 10, color: theme.palette.text.secondary },
    navItemActive: {
        backgroundColor: 'rgba(245,158,11,0.14)', color: '#B45309',
        '& .MuiListItemIcon-root': { color: '#F59E0B' },
        '& .MuiListItemText-primary': { fontWeight: 600 },
    },
    userAvatar: { width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 15, fontWeight: 600 },
    customBadge: { backgroundColor: '#1AEC02', color: 'white' },
    calcFab: { position: 'fixed', bottom: 24, right: 24, zIndex: 1200 },
}));

const PATH_TO_PAGE = {
    '/production/create-dr': 'Create DR',
    '/production/dr-list': 'DR List',
    '/production/inventory/coil': 'Coil Inventory',
    '/production/inventory/skelp': 'Skelp Inventory',
    '/production/gauge-chart': 'Gauge Chart',
    '/production/roof-length': 'Roof Length',
    '/production/traceability': 'Traceability',
    '/production/calculation-history': 'Calculation History',
    '/production/job-orders': 'Customer Job Orders',
};

function ProductionModule({ path, navigate, onExitModule }) {
    const classes = useStyles();
    const { setUserData } = useContext(UserContext);

    const [mobileOpen, setMobileOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [drOpen, setDrOpen] = useState(true);
    const [inventoryOpen, setInventoryOpen] = useState(path.startsWith('/production/inventory'));
    const [calcOpen, setCalcOpen] = useState(false);

    const pageName = PATH_TO_PAGE[path] || 'Create DR';

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        setRole(user?.role || '');
        setName(user?.Name || '');
    }, []);

    const safeWindow = (typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 1024;
    const go = (to) => { navigate(to); if (safeWindow < 960) setMobileOpen(false); };
    const logOut = () => { setUserData({ token: undefined, user: undefined }); sessionStorage.clear(); };

    const subActive = (p) => `${classes.subItem} ${path === p ? classes.navItemActive : ''}`;

    const drawer = (
        <div>
            <div className={classes.toolbar} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img src="/unimore-logo-landscape.png" width="190" height="56" alt="" style={{ objectFit: 'contain' }} />
            </div>
            <Divider />
            <Typography variant="caption" style={{ padding: '16px 20px 4px', display: 'block', color: '#9CA3AF', letterSpacing: 1 }}>
                PRODUCTION
            </Typography>
            <List>
                <ListItem button className={`${classes.navItem} ${path === '/production/job-orders' ? classes.navItemActive : ''}`} onClick={() => go('/production/job-orders')}>
                    <ListItemIcon><Assignment /></ListItemIcon><ListItemText primary="Customer Job Orders" />
                </ListItem>
                <ListItem button className={classes.navItem} onClick={() => setDrOpen((o) => !o)}>
                    <ListItemIcon><Receipt /></ListItemIcon>
                    <ListItemText primary="Daily Receipt" />
                    {drOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={drOpen} timeout="auto" unmountOnExit>
                    <List disablePadding>
                        <ListItem button className={subActive('/production/create-dr')} onClick={() => go('/production/create-dr')}>
                            <ListItemIcon><NoteAdd /></ListItemIcon>
                            <ListItemText primary="Create DR" />
                        </ListItem>
                        <ListItem button className={subActive('/production/dr-list')} onClick={() => go('/production/dr-list')}>
                            <ListItemIcon><ListAlt /></ListItemIcon>
                            <ListItemText primary="DR List" />
                        </ListItem>
                    </List>
                </Collapse>
                <ListItem button className={classes.navItem} onClick={() => setInventoryOpen((open) => !open)}>
                    <ListItemIcon><Category /></ListItemIcon>
                    <ListItemText primary="Inventory" />
                    {inventoryOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={inventoryOpen} timeout="auto" unmountOnExit>
                    <List disablePadding>
                        <ListItem button className={subActive('/production/inventory/coil')} onClick={() => go('/production/inventory/coil')}>
                            <ListItemIcon><Adjust /></ListItemIcon>
                            <ListItemText primary="Coil" />
                        </ListItem>
                        <ListItem button className={subActive('/production/inventory/skelp')} onClick={() => go('/production/inventory/skelp')}>
                            <ListItemIcon><DonutSmall /></ListItemIcon>
                            <ListItemText primary="Skelp" />
                        </ListItem>
                    </List>
                </Collapse>
                <ListItem button className={`${classes.navItem} ${path === '/production/gauge-chart' ? classes.navItemActive : ''}`} onClick={() => go('/production/gauge-chart')}>
                    <ListItemIcon><BarChart /></ListItemIcon>
                    <ListItemText primary="Gauge Chart" />
                </ListItem>
                <ListItem button className={`${classes.navItem} ${path === '/production/roof-length' ? classes.navItemActive : ''}`} onClick={() => go('/production/roof-length')}>
                    <ListItemIcon><Straighten /></ListItemIcon>
                    <ListItemText primary="Roof Length" />
                </ListItem>
                <ListItem button className={`${classes.navItem} ${path === '/production/traceability' ? classes.navItemActive : ''}`} onClick={() => go('/production/traceability')}><ListItemIcon><DeviceHub /></ListItemIcon><ListItemText primary="Traceability" /></ListItem>
                <ListItem button className={`${classes.navItem} ${path === '/production/calculation-history' ? classes.navItemActive : ''}`} onClick={() => go('/production/calculation-history')}><ListItemIcon><History /></ListItemIcon><ListItemText primary="Calculation History" /></ListItem>
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
                    <NotificationBell navigate={navigate} />
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
                {pageName === 'Create DR' && <CreateDR />}
                {pageName === 'DR List' && <DRList />}
                {pageName === 'Coil Inventory' && <CoilInventory />}
                {pageName === 'Skelp Inventory' && <SkelpInventory />}
                {pageName === 'Gauge Chart' && <GaugeChart />}
                {pageName === 'Roof Length' && <RoofLength />}
                {pageName === 'Traceability' && <WorkflowBoard {...traceabilityConfig} />}
                {pageName === 'Calculation History' && <CalculationHistory />}
                {pageName === 'Customer Job Orders' && <SalesJobOrders />}
            </main>

            {/* Floating calculator — persists while inside Production */}
            {!calcOpen &&
                <Tooltip title="Calculator">
                    <Fab color="primary" size="medium" className={classes.calcFab} onClick={() => setCalcOpen(true)}>
                        <Dialpad />
                    </Fab>
                </Tooltip>}
            {calcOpen && <FloatingCalculator onClose={() => setCalcOpen(false)} />}
        </div>
    );
}

export default ProductionModule;
