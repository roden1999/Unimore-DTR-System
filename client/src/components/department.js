import React, { useState, useEffect } from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import CardActionArea from '@material-ui/core/CardActionArea';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import Modal from '@material-ui/core/Modal';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import Switch from '@material-ui/core/Switch';
import TableRow from '@material-ui/core/TableRow';
import Backdrop from '@material-ui/core/Backdrop';
import 'date-fns';
import DateFnsUtils from '@date-io/date-fns';
import {
    MuiPickersUtilsProvider,
    KeyboardTimePicker,
    KeyboardDatePicker,
} from '@material-ui/pickers';
import { Save, Edit, Delete, Add } from '@material-ui/icons/';
import { useSpring, animated } from 'react-spring';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import { TextField } from '@material-ui/core';

const axios = require("axios");
const moment = require("moment");

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        height: '100%',
        minHeight: '90vh',
        maxHeight: '90vh'
    },
    paper: {
        padding: theme.spacing(2),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
    modal: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: '10%',
        left: '10%',
        overflow: 'scroll',
        height: '100%',
        // display: 'block'
    },
    modalPaper: {
        backgroundColor: theme.palette.background.paper,
        border: '2px solid #000',
        boxShadow: theme.shadows[5],
        padding: theme.spacing(2, 4, 3),
    },
}));

const StyledTableCell = withStyles((theme) => ({
    head: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
    },
    body: {
        fontSize: 14,
    },
}))(TableCell);

const StyledTableRow = withStyles((theme) => ({
    root: {
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.action.hover,
        },
    },
}))(TableRow);

function createData(name, calories, fat, carbs, protein) {
    return { name, calories, fat, carbs, protein };
}

const Fade = React.forwardRef(function Fade(props, ref) {
    const { in: open, children, onEnter, onExited, ...other } = props;
    const style = useSpring({
        from: { opacity: 0 },
        to: { opacity: open ? 1 : 0 },
        onStart: () => {
            if (open && onEnter) {
                onEnter();
            }
        },
        onRest: () => {
            if (!open && onExited) {
                onExited();
            }
        },
    });

    return (
        <animated.div ref={ref} style={style} {...other}>
            {children}
        </animated.div>
    );
});

