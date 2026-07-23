import React, { useState, useEffect, useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
    Card, CardActionArea, Typography, Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions, Button, IconButton, Menu, MenuItem, Avatar
} from '@material-ui/core';
import {
    People, Category, Settings, Receipt, Dashboard, Build, ExitToApp
} from '@material-ui/icons';
import UserContext from './context/userContext';

const useStyles = makeStyles(() => ({
    root: {
        width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box',
    },
    topBar: {
        position: 'absolute', top: 0, right: 0, padding: 16,
        display: 'flex', alignItems: 'center', color: 'white',
    },
    heading: { color: 'white', fontWeight: 700, textAlign: 'center', letterSpacing: 0.3 },
    sub: { color: 'rgba(255,255,255,0.85)', marginBottom: 36, textAlign: 'center' },
    grid: {
        display: 'grid', gap: 20, width: '100%', maxWidth: 980,
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    },
    card: {
        borderRadius: 16, background: '#fff',
        boxShadow: '0 10px 30px rgba(17,24,39,0.18)',
        transition: 'transform .18s ease, box-shadow .18s ease',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 40px rgba(17,24,39,0.26)' },
    },
    area: { padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minHeight: 150 },
    iconChip: {
        width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center',
        justifyContent: 'center', marginBottom: 14,
    },
    cardTitle: { fontWeight: 700, color: '#1F2937' },
    cardDesc: { color: '#6B7280', marginTop: 6, fontSize: 13, lineHeight: 1.35 },
    avatar: { width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 15, fontWeight: 600 },
}));

function ModuleSelection({ onSelectHR, onSelectInventory, onSelectMachineParts, onSelectProduction }) {
    const classes = useStyles();
    const { setUserData } = useContext(UserContext);

    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [underConstruction, setUnderConstruction] = useState(false);

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (user) { setRole(user.role); setName(user.Name); }
    }, []);

    const logOut = () => { setUserData({ token: undefined, user: undefined }); sessionStorage.clear(); };

    const modules = [
        { title: 'Human Resources', desc: 'Employees, attendance, shifts, payroll', icon: <People />, color: '#4F73FF', bg: 'rgba(79,115,255,0.12)', onClick: onSelectHR },
        { title: 'Inventory', desc: 'Tools, consumables, borrowing & forms', icon: <Category />, color: '#06B6D4', bg: 'rgba(6,182,212,0.12)', onClick: onSelectInventory },
        { title: 'Machine Parts', desc: 'Machine spare parts catalog', icon: <Settings />, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', onClick: onSelectMachineParts },
        { title: 'Production', desc: 'Daily receipts and production records', icon: <Receipt />, color: '#F59E0B', bg: 'rgba(245,158,11,0.14)', onClick: onSelectProduction },
        { title: 'Management Dashboard', desc: 'Executive analytics & overview', icon: <Dashboard />, color: '#EF4444', bg: 'rgba(239,68,68,0.12)', onClick: () => setUnderConstruction(true) },
    ];

    return (
        <div className={classes.root}>
            <div className={classes.topBar}>
                <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
                    <Avatar className={classes.avatar}>{name ? name.charAt(0).toUpperCase() : ''}</Avatar>
                    <div style={{ marginLeft: 8, textAlign: 'left' }}>
                        <div style={{ fontSize: 14 }}>{name}</div>
                        <div style={{ fontSize: 11, color: '#E0E0E0' }}>{role}</div>
                    </div>
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                    <MenuItem onClick={logOut}><ExitToApp fontSize="small" style={{ marginRight: 8 }} />Logout</MenuItem>
                </Menu>
            </div>

            <Typography variant="h4" className={classes.heading}>Unimore Trading</Typography>
            <Typography variant="subtitle1" className={classes.sub}>Select a workspace to continue</Typography>

            <div className={classes.grid}>
                {modules.map((m) => (
                    <Card key={m.title} className={classes.card} elevation={0}>
                        <CardActionArea className={classes.area} onClick={m.onClick}>
                            <div className={classes.iconChip} style={{ backgroundColor: m.bg, color: m.color }}>
                                {m.icon}
                            </div>
                            <Typography variant="subtitle1" className={classes.cardTitle}>{m.title}</Typography>
                            <Typography className={classes.cardDesc}>{m.desc}</Typography>
                        </CardActionArea>
                    </Card>
                ))}
            </div>

            <Dialog open={underConstruction} onClose={() => setUnderConstruction(false)}>
                <DialogTitle style={{ textAlign: 'center' }}>
                    <Build style={{ fontSize: 48, color: '#F59E0B', display: 'block', margin: '0 auto 8px' }} />
                    Under Construction
                </DialogTitle>
                <DialogContent>
                    <DialogContentText style={{ textAlign: 'center' }}>
                        The Management Dashboard is not available yet.<br />Please check back soon.
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
