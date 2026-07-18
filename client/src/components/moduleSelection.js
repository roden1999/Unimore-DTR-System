import React, { useState, useEffect, useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
    Card, CardActionArea, CardContent, Typography, Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions, Button, IconButton, Menu, MenuItem
} from '@material-ui/core';
import { PeopleAlt, Build, AccountCircle } from '@material-ui/icons';
import UserContext from './context/userContext';

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topBar: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        color: 'white',
    },
    heading: {
        color: 'white',
        marginBottom: 8,
        fontWeight: 600,
        textAlign: 'center',
    },
    sub: {
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 40,
        textAlign: 'center',
    },
    cards: {
        display: 'flex',
        gap: 32,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    card: {
        width: 260,
        height: 220,
        borderRadius: 16,
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
    },
    cardArea: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
    },
    icon: {
        fontSize: 64,
        marginBottom: 16,
    },
    hrIcon: { color: '#4F73FF' },
    toolIcon: { color: '#F5A623' },
    cardTitle: { fontWeight: 600 },
    cardDesc: { color: '#7A7A7A', marginTop: 8, fontSize: 13 },
}));

function ModuleSelection({ onSelectHR }) {
    const classes = useStyles();
    const { setUserData } = useContext(UserContext);

    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [anchorEl, setAnchorEl] = useState(null);
    const [underConstruction, setUnderConstruction] = useState(false);

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (user) {
            setRole(user.role);
            setName(user.Name);
        }
    }, []);

    const logOut = () => {
        setUserData({ token: undefined, user: undefined });
        sessionStorage.clear();
    };

    return (
        <div className={classes.root}>
            <div className={classes.topBar}>
                <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
                    <AccountCircle />
                    <div style={{ marginLeft: 8, textAlign: 'left' }}>
                        <div style={{ fontSize: 14 }}>{name}</div>
                        <div style={{ fontSize: 11, color: '#E0E0E0' }}>{role}</div>
                    </div>
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                    <MenuItem onClick={logOut}>Logout</MenuItem>
                </Menu>
            </div>

            <Typography variant="h4" className={classes.heading}>Welcome to Unimore</Typography>
            <Typography variant="subtitle1" className={classes.sub}>Select a module to continue</Typography>

            <div className={classes.cards}>
                <Card className={classes.card}>
                    <CardActionArea className={classes.cardArea} onClick={onSelectHR}>
                        <CardContent style={{ textAlign: 'center' }}>
                            <PeopleAlt className={`${classes.icon} ${classes.hrIcon}`} />
                            <Typography variant="h6" className={classes.cardTitle}>HR Module</Typography>
                            <Typography className={classes.cardDesc}>
                                Employees, departments, time logs, DTR, payroll &amp; shift scheduling
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>

                <Card className={classes.card}>
                    <CardActionArea className={classes.cardArea} onClick={() => setUnderConstruction(true)}>
                        <CardContent style={{ textAlign: 'center' }}>
                            <Build className={`${classes.icon} ${classes.toolIcon}`} />
                            <Typography variant="h6" className={classes.cardTitle}>Tools &amp; Consumables Inventory</Typography>
                            <Typography className={classes.cardDesc}>
                                Track tools and consumable materials
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>
            </div>

            <Dialog open={underConstruction} onClose={() => setUnderConstruction(false)}>
                <DialogTitle style={{ textAlign: 'center' }}>
                    <Build style={{ fontSize: 48, color: '#F5A623', display: 'block', margin: '0 auto 8px' }} />
                    Under Construction
                </DialogTitle>
                <DialogContent>
                    <DialogContentText style={{ textAlign: 'center' }}>
                        The Tools &amp; Consumables Inventory module is not available yet.<br />Please check back soon.
                    </DialogContentText>
                </DialogContent>
                <DialogActions style={{ justifyContent: 'center', paddingBottom: 16 }}>
                    <Button onClick={() => setUnderConstruction(false)} variant="contained" color="primary">OK</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default ModuleSelection;
