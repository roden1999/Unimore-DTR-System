import React, { useState, useEffect } from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import CircularProgress from '@material-ui/core/CircularProgress';
import TableRow from '@material-ui/core/TableRow';
import Button from '@material-ui/core/Button';
import Switch from '@material-ui/core/Switch';
import MuiAlert from '@material-ui/lab/Alert';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import Portal from '@material-ui/core/Portal';
import DateFnsUtils from '@date-io/date-fns';
import {
    MuiPickersUtilsProvider,
    KeyboardTimePicker,
    KeyboardDatePicker,
} from '@material-ui/pickers';
import { Save, Edit, Delete, Add } from '@material-ui/icons/';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import { useSpring, animated } from 'react-spring';
import Select from '../common/Dropdown';
import { TextField } from '@material-ui/core';
import EmployeeAvatar from '../common/EmployeeAvatar';

const axios = require("axios");
const moment = require("moment");

const useStyles = makeStyles((theme) => ({
    root: {
        // flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
        padding: 20,
        borderRadius: 10,
        height: '100%',
        minHeight: '80vh',
        maxHeight: '80vh',
        overflow: 'hidden'
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
    },
    modalPaper: {
        backgroundColor: theme.palette.background.paper,
        border: '2px solid #000',
        boxShadow: theme.shadows[5],
        padding: theme.spacing(0, 4, 0),
        // minHeight: '700px',
        maxHeight: '700px',
        overflowY: "scroll"
    },
    tbcontainer: {
        maxHeight: 375,
    },
}));

const AntSwitch = withStyles((theme) => ({
    root: {
        width: 32,
        height: 20,
        padding: 0,
        display: 'flex',
    },
    switchBase: {
        padding: 2,
        color: theme.palette.grey[500],
        '&$checked': {
            transform: 'translateX(12px)',
            color: theme.palette.common.white,
            '& + $track': {
                opacity: 1,
                backgroundColor: theme.palette.primary.main,
                borderColor: theme.palette.primary.main,
            },
        },
    },
    thumb: {
        width: 16,
        height: 16,
        boxShadow: 'none',
    },
    track: {
        border: `1px solid ${theme.palette.grey[500]}`,
        borderRadius: 16 / 2,
        opacity: 1,
        backgroundColor: theme.palette.background.paper,
    },
    checked: {},
}))(Switch);

function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
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


