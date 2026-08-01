import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Modal from '@material-ui/core/Modal';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import { NavigateNext, NavigateBefore, Add, Save, Close, Delete, Edit } from '@material-ui/icons';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Divider } from '@material-ui/core';
import Select from './common/Dropdown';
import Portal from '@material-ui/core/Portal';
import { ToastContainer, toast } from 'react-toastify';

import DateFnsUtils from '@date-io/date-fns';
import {
    MuiPickersUtilsProvider,
    KeyboardTimePicker,
    KeyboardDatePicker,
} from '@material-ui/pickers';

const axios = require("axios");
const moment = require("moment");

function rand() {
    return Math.round(Math.random() * 20) - 10;
}

function getModalStyle() {
    const top = 50 + rand();
    const left = 50 + rand();

    return {
        top: `${top}%`,
        left: `${left}%`,
        transform: `translate(-${top}%, -${left}%)`,
    };
}

const useStyles = makeStyles((theme) => ({
    paper: {
        position: 'absolute',
        width: 400,
        backgroundColor: theme.palette.background.paper,
        border: '2px solid #000',
        boxShadow: theme.shadows[5],
        padding: theme.spacing(2, 4, 3),
    },
    calendarRoot: {
        height: 700,
        padding: 5,
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.background.paper,
        '& .rbc-calendar': { color: theme.palette.text.primary },
        '& .rbc-month-view, & .rbc-time-view, & .rbc-agenda-view table': {
            borderColor: theme.palette.divider,
            backgroundColor: theme.palette.background.paper,
        },
        '& .rbc-header, & .rbc-time-header-content, & .rbc-timeslot-group, & .rbc-day-bg, & .rbc-month-row': {
            borderColor: theme.palette.divider,
        },
        '& .rbc-day-bg + .rbc-day-bg, & .rbc-month-row + .rbc-month-row': { borderColor: theme.palette.divider },
        '& .rbc-off-range-bg': { backgroundColor: theme.palette.type === 'dark' ? '#111827' : '#E5E7EB' },
        '& .rbc-today': { backgroundColor: theme.palette.type === 'dark' ? 'rgba(125,151,255,.16)' : '#EAF2FF' },
        '& .rbc-off-range, & .rbc-agenda-empty': { color: theme.palette.text.secondary },
        '& .rbc-show-more': { backgroundColor: theme.palette.background.paper, color: theme.palette.primary.main },
        '& .rbc-agenda-date-cell, & .rbc-agenda-time-cell, & .rbc-agenda-event-cell': { borderColor: theme.palette.divider },
    },
}));

const customSelectStyle = {
    control: base => ({
        ...base,
        height: 40,
        minHeight: 40,
        borderRadiusTopRight: 0,
        borderRadiusBottomRight: 0,
        // backgroundColor: '#383f48',
    }),
    option: (provided, state) => ({
        ...provided,
        color: state.isSelected ? 'white' : 'black',
        padding: 20,
        zIndex: 1000
    }),
    singleValue: base => ({
        ...base,
        // color: "#fff"
    }),
    input: base => ({
        ...base,
        // color: "#fff"
    }),
    menu: (provided) => ({ ...provided, zIndex: 9999 }),
};

const localizer = momentLocalizer(moment);

const allViews = () => Object
    .keys(Calendar.Views)
    .map(k => Calendar.Views[k]);

