import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
    Paper, Grid, Button, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
    DialogActions, Typography, Chip, IconButton
} from '@material-ui/core';
import { Add, Delete } from '@material-ui/icons';
import 'date-fns';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider, KeyboardTimePicker } from '@material-ui/pickers';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const axios = require("axios");
const moment = require("moment");

const useStyles = makeStyles(() => ({
    root: { backgroundColor: 'white', padding: 20, borderRadius: 10, minHeight: '90vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
}));

function Shifts() {
    const classes = useStyles();
    const [shifts, setShifts] = useState([]);
    const [reload, setReload] = useState(false);
    const [open, setOpen] = useState(false);

    const [name, setName] = useState("");
    const [timeStart, setTimeStart] = useState(moment().format("YYYY-MM-DD 20:00"));
    const [timeEnd, setTimeEnd] = useState(moment().format("YYYY-MM-DD 05:00"));

    useEffect(() => {
        axios.get(window.apihost + "shifts/list")
            .then((res) => setShifts(Array.isArray(res.data) ? res.data : []))
            .catch((err) => console.log(err));
    }, [reload]);

    const resetForm = () => {
        setName("");
        setTimeStart(moment().format("YYYY-MM-DD 20:00"));
        setTimeEnd(moment().format("YYYY-MM-DD 05:00"));
    };

    const handleAdd = () => {
        var route = "shifts/";
        var url = window.apihost + route;
        const data = {
            name,
            timeStart: moment(timeStart).format("h:mm a"),
            timeEnd: moment(timeEnd).format("h:mm a"),
        };
        axios.post(url, data)
            .then((res) => {
                toast.success((res.data.shift || "Shift") + " saved.", { position: "top-center" });
                setOpen(false);
                resetForm();
                setReload(!reload);
            })
            .catch((err) => {
                toast.error(typeof err.response?.data === "string" ? err.response.data : "Error saving shift.", { position: "top-center" });
            });
    };

    const handleDelete = (id) => {
        axios.delete(window.apihost + "shifts/" + id)
            .then(() => { toast.info("Shift deleted.", { position: "top-center" }); setReload(!reload); })
            .catch((err) => console.log(err));
    };

    return (
        <div className={classes.root}>
            <ToastContainer />
            <div className={classes.header}>
                <Typography variant="h6">Shift Templates</Typography>
                <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => setOpen(true)}>
                    New Shift
                </Button>
            </div>

            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Start</TableCell>
                            <TableCell>End</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell align="right">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {shifts.length === 0 &&
                            <TableRow><TableCell colSpan={5} align="center">No shifts yet.</TableCell></TableRow>
                        }
                        {shifts.map((s) => (
                            <TableRow key={s.Id}>
                                <TableCell>{s.Name}</TableCell>
                                <TableCell>{s.TimeStart}</TableCell>
                                <TableCell>{s.TimeEnd}</TableCell>
                                <TableCell>
                                    {s.CrossesMidnight
                                        ? <Chip size="small" label="Night (crosses midnight)" style={{ backgroundColor: '#3f51b5', color: 'white' }} />
                                        : <Chip size="small" label="Day" />}
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleDelete(s.Id)}><Delete fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>New Shift</DialogTitle>
                <DialogContent>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField label="Shift Name" fullWidth value={name}
                                    onChange={(e) => setName(e.target.value)} placeholder="Night Shift 8PM-5AM" />
                            </Grid>
                            <Grid item xs={6}>
                                <KeyboardTimePicker label="Time Start" value={timeStart}
                                    onChange={(d) => setTimeStart(d)} />
                            </Grid>
                            <Grid item xs={6}>
                                <KeyboardTimePicker label="Time End" value={timeEnd}
                                    onChange={(d) => setTimeEnd(d)} />
                            </Grid>
                        </Grid>
                    </MuiPickersUtilsProvider>
                    <Typography variant="caption" color="textSecondary">
                        If the end time is earlier than the start time, the shift is treated as crossing midnight.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleAdd} variant="contained" color="primary">Save</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default Shifts;