const customMultiSelectStyle = {
    clearIndicator: (ci) => ({
        ...ci
        // backgroundColor: '#383f48',
    }),
    dropdownIndicator: (ci) => ({
        ...ci
        // backgroundColor: "#383f48"
    }),
    indicatorsContainer: (ci) => ({
        ...ci,
        color: "red",
        // backgroundColor: "#383f48",
        position: "sticky",
        top: 0,
        height: "40px",
        zIndex: "100"
    }),
    control: (base) => ({
        ...base,
        height: 40,
        minHeight: 40,
        overflowX: "hidden",
        overflowY: "auto",
        borderRadiusTopRight: 0,
        borderRadiusBottomRight: 0,
        width: "100%"
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
    multiValue: (styles, { data }) => {
        return {
            ...styles,
            backgroundColor: "#1E8EFF",
        };
    },
    multiValueLabel: (styles, { data }) => ({
        ...styles,
        color: "#00000",
    }),
    input: base => ({
        ...base,
        // color: "#fff"
    }),
    menu: (provided) => ({ ...provided, zIndex: 9999 }),
};

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

const IOSSwitch = withStyles((theme) => ({
    root: {
        width: 42,
        height: 26,
        padding: 0,
        margin: theme.spacing(1),
    },
    switchBase: {
        padding: 1,
        '&$checked': {
            transform: 'translateX(16px)',
            color: theme.palette.common.white,
            '& + $track': {
                backgroundColor: '#52d869',
                opacity: 1,
                border: 'none',
            },
        },
        '&$focusVisible $thumb': {
            color: '#52d869',
            border: '6px solid #fff',
        },
    },
    thumb: {
        width: 24,
        height: 24,
    },
    track: {
        borderRadius: 26 / 2,
        border: `1px solid ${theme.palette.grey[400]}`,
        backgroundColor: theme.palette.grey[50],
        opacity: 1,
        transition: theme.transitions.create(['background-color', 'border']),
    },
    checked: {},
    focusVisible: {},
}))(({ classes, ...props }) => {
    return (
        <Switch
            focusVisibleClassName={classes.focusVisible}
            disableRipple
            classes={{
                root: classes.root,
                switchBase: classes.switchBase,
                thumb: classes.thumb,
                track: classes.track,
                checked: classes.checked,
            }}
            {...props}
        />
    );
});

const Department = () => {
    const classes = useStyles();
    const [loader, setLoader] = useState(true);
    const [departmentData, setDepartmentData] = useState(null);
    const [departmentOptions, setDepartmentOptions] = useState(null);
    const [employeeOptions, setEmployeeOptions] = useState(null);
    const [id, setId] = useState(-1);
    const [department, setDepartment] = useState("");
    const [dayNightShift, setDayNightShift] = useState(true);
    const [mondayTI, setMondayTI] = useState(moment().format("MM DD, yyyy 8:00"));
    const [mondayTO, setMondayTO] = useState(moment().format("MM DD, yyyy 17:00"));
    const [tuesdayTI, setTuesdayTI] = useState(moment().format("MM DD, yyyy 8:00"));
    const [tuesdayTO, setTuesdayTO] = useState(moment().format("MM DD, yyyy 17:00"));
    const [wednesdayTI, setWednesdayTI] = useState(moment().format("MM DD, yyyy 8:00"));
    const [wednesdayTO, setWednesdayTO] = useState(moment().format("MM DD, yyyy 18:00"));
    const [thursdayTI, setThursdayTI] = useState(moment().format("MM DD, yyyy 8:00"));
    const [thursdayTO, setThursdayTO] = useState(moment().format("MM DD, yyyy 18:00"));
    const [fridayTI, setFridayTI] = useState(moment().format("MM DD, yyyy 8:00"));
    const [fridayTO, setFridayTO] = useState(moment().format("MM DD, yyyy 18:00"));
    const [saturdayTI, setSaturdayTI] = useState(moment().format("MM DD, yyyy 8:00"));
    const [saturdayTO, setSaturdayTO] = useState(moment().format("MM DD, yyyy 12:00"));
    const [addModal, setAddModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [deletePopup, setDeletePopup] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [totalEmp, setTotalEmp] = useState(0);
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        setRole(user.role);
        setName(user.Name);
    }, []);

    useEffect(() => {
        setLoader(true);
        var data = {
            selectedDepartment: !selectedDepartment ? [] : selectedDepartment,
            page: page
        };
        var route = "department/list";
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");
        // const user = JSON.parse(sessionStorage.getItem('user'));
        axios
            .post(url, data)
            .then(function (response) {
                // handle success
                if (Array.isArray(response.data)) {
                    setDepartmentData(response.data);
                    setLoader(false);
                } else {
                    var obj = [];
                    obj.push(response.data);
                    setDepartmentData(obj);
                    setLoader(false);
                }
            })
            .catch(function (error) {
                // handle error
                console.log(error);
                setLoader(false);
            })
            .finally(function () {
                // always executed
            });
    }, [selectedDepartment]);

    const departmentList = departmentData
        ? departmentData.map((x) => ({
            id: x._id,
            department: x.department,
            timePerDay: x.timePerDay,
            dayNightShift: x.dayNightShift,
        }))
        : [];

    useEffect(() => {
        var route = "department/options";
        var url = window.apihost + route;
        var token = sessionStorage.getItem("auth-token");

        axios
            .get(url, {
                headers: { "auth-token": token },
            })
            .then(function (response) {
                // handle success
                if (Array.isArray(response.data)) {
                    setDepartmentOptions(response.data);
                } else {
                    var obj = [];
                    obj.push(response.data);
                    setDepartmentOptions(obj);
                }
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .finally(function () {
                // always executed
            });
    }, [loader]);

    const departmentOptionsList = departmentOptions
        ? departmentOptions.map((x) => ({
            id: x._id,
            name: x.department,
        }))
        : [];

    function DepartmentOption(item) {
        var list = [];
        if (item !== undefined || item !== null) {
            item.map((x) => {
                return list.push({
                    label: x.name,
                    value: x.id,
                });
            });
        }
        return list;
    }

    const handleAddDepartment = () => {
        var route = "department/";
        var url = window.apihost + route;
        var token = sessionStorage.getItem("auth-token");

        var data = {
            department: department,
            dayNightShift: dayNightShift,
            timePerDay: [
                { "day": "Monday", "timeStart": moment(mondayTI).format("hh:mm a"), "timeEnd": moment(mondayTO).format("hh:mm a") },
                { "day": "Tuesday", "timeStart": moment(tuesdayTI).format("hh:mm a"), "timeEnd": moment(tuesdayTO).format("hh:mm a") },
                { "day": "Wednesday", "timeStart": moment(wednesdayTI).format("hh:mm a"), "timeEnd": moment(wednesdayTO).format("hh:mm a") },
                { "day": "Thursday", "timeStart": moment(thursdayTI).format("hh:mm a"), "timeEnd": moment(thursdayTO).format("hh:mm a") },
                { "day": "Friday", "timeStart": moment(fridayTI).format("hh:mm a"), "timeEnd": moment(fridayTO).format("hh:mm a") },
                { "day": "Saturday", "timeStart": moment(saturdayTI).format("hh:mm a"), "timeEnd": moment(saturdayTO).format("hh:mm a") }
            ]
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
                toast.success(response.data.department + ' successfully saved.', {
                    position: "top-center"
                });
                setAddModal(false);
                setLoader(false);
                setId(-1);
                setDepartment("");
                setDayNightShift(true);
                setMondayTI(moment().format("MM DD, yyyy 8:00"));
                setMondayTO(moment().format("MM DD, yyyy 17:00"));
                setTuesdayTI(moment().format("MM DD, yyyy 8:00"));
                setTuesdayTO(moment().format("MM DD, yyyy 17:00"));
                setWednesdayTI(moment().format("MM DD, yyyy 8:00"));
                setWednesdayTO(moment().format("MM DD, yyyy 18:00"));
                setThursdayTI(moment().format("MM DD, yyyy 8:00"));
                setThursdayTO(moment().format("MM DD, yyyy 18:00"));
                setFridayTI(moment().format("MM DD, yyyy 8:00"));
                setFridayTO(moment().format("MM DD, yyyy 18:00"));
                setSaturdayTI(moment().format("MM DD, yyyy 8:00"));
                setSaturdayTO(moment().format("MM DD, yyyy 18:00"));
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

    const handleCloseAddModal = () => {
        setAddModal(false);
        setDepartment("");
        setDayNightShift(true);
        setMondayTI(moment().format("MM DD, yyyy 8:00"));
        setMondayTO(moment().format("MM DD, yyyy 17:00"));
        setTuesdayTI(moment().format("MM DD, yyyy 8:00"));
        setTuesdayTO(moment().format("MM DD, yyyy 17:00"));
        setWednesdayTI(moment().format("MM DD, yyyy 8:00"));
        setWednesdayTO(moment().format("MM DD, yyyy 18:00"));
        setThursdayTI(moment().format("MM DD, yyyy 8:00"));
        setThursdayTO(moment().format("MM DD, yyyy 18:00"));
        setFridayTI(moment().format("MM DD, yyyy 8:00"));
        setFridayTO(moment().format("MM DD, yyyy 18:00"));
        setSaturdayTI(moment().format("MM DD, yyyy 8:00"));
        setSaturdayTO(moment().format("MM DD, yyyy 18:00"));
    }

    const handleEditDepartment = () => {
        var route = `department/${id}`;
        var url = window.apihost + route;
        var token = sessionStorage.getItem("auth-token");

        var tpd = [
            { "day": "Monday", "timeStart": moment(mondayTI).format("hh:mm a"), "timeEnd": moment(mondayTO).format("hh:mm a") },
            { "day": "Tuesday", "timeStart": moment(tuesdayTI).format("hh:mm a"), "timeEnd": moment(tuesdayTO).format("hh:mm a") },
            { "day": "Wednesday", "timeStart": moment(wednesdayTI).format("hh:mm a"), "timeEnd": moment(wednesdayTO).format("hh:mm a") },
            { "day": "Thursday", "timeStart": moment(thursdayTI).format("hh:mm a"), "timeEnd": moment(thursdayTO).format("hh:mm a") },
            { "day": "Friday", "timeStart": moment(fridayTI).format("hh:mm a"), "timeEnd": moment(fridayTO).format("hh:mm a") },
            { "day": "Saturday", "timeStart": moment(saturdayTI).format("hh:mm a"), "timeEnd": moment(saturdayTO).format("hh:mm a") }
        ]

        var data = {
            // id: id,
            department: department,
            dayNightShift: dayNightShift,
            timePerDay: JSON.stringify(tpd)
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
                toast.success(response.data.department + ' successfully saved.', {
                    position: "top-center"
                });
                setEditModal(false);
                setLoader(false);
                setId(-1);
                setDepartment("");
                setDayNightShift(true);
                setMondayTI(moment().format("MM DD, yyyy 8:00"));
                setMondayTO(moment().format("MM DD, yyyy 17:00"));
                setTuesdayTI(moment().format("MM DD, yyyy 8:00"));
                setTuesdayTO(moment().format("MM DD, yyyy 17:00"));
                setWednesdayTI(moment().format("MM DD, yyyy 8:00"));
                setWednesdayTO(moment().format("MM DD, yyyy 18:00"));
                setThursdayTI(moment().format("MM DD, yyyy 8:00"));
                setThursdayTO(moment().format("MM DD, yyyy 18:00"));
                setFridayTI(moment().format("MM DD, yyyy 8:00"));
                setFridayTO(moment().format("MM DD, yyyy 18:00"));
                setSaturdayTI(moment().format("MM DD, yyyy 8:00"));
                setSaturdayTO(moment().format("MM DD, yyyy 18:00"));
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

    const handleOpenEditModal = (params) => {
        var data = JSON.parse(params.timePerDay);
        for (const i in data) {
            if (data[i].day === "Monday") {
                var ti = moment(data[i].timeStart, "HH:mm a").format("HH:mm");
                var to = moment(data[i].timeEnd, "HH:mm a").format("HH:mm");
                setMondayTI(moment().format(`MM DD, yyyy ${ti}`));
                setMondayTO(moment().format(`MM DD, yyyy ${to}`));
            };
            if (data[i].day === "Tuesday") {
                var ti = moment(data[i].timeStart, "HH:mm a").format("HH:mm");
                var to = moment(data[i].timeEnd, "HH:mm a").format("HH:mm");
                setTuesdayTI(moment().format(`MM DD, yyyy ${ti}`));
                setTuesdayTO(moment().format(`MM DD, yyyy ${to}`));
            };
            if (data[i].day === "Wednesday") {
                var ti = moment(data[i].timeStart, "HH:mm a").format("HH:mm");
                var to = moment(data[i].timeEnd, "HH:mm a").format("HH:mm");
                setWednesdayTI(moment().format(`MM DD, yyyy ${ti}`));
                setWednesdayTO(moment().format(`MM DD, yyyy ${to}`));
            };
            if (data[i].day === "Thursday") {
                var ti = moment(data[i].timeStart, "HH:mm a").format("HH:mm");
                var to = moment(data[i].timeEnd, "HH:mm a").format("HH:mm");
                setThursdayTI(moment().format(`MM DD, yyyy ${ti}`));
                setThursdayTO(moment().format(`MM DD, yyyy ${to}`));
            };
            if (data[i].day === "Friday") {
                var ti = moment(data[i].timeStart, "HH:mm a").format("HH:mm");
                var to = moment(data[i].timeEnd, "HH:mm a").format("HH:mm");
                setFridayTI(moment().format(`MM DD, yyyy ${ti}`));
                setFridayTO(moment().format(`MM DD, yyyy ${to}`));
            };
            if (data[i].day === "Saturday") {
                var ti = moment(data[i].timeStart, "HH:mm a").format("HH:mm");
                var to = moment(data[i].timeEnd, "HH:mm a").format("HH:mm");
                setSaturdayTI(moment().format(`MM DD, yyyy ${ti}`));
                setSaturdayTO(moment().format(`MM DD, yyyy ${to}`));
            };
        }
        setEditModal(true);
        setLoader(false);
        setId(params.id);
        setDepartment(params.department);
        setDayNightShift(params.dayNightShift);

    }

    const handleCloseEditModal = () => {
        setEditModal(false);
        setLoader(false);
        setId(-1);
        setDepartment("");
        setDayNightShift(true);
        setMondayTI(moment().format("MM DD, yyyy 8:00"));
        setMondayTO(moment().format("MM DD, yyyy 17:00"));
        setTuesdayTI(moment().format("MM DD, yyyy 8:00"));
        setTuesdayTO(moment().format("MM DD, yyyy 17:00"));
        setWednesdayTI(moment().format("MM DD, yyyy 8:00"));
        setWednesdayTO(moment().format("MM DD, yyyy 18:00"));
        setThursdayTI(moment().format("MM DD, yyyy 8:00"));
        setThursdayTO(moment().format("MM DD, yyyy 18:00"));
        setFridayTI(moment().format("MM DD, yyyy 8:00"));
        setFridayTO(moment().format("MM DD, yyyy 18:00"));
        setSaturdayTI(moment().format("MM DD, yyyy 8:00"));
        setSaturdayTO(moment().format("MM DD, yyyy 18:00"));
    }

    const handleDeleteItem = () => {
        var url = window.apihost + `department/${id}`;
        var token = sessionStorage.getItem("auth-token");
        setLoader(true);
        axios
            .delete(url, {
                headers: { "auth-token": token },
            })
            .then(function (response) {
                // handle success
                if (response.status <= 200) {
                    toast.success('Department successfully deleted.', {
                        position: "top-center"
                    })
                    setId(-1);
                    setLoader(false);
                    setDeletePopup(false);
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
                    toast.error(JSON.stringify(error.response.data), {
                        position: "top-center"
                    });
                    setLoader(false);
                }
            });
    }

    const handleOpenDeletePopup = (id) => {
        setDeletePopup(true);
        setId(id);
    }

    const handleCloseDeleteModal = () => {
        setDeletePopup(false);
        setLoader(false);
        setId(-1);
        setDepartment("");
        setDayNightShift(true);
        setMondayTI(moment().format("MM DD, yyyy 8:00"));
        setMondayTO(moment().format("MM DD, yyyy 17:00"));
        setTuesdayTI(moment().format("MM DD, yyyy 8:00"));
        setTuesdayTO(moment().format("MM DD, yyyy 17:00"));
        setWednesdayTI(moment().format("MM DD, yyyy 8:00"));
        setWednesdayTO(moment().format("MM DD, yyyy 18:00"));
        setThursdayTI(moment().format("MM DD, yyyy 8:00"));
        setThursdayTO(moment().format("MM DD, yyyy 18:00"));
        setFridayTI(moment().format("MM DD, yyyy 8:00"));
        setFridayTO(moment().format("MM DD, yyyy 18:00"));
        setSaturdayTI(moment().format("MM DD, yyyy 8:00"));
        setSaturdayTO(moment().format("MM DD, yyyy 18:00"));
    }

    return (
        <div className={classes.root}>

            <ToastContainer />
            <Button
                size="large"
                style={{ float: 'left' }}
                variant="contained"
                color="default"
                startIcon={<Add />}
                disabled={role === "Administrator" || role === "HR" || role === "HR Staff" ? false : true}
                onClick={() => setAddModal(true)}>Add Department</Button>

            <div style={{
                float: 'right', width: '30%', zIndex: 100,
            }}>
                <Select
                    defaultValue={selectedDepartment}
                    options={DepartmentOption(departmentOptionsList)}
                    onChange={e => setSelectedDepartment(e)}
                    placeholder='Search...'
                    isClearable
                    isMulti
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
                    styles={customMultiSelectStyle}
                />
            </div>

            <div style={{ padding: 10, backgroundColor: '#F4F4F4', marginTop: 60, height: '100', minHeight: '75vh', maxHeight: '75vh', overflowY: 'scroll', overflowX: 'hidden' }}>
                <Grid container spacing={3}>
                    {departmentList.length > 0 && departmentList.map(x =>
                        <Grid item xs={4}>
                            <Card>
                                <CardActionArea>
                                    <CardContent>
                                        <Typography gutterBottom variant="h5" component="h2">
                                            {x.department}
                                        </Typography>
                                        <Typography gutterBottom variant="p" component="h3">
                                            {/* <Typography component="div">
                                                <Grid component="label" container alignItems="center" spacing={1}>
                                                    <Grid item>Night</Grid>
                                                    <Grid item>
                                                        <IOSSwitch checked={x.dayNightShift} name="checkedB" />
                                                    </Grid>
                                                    <Grid item>Day</Grid>
                                                </Grid>
                                            </Typography> */}
                                        </Typography>
                                    </CardContent>
                                    <CardContent>
                                        <TableContainer component={Paper}>
                                            <Table aria-label="customized table">
                                                <TableHead>
                                                    <TableRow>
                                                        <StyledTableCell>Day</StyledTableCell>
                                                        <StyledTableCell align="right">Time Start</StyledTableCell>
                                                        <StyledTableCell align="right">Time End</StyledTableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {JSON.parse(x.timePerDay).map((row) => (
                                                        <StyledTableRow key={row.day}>
                                                            <StyledTableCell component="th" scope="row">
                                                                {row.day}
                                                            </StyledTableCell>
                                                            <StyledTableCell align="right">{row.timeStart}</StyledTableCell>
                                                            <StyledTableCell align="right">{row.timeEnd}</StyledTableCell>
                                                        </StyledTableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </CardContent>
                                </CardActionArea>
                                <CardActions>
                                    <Button
                                        size="small"
                                        color="primary"
                                        disabled={role === "Administrator" || role === "HR" || role === "HR Staff" ? false : true}
                                        onClick={() => handleOpenEditModal(x)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        size="small"
                                        color="primary"
                                        disabled={role === "Administrator" || role === "HR" ? false : true}
                                        onClick={() => handleOpenDeletePopup(x.id)}
                                    >
                                        Delete
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    )}
                </Grid>
                {loader === true &&
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 200 }}>
                        <CircularProgress />
                    </div>
                }
                {departmentList.length === 0 && loader !== true &&
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 200 }}>
                        <h1 style={{ color: '#C4C4C4C4' }}>No Data Found</h1>
                    </div>
                }
            </div>

            <Modal
                aria-labelledby="spring-modal-title"
                aria-describedby="spring-modal-description"
                className={classes.modal}
                open={addModal}
                onClose={handleCloseAddModal}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                }}
            >
                <Fade in={addModal}>
                    <div className={classes.modalPaper}>
                        <div>
                            <h1>Add Employee</h1>
                        </div>
                        <Divider />
                        <br />
                        <form noValidate autoComplete="off">
                            <div>
                                <label style={{ fontSize: '17px' }}><strong>Department Name</strong></label><br />
                                <TextField variant='outlined' size='small' fullWidth placeholder="Department Name" value={department} onChange={e => setDepartment(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                            </div>

                            <br />

                            {/* <Typography gutterBottom variant="p" component="h3">
                                <Typography component="div">
                                    <Grid component="label" container alignItems="center" spacing={1}>
                                        <Grid item>Night</Grid>
                                        <Grid item>
                                            <IOSSwitch checked={dayNightShift} onChange={() => setDayNightShift(!dayNightShift)} name="checkedB" />
                                        </Grid>
                                        <Grid item>Day</Grid>
                                    </Grid>
                                </Typography>
                            </Typography> */}

                            <br />

                            <TableContainer component={Paper}>
                                <Table aria-label="customized table">
                                    <TableHead>
                                        <TableRow>
                                            <StyledTableCell>Day</StyledTableCell>
                                            <StyledTableCell align="right">Time Start</StyledTableCell>
                                            <StyledTableCell align="right">Time End</StyledTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                        <TableBody>
                                            <StyledTableRow>
                                                <StyledTableCell component="th" scope="row">
                                                    Monday
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        clearable={false}
                                                        // label="Time picker"
                                                        format='hh:mm a'
                                                        value={mondayTI}
                                                        onChange={e => setMondayTI(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={mondayTO}
                                                        onChange={e => setMondayTO(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                            </StyledTableRow>
                                            <StyledTableRow>
                                                <StyledTableCell component="th" scope="row">
                                                    Tuesday
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={tuesdayTI}
                                                        onChange={e => setTuesdayTI(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={tuesdayTO}
                                                        onChange={e => setTuesdayTO(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                            </StyledTableRow>
                                            <StyledTableRow>
                                                <StyledTableCell component="th" scope="row">
                                                    Wednesday
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={wednesdayTI}
                                                        onChange={e => setWednesdayTI(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={wednesdayTO}
                                                        onChange={e => setWednesdayTO(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                            </StyledTableRow>
                                            <StyledTableRow>
                                                <StyledTableCell component="th" scope="row">
                                                    Thursday
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={thursdayTI}
                                                        onChange={e => setThursdayTI(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={thursdayTO}
                                                        onChange={e => setThursdayTO(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                            </StyledTableRow>
                                            <StyledTableRow>
                                                <StyledTableCell component="th" scope="row">
                                                    Friday
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={fridayTI}
                                                        onChange={e => setFridayTI(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={fridayTO}
                                                        onChange={e => setFridayTO(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                            </StyledTableRow>
                                            <StyledTableRow>
                                                <StyledTableCell component="th" scope="row">
                                                    Saturday
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={saturdayTI}
                                                        onChange={e => setSaturdayTI(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={saturdayTO}
                                                        onChange={e => setSaturdayTO(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                            </StyledTableRow>
                                        </TableBody>
                                    </MuiPickersUtilsProvider>
                                </Table>
                            </TableContainer>

                            <br />

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                                    disabled={loader}
                                    loading={loader}
                                    onClick={handleAddDepartment}>
                                    <b>Submit</b>
                                </Button>
                            </div>
                        </form>
                    </div>
                </Fade>
            </Modal>


            <Modal
                aria-labelledby="spring-modal-title"
                aria-describedby="spring-modal-description"
                className={classes.modal}
                open={editModal}
                onClose={handleCloseEditModal}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                }}
            >
                <Fade in={editModal}>
                    <div className={classes.modalPaper}>
                        <div>
                            <h1>Edit Employee</h1>
                        </div>
                        <Divider />
                        <br />
                        <form noValidate autoComplete="off">
                            <div>
                                <label style={{ fontSize: '17px' }}><strong>Department Name</strong></label><br />
                                <TextField variant='outlined' size='small' fullWidth placeholder="Department Name" value={department} onChange={e => setDepartment(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                            </div>

                            <br />

                            {/* <Typography gutterBottom variant="p" component="h3">
                                <Typography component="div">
                                    <Grid component="label" container alignItems="center" spacing={1}>
                                        <Grid item>Night</Grid>
                                        <Grid item>
                                            <IOSSwitch checked={dayNightShift} onChange={() => setDayNightShift(!dayNightShift)} name="checkedB" />
                                        </Grid>
                                        <Grid item>Day</Grid>
                                    </Grid>
                                </Typography>
                            </Typography> */}

                            <br />

                            <TableContainer component={Paper}>
                                <Table aria-label="customized table">
                                    <TableHead>
                                        <TableRow>
                                            <StyledTableCell>Day</StyledTableCell>
                                            <StyledTableCell align="right">Time Start</StyledTableCell>
                                            <StyledTableCell align="right">Time End</StyledTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                        <TableBody>
                                            <StyledTableRow>
                                                <StyledTableCell component="th" scope="row">
                                                    Monday
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        clearable={false}
                                                        // label="Time picker"
                                                        format='hh:mm a'
                                                        value={mondayTI}
                                                        onChange={e => setMondayTI(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={mondayTO}
                                                        onChange={e => setMondayTO(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                            </StyledTableRow>
                                            <StyledTableRow>
                                                <StyledTableCell component="th" scope="row">
                                                    Tuesday
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={tuesdayTI}
                                                        onChange={e => setTuesdayTI(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={tuesdayTO}
                                                        onChange={e => setTuesdayTO(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                            </StyledTableRow>
                                            <StyledTableRow>
                                                <StyledTableCell component="th" scope="row">
                                                    Wednesday
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={wednesdayTI}
                                                        onChange={e => setWednesdayTI(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={wednesdayTO}
                                                        onChange={e => setWednesdayTO(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                            </StyledTableRow>
                                            <StyledTableRow>
                                                <StyledTableCell component="th" scope="row">
                                                    Thursday
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={thursdayTI}
                                                        onChange={e => setThursdayTI(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={thursdayTO}
                                                        onChange={e => setThursdayTO(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                            </StyledTableRow>
                                            <StyledTableRow>
                                                <StyledTableCell component="th" scope="row">
                                                    Friday
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={fridayTI}
                                                        onChange={e => setFridayTI(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={fridayTO}
                                                        onChange={e => setFridayTO(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                            </StyledTableRow>
                                            <StyledTableRow>
                                                <StyledTableCell component="th" scope="row">
                                                    Saturday
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={saturdayTI}
                                                        onChange={e => setSaturdayTI(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                                <StyledTableCell align="right">
                                                    <KeyboardTimePicker
                                                        margin="normal"
                                                        id="time-picker"
                                                        // label="Time picker"
                                                        value={saturdayTO}
                                                        onChange={e => setSaturdayTO(e)}
                                                        KeyboardButtonProps={{
                                                            'aria-label': 'change time',
                                                        }}
                                                    />
                                                </StyledTableCell>
                                            </StyledTableRow>
                                        </TableBody>
                                    </MuiPickersUtilsProvider>
                                </Table>
                            </TableContainer>

                            <br />

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                                    disabled={loader}
                                    loading={loader}
                                    onClick={handleEditDepartment}>
                                    <b>Submit</b>
                                </Button>
                            </div>
                        </form>
                    </div>
                </Fade>
            </Modal>

            <Modal
                aria-labelledby="spring-modal-title"
                aria-describedby="spring-modal-description"
                className={classes.modal}
                open={deletePopup}
                onClose={handleCloseDeleteModal}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                }}
            >
                <Fade in={deletePopup}>
                    <div className={classes.modalPaper}>
                        <div>
                            <h1>Warning</h1>
                        </div>
                        <Divider />
                        <br />

                        <p>Are you sure you want to delete this Department?</p>

                        <br />
                        <Divider />
                        <br />

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                size="large"
                                // style={{ float: 'right' }}
                                variant="contained"
                                color="default"
                                onClick={handleCloseDeleteModal}>
                                <b>Cancel</b>
                            </Button>
                            <Button
                                size="large"
                                style={{ marginLeft: 10 }}
                                variant="contained"
                                color='secondary'
                                startIcon={<Delete />}
                                disabled={loader}
                                loading={loader}
                                onClick={handleDeleteItem}>
                                <b>Delete</b>
                            </Button>
                        </div>
                    </div>
                </Fade>
            </Modal>
        </div>
    );
}

export default Department;