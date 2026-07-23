import React, { useState, useEffect, useContext } from 'react';
import {
    AppBar, CssBaseline, Divider, Drawer, IconButton, Menu, MenuItem, List, ListItem,
    ListItemIcon, ListItemText, Collapse, Toolbar, Typography, Hidden, Tooltip, Avatar,
    Badge, Fab
} from '@material-ui/core';
import {
    Receipt, ExpandLess, ExpandMore, NoteAdd, ListAlt, AccountCircle, Home, Dialpad
} from '@material-ui/icons';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles } from '@material-ui/core/styles';

import CreateDR from './CreateDR';
import DRList from './DRList';
import FloatingCalculator from './FloatingCalculator';
import UserContext from '../context/userContext';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
    root: { display: 'flex' },
    appBar: { zIndex: theme.zIndex.drawer + 1 },
    appBarShift: { marginLeft: drawerWidth, width: `calc(100% - ${drawerWidth}px)` },
    menuButton: { marginRight: theme.spacing(2) },
    drawerPaper: { width: drawerWidth, backgroundColor: '#FFFFFF' },
    toolbar: theme.mixins.toolbar,
    content: { flexGrow: 1, padding: theme.spacing(3), backgroundColor: '#F4F6FB', minHeight: '100vh', marginLeft: 0, transition: 'margin .3s' },
    contentShift: { marginLeft: drawerWidth },
    navItem: { margin: '4px 12px', borderRadius: 10, color: '#4B5563', '& .MuiListItemIcon-root': { minWidth: 40, color: '#6B7280' } },
    subItem: { paddingLeft: 40, margin: '2px 12px', borderRadius: 10, color: '#4B5563' },
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
                {pageName === 'Create DR' && <CreateDR />}
                {pageName === 'DR List' && <DRList />}
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
