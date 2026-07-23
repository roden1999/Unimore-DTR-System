import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
    Paper, Grid, Button, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions, Typography, IconButton, Divider
} from '@material-ui/core';
import { Delete, AssignmentInd } from '@material-ui/icons';
import 'date-fns';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import Select from './common/Dropdown';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const axios = require("axios");
const moment = require("moment");

const useStyles = makeStyles(() => ({
    root: { backgroundColor: 'white', padding: 20, borderRadius: 10, minHeight: '90vh' },
    section: { marginBottom: 24 },
    label: { fontSize: 12, color: '#555', marginBottom: 4 },
}));

function ShiftAssignment() {
    const classes = useStyles();

    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [shiftOptions, setShiftOptions] = useState([]);
    const [overrides, setOverrides] = useState([]);
    const [reload, setReload] = useState(false);

    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [selectedShift, setSelectedShift] = useState(null);
    const [startDate, setStartDate] = useState(moment().format("YYYY-MM-DD"));
    const [endDate, setEndDate] = useState(moment().add(2, "days").format("YYYY-MM-DD"));
    const [note, setNote] = useState("");

    const [conflictOpen, setConflictOpen] = useState(false);
    const [conflicts, setConflicts] = useState([]);

    useEffect(() => {
        axios.get(window.apihost + "employees/options")
            .then((res) => {
                const opts = (Array.isArray(res.data) ? res.data : []).map((e) => ({
                    label: `${e.employeeNo} - ${e.employeeName}`, value: e.id,
                }));
                setEmployeeOptions(opts);
            }).catch((err) => console.log(err));

        axios.get(window.apihost + "shifts/list")
            .then((res) => {
                const opts = (Array.isArray(res.data) ? res.data : []).map((s) => ({
                    label: `${s.Name} (${s.TimeStart} - ${s.TimeEnd})`, value: s.Id,
                }));
                setShiftOptions(opts);
            }).catch((err) => console.log(err));
    }, []);

    useEffect(() => {
        axios.post(window.apihost + "shift-overrides/list", { selectedEmployee: [] })
            .then((res) => setOverrides(Array.isArray(res.data) ? res.data : []))
            .catch((err) => console.log(err));
    }, [reload]);

    const submit = (force) => {
        if (!selectedShift) return toast.warn("Please select a shift.", { position: "top-center" });
        if (!selectedEmployees.length) return toast.warn("Please select at least one employee.", { position: "top-center" });

        const data = {
            employeeIds: selectedEmployees.map((e) => e.value),
            shiftId: selectedShift.value,
            startDate,
            endDate,
            note,
            force: !!force,
        };

        axios.post(window.apihost + "shift-overrides/assign", data)
            .then((res) => {
                toast.success(res.data.message, { position: "top-center" });
                setConflictOpen(false);
                setConflicts([]);
                setSelectedEmployees([]);
                setNote("");
                setReload(!reload);
            })
            .catch((err) => {
                if (err.response && err.response.status === 409) {
                    setConflicts(err.response.data.conflicts || []);
                    setConflictOpen(true);
                } else {
                    toast.error(typeof err.response?.data === "string" ? err.response.data : "Error assigning shift.", { position: "top-center" });
                }
            });
    };

    const handleDelete = (id) => {
        axios.delete(window.apihost + "shift-overrides/" + id)
            .then(() => { toast.info("Override removed.", { position: "top-center" }); setReload(!reload); })
            .catch((err) => console.log(err));
    };

    return (
        <div className={classes.root}>
            <ToastContainer />
            <Typography variant="h6" gutterBottom>Assign Temporary Shift</Typography>
            <Typography variant="caption" color="textSecondary">
                Select one employee for a solo assignment, or several for a batch. When the date range ends,
                the employees automatically return to their original 8AM-5PM shift.
            </Typography>

            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <Grid container spacing={2} className={classes.section} style={{ marginTop: 8 }}>
                    <Grid item xs={12} md={6}>
                        <div className={classes.label}>Employees (batch or solo)</div>
                        <Select isMulti options={employeeOptions} value={selectedEmployees}
                            onChange={(v) => setSelectedEmployees(v || [])} placeholder="Select employees..." />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <div className={classes.label}>Shift</div>
                        <Select options={shiftOptions} value={selectedShift}
                            onChange={(v) => setSelectedShift(v)} placeholder="Select shift..." />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <KeyboardDatePicker format="MM/dd/yyyy" label="Start Date" value={startDate}
                            onChange={(d) => setStartDate(moment(d).format("YYYY-MM-DD"))} />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <KeyboardDatePicker format="MM/dd/yyyy" label="End Date" value={endDate}
                            onChange={(d) => setEndDate(moment(d).format("YYYY-MM-DD"))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField label="Note (optional)" fullWidth value={note}
                            onChange={(e) => setNote(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={2} style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <Button fullWidth variant="contained" color="primary" startIcon={<AssignmentInd />}
                            onClick={() => submit(false)}>Assign</Button>
                    </Grid>
                </Grid>
            </MuiPickersUtilsProvider>

            <Divider />

            <Typography variant="subtitle1" style={{ margin: '16px 0 8px' }}>Active &amp; Upcoming Overrides</Typography>
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Employee</TableCell>
                            <TableCell>Shift</TableCell>
                            <TableCell>From</TableCell>
                            <TableCell>To</TableCell>
                            <TableCell>Note</TableCell>
                            <TableCell align="right">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {overrides.length === 0 &&
                            <TableRow><TableCell colSpan={6} align="center">No active overrides.</TableCell></TableRow>
                        }
                        {overrides.map((o) => (
                            <TableRow key={o.id}>
                                <TableCell>{o.employeeNo} - {o.employeeName}</TableCell>
                                <TableCell>{o.shiftName} ({o.timeStart} - {o.timeEnd})</TableCell>
                                <TableCell>{o.startDate}</TableCell>
                                <TableCell>{o.endDate}</TableCell>
                                <TableCell>{o.note}</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleDelete(o.id)}><Delete fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={conflictOpen} onClose={() => setConflictOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Overlapping Assignment</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        The following employee(s) already have an override in that date range:
                    </DialogContentText>
                    {conflicts.map((c, i) => (
                        <div key={i} style={{ marginBottom: 8 }}>
                            <strong>{c.employeeName}</strong>
                            <ul style={{ margin: '4px 0' }}>
                                {c.existing.map((e, j) => (
                                    <li key={j}>{e.shiftName}: {e.startDate} - {e.endDate}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    <DialogContentText style={{ marginTop: 8 }}>
                        Do you want to proceed and replace the existing override(s)?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConflictOpen(false)}>No</Button>
                    <Button onClick={() => submit(true)} variant="contained" color="secondary">Yes, Replace</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default ShiftAssignment;
