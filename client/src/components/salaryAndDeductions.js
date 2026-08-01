import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
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
import TablePagination from '@material-ui/core/TablePagination';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import { Save, Edit, Delete, Add } from '@material-ui/icons/';
import { useSpring, animated } from 'react-spring';
// import { useSpring, animated } from 'react-spring/web.cjs';
import Select from './common/Dropdown';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import { TextField } from '@material-ui/core';
import EmployeeAvatar from './common/EmployeeAvatar';

const axios = require("axios");
const moment = require("moment");

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
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
    },
    modalPaper: {
        backgroundColor: theme.palette.background.paper,
        border: '2px solid #000',
        boxShadow: theme.shadows[5],
        padding: theme.spacing(2, 4, 3),
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

const SalaryAndDeduction = () => {
    const classes = useStyles();
    const [loader, setLoader] = useState(true);
    const [employeeData, setEmployeeData] = useState(null);
    const [departmentOptions, setDepartmentOptions] = useState(null);
    const [employeeOptions, setEmployeeOptions] = useState(null);
    const [id, setId] = useState(-1);
    const [employeeNo, setEmployeeNo] = useState("");
    const [employeeName, setEmployeeName] = useState("");
    const [department, setDepartment] = useState("");
    const [salary, setSalary] = useState("");
    const [sss, setSSS] = useState("");
    const [phic, setPhic] = useState("");
    const [hdmf, setHdmf] = useState("");
    const [sssLoan, setSssLoan] = useState("");
    const [pagibigLoan, setPagibigLoan] = useState("");
    const [careHealthPlus, setCareHealthPlus] = useState("");
    const [cashAdvance, setCashAdvance] = useState("");
    const [safetyShoes, setSafetyShoes] = useState("");
    const [addModal, setAddModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [deletePopup, setDeletePopup] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState([]);
    const [totalEmp, setTotalEmp] = useState(0);
    const [page, setPage] = useState(0);

    useEffect(() => {
        var data = {
            selectedEmployee: !selectedEmployee ? [] : selectedEmployee,
            selectedDepartment: !selectedDepartment ? [] : selectedDepartment,
            page: page
        };
        var route = "salary/list";
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");
        // const user = JSON.parse(sessionStorage.getItem('user'));
        axios
            .post(url, data)
            .then(function (response) {
                // handle success
                if (Array.isArray(response.data)) {
                    setEmployeeData(response.data);
                    setLoader(false);
                } else {
                    var obj = [];
                    obj.push(response.data);
                    setEmployeeData(obj);
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
    }, [page, selectedEmployee, selectedDepartment, loader]);

    const employeeList = employeeData
        ? employeeData.map((x) => ({
            id: x._id,
            employeeNo: x.employeeNo,
            employeeName: x.employeeName,
            image: x.image || '',
            // deptId: x.deptId,
            department: x.department,
            salary: x.salary,
            salaryId: x.salaryId,
            sss: x.sss,
            phic: x.phic,
            hdmf: x.hdmf,
            sssLoan: x.sssLoan,
            pagibigLoan: x.pagibigLoan,
            careHealthPlus: x.careHealthPlus,
            cashAdvance: x.cashAdvance,
            safetyShoes: x.safetyShoes,
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
            name: x.firstName + " " + x.middleName + " " + x.lastName + " - (" + x.employeeNo + ")",
        }))
        : [];

    function EmployeeOption(item) {
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
                setTotalEmp(total);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .finally(function () {
                // always executed
            });
    }, [employeeOptions, selectedEmployee, loader]);

    const handleEditSalary = () => {
        var route = `salary/`;
        var url = window.apihost + route;
        var token = sessionStorage.getItem("auth-token");

        var data = {
            // id: id,
            employeeId: id,
            salary: salary,
            sss: sss,
            phic: phic,
            hdmf: hdmf,
            sssLoan: sssLoan,
            pagibigLoan: pagibigLoan,
            careHealthPlus: careHealthPlus,
            cashAdvance: cashAdvance,
            safetyShoes: safetyShoes
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
                toast.success(response.data.salary + ' successfully saved.', {
                    position: "top-center"
                });
                setEditModal(false);
                setLoader(false);
                setId(-1);
                setEmployeeNo("");
                setEmployeeName("");
                setSSS("");
                setPhic("");
                setHdmf("");
                setSssLoan("");
                setPagibigLoan("");
                setCareHealthPlus("");
                setCashAdvance("");
                setSafetyShoes("");
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
        setEditModal(true);
        setLoader(false);
        setId(params.id);
        setEmployeeNo(params.employeeNo);
        setEmployeeName(params.employeeName);
        setSalary(params.salary);
        setSSS(params.sss);
        setPhic(params.phic);
        setHdmf(params.hdmf);
        setSssLoan(params.sssLoan);
        setPagibigLoan(params.pagibigLoan);
        setCareHealthPlus(params.careHealthPlus);
        setCashAdvance(params.cashAdvance);
        setSafetyShoes(params.safetyShoes);
    }

    const handleCloseEditModal = () => {
        setEditModal(false);
        setLoader(false);
        setId(-1);
        setEmployeeNo("");
        setEmployeeName("");
        setSSS("");
        setPhic("");
        setHdmf("");
        setSssLoan("");
        setPagibigLoan("");
        setCareHealthPlus("");
        setCashAdvance("");
        setSafetyShoes("");
    }

    const handleDeleteItem = () => {
        var url = window.apihost + `salary/${id}`;
        var token = sessionStorage.getItem("auth-token");
        setLoader(true);
        axios
            .delete(url, {
                headers: { "auth-token": token },
            })
            .then(function (response) {
                // handle success
                if (response.status <= 200) {
                    toast.success(`Employee's salary successfully deleted.`, {
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
    }

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleFilterDepartment = (e) => {
        setSelectedDepartment(e);
        setPage(0);
    }

    return (
        <div className={classes.root}>

            <ToastContainer />

            <div style={{
                float: 'right', width: '30%', zIndex: 100,
            }}>
                <Select
                    defaultValue={selectedEmployee}
                    options={EmployeeOption(employeeOptionsList)}
                    onChange={e => setSelectedEmployee(e)}
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

            <div style={{ padding: 10, backgroundColor: 'var(--app-bg-subtle)', marginTop: 60, height: '100', minHeight: '75vh', maxHeight: '75vh', overflowY: 'scroll' }}>
                <Grid container spacing={3}>
                    {employeeList.length > 0 && employeeList.map(x =>
                        <Grid item xs={4}>
                            <Card>
                                <CardActionArea>
                                    <CardContent>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}><EmployeeAvatar image={x.image} name={x.employeeName} size={48} />
                                        <Typography gutterBottom>
                                            <strong>{x.employeeName + " - (" + x.employeeNo + ")"}</strong>
                                        </Typography>
                                        </div>
                                        <Typography gutterBottom>
                                            <strong>Salary: ₱{x.salary.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</strong>
                                        </Typography>
                                        <Grid container spacing={3}>
                                            <Grid item xs>
                                                <Typography>SSS: {x.sss.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Typography>
                                                <Typography>PHIC: {x.phic.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Typography>
                                                <Typography>HDMF: {x.hdmf.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Typography>
                                                <Typography>Cash Advance: {x.cashAdvance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Typography>
                                            </Grid>

                                            <Grid item xs>
                                                <Typography>SSS Loan: {x.sssLoan.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Typography>
                                                <Typography>Pag-Ibig Loan: {x.pagibigLoan.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Typography>
                                                <Typography>Care Health Plus: {x.careHealthPlus.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Typography>
                                                <Typography>Safety Shoes: {x.safetyShoes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </CardActionArea>
                                <CardActions>
                                    <Button size="small" color="primary" onClick={() => handleOpenEditModal(x)}>
                                        Edit
                                    </Button>
                                    {x.salaryId !== "No Salary" &&
                                        <Button size="small" color="primary" onClick={() => handleOpenDeletePopup(x.salaryId)}>
                                            Delete
                                        </Button>
                                    }
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
                {employeeList.length === 0 && loader !== true &&
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
                    count={totalEmp}
                    rowsPerPage={20}
                    page={page}
                    onChangePage={handleChangePage}
                // onChangeRowsPerPage={handleChangeRowsPerPage}
                />
            }

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
                            <h1>Edit Salary</h1>
                            <h4>{employeeName + " - (" + employeeNo + ")"}</h4>
                        </div>
                        <Divider />
                        <br />
                        <form noValidate autoComplete="off">
                            <div>
                                <label style={{ fontSize: '17px' }}><strong>Salary</strong></label><br />
                                <TextField variant='outlined' size='small' fullWidth placeholder="Salary" type="number" value={salary} onChange={e => setSalary(e.target.value)}
                                    InputProps={{ startAdornment: <InputAdornment position="start">₱</InputAdornment>, }}
                                />
                            </div>

                            <br />

                            <Grid container spacing={3}>
                                <Grid item xs>
                                    <div>
                                        <label style={{ fontSize: '17px' }}><strong>SSS</strong></label><br />
                                        <TextField type="number" variant='outlined' size='small' fullWidth placeholder="SSS" type="number" value={sss} onChange={e => setSSS(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                                    </div>
                                    <br />

                                    <div>
                                        <label style={{ fontSize: '17px' }}><strong>PHIC</strong></label><br />
                                        <TextField variant='outlined' size='small' fullWidth placeholder="PHIC" type="number" value={phic} onChange={e => setPhic(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                                    </div>

                                    <br />
                                    <div>
                                        <label style={{ fontSize: '17px' }}><strong>HDMF</strong></label><br />
                                        <TextField variant='outlined' size='small' fullWidth placeholder="HDMF" type="number" value={hdmf} onChange={e => setHdmf(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                                    </div>
                                    <br />
                                </Grid>

                                <Grid item xs>
                                    <div>
                                        <label style={{ fontSize: '17px' }}><strong>SSS Loan</strong></label><br />
                                        <TextField variant='outlined' size='small' fullWidth placeholder="SSS Loan" type="number" value={sssLoan} onChange={e => setSssLoan(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                                    </div>

                                    <br />
                                    <div>
                                        <label style={{ fontSize: '17px' }}><strong>Pag-Ibig Loan</strong></label><br />
                                        <TextField variant='outlined' size='small' fullWidth placeholder="Pag-Ibig Loan" type="number" value={pagibigLoan} onChange={e => setPagibigLoan(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                                    </div>

                                    <br />
                                    <div>
                                        <label style={{ fontSize: '17px' }}><strong>Care Health Plus</strong></label><br />
                                        <TextField variant='outlined' size='small' fullWidth placeholder="Care Health Plus" type="number" value={careHealthPlus} onChange={e => setCareHealthPlus(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                                    </div>

                                    <br />
                                    <div>
                                        <label style={{ fontSize: '17px' }}><strong>Cash Advance</strong></label><br />
                                        <TextField variant='outlined' size='small' fullWidth placeholder="Cash Adcance" type="number" value={cashAdvance} onChange={e => setCashAdvance(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                                    </div>

                                    <br />
                                    <div>
                                        <label style={{ fontSize: '17px' }}><strong>Safety Shoes</strong></label><br />
                                        <TextField variant='outlined' size='small' fullWidth placeholder="Care Health Plus" type="number" value={safetyShoes} onChange={e => setSafetyShoes(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                                    </div>

                                    <br />
                                </Grid>
                            </Grid>

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
                                    onClick={handleEditSalary}>
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

                        <p>Are you sure you want to delete this employee's salary?</p>

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

export default SalaryAndDeduction;