const HolidaySchedule = () => {
    const classes = useStyles();
    const [modalStyle] = React.useState(getModalStyle);
    const [holidayData, setHolidayData] = useState([]);
    const [id, setId] = useState(-1);
    const [title, setTitle] = useState("");
    const [date, setDate] = useState(moment());
    const [type, setType] = useState([]);
    const [addModal, setAddModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [deletePopup, setDeletePopup] = useState(false);
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [loader, setLoader] = useState(false);

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        setRole(user.role);
        setName(user.Name);
    }, []);

    useEffect(() => {
        var route = "holiday-schedule/list";
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");
        axios
            .get(url)
            .then(function (response) {
                // handle success
                setHolidayData(response.data);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .finally(function () {
                // always executed
            });
    }, [loader]);

    const handleAddHoliday = () => {
        var route = "holiday-schedule/";
        var url = window.apihost + route;
        var token = sessionStorage.getItem("auth-token");

        var data = {
            date: moment(date).format("MM/DD/yyyy"),
            title: title,
            type: type ? type.value : "",
        }

        setLoader(true);

        axios
            .post(url, data, {
                headers: {
                    "auth-token": token,
                },
            })
            .then(function (response) {
                // handle success
                toast.success(response.data.hs + ' successfully add.', {
                    position: "top-center"
                });
                setAddModal(false);
                setLoader(false);
                setId(-1);
                setDate(moment().format("MM/DD/yyyy"));
                setTitle("");
                setType("");
            })
            .catch(function (error) {
                // handle error
                toast.error(JSON.stringify(error.response.data), {
                    position: "top-center"
                });
                setLoader(false);
            })
            .finally(function () {
                // always executed
            });
    }

    const handleEditHoliday = () => {
        var route = `holiday-schedule/${id}`;
        var url = window.apihost + route;
        var token = sessionStorage.getItem("auth-token");

        var data = {
            date: moment(date).format("MM/DD/yyyy"),
            title: title,
            type: type ? type.value : "",
        }

        setLoader(true);

        axios
            .put(url, data, {
                headers: {
                    "auth-token": token,
                },
            })
            .then(function (response) {
                // handle success
                toast.success(response.data.hs + ' successfully add.', {
                    position: "top-center"
                });
                setEditModal(false);
                setLoader(false);
                setId(-1);
                setDate(moment().format("MM/DD/yyyy"));
                setTitle("");
                setType("");
            })
            .catch(function (error) {
                // handle error
                toast.error(JSON.stringify(error.response.data), {
                    position: "top-center"
                });
                setLoader(false);
            })
            .finally(function () {
                // always executed
            });
    }

    const CustomToolbar = (toolbar) => {
        const goToBack = () => {
            toolbar.date.setMonth(toolbar.date.getMonth() - 1);
            toolbar.onNavigate('prev');
        };

        const goToNext = () => {
            toolbar.date.setMonth(toolbar.date.getMonth() + 1);
            toolbar.onNavigate('next');
        };

        const goToCurrent = () => {
            const now = new Date();
            toolbar.date.setMonth(now.getMonth());
            toolbar.date.setYear(now.getFullYear());
            toolbar.onNavigate('current');
        };

        const label = () => {
            const date = moment(toolbar.date);
            return (
                <span style={{ fontSize: 30 }}><b>{date.format('MMMM')}</b><span> {date.format('YYYY')}</span></span>
            );
        };

        return (
            <div style={{ marginBottom: 10 }}>
                <ButtonGroup variant="contained" aria-label="contained primary button group">
                    <Button
                        variant="contained"
                        size='large'
                        disableElevation
                        disabled={role === "Administrator" || role === "HR" || role === "HR Staff" ? false : true}
                        onClick={() => setAddModal(true)} startIcon={<Add />}
                    >
                        Add Schedule
                    </Button>
                </ButtonGroup>

                <ButtonGroup variant="contained" aria-label="contained primary button group" style={{ marginLeft: '25%' }}>
                    <Button variant="contained" size='large' disableElevation onClick={goToBack} startIcon={<NavigateBefore />}>back</Button>
                    <Button variant="contained" size='large' disableElevation onClick={goToCurrent}>Today</Button>
                    <Button variant="contained" size='large' disableElevation onClick={goToNext} startIcon={<NavigateNext />}>next</Button>
                </ButtonGroup>
                {/* <span className="rbc-toolbar-label"><label>{label()}</label></span> */}
                <label style={{ float: 'right' }}>{label()}</label>
            </div>
        )
    }

    const CustomEvent = (event) => {
        return (
            <div style={{ height: "100%", maxHeight: '60vh', minHeight: '60vh' }}>
                <IconButton
                    color="inherit"
                    aria-label="close"
                    component="span"
                    style={{ float: "right", zIndex: 99 }}
                    disabled={role === "Administrator" || role === "HR" || role === "HR Staff" ? false : true}
                    onClick={() => handleOpenDeleteModal(event.event.id)}
                >
                    <Close />
                </IconButton>

                <IconButton
                    color="inherit"
                    aria-label="close"
                    component="span"
                    style={{ float: "right", zIndex: 99 }}
                    disabled={role === "Administrator" || role === "HR" || role === "HR Staff" ? false : true}
                    onClick={() => handleEditModal(event.event)}
                >
                    <Edit />
                </IconButton>

                <span> <strong> {event.title} </strong> </span> <br />
                <label>{event.event.type}</label>
            </div>
        )
    }

    const handleCloseAddModal = () => {
        setAddModal(false);
        setLoader(false);
        setId(-1);
        setDate(moment().format("MM/DD/yyyy"));
        setTitle("");
        setType("");
    };

    const handleEditModal = (params) => {
        if (deletePopup !== true) {
            var st = params.type !== "" ? { label: params.type, value: params.type } : "";
            setEditModal(true);
            setId(params.id);
            setDate(moment(params.start).format("MM/DD/yyyy"));
            setTitle(params.title);
            setType(st);
        }
    }

    const handleCloseEditModal = () => {
        setEditModal(false);
        setLoader(false);
        setId(-1);
        setDate(moment().format("MM/DD/yyyy"));
        setTitle("");
        setType("");
    };

    function TypeOption(item) {
        var list = [
            { label: "Regular Holiday", value: "Regular Holiday" },
            { label: "Special Holiday", value: "Special Holiday" },
            { label: "Regular Holiday w/o Pay", value: "Regular Holiday w/o Pay" },
            { label: "Special Holiday w/o Pay", value: "Special Holiday w/o Pay" },
            { label: "Regular Holiday Rest Day", value: "Regular Holiday Rest Day" },
            { label: "Special Holiday Rest Day", value: "Special Holiday Rest Day" },
        ];

        return list;
    }

    const handleCloseDeletePopup = () => {
        setDeletePopup(false);
        setLoader(false);
        setId(-1);
        setDate(moment().format("MM/DD/yyyy"));
        setTitle("");
        setType("");
    }

    const handleOpenDeleteModal = (id) => {
        setDeletePopup(true);
        setId(id);
    }

    const handleDeleteSched = () => {
        var url = window.apihost + `holiday-schedule/${id}`;
        var token = sessionStorage.getItem("auth-token");
        setLoader(true);
        axios
            .delete(url, {
                headers: { "auth-token": token },
            })
            .then(function (response) {
                // handle success
                if (response.status <= 200) {
                    toast.success('Schedule successfully deleted.', {
                        position: "top-center"
                    })
                    setId(-1);
                    setLoader(false);
                    setDeletePopup(false);
                    setDate(moment().format("MM/DD/yyyy"));
                    setTitle("");
                    setType("");
                }
            })
            .catch((err) => {
                if (err.response.status === 400) {
                    const error = {
                        status: err.response.status,
                        error: err.response.data,
                    };
                    alert(JSON.stringify(error));
                    setLoader(false);
                } else {
                    // alert(err.response.status + JSON.stringify(err.response.data));
                    const error = {
                        status: err.response.status,
                        error: JSON.stringify(err.response.data),
                    };
                    toast.error(err.response, {
                        position: "top-center"
                    });
                    setLoader(false);
                }
            });
    }

    return (
        <div className={classes.calendarRoot}>
            <Portal>
                <ToastContainer />
            </Portal>

            <Calendar
                localizer={localizer}
                events={holidayData}
                // onSelectEvent={(e) => handleEditModal(e)}
                step={60}
                views={allViews}
                defaultDate={new Date(moment())}
                components={{
                    toolbar: CustomToolbar,
                    event: CustomEvent
                }}
            />

            <Modal
                open={addModal}
                onClose={handleCloseAddModal}
                aria-labelledby="simple-modal-title"
                aria-describedby="simple-modal-description"
            >
                <div style={modalStyle} className={classes.paper}>
                    <h2 id="simple-modal-title">Add Schedule</h2>
                    <Divider />
                    <br />
                    <form noValidate autoComplete="off">
                        <div>
                            <label style={{ fontSize: '17px' }}><strong>Title</strong></label><br />
                            <TextField variant='outlined' size='small' fullWidth placeholder="title" value={title} onChange={e => setTitle(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                        </div>

                        <br />

                        <div>
                            <label style={{ fontSize: '17px' }}><strong>Holiday Type</strong></label><br />
                            <Select
                                defaultValue={type}
                                options={TypeOption()}
                                onChange={e => setType(e)}
                                placeholder='Search...'
                                theme={(theme) => ({
                                    ...theme,
                                    // borderRadius: 0,
                                    colors: {
                                        ...theme.colors,
                                        text: 'black',
                                        primary25: '#66c0f4',
                                        primary: '#B9B9B9',
                                    },
                                })}
                                styles={customSelectStyle}
                            />
                        </div>

                        <br />

                        <div>
                            <label style={{ fontSize: '17px' }}><strong>Date</strong></label><br />
                            <TextField
                                id="date"
                                label=""
                                type="date"
                                variant="outlined"
                                fullWidth
                                size="small"
                                defaultValue={moment().format("DD/MM/yyyy")}
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className={classes.textField}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </div>

                        <br />

                        <div>
                            <Button
                                size="large"
                                // style={{ float: 'right' }}
                                variant="contained"
                                color="default"
                                onClick={handleCloseAddModal}>
                                <b>Cancel</b>
                            </Button>
                            <Button
                                size="large"
                                style={{ marginLeft: 10 }}
                                variant="contained"
                                color="default"
                                startIcon={<Save />}
                                onClick={handleAddHoliday}
                            >
                                <b>Submit</b>
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal
                open={editModal}
                onClose={handleCloseEditModal}
                aria-labelledby="simple-modal-title"
                aria-describedby="simple-modal-description"
            >
                <div style={modalStyle} className={classes.paper}>
                    <h2 id="simple-modal-title">Edit Schedule</h2>
                    <Divider />
                    <br />
                    <form noValidate autoComplete="off">
                        <div>
                            <label style={{ fontSize: '17px' }}><strong>Title</strong></label><br />
                            <TextField variant='outlined' size='small' fullWidth placeholder="title" value={title} onChange={e => setTitle(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                        </div>

                        <br />

                        <div>
                            <label style={{ fontSize: '17px' }}><strong>Holiday Type</strong></label><br />
                            <Select
                                defaultValue={type}
                                options={TypeOption()}
                                onChange={e => setType(e)}
                                placeholder='Search...'
                                theme={(theme) => ({
                                    ...theme,
                                    // borderRadius: 0,
                                    colors: {
                                        ...theme.colors,
                                        text: 'black',
                                        primary25: '#66c0f4',
                                        primary: '#B9B9B9',
                                    },
                                })}
                                styles={customSelectStyle}
                            />
                        </div>

                        <br />

                        <div>
                            <label style={{ fontSize: '17px' }}><strong>Date</strong></label><br />
                            <TextField
                                id="date"
                                label=""
                                type="date"
                                variant="outlined"
                                fullWidth
                                size="small"
                                defaultValue={moment().format("yyyy-mm-dd")}
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className={classes.textField}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </div>

                        <br />

                        <div>
                            <Button
                                size="large"
                                // style={{ float: 'right' }}
                                variant="contained"
                                color="default"
                                onClick={handleCloseEditModal}>
                                <b>Cancel</b>
                            </Button>
                            <Button
                                size="large"
                                style={{ marginLeft: 10 }}
                                variant="contained"
                                color="default"
                                startIcon={<Save />}
                                onClick={handleEditHoliday}
                            >
                                <b>Submit</b>
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal
                aria-labelledby="simple-modal-title"
                aria-describedby="simple-modal-description"
                open={deletePopup}
                onClose={handleCloseDeletePopup}
            >
                <div style={modalStyle} className={classes.paper}>

                    <h1 id="simple-modal-title">Warning</h1>

                    <Divider />

                    <br />

                    <p>Are you sure you want to delete this schedule?</p>

                    <br />
                    <Divider />
                    <br />

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            size="large"
                            // style={{ float: 'right' }}
                            variant="contained"
                            color="default"
                            onClick={handleCloseDeletePopup}>
                            <b>Cancel</b>
                        </Button>
                        <Button
                            size="large"
                            style={{ marginLeft: 10 }}
                            variant="contained"
                            color='secondary'
                            startIcon={<Delete />}
                            onClick={handleDeleteSched}>
                            <b>Delete</b>
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default HolidaySchedule;
