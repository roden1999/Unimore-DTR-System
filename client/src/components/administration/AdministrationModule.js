import React, { useContext, useEffect, useState } from 'react';
import {
    AppBar, Avatar, CssBaseline, Divider, Drawer, Hidden, IconButton, List,
    ListItem, ListItemIcon, ListItemText, Menu, MenuItem, Toolbar, Tooltip, Typography
} from '@material-ui/core';
import { AccountCircle, Dashboard, Home, Security } from '@material-ui/icons';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles } from '@material-ui/core/styles';
import AccessDashboard from './AccessDashboard';
import UserAccounts from './UserAccounts';
import NotificationBell from '../common/NotificationBell';
import UserContext from '../context/userContext';

const drawerWidth = 250;
const useStyles = makeStyles(theme => ({
    root: { display: 'flex' },
    appBar: { zIndex: theme.zIndex.drawer + 1 },
    appBarShift: { marginLeft: drawerWidth, width: `calc(100% - ${drawerWidth}px)` },
    drawerPaper: { width: drawerWidth, backgroundColor: theme.palette.background.paper },
    toolbar: theme.mixins.toolbar,
    content: { flexGrow: 1, minWidth: 0, padding: theme.spacing(3), background: theme.palette.background.default, minHeight: '100vh' },
    contentShift: { marginLeft: drawerWidth },
    navItem: { margin: '4px 12px', borderRadius: 10, color: theme.palette.text.secondary, '& .MuiListItemIcon-root': { minWidth: 40, color: theme.palette.text.secondary } },
    active: { background: 'rgba(99,102,241,.13)', color: '#6366F1', '& .MuiListItemIcon-root': { color: '#6366F1' }, '& .MuiListItemText-primary': { fontWeight: 700 } },
    avatar: { width: 34, height: 34, background: 'rgba(255,255,255,.25)' },
}));

const pages = {
    '/administration/dashboard': ['Access Dashboard', <Dashboard />],
    '/administration/accounts': ['Employee Accounts', <Security />],
};

export default function AdministrationModule({ path, navigate, onExitModule }) {
    const classes = useStyles();
    const { setUserData } = useContext(UserContext);
    const [mobile, setMobile] = useState(false);
    const [drawer, setDrawer] = useState(true);
    const [anchor, setAnchor] = useState(null);
    const [user, setUser] = useState({});
    const page = pages[path] || pages['/administration/dashboard'];

    useEffect(() => setUser(JSON.parse(sessionStorage.getItem('user')) || {}), []);
    const go = to => { navigate(to); if (window.innerWidth < 960) setMobile(false); };
    const logout = () => { sessionStorage.clear(); setUserData({ token: undefined, user: undefined }); };

    const drawerContent = <>
        <div className={classes.toolbar} style={{ display: 'grid', placeItems: 'center' }}>
            <img src="/unimore-logo-landscape.png" width="190" height="56" alt="" style={{ objectFit: 'contain' }} />
        </div>
        <Divider />
        <Typography variant="caption" style={{ padding: '16px 20px 4px', display: 'block', color: '#9CA3AF', letterSpacing: 1 }}>
            IDENTITY & ACCESS
        </Typography>
        <List>{Object.entries(pages).map(([route, value]) => <ListItem button key={route} onClick={() => go(route)} className={`${classes.navItem} ${path === route ? classes.active : ''}`}>
            <ListItemIcon>{value[1]}</ListItemIcon><ListItemText primary={value[0]} />
        </ListItem>)}</List>
    </>;

    return <div className={classes.root}>
        <CssBaseline />
        <AppBar position="fixed" className={drawer ? classes.appBarShift : classes.appBar}>
            <Toolbar>
                <IconButton color="inherit" edge="start" onClick={() => window.innerWidth < 960 ? setMobile(!mobile) : setDrawer(!drawer)}><MenuIcon /></IconButton>
                <Typography variant="h6" style={{ flexGrow: 1, marginLeft: 12 }}>{page[0]}</Typography>
                <NotificationBell navigate={navigate} />
                <Tooltip title="Back to Modules"><IconButton color="inherit" onClick={onExitModule}><Home /></IconButton></Tooltip>
                <IconButton color="inherit" onClick={e => setAnchor(e.currentTarget)}>
                    <Avatar className={classes.avatar}>{user.Name?.charAt(0) || <AccountCircle />}</Avatar>
                    <ListItemText style={{ marginLeft: 10 }} primary={user.Name} secondary={<span style={{ color: 'rgba(255,255,255,.75)', fontSize: 12 }}>{user.role}</span>} />
                </IconButton>
                <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}><MenuItem onClick={logout}>Logout</MenuItem></Menu>
            </Toolbar>
        </AppBar>
        <Hidden mdUp><Drawer variant="temporary" open={mobile} onClose={() => setMobile(false)} classes={{ paper: classes.drawerPaper }} ModalProps={{ keepMounted: true }}>{drawerContent}</Drawer></Hidden>
        <Hidden smDown><Drawer variant="persistent" open={drawer} classes={{ paper: classes.drawerPaper }}>{drawerContent}</Drawer></Hidden>
        <main className={`${classes.content} ${drawer ? classes.contentShift : ''}`}>
            <div className={classes.toolbar} />
            {path === '/administration/accounts' ? <UserAccounts /> : <AccessDashboard navigate={navigate} />}
        </main>
    </div>;
}
