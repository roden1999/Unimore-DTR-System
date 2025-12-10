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
import TableRow from '@material-ui/core/TableRow';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import Input from '@material-ui/core/Input';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import { Save, Edit, Delete, Add, Print } from '@material-ui/icons/';
import { useSpring, animated } from 'react-spring';
import Select from 'react-select';
import Portal from '@material-ui/core/Portal';
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
        maxHeight: '80vh'
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
        maxHeight: 650,
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

const customSelectStyle = {
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


const RawLogs = () => {
    const classes = useStyles();
    var rawSemp = JSON.parse(sessionStorage.getItem("rawSemp"));
    var rawSfromDate = sessionStorage.getItem("rawSfromDate");
    var rawStoDate = sessionStorage.getItem("rawStoDate");
    const [loader, setLoader] = useState(true);
    const [logData, setLogData] = useState(null);
    const [printData, setPrintData] = useState(null);
    const [departmentOptions, setDepartmentOptions] = useState(null);
    const [employeeOptions, setEmployeeOptions] = useState(null);
    const [id, setId] = useState(-1);
    const [employeeNo, setEmployeeNo] = useState("");
    const [firstName, setFirstName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [lastName, setLastName] = useState("");
    const [department, setDepartment] = useState("");
    const [contactNo, setContactNo] = useState("");
    const [gender, setGender] = useState("");
    const [address, setAddress] = useState("");
    const [addModal, setAddModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [deletePopup, setDeletePopup] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(rawSemp.emp);
    const [fromDate, setFromDate] = useState(rawSfromDate);
    const [toDate, setToDate] = useState(rawStoDate);
    const [totalLogs, setTotalLogs] = useState(0);
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
            selectedLogs: !selectedEmployee ? [] : selectedEmployee,
            fromDate: fromDate,
            toDate: toDate,
            page: page
        };
        var route = "timeLogs/raw-list";
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
    }, [selectedEmployee, fromDate, toDate, page, loader]);

    useEffect(() => {
        var data = {
            selectedLogs: !selectedEmployee ? [] : selectedEmployee,
            fromDate: fromDate,
            toDate: toDate,
        };
        var route = "timeLogs/print-raw-list";
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");
        // const user = JSON.parse(sessionStorage.getItem('user'));
        axios
            .post(url, data)
            .then(function (response) {
                // handle success
                if (Array.isArray(response.data)) {
                    setPrintData(response.data);
                    setLoader(false);
                } else {
                    var obj = [];
                    obj.push(response.data);
                    setPrintData(obj);
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
    }, [selectedEmployee, fromDate, toDate, page, loader]);

    const logList = logData
        ? logData.map((x) => ({
            id: x._id,
            employeeNo: x.employeeNo,
            employeeName: x.employeeName,
            timeInOut: x.timeInOut,
            dateTime: x.dateTime
        }))
        : [];

    const printList = printData
        ? printData.map((x) => ({
            id: x._id,
            employeeNo: x.employeeNo,
            employeeName: x.employeeName,
            timeInOut: x.timeInOut,
            dateTime: x.dateTime
        }))
        : [];

    useEffect(() => {
        var route = "employees/options";
        var url = window.apihost + route;
        var token = sessionStorage.getItem("auth-token");

        axios
            .get(url, {
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
    }, [loader]);

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
        var route = "timeLogs/total-logs";
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");
        var data = {
            selectedLogs: !selectedEmployee ? [] : selectedEmployee,
            fromDate: fromDate,
            toDate: toDate,
        };
        axios
            .post(url, data)
            .then(function (response) {
                // handle success
                var total = response.data !== "" ? response.data : 0;
                setTotalLogs(total);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .finally(function () {
                // always executed
            });
    }, [employeeOptions, selectedEmployee, fromDate, toDate, loader]);

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

    const handleUploadXlsFile = (e) => {
        const formData = new FormData();
        formData.append('file', e[0]);

        var route = `timeLogs/uploadxls`;
        var url = window.apihost + route;
        var token = sessionStorage.getItem("auth-token");

        setLoader(true);

        axios
            .post(url, formData, {
                headers: {
                    'access-control-allow-origin': '*',
                    'accept': 'application/json',
                    'Content-Type': 'multipart/form-data',
                    'auth-token': token,
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
    }

    const handleCloseAddModal = () => {
        setAddModal(false);
    }

    const onSelectedEmployee = (e) => {
        setSelectedEmployee(e);
        var emp = { "emp": e }
        sessionStorage.setItem("rawSemp", JSON.stringify(emp));
    };

    const onToDate = (e) => {
        setToDate(e);
        sessionStorage.setItem("rawStoDate", e.toString());
    };

    const onFromDate = (e) => {
        setFromDate(e);
        sessionStorage.setItem("rawSfromDate", e.toString());
    }

    const exportToPDF = (e) => {
        const document = {
            content: [
                { image: 'unimore', width: 210, height: 60, alignment: "center" },
                {
                    columns: [
                        [
                            { text: "UNIMORE TRADING CORPORATION", fontSize: 10, bold: true, lineHeight: 2 },
                            { text: "Raw Logs Copy (Biometrics Data)", fontSize: 10, bold: true, lineHeight: 2, },
                        ],
                        [
                            { text: "Date/Time Printed: " + moment().format("MM/DD/yyy hh:mm A"), fontSize: 10, bold: true, lineHeight: 2, },
                            { text: "Date Range: " + moment(fromDate).format("MM/DD/yyy").toString() + " - " + moment(toDate).format("MM/DD/yyyy").toString(), fontSize: 10, bold: true, lineHeight: 2, },
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
                widths: [80, 160, 60, 60, 100],
                body: [
                    //Data
                    //Header
                    [
                        { text: 'Employee No.', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Employee Name', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Mode | In/Out', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Time', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Date', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                    ],
                ]
            },
        });

        e.map(y => {
            var color = "";

            document.content.push({
                // layout: 'lightHorizontalLines',
                table: {
                    headerRows: 1,
                    widths: [80, 160, 60, 60, 100],
                    body: [
                        //Data
                        [
                            { text: y.employeeNo, fontSize: 7, alignment: "center", fillColor: color },
                            { text: y.employeeName, fontSize: 7, alignment: "center", fillColor: color },
                            { text: y.timeInOut === "S" ? "Time In" : "Time Out", fontSize: 7, alignment: "center", color: y.timeInOut === "S" ? "blue" : "red", fillColor: color },
                            { text: moment(y.dateTime).format("hh:mm A").toString(), fontSize: 7, alignment: "center", fillColor: color },
                            { text: moment(y.dateTime).format("MMM DD, yyyy").toString(), fontSize: 7, alignment: "center", fillColor: color },
                        ],
                    ],
                    lineHeight: 2
                },
            });
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

    return (
        <div className={classes.root}>
            <Portal>
                <ToastContainer />
            </Portal>

            <Button
                size="large"
                style={{ float: 'left' }}
                variant="contained"
                color="default"
                startIcon={<Add />}
                disabled={role === "Administrator" || role === "Device Manager" ? false : true}
                onClick={() => setAddModal(true)}>
                Import Logs
            </Button>

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
                    styles={customSelectStyle}
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

            <Button
                size="large"
                style={{ float: 'right', marginRight: 10 }}
                variant="contained"
                color="default"
                startIcon={<Print />}
                disabled={role === "Administrator" || role === "Device Manager" ? false : true}
                onClick={() => exportToPDF(printList)}>Print Raw Logs</Button>

            <div style={{ padding: 10, backgroundColor: '#F4F4F4', marginTop: 60, height: '100', minHeight: '68vh', maxHeight: '68vh', overFlowY: 'auto' }}>
                <TableContainer className={classes.tbcontainer}>
                    <Table stickyHeader aria-label="sticky table">
                        <TableHead>
                            <TableRow>
                                <StyledTableCell>Employee No</StyledTableCell>
                                <StyledTableCell>Employee Name</StyledTableCell>
                                <StyledTableCell>Mode</StyledTableCell>
                                <StyledTableCell>Time</StyledTableCell>
                                <StyledTableCell>Date</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {logList.length !== 0 && logList.map(x =>
                                <StyledTableRow hover role="checkbox" tabIndex={-1} key={x.id}>
                                    <StyledTableCell>
                                        {x.employeeNo}
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        {x.employeeName}
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        {x.timeInOut === "S" ?
                                            <Chip
                                                label={"Time In"}
                                                color="primary"
                                                variant="outlined"
                                            // style={{ backgroundColor: '#1AEC02' }}
                                            /> :
                                            <Chip
                                                label={"Time Out"}
                                                color="secondary"
                                                variant="outlined"
                                            // style={{ backgroundColor: '#0953F2' }}
                                            />
                                        }
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        {moment(x.dateTime).format("hh:mm A")}
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        {moment(x.dateTime).format("MMM DD, yyyy")}
                                    </StyledTableCell>
                                </StyledTableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {Object.keys(selectedEmployee).length === 0 &&
                    <TablePagination
                        // rowsPerPageOptions={[10, 25, 100]}
                        labelRowsPerPage=''
                        rowsPerPageOptions={[]}
                        component="div"
                        count={totalLogs}
                        rowsPerPage={20}
                        page={page}
                        onChangePage={handleChangePage}
                    // onChangeRowsPerPage={handleChangeRowsPerPage}
                    />
                }

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

            <DropzoneDialog
                open={addModal}
                dialogTitle={"Upload file from NIDEKA NU-2302 Biometrics device."}
                // onSave={this.handleSave.bind(this)}
                // onSave={e => handleImportLogs(e)}
                onSave={e => handleUploadXlsFile(e)}
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

export default RawLogs;