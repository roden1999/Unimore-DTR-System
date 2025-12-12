import React, { useState, useEffect } from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import CardActionArea from '@material-ui/core/CardActionArea';
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
import Chip from '@material-ui/core/Chip';
import Input from '@material-ui/core/Input';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import DateFnsUtils from '@date-io/date-fns';
import {
    MuiPickersUtilsProvider,
    KeyboardTimePicker,
    KeyboardDatePicker,
} from '@material-ui/pickers';
import { Save, Edit, Delete, Add, PictureAsPdf, Print } from '@material-ui/icons/';
import { useSpring, animated } from 'react-spring';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import { TextField } from '@material-ui/core';
import { DropzoneDialog } from 'material-ui-dropzone'
import * as XLSX from "xlsx";

//import pdfmake
import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const axios = require("axios");
const moment = require("moment");

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        backgroundColor: 'white',
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
        padding: theme.spacing(2, 4, 3),
    },
    tbcontainer: {
        maxHeight: 360,
    },
}));

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


const DetailedLogs = () => {
    const classes = useStyles();
    var dlSremarks = JSON.parse(sessionStorage.getItem("dlSremarks")) || { remarks: [] };
    var dlSemp = JSON.parse(sessionStorage.getItem("dlSemp")) || { emp: [] };
    var dlSdept = JSON.parse(sessionStorage.getItem("dlSdept")) || { dept: [] };
    var dlSfromDate = sessionStorage.getItem("dlSfromDate");
    var dlStoDate = sessionStorage.getItem("dlStoDate");
    const [loader, setLoader] = useState(true);
    const [logData, setLogData] = useState([]);
    const [employeeOptions, setEmployeeOptions] = useState(null);
    const [departmentOptions, setDepartmentOptions] = useState(null);
    const [addModal, setAddModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(dlSemp.emp);
    const [selectedRemarks, setSelectedRemarks] = useState(dlSremarks.remarks);
    const [selectedDepartment, setSelectedDepartment] = useState(dlSdept.dept);
    const [fromDate, setFromDate] = useState(dlSfromDate);
    const [toDate, setToDate] = useState(dlStoDate);
    const [totalEmployee, setTotalEmployee] = useState(0);
    const [page, setPage] = useState(0);

    useEffect(() => {
        var data = {
            selectedDetailedLogs: !selectedEmployee ? [] : selectedEmployee,
            selectedDepartment: !selectedDepartment ? [] : selectedDepartment,
            selectedRemarks: !selectedRemarks ? [] : selectedRemarks,
            fromDate: fromDate,
            toDate: toDate,
            page: page
        };
        var route = "timeLogs/detailed-list";
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");
        // const user = JSON.parse(sessionStorage.getItem('user'));
        axios
            .post(url, data)
            .then(function (response) {
                // handle success
                if (Array.isArray(response.data)) {
                    setLogData(response.data);
                    setLoader(false);
                } else {
                    var obj = [];
                    obj.push(response.data);
                    setLogData(obj);
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
    }, [selectedEmployee, selectedDepartment, selectedRemarks, page, toDate, fromDate, loader]);

    const logList = logData
        ? logData.map((x) => ({
            id: x._id,
            employeeNo: x.employeeNo,
            employeeName: x.employeeName,
            department: x.department,
            timeLogs: x.timeLogs,
            totalDays: x.totalDays,
            totalHoursWork: x.totalHoursWork,
            totalRestday: x.totalRestday,
            totalRestdayOt: x.totalRestdayOt,
            totalHoliday: x.totalHoliday,
            totalHolidayOt: x.totalHolidayOt,
            totalSpecialHoliday: x.totalSpecialHoliday,
            totalSpecialHolidayOt: x.totalSpecialHolidayOt,
            totalHolidayRestday: x.totalHolidayRestday,
            totalHolidayRestdayOt: x.totalHolidayRestdayOt,
            totalSpecialHolidayRestday: x.totalSpecialHolidayRestday,
            totalSpecialHolidayRestdayOt: x.totalSpecialHolidayRestdayOt,
            totalLate: x.totalLate,
            totalUT: x.totalUT,
            totalOT: x.totalOT,
            totalAbsent: x.totalAbsent,
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
        var list = [];
        if (item !== undefined || item !== null) {
            item.map((x) => {
                return list.push({
                    label: x.name,
                    value: x.employeeNo,
                });
            });
        }
        return list;
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

    function RemarksOption(item) {
        var list = [
            { label: "Late", value: "Late" },
            { label: "Overtime", value: "Overtime" },
        ];

        return list;
    }

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleImportLogs = (file) => {
        var selectedFile = file[0];
        var reader = new FileReader();
        const rABS = !!reader.readAsBinaryString;

        reader.onload = function (e) {
            var data = e.target.result;
            const wb = XLSX.read(data, { type: rABS ? "binary" : "array" });
            // wb.SheetNames[0].foreach(function(sheetName) {
            //     var XL_row_object = XLSX.utils.sheet_to_row_object_array(wb.Sheets[sheetName]);
            //     var json_object = JSON.stringify(XL_row_object);
            //     alert(json_object);
            // })
            var sheet_name_list = wb.SheetNames[0];
            var jsonFromExcel = XLSX.utils.sheet_to_csv(wb.Sheets[sheet_name_list], {
                raw: false,
                dateNF: "MM-DD-YYYY",
                header: 1,
                defval: ""
            })
            var lines = jsonFromExcel.split("\n");

            var result = [];

            var headers = lines[0].split(",");

            for (var i = 1; i < lines.length; i++) {
                var obj = {};
                var currentline = lines[i].split(",");

                for (var j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }

                if (obj.EnNo && obj.DaiGong) {
                    result.push(obj);
                }
            }
            // alert(JSON.stringify(result));

            var route = `timeLogs/import`;
            var url = window.apihost + route;
            var token = sessionStorage.getItem("auth-token");

            var data = {
                data: result
            };

            setLoader(true);

            axios
                .post(url, data, {
                    headers: {
                        "auth-token": token,
                    },
                })
                .then(function (response) {
                    // handle success
                    toast.success(response.data.logs, {
                        position: "top-center"
                    });
                    setAddModal(false);
                    setLoader(false);
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
        };

        reader.onerror = function (err) {
            alert("File could not be read! Code " + err.target.error.code);
        };

        reader.readAsBinaryString(selectedFile);
    }

    const handleCloseAddModal = () => {
        setAddModal(false);
    }

    const exportToPDF = (e) => {
        const document = {
            content: [
                { image: 'unimore', width: 180, height: 50 },
                {
                    columns: [
                        [
                            { text: e.employeeName, fontSize: 10, bold: true, lineHeight: 1 },
                            { text: e.department, fontSize: 10, bold: true, lineHeight: 1, },
                        ],
                        [
                            { text: "Date Covered: " + moment(fromDate).format("MMM DD") + " - " + moment(toDate).format("DD, yyyy"), fontSize: 10, bold: true, lineHeight: 1, },
                        ]
                    ]
                },
            ],
            images: {
                unimore: 'https://i.ibb.co/mTwt2jt/unimore-logo-back-black.png'
            }
        }
        document.content.push({
            // layout: 'lightHorizontalLines',
            table: {
                headerRows: 1,
                widths: [37, 50, 60, 30, 30, 30, 30, 34, 20, 20, 20, 37, 40],
                body: [
                    //Data
                    //Header
                    [
                        { text: 'Day', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Date', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Schedule', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'In', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Break Out', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Break In', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Out', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Hours Work', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Late', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'UT', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'OT', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Remarks', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Reason', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' }
                    ],
                ]
            },
        });

        e.timeLogs.forEach(y => {
            var color = "";
            const remarks = y.remarks || ""; // default to empty string
            if (remarks === "Special Holiday") color = "#7BFF66";
            if (remarks === "Regular Holiday") color = "#7BFF66";
            if (remarks === "Special Holiday w/o Pay") color = "#FF0C0C";
            if (remarks === "Regular Holiday w/o Pay") color = "#FF0C0C";
            if (remarks === "Working Regular Holiday" || remarks === "Working Special Holiday") color = "#20E700";
            if (remarks === "Absent") color = "#FF0C0C";
            if (remarks === "Working Regular Holiday Rest Day" || remarks === "Working Special Holiday Rest Day") color = "#2CFF72";

            document.content.push({
                // layout: 'lightHorizontalLines',
                table: {
                    headerRows: 1,
                    widths: [37, 50, 60, 30, 30, 30, 30, 34, 20, 20, 20, 37, 40],
                    body: [
                        //Data
                        [
                            { text: y.day.toString(), fontSize: 7, alignment: "center", color: y.day === "Sunday" ? "red" : "black", fillColor: color },
                            { text: moment(y.dateTime).format("MM/DD/yyyy").toString(), fontSize: 7, alignment: "center", fillColor: color },
                            { text: y.timeStartEnd.toString(), fontSize: 7, alignment: "center", fillColor: color },
                            { text: y.timeIn !== "Invalid date" ? y.timeIn.toString() : "", fontSize: 7, alignment: "center", fillColor: color },
                            { text: y.breakOut !== "Invalid date" ? y.breakOut.toString() : "", fontSize: 7, alignment: "center", fillColor: color },
                            { text: y.breakIn !== "Invalid date" ? y.breakIn.toString() : "", fontSize: 7, alignment: "center", fillColor: color },
                            { text: y.timeOut !== "Invalid date" ? y.timeOut.toString() : "", fontSize: 7, alignment: "center", fillColor: color },
                            { text: y.hoursWork.toString(), fontSize: 7, alignment: "right", fillColor: color },
                            { text: y.late.toString(), fontSize: 7, alignment: "right", fillColor: color },
                            { text: y.UT.toString(), fontSize: 7, alignment: "right", fillColor: color },
                            { text: y.OT.toString(), fontSize: 7, alignment: "right", fillColor: color },
                            { text: y.remarks !== "OT For Approval" ? y.remarks.toString() : "", fontSize: 7, alignment: "center", fillColor: color },
                            { text: y.reason.toString(), fontSize: 7, alignment: "left", fillColor: color }
                        ],
                    ],
                    lineHeight: 2
                },
            });
        });

        document.content.push({
            margin: [0, 5],
            columns: [
                [
                    { text: "Total Days: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Hours Work: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Late: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Undertime: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Overtime: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Restday: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Restday OT: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Regular Holiday: ", fontSize: 9, bold: true, lineHeight: 1, },
                ],
                [

                    { text: e.totalDays.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalHoursWork.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalLate.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalUT.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalOT.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalRestday.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalRestdayOt.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalHoliday.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                ],
                [
                    { text: "Total Absences: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Regular Holiday OT: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Special Holiday: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Special Holiday OT: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Regular Holiday Restday: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Regular Holiday Restday OT: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Special Holiday Restday: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Special Holiday Restday OT:", fontSize: 9, bold: true, lineHeight: 1, },
                ],
                [
                    { text: e.totalAbsent.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalHolidayOt.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalSpecialHoliday.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalSpecialHolidayOt.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalHolidayRestday.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalHolidayRestdayOt.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalSpecialHolidayRestday.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalSpecialHolidayRestdayOt.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                ],
            ],
            columnGap: 10
        });

        pdfMake.tableLayouts = {
            exampleLayout: {
                hLineWidth: function (i, node) {
                    if (i === 0 || i === node.table.body.length) {
                        return 0;
                    }
                    return (i === node.table.headerRows) ? 2 : 1;
                },
                vLineWidth: function (i) {
                    return 0;
                },
                hLineColor: function (i) {
                    return i === 1 ? 'black' : '#aaa';
                },
                paddingLeft: function (i) {
                    return i === 0 ? 0 : 8;
                },
                paddingRight: function (i, node) {
                    return (i === node.table.widths.length - 1) ? 0 : 8;
                }
            }
        };

        // pdfMake.createPdf(document).download();
        pdfMake.createPdf(document).print({}, window.frames['printPdf']);
    }

    const onSelectedEmployee = (e) => {
        setSelectedEmployee(e);
        var emp = { "emp": e }
        sessionStorage.setItem("dlSemp", JSON.stringify(emp));
    };

    const onSelectedDepartment = (e) => {
        setSelectedDepartment(e);
        var dept = { "dept": e }
        sessionStorage.setItem("dlSdept", JSON.stringify(dept));
    }

    const onToDate = (e) => {
        setToDate(e);
        sessionStorage.setItem("dlStoDate", e.toString());
    };

    const onFromDate = (e) => {
        setFromDate(e);
        sessionStorage.setItem("dlSfromDate", e.toString());
    }

    const handleFilterDepartment = (e) => {
        setSelectedDepartment(e);
        setPage(0);
    }

    const handleFilterRemarks = (e) => {
        var data = e ? e : [];
        setSelectedRemarks(data);
        // setPage(0);
    }

    const renderRemarksChip = (remarks) => {
        const map = {
            "Absent": { color: "secondary" },
            "Undertime": { color: "default", bg: "#FFE633" },
            "Rest Day": { color: "default", bg: "#33FEE5" },
            "Working Rest Day": { color: "default", bg: "#00A2FF" },
            "Regular Holiday": { color: "default", bg: "#7BFF66" },
            "Special Holiday": { color: "default", bg: "#7BFF66" },
            "Regular Holiday w/o Pay": { color: "default", bg: "#FF0C0C" },
            "Special Holiday w/o Pay": { color: "default", bg: "#FF0C0C" },
            "Overtime": { color: "primary" },
            "Late": { color: "primary", bg: "#FFA908" },
            "Offset": { color: "default", bg: "#233A46" },
            "Manual Log": { color: "default", bg: "#233A46" },
            "SL w/ Pay": { color: "default", bg: "#FF00F3" },
            "SL w/o Pay": { color: "default", bg: "#FF00F3" },
            "VL w/ Pay": { color: "default", bg: "#FF00F3" },
            "VL w/o Pay": { color: "default", bg: "#FF00F3" },
        };

        if (!map[remarks]) return null;

        return (
            <Chip
                label={remarks}
                color={map[remarks].color}
                style={map[remarks].bg ? { backgroundColor: map[remarks].bg } : {}}
            />
        );
    };


    return (
        <div className={classes.root}>

            <ToastContainer />
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
                    defaultValue={selectedRemarks}
                    options={RemarksOption()}
                    onChange={e => handleFilterRemarks(e)}
                    placeholder='Remarks Filter'
                    isClearable
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

            <div style={{ padding: 10, backgroundColor: '#F4F4F4', marginTop: 60, height: '100', minHeight: '68vh', maxHeight: '68vh', overflowY: 'scroll' }}>
                <Grid container spacing={3}>
                    {Array.isArray(logList) && logList.length > 0 && !loader
                        ? logList.map((x, idx) => (
                            <Grid item xs={12} key={idx}>
                                <Card>
                                    <CardContent>
                                        <Button
                                            size="small"
                                            style={{ float: "right" }}
                                            variant="contained"
                                            color="default"
                                            startIcon={<Print />}
                                            onClick={() => exportToPDF(x)}
                                        >
                                            Print Logs
                                        </Button>

                                        <Typography style={{ fontSize: 14 }} color="textSecondary" gutterBottom>
                                            {x?.employeeNo || ""}
                                        </Typography>
                                        <Typography variant="h5" component="h2">
                                            {x?.employeeName || ""}
                                        </Typography>
                                        <Typography color="textSecondary">{x?.department || ""}</Typography>

                                        <div
                                            style={{
                                                padding: 10,
                                                backgroundColor: "#F4F4F4",
                                                marginTop: 10,
                                                minHeight: "40vh",
                                                maxHeight: "40vh",
                                                overflowY: "auto",
                                            }}
                                        >
                                            <TableContainer className={classes.tbcontainer}>
                                                <Table stickyHeader aria-label="sticky table">
                                                    <TableHead>
                                                        <TableRow>
                                                            {[
                                                                "Day",
                                                                "Date",
                                                                "Time Start / End",
                                                                "Time In",
                                                                "Break Out",
                                                                "Break In",
                                                                "Time Out",
                                                                "Hours Work",
                                                                "Late",
                                                                "UT",
                                                                "OT",
                                                                "Remarks",
                                                                "Reason",
                                                            ].map((header) => (
                                                                <StyledTableCell key={header}>{header}</StyledTableCell>
                                                            ))}
                                                        </TableRow>
                                                    </TableHead>

                                                    <TableBody>
                                                        {Array.isArray(x?.timeLogs) &&
                                                            x.timeLogs.map((y, i) => (
                                                                <StyledTableRow hover role="checkbox" tabIndex={-1} key={i}>
                                                                    <StyledTableCell style={{ color: y?.day === "Sunday" ? "red" : "" }}>
                                                                        {y?.day || ""}
                                                                    </StyledTableCell>
                                                                    <StyledTableCell>
                                                                        {y?.dateTime ? moment(y.dateTime).format("MMM DD, yyyy") : ""}
                                                                    </StyledTableCell>
                                                                    <StyledTableCell>{y?.timeStartEnd || ""}</StyledTableCell>
                                                                    <StyledTableCell>{y?.timeIn !== "Invalid date" ? y?.timeIn : ""}</StyledTableCell>
                                                                    <StyledTableCell>{y?.breakOut !== "Invalid date" ? y?.breakOut : ""}</StyledTableCell>
                                                                    <StyledTableCell>{y?.breakIn !== "Invalid date" ? y?.breakIn : ""}</StyledTableCell>
                                                                    <StyledTableCell>{y?.timeOut !== "Invalid date" ? y?.timeOut : ""}</StyledTableCell>
                                                                    <StyledTableCell>{y?.hoursWork || ""}</StyledTableCell>
                                                                    <StyledTableCell>{y?.late || ""}</StyledTableCell>
                                                                    <StyledTableCell>{y?.UT || ""}</StyledTableCell>
                                                                    <StyledTableCell>{y?.OT || ""}</StyledTableCell>
                                                                    <StyledTableCell>{y?.remarks ? renderRemarksChip(y.remarks) : ""}</StyledTableCell>
                                                                    <StyledTableCell>{y?.reason || ""}</StyledTableCell>
                                                                </StyledTableRow>
                                                            ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </div>
                                    </CardContent>

                                    <CardActions>
                                        <Grid container spacing={3}>
                                            {[
                                                {
                                                    totalDays: "Total Days",
                                                    totalHoursWork: "Hours Work",
                                                    totalOT: "Overtime",
                                                    totalHolidayRestday: "Holiday Restday",
                                                    totalHolidayRestdayOt: "Holiday Restday OT",
                                                },
                                                {
                                                    totalLate: "Late",
                                                    totalRestday: "Restday (hrs)",
                                                    totalRestdayOt: "Restday OT (hrs)",
                                                    totalSpecialHolidayRestday: "Special Holiday Restday (hrs)",
                                                },
                                                {
                                                    totalUT: "Undertime",
                                                    totalHoliday: "Regular Holiday (hrs)",
                                                    totalHolidayOt: "Regular Holiday OT (hrs)",
                                                    totalSpecialHolidayRestdayOt: "Special Holiday Restday OT (hrs)",
                                                },
                                                {
                                                    totalAbsent: "Absent",
                                                    totalSpecialHoliday: "Special Holiday (hrs)",
                                                    totalSpecialHolidayOt: "Special Holiday OT (hrs)",
                                                },
                                            ].map((group, gIdx) => (
                                                <Grid item xs={3} key={gIdx}>
                                                    {Object.entries(group).map(([key, label]) => (
                                                        <Typography style={{ fontSize: 15 }} key={key}>
                                                            <b>
                                                                {label}: {x?.[key] || 0}
                                                            </b>
                                                        </Typography>
                                                    ))}
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))
                        : null}
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

            <DropzoneDialog
                open={addModal}
                // onSave={this.handleSave.bind(this)}
                onSave={e => handleImportLogs(e)}
                // acceptedFiles={['image/jpeg', 'image/png', 'image/bmp']}
                acceptedFiles={['.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel']}
                showPreviews={true}
                filesLimit={1}
                showFileNames={true}
                maxFileSize={5000000}
                onClose={handleCloseAddModal}
            />
        </div >
    );
}

export default DetailedLogs;