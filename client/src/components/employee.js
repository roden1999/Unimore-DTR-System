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
import Input from '@material-ui/core/Input';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import { Save, Edit, Delete, Add } from '@material-ui/icons/';
import { useSpring, animated } from 'react-spring';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import { TextField } from '@material-ui/core';
import Switch from '@material-ui/core/Switch';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  TableContainer
} from '@material-ui/core';
import { FormControlLabel } from '@material-ui/core';

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
  container: base => ({
    ...base,
    flex: 1,
  }),
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

const Employee = () => {
  const classes = useStyles();
  const [loader, setLoader] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [employeeData, setEmployeeData] = useState(null);
  const [departmentOptions, setDepartmentOptions] = useState(null);
  const [employeeOptions, setEmployeeOptions] = useState(null);
  const [id, setId] = useState(-1);
  const [employeeNo, setEmployeeNo] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [department, setDepartment] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState([]);
  const [totalEmp, setTotalEmp] = useState(0);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    setRole(user.role);
    setName(user.Name);
  }, []);

  useEffect(() => {
    setLoader(true);
    var data = {
      selectedEmployee: !selectedEmployee ? [] : selectedEmployee,
      selectedDepartment: !selectedDepartment ? [] : selectedDepartment,
      page: page
    };
    var route = "employees/list";
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
  }, [page, selectedEmployee, selectedDepartment]);

  const employeeList = employeeData
    ? employeeData.map((x) => ({
      id: x._id,
      employeeNo: x.employeeNo,
      firstName: x.firstName,
      middleName: x.middleName,
      lastName: x.lastName,
      suffix: x.suffix,
      deptId: x.deptId,
      department: x.department,
      contactNo: x.contactNo,
      gender: x.gender,
      address: x.address,
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

  function GenderOption() {
    var list = [
      { label: "Male", value: "Male" },
      { label: "Female", value: "Female" }
    ];
    return list;
  }

  const handleAddEmployee = () => {
    var route = "employees/";
    var url = window.apihost + route;
    var token = sessionStorage.getItem("auth-token");

    var data = {
      employeeNo: employeeNo,
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      suffix: suffix,
      department: department ? department.value : "",
      contactNo: contactNo,
      gender: gender ? gender.value : "",
      address: address,
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
        toast.success(response.data.employee + ' successfully saved.', {
          position: "top-center"
        });
        setAddModal(false);
        setLoader(false);
        setId(-1);
        setEmployeeNo("");
        setFirstName("");
        setMiddleName("");
        setLastName("");
        setSuffix("");
        setDepartment("");
        setGender("");
        setContactNo("");
        setGender("");
        setAddress("");
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
    setEmployeeNo("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setSuffix("");
    setDepartment("");
    setGender("");
    setContactNo("");
    setAddress("");
  }

  const handleEditEmployee = () => {
    var route = `employees/${id}`;
    var url = window.apihost + route;
    var token = sessionStorage.getItem("auth-token");

    var data = {
      // id: id,
      employeeNo: employeeNo,
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      suffix: suffix,
      department: department ? department.value : "",
      contactNo: contactNo,
      gender: gender ? gender.value : "",
      address: address,
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
        toast.success(response.data.employee + ' successfully saved.', {
          position: "top-center"
        });
        setEditModal(false);
        setLoader(false);
        setId(-1);
        setEmployeeNo("");
        setFirstName("");
        setMiddleName("");
        setLastName("");
        setSuffix("");
        setDepartment("");
        setGender("");
        setContactNo("");
        setAddress("");
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
    var dep = params.department !== "" ? { label: params.department, value: params.deptId } : [];
    var gndr = params.gender !== "" ? { label: params.gender, value: params.gender } : [];
    setEditModal(true);
    setLoader(false);
    setId(params.id);
    setEmployeeNo(params.employeeNo);
    setFirstName(params.firstName);
    setMiddleName(params.middleName);
    setLastName(params.lastName);
    setSuffix(params.suffix);
    setDepartment(dep);
    setGender(gndr);
    setContactNo(params.contactNo);
    setAddress(params.address);
  }

  const handleCloseEditModal = () => {
    setEditModal(false);
    setLoader(false);
    setId(-1);
    setEmployeeNo("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setSuffix("");
    setDepartment("");
    setGender("");
    setContactNo("");
    setAddress("");
  }

  const handleDeleteItem = () => {
    var url = window.apihost + `employees/${id}`;
    var token = sessionStorage.getItem("auth-token");
    setLoader(true);
    axios
      .delete(url, {
        headers: { "auth-token": token },
      }).then(function (response) {
        // handle success
        toast.success('Employee successfully deleted.', {
          position: "top-center"
        })
        setId(-1);
        setLoader(false);
        setDeletePopup(false);
      }).catch((err) => {
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
    setEmployeeNo("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setSuffix("");
    setDepartment("");
    setContactNo("");
    setAddress("");
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleFilterDepartment = (e) => {
    setSelectedDepartment(e);
    setPage(0);
  }

  const toggleView = () => {
    setViewMode(prev => (prev === 'card' ? 'table' : 'card'));
  };

  return (
    <div style={{ padding: 20 }}>
      <ToastContainer />

      {/* Header Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 }}>
        <Button
          size="large"
          variant="contained"
          color="default"
          startIcon={<Add />}
          onClick={() => setAddModal(true)}
        >
          Add Employee
        </Button>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControlLabel
            control={<Switch checked={viewMode === 'table'} onChange={toggleView} />}
            label={viewMode === 'table' ? 'Table View' : 'Card View'}
          />

          <Select
            defaultValue={selectedEmployee}
            options={EmployeeOption(employeeOptionsList)}
            onChange={e => setSelectedEmployee(e)}
            placeholder="Search..."
            isClearable
            isMulti
            styles={{ container: base => ({ ...base, minWidth: 200 }) }}
          />

          <Select
            defaultValue={selectedDepartment}
            options={DepartmentSearchOption(departmentOptionsList)}
            onChange={e => handleFilterDepartment(e)}
            placeholder="Department"
            isClearable
            isMulti
            styles={{ container: base => ({ ...base, minWidth: 150 }) }}
          />
        </div>
      </div>

      {/* Outer container */}
      <div
        style={{
          backgroundColor: '#F4F4F4',
          padding: 10,
          height: '75vh',         // fix the height for scrollable content
          overflowY: 'auto',      // vertical scroll
        }}
      >
        {loader ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}>
            <CircularProgress />
          </div>
        ) : employeeList.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}>
            <h1 style={{ color: '#C4C4C4' }}>No Data Found</h1>
          </div>
        ) : viewMode === 'card' ? (
          <Grid container spacing={3}>
            {employeeList.map((x, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card>
                  <CardActionArea>
                    <CardContent>
                      <Typography gutterBottom variant="h5">
                        {`${x.lastName} ${x.firstName} ${x.middleName} ${x.suffix}`}
                      </Typography>
                      <Typography gutterBottom variant="body2">
                        Employee No: {x.employeeNo}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Department: {x.department} <br />
                        Gender: {x.gender} <br />
                        Contact No: {x.contactNo} <br />
                        Address: {x.address}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                  <CardActions>
                    <Button size="small" color="primary" onClick={() => handleOpenEditModal(x)}>Edit</Button>
                    <Button
                      size="small"
                      color="primary"
                      disabled={!(role === "Administrator" || role === "HR")}
                      onClick={() => handleOpenDeletePopup(x.id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ borderCollapse: 'collapse', minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      border: '1px solid #ccc',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: '#fff',
                      zIndex: 3,
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ccc' }}>Employee No</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ccc' }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ccc' }}>Gender</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ccc' }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid #ccc' }}>Address</TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      border: '1px solid #ccc',
                      position: 'sticky',
                      right: 0,
                      backgroundColor: '#fff',
                      zIndex: 3,
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employeeList.map((x, index) => (
                  <TableRow key={index}>
                    <TableCell
                      sx={{
                        border: '1px solid #ccc',
                        position: 'sticky',
                        left: 0,
                        backgroundColor: '#fff',
                        zIndex: 1,
                      }}
                    >
                      {`${x.lastName} ${x.firstName} ${x.middleName} ${x.suffix}`}
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #ccc' }}>{x.employeeNo}</TableCell>
                    <TableCell sx={{ border: '1px solid #ccc' }}>{x.department}</TableCell>
                    <TableCell sx={{ border: '1px solid #ccc' }}>{x.gender}</TableCell>
                    <TableCell sx={{ border: '1px solid #ccc' }}>{x.contactNo}</TableCell>
                    <TableCell sx={{ border: '1px solid #ccc' }}>{x.address}</TableCell>
                    <TableCell
                      sx={{
                        border: '1px solid #ccc',
                        position: 'sticky',
                        right: 0,
                        backgroundColor: '#fff',
                        zIndex: 1,
                      }}
                    >
                      <Button size="small" color="primary" onClick={() => handleOpenEditModal(x)}>Edit</Button>
                      <Button
                        size="small"
                        color="primary"
                        disabled={!(role === "Administrator" || role === "HR")}
                        onClick={() => handleOpenDeletePopup(x.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>

      {/* Pagination */}
      <div style={{ marginTop: 10 }}>
        {viewMode === 'table' || Object.keys(selectedEmployee).length === 0 ? (
          <TablePagination
            rowsPerPageOptions={[]}
            component="div"
            count={totalEmp}
            rowsPerPage={20}
            page={page}
            onPageChange={handleChangePage} // updated prop for MUI v5
          />
        ) : null}
      </div>

      {/* Add Employee Modal */}
      <Modal
        open={addModal}
        onClose={handleCloseAddModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={addModal}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              padding: '30px 25px',
              width: '90%',
              maxWidth: 500,
              margin: 'auto',
              outline: 'none',
              boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              maxHeight: '90vh',
              overflowY: 'auto',
              marginTop: 20
            }}
          >
            <h2 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Add Employee</h2>
            <Divider style={{ marginBottom: 10 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>Employee No</label>
              <TextField fullWidth variant="outlined" size="small" value={employeeNo} onChange={e => setEmployeeNo(e.target.value)} placeholder="Employee No" />

              <label style={{ fontSize: 14, fontWeight: 500 }}>First Name</label>
              <TextField fullWidth variant="outlined" size="small" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" />

              <label style={{ fontSize: 14, fontWeight: 500 }}>Middle Name / Middle Initial</label>
              <TextField fullWidth variant="outlined" size="small" value={middleName} onChange={e => setMiddleName(e.target.value)} placeholder="Middle Name" />

              <label style={{ fontSize: 14, fontWeight: 500 }}>Last Name</label>
              <TextField fullWidth variant="outlined" size="small" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" />

              <label style={{ fontSize: 14, fontWeight: 500 }}>Suffix</label>
              <TextField fullWidth variant="outlined" size="small" value={suffix} onChange={e => setSuffix(e.target.value)} placeholder="Suffix" />

              <label style={{ fontSize: 14, fontWeight: 500 }}>Department</label>
              <Select
                defaultValue={department}
                options={DepartmentOption(departmentOptionsList)}
                onChange={e => setDepartment(e)}
                placeholder='Department...'
                theme={theme => ({
                  ...theme,
                  colors: { ...theme.colors, text: '#333', primary25: '#e3f2fd', primary: '#1e88e5' },
                })}
                styles={customSelectStyle}
              />

              <label style={{ fontSize: 14, fontWeight: 500 }}>Gender</label>
              <Select
                defaultValue={gender}
                options={GenderOption()}
                onChange={e => setGender(e)}
                placeholder='Gender...'
                theme={theme => ({
                  ...theme,
                  colors: { ...theme.colors, text: '#333', primary25: '#e3f2fd', primary: '#1e88e5' },
                })}
                styles={customSelectStyle}
              />

              <label style={{ fontSize: 14, fontWeight: 500 }}>Contact No</label>
              <TextField type="number" fullWidth variant="outlined" size="small" value={contactNo} onChange={e => setContactNo(e.target.value)} placeholder="Contact No" />

              <label style={{ fontSize: 14, fontWeight: 500 }}>Address</label>
              <TextField fullWidth variant="outlined" size="small" value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={handleCloseAddModal}
                style={{ flex: '1 1 45%', borderRadius: 10, color: '#555', borderColor: '#ccc', textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Save />}
                onClick={handleAddEmployee}
                disabled={loader}
                loading={loader}
                style={{ flex: '1 1 45%', borderRadius: 10, background: 'linear-gradient(90deg, #1e88e5, #42a5f5)', color: '#fff', textTransform: 'none' }}
              >
                Submit
              </Button>
            </div>
          </div>
        </Fade>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        open={editModal}
        onClose={handleCloseEditModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={editModal}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              padding: '30px 25px',
              width: '90%',
              maxWidth: 500,
              margin: 'auto',
              outline: 'none',
              boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              maxHeight: '90vh',
              overflowY: 'auto',
              marginTop: 20
            }}
          >
            <h2 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Edit Employee</h2>
            <Divider style={{ marginBottom: 10 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>Employee No</label>
              <TextField fullWidth variant="outlined" size="small" value={employeeNo} onChange={e => setEmployeeNo(e.target.value)} placeholder="Employee No" />

              <label style={{ fontSize: 14, fontWeight: 500 }}>First Name</label>
              <TextField fullWidth variant="outlined" size="small" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" />

              <label style={{ fontSize: 14, fontWeight: 500 }}>Middle Name</label>
              <TextField fullWidth variant="outlined" size="small" value={middleName} onChange={e => setMiddleName(e.target.value)} placeholder="Middle Name" />

              <label style={{ fontSize: 14, fontWeight: 500 }}>Last Name</label>
              <TextField fullWidth variant="outlined" size="small" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" />

              <label style={{ fontSize: 14, fontWeight: 500 }}>Suffix</label>
              <TextField fullWidth variant="outlined" size="small" value={suffix} onChange={e => setSuffix(e.target.value)} placeholder="Suffix" />

              <label style={{ fontSize: 14, fontWeight: 500 }}>Department</label>
              <Select
                defaultValue={department}
                options={DepartmentOption(departmentOptionsList)}
                onChange={e => setDepartment(e)}
                placeholder='Department...'
                theme={theme => ({
                  ...theme,
                  colors: { ...theme.colors, text: '#333', primary25: '#e3f2fd', primary: '#1e88e5' },
                })}
                styles={customSelectStyle}
              />

              <label style={{ fontSize: 14, fontWeight: 500 }}>Gender</label>
              <Select
                defaultValue={gender}
                options={GenderOption()}
                onChange={e => setGender(e)}
                placeholder='Gender...'
                theme={theme => ({
                  ...theme,
                  colors: { ...theme.colors, text: '#333', primary25: '#e3f2fd', primary: '#1e88e5' },
                })}
                styles={customSelectStyle}
              />

              <label style={{ fontSize: 14, fontWeight: 500 }}>Contact No</label>
              <TextField type="number" fullWidth variant="outlined" size="small" value={contactNo} onChange={e => setContactNo(e.target.value)} placeholder="Contact No" />

              <label style={{ fontSize: 14, fontWeight: 500 }}>Address</label>
              <TextField fullWidth variant="outlined" size="small" value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={handleCloseEditModal}
                style={{ flex: '1 1 45%', borderRadius: 10, color: '#555', borderColor: '#ccc', textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Save />}
                onClick={handleEditEmployee}
                disabled={loader}
                loading={loader}
                style={{ flex: '1 1 45%', borderRadius: 10, background: 'linear-gradient(90deg, #1e88e5, #42a5f5)', color: '#fff', textTransform: 'none' }}
              >
                Submit
              </Button>
            </div>
          </div>
        </Fade>
      </Modal>

      {/* Delete Employee Modal */}
      <Modal
        open={deletePopup}
        onClose={handleCloseDeleteModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={deletePopup}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              padding: '30px 25px',
              width: '90%',
              maxWidth: 400,
              margin: 'auto',
              outline: 'none',
              boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              maxHeight: '90vh',
              overflowY: 'auto',
              marginTop: 20
            }}
          >
            <h2 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Warning</h2>
            <Divider style={{ marginBottom: 10 }} />

            <p>Are you sure you want to delete this employee?</p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={handleCloseDeleteModal}
                style={{ flex: '1 1 45%', borderRadius: 10, color: '#555', borderColor: '#ccc', textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Delete />}
                onClick={handleDeleteItem}
                disabled={loader}
                loading={loader}
                style={{ flex: '1 1 45%', borderRadius: 10, background: '#f44336', color: '#fff', textTransform: 'none' }}
              >
                Delete
              </Button>
            </div>
          </div>
        </Fade>
      </Modal>

    </div>
  );
}

export default Employee;