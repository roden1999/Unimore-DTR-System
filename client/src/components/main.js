import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import {
    AppBar, CssBaseline, Divider, Drawer, IconButton,
    Menu, MenuItem, List, ListItem, ListItemIcon, ListItemText,
    Badge, Toolbar, Typography, useTheme, Hidden, Tooltip, Avatar
} from '@material-ui/core';
import {
    PeopleAlt, HomeWork, EventNote,
    Today, AccountCircle, Schedule, AssignmentInd, Home, Dashboard, FlightTakeoff, AccessTime, AssignmentTurnedIn,
} from '@material-ui/icons';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles } from '@material-ui/core/styles';

import Employee from "./employee";
import Department from "./department";
import TimeLogs from "./timeLogs";
import HolidaySchedule from "./holidaySchedule";
import Shifts from "./shifts";
import ShiftAssignment from "./shiftAssignment";
import HRDashboard from './hr/HRDashboard';
import UserContext from './context/userContext';
import NotificationBell from './common/NotificationBell';
import WorkflowBoard from './workflows/WorkflowBoard';
import { leaveConfig, overtimeConfig } from './workflows/workflowConfigs';
import ApprovalCenter from './management/ApprovalCenter';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
    root: { display: 'flex' },

    appBar: {
        zIndex: theme.zIndex.drawer + 1,
    },
    appBarShift: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`
    },

    menuButton: { marginRight: theme.spacing(2) },

    drawerPaper: { width: drawerWidth, backgroundColor: theme.palette.background.paper },

    toolbar: theme.mixins.toolbar,

    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
        marginLeft: 0,
        transition: "margin .3s",
    },
    contentShift: {
        marginLeft: drawerWidth,
    },

    customBadge: { backgroundColor: "#1AEC02", color: "white" },

    navItem: {
        margin: '4px 12px',
        borderRadius: 10,
        color: theme.palette.text.secondary,
        '& .MuiListItemIcon-root': { minWidth: 40, color: theme.palette.text.secondary },
    },
    navItemActive: {
        backgroundColor: 'rgba(79,115,255,0.10)',
        color: '#3454D1',
        fontWeight: 600,
        '& .MuiListItemIcon-root': { color: '#4F73FF' },
        '& .MuiListItemText-primary': { fontWeight: 600 },
    },
    userAvatar: {
        width: 34, height: 34,
        backgroundColor: 'rgba(255,255,255,0.25)',
        color: '#fff', fontSize: 15, fontWeight: 600,
    },
    logo: { objectFit: 'contain' },
}));

// Map between browser routes and page labels.
const PATH_TO_PAGE = {
    '/dashboard': 'Dashboard',
    '/employee': 'Employee',
    '/department': 'Department',
    '/timelogs': 'Time Logs',
    '/holiday': 'Holiday Schedule',
    '/shifts': 'Shifts',
    '/shift-assignment': 'Shift Assignment',
    '/leave-requests': 'Leave Requests',
    '/overtime-requests': 'Overtime Requests',
    '/hr/approvals': 'HR Approvals',
};

function Main(props) {
    const { window, onExitModule, path, navigate } = props;
    const classes = useStyles();
    const theme = useTheme();
    const { setUserData } = useContext(UserContext);

    const [mobileOpen, setMobileOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [anchorEl, setAnchorEl] = useState(null);

    const pageName = PATH_TO_PAGE[path] || 'Employee'; // page is driven by the URL

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        setRole(user.role);
        setName(user.Name);
    }, []);

    const safeWindow = (typeof window !== "undefined" && window.innerWidth) 
    ? window.innerWidth 
    : 1024;


    const toggleDesktopDrawer = () => setDrawerOpen(!drawerOpen);
    const toggleMobileDrawer = () => setMobileOpen(!mobileOpen);

    const logOut = () => {
        setUserData({ token: undefined, user: undefined });
        sessionStorage.clear();
    };

    const navItems = [
        { label: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
        { label: "Employee", path: "/employee", icon: <PeopleAlt /> },
        { label: "Department", path: "/department", icon: <HomeWork /> },
        { label: "Time Logs", path: "/timelogs", icon: <EventNote /> },
        { label: "Holiday Schedule", path: "/holiday", icon: <Today /> },
        { label: "Shifts", path: "/shifts", icon: <Schedule /> },
        { label: "Shift Assignment", path: "/shift-assignment", icon: <AssignmentInd /> },
        { label: "Leave Requests", path: "/leave-requests", icon: <FlightTakeoff /> },
        { label: "Overtime Requests", path: "/overtime-requests", icon: <AccessTime /> },
    ];
    if (role === "HR" || role === "Administrator") navItems.push({ label: "HR Approvals", path: "/hr/approvals", icon: <AssignmentTurnedIn /> });

    const go = (to) => {
        navigate(to);
        if (safeWindow < 960) setMobileOpen(false);
    };

    const drawer = (
        <div>
            <div className={classes.toolbar} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img src="/unimore-logo-landscape.png" width='190' height='56' alt="" className={classes.logo} />
            </div>

            <Divider />

            <Typography variant="caption" style={{ padding: '16px 20px 4px', display: 'block', color: '#9CA3AF', letterSpacing: 1 }}>
                HR MODULE
            </Typography>

            <List>
                {navItems.map((item) => (
                    <ListItem
                        button
                        key={item.label}
                        onClick={() => go(item.path)}
                        className={`${classes.navItem} ${path === item.path ? classes.navItemActive : ""}`}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} />
                    </ListItem>
                ))}
            </List>
        </div>
    );

    const container = window !== undefined ? () => window().document.body : undefined;

    return (
        <div className={classes.root}>
            <CssBaseline />

            <AppBar
                position="fixed"
                className={drawerOpen ? classes.appBarShift : classes.appBar}
            >
                <Toolbar>

                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => {
                            if (safeWindow < 960) toggleMobileDrawer();
                            else toggleDesktopDrawer();
                        }}
                        className={classes.menuButton}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography variant="h6" style={{ flexGrow: 1 }}>
                        {pageName}
                    </Typography>

                    <Tooltip title="Back to Modules">
                        <IconButton color="inherit" onClick={() => onExitModule && onExitModule()}>
                            <Home />
                        </IconButton>
                    </Tooltip>

                    <NotificationBell navigate={navigate} />

                    <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <Badge variant="dot" color="secondary" classes={{ badge: classes.customBadge }}>
                            <Avatar className={classes.userAvatar}>
                                {name ? name.charAt(0).toUpperCase() : <AccountCircle />}
                            </Avatar>
                        </Badge>
                        <ListItemText style={{ marginLeft: 10 }} primary={name}
                            secondary={<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{role}</span>}
                        />
                    </IconButton>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                    >
                        <MenuItem onClick={logOut}>Logout</MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Mobile drawer */}
            <Hidden mdUp>
                <Drawer
                    container={container}
                    variant="temporary"
                    anchor="left"
                    open={mobileOpen}
                    onClose={toggleMobileDrawer}
                    classes={{ paper: classes.drawerPaper }}
                    ModalProps={{ keepMounted: true }}
                >
                    {drawer}
                </Drawer>
            </Hidden>

            {/* Desktop drawer */}
            <Hidden smDown>
                <Drawer
                    variant="persistent"
                    open={drawerOpen}
                    anchor="left"
                    classes={{ paper: classes.drawerPaper }}
                >
                    {drawer}
                </Drawer>
            </Hidden>

            {/* MAIN CONTENT */}
            <main className={`${classes.content} ${drawerOpen ? classes.contentShift : ""}`}>
                <div className={classes.toolbar} />

                {pageName === "Dashboard" && <HRDashboard />}
                {pageName === "Employee" && <Employee />}
                {pageName === "Department" && <Department />}
                {pageName === "Time Logs" && <TimeLogs />}
                {pageName === "Holiday Schedule" && <HolidaySchedule />}
                {pageName === "Shifts" && <Shifts />}
                {pageName === "Shift Assignment" && <ShiftAssignment />}
                {pageName === "Leave Requests" && <WorkflowBoard {...leaveConfig} />}
                {pageName === "Overtime Requests" && <WorkflowBoard {...overtimeConfig} />}
                {pageName === "HR Approvals" && <ApprovalCenter module="Human Resources" title="HR Approval Center" />}

            </main>
        </div>
    );
}

Main.propTypes = { window: PropTypes.func };
export default Main;