const DtrCorrection = () => {
    const classes = useStyles();
    var dtrSemp = JSON.parse(sessionStorage.getItem("dtrSemp") || "{}");
    var dtrSdept = JSON.parse(sessionStorage.getItem("dtrSdept") || "{}");
    var dtrSfromDate = sessionStorage.getItem("dtrSfromDate") || moment().startOf('month').format("YYYY-MM-DD");
    var dtrStoDate = sessionStorage.getItem("dtrStoDate") || moment().format("YYYY-MM-DD");
    const [loader, setLoader] = useState(true);
    const [logData, setLogData] = useState(null);
    const [employeeNo, setEmployeeNo] = useState("")
    const [employeeName, setEmployeeName] = useState("")
    const [department, setDepartment] = useState("");
    const [timeIn, setTimeIn] = useState(moment().format("MM DD, yyyy 8:00"));
    const [timeOut, setTimeOut] = useState(moment().format("MM DD, yyyy 17:00"));
    const [otHours, setOtHours] = useState(0);
    const [hourswork, setHourswork] = useState(0);
    const [undertime, setUndertime] = useState(0);
    const [breakTimeHrs, setBreakTimeHrs] = useState("");
    const [breakTime, setBreakTime] = useState(false);
    const [date, setDate] = useState(moment().format("MM/DD/yyyy"));
    const [remarks, setRemarks] = useState("");
    const [reason, setReason] = useState("");
    const [employeeOptions, setEmployeeOptions] = useState(null);
    const [departmentOptions, setDepartmentOptions] = useState(null);
    const [addModal, setAddModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(dtrSemp.emp || []);
    const [selectedDepartment, setSelectedDepartment] = useState(dtrSdept.dept || []);
    const [fromDate, setFromDate] = useState(dtrSfromDate);
    const [toDate, setToDate] = useState(dtrStoDate);
    const [totalEmployee, setTotalEmployee] = useState(0);
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [page, setPage] = useState(0);

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        setRole(user.role);
        setName(user.Name);
    }, []);

    useEffect(() => {
        var data = {
            selectedDtrcLogs: !selectedEmployee ? [] : selectedEmployee,
            selectedDepartment: !selectedDepartment ? [] : selectedDepartment,
            fromDate: fromDate,
            toDate: toDate,
            page: page
        };
        var route = "timeLogs/dtr-correction";
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");
        // const user = JSON.parse(sessionStorage.getItem('user'));
        axios
            .post(url, data)
            .then(function (response) {
                // handle success
                setLogData(Array.isArray(response.data) ? response.data : []);
                setLoader(false);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
                setLogData([]);
                setLoader(false);
            })
            .finally(function () {
                // always executed
            });
    }, [selectedEmployee, selectedDepartment, page, toDate, fromDate, loader]);

    const logList = logData
        ? logData.map((x) => ({
            id: x._id,
            employeeNo: x.employeeNo,
            employeeName: x.employeeName,
            image: x.image || '',
            department: x.department,
            timeLogs: Array.isArray(x.timeLogs) ? x.timeLogs : [],
        }))
        : [];

    useEffect(() => {
        var route = "employees/employee-options";
        var url = window.apihost + route;
        var token = sessionStorage.getItem("auth-token");

        var data = {
            selectedDepartment: !selectedDepartment ? [] : selectedDepartment
        };
        axios
            .post(url, data, {
                headers: { "auth-token": token },
            })
            .then(function (response) {
                // handle success
                if (Array.isArray(response.data)) {
                    setEmployeeOptions(response.data);
                } else {
                    var obj = [];
                    obj.push(response.data);
                    setEmployeeOptions(obj);
                }
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .finally(function () {
                // always executed
            });
    }, [loader, selectedDepartment]);

    const employeeOptionsList = employeeOptions
        ? employeeOptions.map((x) => ({
            id: x._id,
            name: x.lastName + " " + x.firstName + " " + x.middleName + " " + x.suffix + " - (" + x.employeeNo + ")",
            employeeNo: x.employeeNo
        }))
        : [];

    function EmployeeOption(item) {
        if (!Array.isArray(item)) return [];
        return item.map((x) => ({ label: x.name, value: x.employeeNo }));
    }

    useEffect(() => {
        var route = "employees/total-employees";
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");

        var data = {
            selectedDepartment: !selectedDepartment ? [] : selectedDepartment
        };

        axios
            .post(url, data)
            .then(function (response) {
                // handle success
                var total = response.data !== "" ? response.data : 0;
                setTotalEmployee(total);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .finally(function () {
                // always executed
            });
    }, [employeeOptions, selectedEmployee, loader]);

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

    function DepartmentSearchOption(item) {
        if (!Array.isArray(item)) return [];
        return item.map((x) => ({ label: x.name, value: x.id }));
    }


    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleCloseAddModal = () => {
        setAddModal(false);
        setEmployeeNo("");
        setEmployeeName("");
        setDepartment("");
        setDate(moment().format("MM/DD/yyyy"));
        setTimeIn(moment().format("MM DD, yyyy 8:00"));
        setTimeOut(moment().format("MM DD, yyyy 17:00"));
        setOtHours(0);
        setHourswork(0);
        setUndertime(0);
        setBreakTimeHrs(0);
        setBreakTime(false);
        setRemarks("");
        setReason("");
    }

    const handleOpenModal = (params) => {
        var ti = params.timeIn ? moment(params.date).format("MM/DD/yyyy") + " " + params.timeIn : "";
        var to = params.timeOut ? moment(params.date).format("MM/DD/yyyy") + " " + params.timeOut : "";
        setAddModal(true);
        setEmployeeNo(params.empNo);
        setEmployeeName(params.empName);
        setDepartment(params.department);
        setDate(moment(params.date).format("MM/DD/yyyy"));
        setTimeIn(ti);
        setTimeOut(to);
        setBreakTime(params.breakTime);
    }

    function RemarksOption(item) {
        var list = [
            { label: "Manual Timelog", value: "Manual Timelog" },
            { label: "Overtime", value: "Overtime" },
            { label: "Offset", value: "Offset" },
            { label: "Working Rest Day", value: "Working Rest Day" },
            { label: "Working Regular Holiday", value: "Working Regular Holiday" },
            { label: "Working Special Holiday", value: "Working Special Holiday" },
            // { label: "Working Holiday Rest Day", value: "Working Holiday Rest Day" },
            { label: "Working Regular Holiday Rest Day", value: "Working Regular Holiday Rest Day" },
            { label: "Working Special Holiday Rest Day", value: "Working Special Holiday Rest Day" },
            { label: "Sick Leave w/ Pay", value: "SL w/ Pay" },
            { label: "Sick Leave w/o Pay", value: "SL w/o Pay" },
            { label: "Vacation Leave w/ Pay", value: "VL w/ Pay" },
            { label: "Vacation Leave w/o Pay", value: "VL w/o Pay" },
            { label: "Personal Leave", value: "Personal Leave" },
            { label: "Emergency Leave", value: "Emergency Leave" },
        ];

        return list;
    }

    const handleSubmitRecord = () => {
        var route = "timeLogs/approved-dtr-correction";
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");

        var data = {
            employeeNo: employeeNo,
            employeeName: employeeName,
            department: department,
            date: date,
            timeIn: moment(timeIn).format("h:mm A"),
            timeOut: moment(timeOut).format("h:mm A"),
            breakTime: breakTime,
            otHours: otHours,
            hourswork: hourswork,
            undertime: undertime,
            breakTimeHrs: breakTimeHrs,
            remarks: !remarks ? "" : remarks.value,
            reason: reason
        }

        setLoader(true);

        axios
            .post(url, data)
            .then(function (response) {
                // handle success
                toast.success(response.data.dtrc, {
                    position: "top-center"
                });
                setAddModal(false);
                setLoader(false);
                setEmployeeNo("");
                setEmployeeName("");
                setDepartment("");
                setDate(moment().format("MM/DD/yyyy"));
                setTimeIn(moment().format("MM DD, yyyy 8:00"));
                setTimeOut(moment().format("MM DD, yyyy 17:00"));
                setBreakTime(false);
                setOtHours(0);
                setHourswork(0);
                setUndertime(0);
                setBreakTimeHrs("");
                setRemarks("");
                setReason("");
            })
            .catch(function (error) {
                // handle error
                toast.error(JSON.stringify(error.response?.data?.error || error.message), {
                    position: "top-center"
                });
                setLoader(false);
            })
            .finally(function () {
                // always executed
            });
    }

    const onSelectedEmployee = (e) => {
        setSelectedEmployee(e);
        var emp = { "emp": e }
        sessionStorage.setItem("dtrSemp", JSON.stringify(emp));
    };

    const onSelectedDepartment = (e) => {
        setSelectedDepartment(e);
        var dept = { "dept": e }
        sessionStorage.setItem("dtrSdept", JSON.stringify(dept));
    }

    const onToDate = (e) => {
        setToDate(e);
        sessionStorage.setItem("dtrStoDate", e.toString());
    };

    const onFromDate = (e) => {
        setFromDate(e);
        sessionStorage.setItem("dtrSfromDate", e.toString());
    }

    const handleFilterDepartment = (e) => {
        setSelectedDepartment(e);
        setPage(0);
    }

    return (
        <div className={classes.root}>
            <Portal>
                <ToastContainer />
            </Portal>
            {/* <Button
                size="large"
                style={{ float: 'left' }}
                variant="contained"
                color="default"
                startIcon={<Add />}
                onClick={() => setAddModal(true)}>Import Logs</Button> */}

            <div style={{
                float: 'right', width: '30%', zIndex: 100,
            }}>
                <Select
                    defaultValue={selectedEmployee}
                    options={EmployeeOption(employeeOptionsList)}
                    onChange={e => onSelectedEmployee(e)}
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

            <div style={{
                float: 'right', width: '15%', zIndex: 100, marginRight: 10
            }}>
                <Select
                    defaultValue={selectedDepartment}
                    options={DepartmentSearchOption(departmentOptionsList)}
                    onChange={e => handleFilterDepartment(e)}
                    placeholder='Department'
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

            <TextField
                id="date"
                label="To Date"
                type="date"
                variant="outlined"
                size="small"
                defaultValue={moment().format("DD/MM/yyyy")}
                value={toDate}
                onChange={e => onToDate(e.target.value)}
                className={classes.textField}
                InputLabelProps={{
                    shrink: true,
                }}
                style={{ float: 'right', marginRight: 10 }}
            />
            <TextField
                id="date"
                label="From Date"
                type="date"
                variant="outlined"
                size="small"
                defaultValue={moment().startOf('month').format("DD/MM/yyyy")}
                value={fromDate}
                onChange={e => onFromDate(e.target.value)}
                className={classes.textField}
                InputLabelProps={{
                    shrink: true,
                }}
                style={{ float: 'right', marginRight: 10 }}
            />

            <div style={{ padding: 10, backgroundColor: 'var(--app-bg-subtle)', marginTop: 60, height: '100', minHeight: '65vh', maxHeight: '65vh', overflowY: 'scroll' }}>
                <Grid container spacing={3}>
                    {logList.length !== 0 && loader !== true && logList.map(x =>
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><EmployeeAvatar image={x.image} name={x.employeeName} size={56} /><div><Typography style={{ fontSize: 14 }} color="textSecondary">{x.employeeNo}</Typography><Typography variant="h5">{x.employeeName}</Typography><Typography color="textSecondary">{x.department}</Typography></div></div>

                                    <div style={{ padding: 10, backgroundColor: 'var(--app-bg-subtle)', marginTop: 60, height: '100%', minHeight: '40vh', maxHeight: '40vh', overflowY: 'auto' }}>
                                        <TableContainer className={classes.tbcontainer}>
                                            <Table stickyHeader aria-label="sticky table">
                                                <TableHead>
                                                    <TableRow>
                                                        <StyledTableCell>Day</StyledTableCell>
                                                        <StyledTableCell>Date</StyledTableCell>
                                                        <StyledTableCell>Time In</StyledTableCell>
                                                        <StyledTableCell>Time Out</StyledTableCell>
                                                        <StyledTableCell>Remarks</StyledTableCell>
                                                        <StyledTableCell>Reason</StyledTableCell>
                                                        <StyledTableCell>Action</StyledTableCell>
                                                    </TableRow>
                                                </TableHead>
                                                {(Array.isArray(x.timeLogs) ? x.timeLogs : []).map(y =>
                                                    <TableBody>
                                                        <StyledTableRow hover role="checkbox" tabIndex={-1} key={y.id}>
                                                            <StyledTableCell>
                                                                {y.day}
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                {moment(y.date).format("MMM DD, yyyy")}
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                {y.timeIn !== "Invalid date" ? y.timeIn : ""}
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                {y.timeOut !== "Invalid date" ? y.timeOut : ""}
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                {y.remarks}
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                {y.reason}
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                <Button
                                                                    variant="contained"
                                                                    color="primary"
                                                                    disableElevation
                                                                    disabled={role === "Administrator" || role === "HR" ? false : true}
                                                                    onClick={() => handleOpenModal(y)}
                                                                >
                                                                    Manage Record
                                                                </Button>
                                                            </StyledTableCell>
                                                        </StyledTableRow>
                                                    </TableBody>
                                                )}
                                            </Table>
                                        </TableContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
                {loader === true &&
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 200 }}>
                        <CircularProgress />
                    </div>
                }
                {logList.length === 0 && loader !== true &&
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 200 }}>
                        <h1 style={{ color: '#C4C4C4C4' }}>No Data Found</h1>
                    </div>
                }
            </div>

            {Object.keys(selectedEmployee).length === 0 &&
                <TablePagination
                    // rowsPerPageOptions={[10, 25, 100]}
                    labelRowsPerPage=''
                    rowsPerPageOptions={[]}
                    component="div"
                    count={totalEmployee}
                    rowsPerPage={5}
                    page={page}
                    onChangePage={handleChangePage}
                // onChangeRowsPerPage={handleChangeRowsPerPage}
                />
            }

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
                        <div style={{ position: "sticky", top: 0, backgroundColor: 'var(--app-bg-paper)', zIndex: 2 }}>
                            <h1>Manage Record</h1>
                            <h3>{employeeName}</h3>
                            <h4>{moment(date).format("MMM DD, yyyy")}</h4>
                        </div>
                        <Divider />
                        <br />
                        <form noValidate autoComplete="off">
                            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                <div style={{ marginBottom: 15 }}>
                                    <label style={{ fontSize: '17px' }}><b>Remarks</b></label>
                                    <Select
                                        defaultValue={remarks}
                                        options={RemarksOption()}
                                        onChange={e => setRemarks(e)}
                                        placeholder='Remarks...'
                                        // isClearable
                                        // isMulti
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

                                {Object.keys(remarks).length > 0 &&
                                    remarks.value !== "Overtime" &&
                                    remarks.value !== "SL w/ Pay" &&
                                    remarks.value !== "SL w/o Pay" &&
                                    remarks.value !== "VL w/ Pay" &&
                                    remarks.value !== "VL w/o Pay" &&
                                    remarks.value !== "Personal Leave" &&
                                    remarks.value !== "Emergency Leave" &&

                                    <div style={{ marginBottom: 10 }}>
                                        <label style={{ fontSize: '17px' }}><strong>Time In</strong></label><br />
                                        <KeyboardTimePicker
                                            margin="normal"
                                            id="time-picker"
                                            // label="Time picker"
                                            inputVariant="outlined"
                                            value={timeIn}
                                            onChange={e => setTimeIn(e)}
                                            KeyboardButtonProps={{
                                                'aria-label': 'change time',
                                            }}
                                        />
                                    </div>
                                }

                                {Object.keys(remarks).length > 0 &&
                                    remarks.value !== "Overtime" &&
                                    remarks.value !== "SL w/ Pay" &&
                                    remarks.value !== "SL w/o Pay" &&
                                    remarks.value !== "VL w/ Pay" &&
                                    remarks.value !== "VL w/o Pay" &&
                                    remarks.value !== "Personal Leave" &&
                                    remarks.value !== "Emergency Leave" &&

                                    <div style={{ marginBottom: 10 }}>
                                        <label style={{ fontSize: '17px' }}><strong>Time Out</strong></label><br />
                                        <KeyboardTimePicker
                                            margin="normal"
                                            id="time-picker"
                                            // label="Time picker"
                                            inputVariant="outlined"
                                            value={timeOut}
                                            onChange={e => setTimeOut(e)}
                                            KeyboardButtonProps={{
                                                'aria-label': 'change time',
                                            }}
                                        />
                                    </div>
                                }

                                <br />

                                {Object.keys(remarks).length > 0 &&
                                    remarks.value === "Overtime" &&
                                    remarks.value !== "SL w/ Pay" &&
                                    remarks.value !== "SL w/o Pay" &&
                                    remarks.value !== "VL w/ Pay" &&
                                    remarks.value !== "VL w/o Pay" &&
                                    remarks.value !== "Personal Leave" &&
                                    remarks.value !== "Emergency Leave" &&
                                    <div>
                                        <label style={{ fontSize: '17px' }}><strong>OT Hours</strong></label><br />
                                        <TextField variant="outlined" size="small" type="number" fullWidth placeholder="ot hours" value={otHours} onChange={e => setOtHours(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                                        <br />
                                        <br />
                                    </div>
                                }


                                {Object.keys(remarks).length > 0 &&
                                    remarks.value !== "SL w/ Pay" &&
                                    remarks.value !== "SL w/o Pay" &&
                                    remarks.value !== "VL w/ Pay" &&
                                    remarks.value !== "VL w/o Pay" &&
                                    remarks.value !== "Personal Leave" &&
                                    remarks.value !== "Emergency Leave" &&
                                    <div>
                                        <Typography component="div" style={{ marginBottom: 10 }}>
                                            <Grid component="label" container alignItems="center" spacing={1}>
                                                <Grid item><label style={{ fontSize: '17px' }}><strong>Break Time: </strong>No</label></Grid>
                                                <Grid item>
                                                    <AntSwitch checked={breakTime} onChange={() => setBreakTime(!breakTime)} name="checkedC" />
                                                </Grid>
                                                <Grid item><label style={{ fontSize: '17px' }}>Yes</label></Grid>
                                            </Grid>
                                        </Typography>
                                    </div>
                                }

                                {Object.keys(remarks).length > 0 &&
                                    remarks.value !== "SL w/ Pay" &&
                                    remarks.value !== "SL w/o Pay" &&
                                    remarks.value !== "VL w/ Pay" &&
                                    remarks.value !== "VL w/o Pay" &&
                                    remarks.value !== "Personal Leave" &&
                                    remarks.value !== "Emergency Leave" &&
                                    breakTime === true &&
                                    <div>
                                        <label style={{ fontSize: '17px' }}><strong>Breaktime Hours</strong></label><br />
                                        <TextField variant="outlined" size="small" type="number" fullWidth placeholder="breaktime hours" value={breakTimeHrs} onChange={e => setBreakTimeHrs(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                                    </div>
                                }

                                {Object.keys(remarks).length > 0 &&
                                    remarks.value === "Manual Timelog" &&
                                    remarks.value !== "SL w/ Pay" &&
                                    remarks.value !== "SL w/o Pay" &&
                                    remarks.value !== "VL w/ Pay" &&
                                    remarks.value !== "VL w/o Pay" &&
                                    remarks.value !== "Personal Leave" &&
                                    remarks.value !== "Emergency Leave" &&
                                    <div>
                                        <label style={{ fontSize: '17px' }}><strong>Hourswork</strong></label><br />
                                        <TextField variant="outlined" size="small" type="number" fullWidth placeholder="hourswork" value={hourswork} onChange={e => setHourswork(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                                        <br />
                                        <br />
                                    </div>
                                }

                                {Object.keys(remarks).length > 0 &&
                                    remarks.value === "Manual Timelog" &&
                                    remarks.value !== "Overtime" &&
                                    remarks.value !== "SL w/ Pay" &&
                                    remarks.value !== "SL w/o Pay" &&
                                    remarks.value !== "VL w/ Pay" &&
                                    remarks.value !== "VL w/o Pay" &&
                                    remarks.value !== "Personal Leave" &&
                                    remarks.value !== "Emergency Leave" &&
                                    <div>
                                        <label style={{ fontSize: '17px' }}><strong>OT Hours</strong></label><br />
                                        <TextField variant="outlined" size="small" type="number" fullWidth placeholder="ot hours" value={otHours} onChange={e => setOtHours(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                                        <br />
                                        <br />
                                    </div>
                                }

                                {Object.keys(remarks).length > 0 &&
                                    remarks.value === "Manual Timelog" &&
                                    remarks.value !== "SL w/ Pay" &&
                                    remarks.value !== "SL w/o Pay" &&
                                    remarks.value !== "VL w/ Pay" &&
                                    remarks.value !== "VL w/o Pay" &&
                                    remarks.value !== "Personal Leave" &&
                                    remarks.value !== "Emergency Leave" &&
                                    <div>
                                        <label style={{ fontSize: '17px' }}><strong>Undertime</strong></label><br />
                                        <TextField variant="outlined" size="small" type="number" fullWidth placeholder="undertime" value={undertime} onChange={e => setUndertime(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                                        <br />
                                        <br />
                                    </div>
                                }

                                <br />

                                <div>
                                    <label style={{ fontSize: '17px' }}><strong>Reason</strong></label><br />
                                    <TextField variant='outlined' size='small' fullWidth placeholder="reason" value={reason} onChange={e => setReason(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                                </div>

                                <br />

                                <div style={{ position: "sticky", bottom: 0, backgroundColor: 'var(--app-bg-paper)', zIndex: 2 }}>
                                    <Button
                                        size="large"
                                        // style={{ float: 'right' }}
                                        style={{ marginBottom: 20, marginTop: 20 }}
                                        variant="contained"
                                        color="default"
                                        onClick={handleCloseAddModal}
                                    >
                                        <b>Cancel</b>
                                    </Button>
                                    <Button
                                        size="large"
                                        style={{ marginLeft: 10, marginBottom: 20, marginTop: 20 }}
                                        variant="contained"
                                        color="default"
                                        startIcon={<Save />}
                                        onClick={handleSubmitRecord}
                                    >
                                        <b>Submit</b>
                                    </Button>
                                </div>
                            </MuiPickersUtilsProvider>
                        </form>
                    </div>
                </Fade>
            </Modal>
        </div >
    );
}

export default DtrCorrection;
