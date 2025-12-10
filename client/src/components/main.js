import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import {
    AppBar, CssBaseline, Divider, Drawer, IconButton,
    Menu, MenuItem, List, ListItem, ListItemIcon, ListItemText,
    Badge, Toolbar, Typography, useTheme, Hidden
} from '@material-ui/core';
import {
    PeopleAlt, HomeWork, EventNote,
    Today, AccountCircle, PeopleAltSharp
} from '@material-ui/icons';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles } from '@material-ui/core/styles';

import Employee from "./employee";
import Department from "./department";
import TimeLogs from "./timeLogs";
import HolidaySchedule from "./holidaySchedule";
import User from "./user";
import UserContext from './context/userContext';

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

    drawerPaper: { width: drawerWidth },

    toolbar: theme.mixins.toolbar,

    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
        backgroundColor: '#C4C4C4C4',
        minHeight: '100vh',
        marginLeft: 0,
        transition: "margin .3s",
    },
    contentShift: {
        marginLeft: drawerWidth,
    },

    customBadge: { backgroundColor: "#1AEC02", color: "white" }
}));

function Main(props) {
    const { window } = props;
    const classes = useStyles();
    const theme = useTheme();
    const { setUserData } = useContext(UserContext);

    const [mobileOpen, setMobileOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [pageName, setPageName] = useState("Employee");
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        const data = sessionStorage.getItem('page');
        if (data) setPageName(data);

        const user = JSON.parse(sessionStorage.getItem('user'));
        setRole(user.role);
        setName(user.Name);
    }, []);

    useEffect(() => {
        sessionStorage.setItem('page', pageName);
    }, [pageName]);

    const safeWindow = (typeof window !== "undefined" && window.innerWidth) 
    ? window.innerWidth 
    : 1024;


    const toggleDesktopDrawer = () => setDrawerOpen(!drawerOpen);
    const toggleMobileDrawer = () => setMobileOpen(!mobileOpen);

    const logOut = () => {
        setUserData({ token: undefined, user: undefined });
        sessionStorage.clear();
    };

    const drawer = (
        <div>
            <div className={classes.toolbar} style={{ display: 'flex', justifyContent: 'center' }}>
                <img src="unimore-logo-landscape.png" width='200' height='60' alt="" />
            </div>

            <Divider />

            <List>
                <ListItem button onClick={() => setPageName("Employee")}>
                    <ListItemIcon><PeopleAlt /></ListItemIcon>
                    <ListItemText primary="Employee" />
                </ListItem>
                <ListItem button onClick={() => setPageName("Department")}>
                    <ListItemIcon><HomeWork /></ListItemIcon>
                    <ListItemText primary="Department" />
                </ListItem>
                <ListItem button onClick={() => setPageName("Time Logs")}>
                    <ListItemIcon><EventNote /></ListItemIcon>
                    <ListItemText primary="Time Logs" />
                </ListItem>
                <ListItem button onClick={() => setPageName("Holiday Schedule")}>
                    <ListItemIcon><Today /></ListItemIcon>
                    <ListItemText primary="Holiday Schedule" />
                </ListItem>

                {role === "Administrator" &&
                    <ListItem button onClick={() => setPageName("Users")}>
                        <ListItemIcon><PeopleAltSharp /></ListItemIcon>
                        <ListItemText primary="Users" />
                    </ListItem>
                }
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

                    <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <Badge variant="dot" color="secondary" classes={{ badge: classes.customBadge }}>
                            <AccountCircle />
                        </Badge>
                        <ListItemText style={{ marginLeft: 7 }} primary={name}
                            secondary={<span style={{ fontSize: 12, color: '#BEBFC1' }}>{role}</span>}
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

                {pageName === "Employee" && <Employee />}
                {pageName === "Department" && <Department />}
                {pageName === "Time Logs" && <TimeLogs />}
                {pageName === "Holiday Schedule" && <HolidaySchedule />}
                {pageName === "Users" && role === "Administrator" && <User />}

            </main>
        </div>
    );
}

Main.propTypes = { window: PropTypes.func };
export default Main;
