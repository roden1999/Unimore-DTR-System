import React, { useState, useEffect, useContext } from 'react';
import {
    AppBar, CssBaseline, IconButton, Menu, MenuItem, Toolbar, Typography,
    Avatar, Badge, ListItemText, Tooltip
} from '@material-ui/core';
import { AccountCircle, Home } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';

import SparePartsPage from './SparePartsPage';
import UserContext from '../context/userContext';

const useStyles = makeStyles((theme) => ({
    root: { display: 'flex' },
    appBar: { zIndex: theme.zIndex.drawer + 1 },
    toolbar: theme.mixins.toolbar,
    content: { flexGrow: 1, padding: theme.spacing(3), backgroundColor: '#F4F6FB', minHeight: '100vh' },
    userAvatar: { width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 15, fontWeight: 600 },
    customBadge: { backgroundColor: '#1AEC02', color: 'white' },
}));

function MachinePartsModule({ onExitModule }) {
    const classes = useStyles();
    const { setUserData } = useContext(UserContext);
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        setRole(user?.role || '');
        setName(user?.Name || '');
    }, []);

    const logOut = () => { setUserData({ token: undefined, user: undefined }); sessionStorage.clear(); };

    return (
        <div className={classes.root}>
            <CssBaseline />
            <AppBar position="fixed" className={classes.appBar}>
                <Toolbar>
                    <img src="/unimore-logo.png" alt="" height="36" style={{ marginRight: 12 }} />
                    <Typography variant="h6" style={{ flexGrow: 1 }}>Machine Parts</Typography>
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

            <main className={classes.content}>
                <div className={classes.toolbar} />
                <SparePartsPage />
            </main>
        </div>
    );
}

export default MachinePartsModule;
