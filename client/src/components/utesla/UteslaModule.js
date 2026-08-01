import React, { useContext, useEffect, useState } from 'react';
import { AppBar, Avatar, CssBaseline, Divider, Drawer, Hidden, IconButton, List, ListItem, ListItemIcon, ListItemText, Menu, MenuItem, Toolbar, Tooltip, Typography } from '@material-ui/core';
import { AccountBalanceWallet, AccountCircle, Dashboard, Home, MonetizationOn, People, PieChart, Settings } from '@material-ui/icons';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles } from '@material-ui/core/styles';
import UteslaDashboard from './UteslaDashboard';
import UteslaMembers from './UteslaMembers';
import UteslaSavings from './UteslaSavings';
import UteslaLoans from './UteslaLoans';
import UteslaDividends from './UteslaDividends';
import UteslaSettings from './UteslaSettings';
import NotificationBell from '../common/NotificationBell';
import UserContext from '../context/userContext';

const drawerWidth = 250;
const useStyles = makeStyles(theme => ({
    root: { display: 'flex' }, appBar: { zIndex: theme.zIndex.drawer + 1 },
    appBarShift: { marginLeft: drawerWidth, width: `calc(100% - ${drawerWidth}px)` },
    drawerPaper: { width: drawerWidth, backgroundColor: theme.palette.background.paper }, toolbar: theme.mixins.toolbar,
    content: { flexGrow: 1, minWidth: 0, padding: theme.spacing(3), background: theme.palette.background.default, minHeight: '100vh' }, contentShift: { marginLeft: drawerWidth },
    navItem: { margin: '4px 12px', borderRadius: 10, color: theme.palette.text.secondary, '& .MuiListItemIcon-root': { minWidth: 40, color: theme.palette.text.secondary } },
    active: { background: 'rgba(15,118,110,.13)', color: '#0F766E', '& .MuiListItemIcon-root': { color: '#0F766E' }, '& .MuiListItemText-primary': { fontWeight: 700 } },
    avatar: { width: 34, height: 34, background: 'rgba(255,255,255,.25)' },
}));
const pages = {
    '/utesla/dashboard': ['Dashboard', <Dashboard />], '/utesla/members': ['Members', <People />],
    '/utesla/savings': ['Savings Ledger', <AccountBalanceWallet />], '/utesla/loans': ['Loans', <MonetizationOn />],
    '/utesla/dividends': ['Interest Distribution', <PieChart />], '/utesla/settings': ['Policy Settings', <Settings />],
};

export default function UteslaModule({ path, navigate, onExitModule }) {
    const classes = useStyles(), { setUserData } = useContext(UserContext);
    const [mobile, setMobile] = useState(false), [drawer, setDrawer] = useState(true), [anchor, setAnchor] = useState(null), [user, setUser] = useState({});
    const page = pages[path] || pages['/utesla/dashboard'];
    useEffect(() => setUser(JSON.parse(sessionStorage.getItem('user')) || {}), []);
    const go = route => { navigate(route); if (window.innerWidth < 960) setMobile(false); };
    const logout = () => { sessionStorage.clear(); setUserData({ token: undefined, user: undefined }); };
    const drawerContent = <><div className={classes.toolbar} style={{ display: 'grid', placeItems: 'center' }}><img src="/unimore-logo-landscape.png" width="190" height="56" alt="" style={{ objectFit: 'contain' }} /></div><Divider />
        <Typography variant="caption" style={{ padding: '16px 20px 4px', display: 'block', color: '#9CA3AF', letterSpacing: 1 }}>UTESLA COOPERATIVE</Typography>
        <List>{Object.entries(pages).map(([route, value]) => <ListItem button key={route} onClick={() => go(route)} className={`${classes.navItem} ${path === route ? classes.active : ''}`}><ListItemIcon>{value[1]}</ListItemIcon><ListItemText primary={value[0]} /></ListItem>)}</List></>;
    return <div className={classes.root}><CssBaseline /><AppBar position="fixed" className={drawer ? classes.appBarShift : classes.appBar}><Toolbar>
        <IconButton color="inherit" edge="start" onClick={() => window.innerWidth < 960 ? setMobile(!mobile) : setDrawer(!drawer)}><MenuIcon /></IconButton><Typography variant="h6" style={{ flexGrow: 1, marginLeft: 12 }}>{page[0]}</Typography>
        <NotificationBell navigate={navigate} /><Tooltip title="Back to Modules"><IconButton color="inherit" onClick={onExitModule}><Home /></IconButton></Tooltip>
        <IconButton color="inherit" onClick={event => setAnchor(event.currentTarget)}><Avatar className={classes.avatar}>{user.Name?.charAt(0) || <AccountCircle />}</Avatar><ListItemText style={{ marginLeft: 10 }} primary={user.Name} secondary={<span style={{ color: 'rgba(255,255,255,.75)', fontSize: 12 }}>{user.role}</span>} /></IconButton>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}><MenuItem onClick={logout}>Logout</MenuItem></Menu>
    </Toolbar></AppBar><Hidden mdUp><Drawer variant="temporary" open={mobile} onClose={() => setMobile(false)} classes={{ paper: classes.drawerPaper }} ModalProps={{ keepMounted: true }}>{drawerContent}</Drawer></Hidden><Hidden smDown><Drawer variant="persistent" open={drawer} classes={{ paper: classes.drawerPaper }}>{drawerContent}</Drawer></Hidden>
        <main className={`${classes.content} ${drawer ? classes.contentShift : ''}`}><div className={classes.toolbar} />
            {path === '/utesla/dashboard' && <UteslaDashboard navigate={navigate} />}{path === '/utesla/members' && <UteslaMembers />}{path === '/utesla/savings' && <UteslaSavings />}{path === '/utesla/loans' && <UteslaLoans />}{path === '/utesla/dividends' && <UteslaDividends />}{path === '/utesla/settings' && <UteslaSettings />}
            {!pages[path] && <UteslaDashboard navigate={navigate} />}
        </main></div>;
}
