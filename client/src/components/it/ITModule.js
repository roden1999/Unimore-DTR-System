import React, { useContext, useEffect, useState } from 'react';
import {
    AppBar, Avatar, Collapse, CssBaseline, Divider, Drawer, Hidden, IconButton,
    List, ListItem, ListItemIcon, ListItemText, Menu, MenuItem, Toolbar, Tooltip, Typography
} from '@material-ui/core';
import {
    AccountCircle, Dashboard, DesktopWindows, DevicesOther, ExpandLess, ExpandMore,
    Fingerprint, Home, Keyboard, Laptop, Router, Storage, Videocam
} from '@material-ui/icons';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles } from '@material-ui/core/styles';
import ITDashboard from './ITDashboard';
import ITAssetInventory from './ITAssetInventory';
import BiometricLogs from './BiometricLogs';
import NotificationBell from '../common/NotificationBell';
import UserContext from '../context/userContext';

const drawerWidth = 250;
const useStyles = makeStyles(theme => ({
    root: { display: 'flex' }, appBar: { zIndex: theme.zIndex.drawer + 1 },
    appBarShift: { marginLeft: drawerWidth, width: `calc(100% - ${drawerWidth}px)` },
    drawerPaper: { width: drawerWidth, backgroundColor: theme.palette.background.paper }, toolbar: theme.mixins.toolbar,
    content: { flexGrow: 1, minWidth: 0, padding: theme.spacing(3), background: theme.palette.background.default, minHeight: '100vh' },
    contentShift: { marginLeft: drawerWidth },
    navItem: { margin: '4px 12px', borderRadius: 10, color: theme.palette.text.secondary, '& .MuiListItemIcon-root': { minWidth: 40, color: theme.palette.text.secondary } },
    subItem: { paddingLeft: 38, margin: '2px 12px', borderRadius: 10, color: theme.palette.text.secondary, '& .MuiListItemIcon-root': { minWidth: 36 } },
    active: { background: 'rgba(37,99,235,.12)', color: '#2563EB', '& .MuiListItemIcon-root': { color: '#2563EB' }, '& .MuiListItemText-primary': { fontWeight: 700 } },
    avatar: { width: 34, height: 34, background: 'rgba(255,255,255,.25)' },
}));
const ASSET_ROUTES = {
    '/it/assets': ['', 'All Assets', <Storage />], '/it/assets/desktops': ['Desktop PC', 'Desktop PCs', <DesktopWindows />],
    '/it/assets/laptops': ['Laptop', 'Laptops', <Laptop />], '/it/assets/peripherals': ['Peripheral', 'Peripherals', <Keyboard />],
    '/it/assets/cctv': ['CCTV Camera', 'CCTV Cameras', <Videocam />], '/it/assets/network': ['Router & Network', 'Network Equipment', <Router />],
    '/it/assets/other': ['Other', 'Other Assets', <DevicesOther />],
};
export default function ITModule({ path, navigate, onExitModule }) {
    const classes = useStyles(); const { setUserData } = useContext(UserContext);
    const [mobile, setMobile] = useState(false); const [drawer, setDrawer] = useState(true); const [inventoryOpen, setInventoryOpen] = useState(path.startsWith('/it/assets')); const [anchor, setAnchor] = useState(null); const [user, setUser] = useState({});
    useEffect(() => setUser(JSON.parse(sessionStorage.getItem('user')) || {}), []);
    const assetRoute = ASSET_ROUTES[path]; const pageName = path === '/it/dashboard' ? 'IT Dashboard' : path === '/it/biometric-logs' ? 'NIDEKA NU32 Logs' : assetRoute?.[1] || 'IT Dashboard';
    const go = to => { navigate(to); if (window.innerWidth < 960) setMobile(false); };
    const logout = () => { sessionStorage.clear(); setUserData({ token: undefined, user: undefined }); };
    const drawerContent = <><div className={classes.toolbar} style={{ display: 'grid', placeItems: 'center' }}><img src="/unimore-logo-landscape.png" width="190" height="56" alt="" style={{ objectFit: 'contain' }} /></div><Divider /><Typography variant="caption" style={{ padding: '16px 20px 4px', display: 'block', color: '#9CA3AF', letterSpacing: 1 }}>IT ASSET MANAGEMENT</Typography><List>
        <ListItem button onClick={() => go('/it/dashboard')} className={`${classes.navItem} ${path === '/it/dashboard' ? classes.active : ''}`}><ListItemIcon><Dashboard /></ListItemIcon><ListItemText primary="Dashboard" /></ListItem>
        <ListItem button onClick={() => setInventoryOpen(!inventoryOpen)} className={classes.navItem}><ListItemIcon><Storage /></ListItemIcon><ListItemText primary="Asset Inventory" />{inventoryOpen ? <ExpandLess /> : <ExpandMore />}</ListItem>
        <Collapse in={inventoryOpen} timeout="auto" unmountOnExit><List disablePadding>{Object.entries(ASSET_ROUTES).map(([route, item]) => <ListItem button key={route} onClick={() => go(route)} className={`${classes.subItem} ${path === route ? classes.active : ''}`}><ListItemIcon>{item[2]}</ListItemIcon><ListItemText primary={item[1]} /></ListItem>)}</List></Collapse>
        <ListItem button onClick={() => go('/it/biometric-logs')} className={`${classes.navItem} ${path === '/it/biometric-logs' ? classes.active : ''}`}><ListItemIcon><Fingerprint /></ListItemIcon><ListItemText primary="NIDEKA NU32 Logs" /></ListItem>
    </List></>;
    return <div className={classes.root}><CssBaseline /><AppBar position="fixed" className={drawer ? classes.appBarShift : classes.appBar}><Toolbar><IconButton color="inherit" edge="start" onClick={() => window.innerWidth < 960 ? setMobile(!mobile) : setDrawer(!drawer)}><MenuIcon /></IconButton><Typography variant="h6" style={{ flexGrow: 1, marginLeft: 12 }}>{pageName}</Typography><NotificationBell navigate={navigate} /><Tooltip title="Back to Modules"><IconButton color="inherit" onClick={onExitModule}><Home /></IconButton></Tooltip><IconButton color="inherit" onClick={e => setAnchor(e.currentTarget)}><Avatar className={classes.avatar}>{user.Name?.charAt(0) || <AccountCircle />}</Avatar><ListItemText style={{ marginLeft: 10 }} primary={user.Name} secondary={<span style={{ color: 'rgba(255,255,255,.75)', fontSize: 12 }}>{user.role}</span>} /></IconButton><Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}><MenuItem onClick={logout}>Logout</MenuItem></Menu></Toolbar></AppBar>
        <Hidden mdUp><Drawer variant="temporary" open={mobile} onClose={() => setMobile(false)} classes={{ paper: classes.drawerPaper }} ModalProps={{ keepMounted: true }}>{drawerContent}</Drawer></Hidden><Hidden smDown><Drawer variant="persistent" open={drawer} classes={{ paper: classes.drawerPaper }}>{drawerContent}</Drawer></Hidden>
        <main className={`${classes.content} ${drawer ? classes.contentShift : ''}`}><div className={classes.toolbar} />{path === '/it/dashboard' && <ITDashboard />}{assetRoute && <ITAssetInventory initialCategory={assetRoute[0]} />}{path === '/it/biometric-logs' && <BiometricLogs />}{!assetRoute && !['/it/dashboard','/it/biometric-logs'].includes(path) && <ITDashboard />}</main>
    </div>;
}
