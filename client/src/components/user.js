import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import CardActionArea from '@material-ui/core/CardActionArea';
import CircularProgress from '@material-ui/core/CircularProgress';
import Divider from '@material-ui/core/Divider';
import Modal from '@material-ui/core/Modal';
import Button from '@material-ui/core/Button';
import { Save, Edit, Delete, Add } from '@material-ui/icons/';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { useSpring, animated } from 'react-spring';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import { TextField } from '@material-ui/core';
import Backdrop from '@material-ui/core/Backdrop';
import 'react-toastify/dist/ReactToastify.css';
const axios = require("axios");

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
        // color: state.isSelected ? 'white' : 'black',
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

const Users = () => {
    const classes = useStyles();
    const [usersData, setUsersData] = useState(null);
    const [selectedUser, setSelectedUser] = useState([]);
    const [userOptions, setUserOptions] = useState([]);
    const [loader, setLoader] = useState(true);
    const [addModal, setAddModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [changePassModal, setChangePassModal] = useState(false);
    const [id, setId] = useState(-1);
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState([]);
    const [deletePopup, setDeletePopup] = useState(false);

    useEffect(() => {
        var data = selectedUser;
        var route = "users/list";
        var url = window.apihost + route;
        var token = sessionStorage.getItem("auth-token");

        axios
            .post(url, data, {
                headers: { "auth-token": token },
            })
            .then(function (response) {
                // handle success
                if (Array.isArray(response.data)) {
                    setUsersData(response.data);
                    setLoader(false);
                } else {
                    var obj = [];
                    obj.push(response.data);
                    setUsersData(obj);
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
    }, [selectedUser]);

    const usersList = usersData
        ? usersData.map((x) => ({
            id: x._id,
            userName: x.UserName,
            name: x.Name,
            role: x.Role,
        }))
        : [];

    useEffect(() => {
        var route = "users/search-options";
        var url = window.apihost + route;
        var token = sessionStorage.getItem("auth-token");

        axios
            .get(url, {
                headers: { "auth-token": token },
            })
            .then(function (response) {
                // handle success
                if (Array.isArray(response.data)) {
                    setUserOptions(response.data);
                } else {
                    var obj = [];
                    obj.push(response.data);
                    setUserOptions(obj);
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

    const usersOptionsList = userOptions
        ? userOptions.map((x) => ({
            id: x._id,
            userName: x.UserName,
        }))
        : [];

    function UsersOption(item) {
        var list = [];
        if (item !== undefined || item !== null) {
            item.map((x) => {
                var name = x.userName;
                return list.push({
                    label: name,
                    value: x.id,
                });
            });
        }
        return list;
    }

    function RoleOption() {
        var list = [];
        var item = [
            { role: "Administrator", key: "Administrator" },
            { role: "HR", key: "HR" },
            { role: "HR Staff", key: "HR Staff" },
            { role: "Device Manager", key: "Device Manager" }
        ]
        if (item !== undefined || item !== null) {
            item.map((x) => {
                return list.push({
                    label: x.role,
                    value: x.key,
                });
            });
        }
        return list;
    }

    const handleAddUser = () => {
        var route = "users/";
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");

        var data = {
            userName: userName,
            password: password,
            confirmPassword: confirmPassword,
            name: name,
            role: Object.keys(role).length > 0 ? role.value : ''
        }

        setLoader(true);
        axios
            .post(url, data)
            .then(function (response) {
                // handle success
                toast.success(response.data.user + ' successfully saved.', {
                    position: "top-center"
                });
                setAddModal(false);
                setLoader(false);
                setId(-1);
                setUserName('');
                setPassword('');
                setConfirmPassword('');
                setName('');
                setRole('');
            })
            .catch(function (error) {
                // handle error
                toast.error(error.response.data, {
                    position: "top-center"
                });
                setLoader(false);
            })
            .finally(function () {
                // always executed
            });
    }


    const handlCloseAddModal = () => {
        setAddModal(false);
        setId(-1);
        setUserName("");
        setPassword("");
        setConfirmPassword("");
        setName("");
        setRole("");
    }

    const handleEditUser = () => {
        var route = `users/${id}`;
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");

        var data = {
            UserName: userName,
            Name: name,
            Role: Object.keys(role).length > 0 ? role.value : ''
        }

        setLoader(true);
        axios
            .put(url, data)
            .then(function (response) {
                // handle success
                toast.success(response.data.user + ' successfully edited.', {
                    position: "top-center"
                });
                setEditModal(false);
                setLoader(false);
                setId(-1);
                setUserName('');
                setPassword('');
                setConfirmPassword('');
                setName('');
                setRole('');
            })
            .catch(function (error) {
                // handle error
                toast.error(error.response.data, {
                    position: "top-center"
                });
                setLoader(false);
            })
            .finally(function () {
                // always executed
            });
    }

    const handleOpenEditModal = (params) => {
        setId(params.id);
        setEditModal(true);
        setUserName(params.userName);
        setName(params.name);
        var data = params.role !== "" ? params.role : "";
        setRole([{ label: data, value: data }]);
    }

    const handlCloseEditModal = () => {
        setEditModal(false);
        setId(-1);
        setUserName("");
        setPassword("");
        setConfirmPassword("");
        setName("");
        setRole("");
    }

    const onDelete = (value) => {
        setId(value);
        setDeletePopup(true);
    }

    const handleCloseDeleteModal = () => {
        setDeletePopup(false);
        setId(-1);
        setUserName("");
        setPassword("");
        setConfirmPassword("");
        setName("");
        setRole("");
    }

    const handleDeleteUser = () => {
        var url = window.apihost + `users/${id}`;
        setLoader(true);
        axios
            .delete(url)
            .then(function (response) {
                // handle success
                if (response.status <= 200) {
                    toast.success('User successfully deleted!', {
                        position: "top-center"
                    });
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
                    toast.error(error.response.data, {
                        position: "top-center"
                    });
                    setLoader(false);
                } else {
                    // alert(err.response.status + JSON.stringify(err.response.data));
                    const error = {
                        status: err.response.status,
                        error: JSON.stringify(err.response.data),
                    };
                    alert(JSON.stringify(error));
                    setLoader(false);
                }
            });
    }

    const handleChangePassword = () => {
        var route = `users/change-password/${id}`;
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");

        var data = {
            Password: password,
            ConfirmPassword: confirmPassword
        }

        setLoader(true);
        axios
            .put(url, data)
            .then(function (response) {
                // handle success
                toast.success(response.data.user + ' successfully changed password.', {
                    position: "top-center"
                });
                setChangePassModal(false);
                setLoader(false);
                setId(-1);
                setUserName('');
                setPassword('');
                setConfirmPassword('');
                setName('');
                setRole('');
            })
            .catch(function (error) {
                // handle error
                toast.error(error.response.data, {
                    position: "top-center"
                });
                setLoader(false);
            })
            .finally(function () {
                // always executed
            });
    }

    const handlCloseChangePassModal = () => {
        setChangePassModal(false);
        setId(-1);
        setUserName('');
        setPassword('');
        setConfirmPassword('');
        setName('');
        setRole('');
    }

    const handleOpenChangePassModal = (value) => {
        setChangePassModal(true);
        setId(value);
    }

    return (
        <div style={{ padding: 10, width: '100%', boxSizing: 'border-box' }}>
            <ToastContainer />

            {/* Top Controls */}
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                    gap: '10px',
                }}
            >
                <Button
                    size='large'
                    onClick={() => setAddModal(true)}
                    variant="contained"
                    style={{ minWidth: 140 }}
                >
                    <Add /> Add User
                </Button>

                <div style={{ flex: 1, minWidth: 200, maxWidth: 400 }}>
                    <Select
                        defaultValue={selectedUser}
                        options={UsersOption(usersOptionsList)}
                        onChange={e => setSelectedUser(e)}
                        placeholder='Search...'
                        isClearable
                        isMulti
                        theme={theme => ({
                            ...theme,
                            colors: { ...theme.colors, text: 'black', primary25: '#66c0f4', primary: '#B9B9B9' },
                        })}
                        styles={customMultiSelectStyle}
                    />
                </div>
            </div>

            {/* Users Grid */}
            <div
                style={{
                    backgroundColor: '#F4F4F4',
                    minHeight: '75vh',
                    maxHeight: '75vh',
                    overflowY: 'auto',
                    padding: 10,
                    boxSizing: 'border-box',
                }}
            >
                <Grid container spacing={3}>
                    {usersList && usersList.map(user => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
                            <Card style={{ height: '100%' }}>
                                <CardActionArea>
                                    <CardContent>
                                        <Typography variant="h6"><strong>Name:</strong> {user.name}</Typography>
                                        <Typography variant="h6"><strong>Username:</strong> {user.userName}</Typography>
                                        <Typography variant="body1"><strong>Role:</strong> {user.role}</Typography>
                                    </CardContent>
                                </CardActionArea>
                                <CardActions style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                    <Button size="small" color="primary" disabled={user.userName === "superadmin"} onClick={() => handleOpenEditModal(user)}>Edit</Button>
                                    <Button size="small" color="primary" disabled={user.userName === "superadmin"} onClick={() => handleOpenChangePassModal(user.id)}>Change Password</Button>
                                    <Button size="small" color="secondary" disabled={user.userName === "superadmin"} onClick={() => onDelete(user.id)}>Delete</Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}

                    {(!usersList || usersList.length === 0) && loader !== true && (
                        <div style={{ textAlign: 'center', padding: 120, width: '100%' }}>
                            <h1 style={{ color: "#C4C4C4" }}>No data found!</h1>
                        </div>
                    )}

                    {loader && (
                        <div style={{ margin: '0 auto', textAlign: 'center', width: '100%' }}>
                            <CircularProgress />
                        </div>
                    )}
                </Grid>
            </div>


            {/* <TablePagination
                // rowsPerPageOptions={[10, 25, 100]}
                labelRowsPerPage=''
                rowsPerPageOptions={[]}
                component="div"
                count={totalEmp}
                rowsPerPage={20}
                page={page}
                onChangePage={handleChangePage}
            // onChangeRowsPerPage={handleChangeRowsPerPage}
            /> */}

            <Modal
                open={addModal}
                onClose={handlCloseAddModal}
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
                            maxHeight: '90vh', // ensures modal never exceeds viewport
                            overflowY: 'auto', // scroll inside modal if content too tall
                            marginTop: 20
                        }}
                    >
                        {/* Header */}
                        <div style={{ textAlign: 'left' }}>
                            <h2 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Add Employee</h2>
                        </div>

                        <Divider style={{ marginBottom: 10 }} />

                        {/* Form Fields */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <label style={{ fontSize: 14, fontWeight: 500 }}>Name</label>
                            <TextField fullWidth variant="outlined" size="small" value={name} onChange={e => setName(e.target.value)} />

                            <label style={{ fontSize: 14, fontWeight: 500 }}>Role</label>
                            <Select
                                defaultValue={role}
                                options={RoleOption()}
                                onChange={e => setRole(e)}
                                placeholder="Select Role"
                                theme={theme => ({
                                    ...theme,
                                    colors: { ...theme.colors, text: '#333', primary25: '#e3f2fd', primary: '#1e88e5' },
                                })}
                                styles={customSelectStyle}
                            />

                            <label style={{ fontSize: 14, fontWeight: 500 }}>Username</label>
                            <TextField fullWidth variant="outlined" size="small" value={userName} onChange={e => setUserName(e.target.value)} />

                            <label style={{ fontSize: 14, fontWeight: 500 }}>Password</label>
                            <TextField fullWidth type="password" variant="outlined" size="small" value={password} onChange={e => setPassword(e.target.value)} />

                            <label style={{ fontSize: 14, fontWeight: 500 }}>Confirm Password</label>
                            <TextField fullWidth type="password" variant="outlined" size="small" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                            <Button
                                variant="outlined"
                                onClick={handlCloseAddModal}
                                style={{ flex: '1 1 45%', borderRadius: 10, color: '#555', borderColor: '#ccc', textTransform: 'none' }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<Save />}
                                onClick={handleAddUser}
                                disabled={loader}
                                style={{ flex: '1 1 45%', borderRadius: 10, background: 'linear-gradient(90deg, #1e88e5, #42a5f5)', color: '#fff', textTransform: 'none' }}
                            >
                                Submit
                            </Button>
                        </div>
                    </div>
                </Fade>
            </Modal>

            {/* Edit User Modal */}
<Modal
    open={editModal}
    onClose={handlCloseEditModal}
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
            <h2 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Edit User</h2>
            <Divider style={{ marginBottom: 10 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Name</label>
                <TextField fullWidth variant="outlined" size="small" value={name} onChange={e => setName(e.target.value)} />

                <label style={{ fontSize: 14, fontWeight: 500 }}>Role</label>
                <Select
                    defaultValue={role}
                    options={RoleOption()}
                    onChange={e => setRole(e)}
                    placeholder="Select Role"
                    theme={theme => ({
                        ...theme,
                        colors: { ...theme.colors, text: '#333', primary25: '#e3f2fd', primary: '#1e88e5' },
                    })}
                    styles={customSelectStyle}
                />

                <label style={{ fontSize: 14, fontWeight: 500 }}>Username</label>
                <TextField fullWidth variant="outlined" size="small" value={userName} onChange={e => setUserName(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                <Button
                    variant="outlined"
                    onClick={handlCloseEditModal}
                    style={{ flex: '1 1 45%', borderRadius: 10, color: '#555', borderColor: '#ccc', textTransform: 'none' }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Save />}
                    onClick={handleEditUser}
                    disabled={loader}
                    style={{ flex: '1 1 45%', borderRadius: 10, background: 'linear-gradient(90deg, #1e88e5, #42a5f5)', color: '#fff', textTransform: 'none' }}
                >
                    Submit
                </Button>
            </div>
        </div>
    </Fade>
</Modal>

{/* Delete User Modal */}
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

            <p>Are you sure you want to delete this User?</p>

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
                    onClick={handleDeleteUser}
                    disabled={loader}
                    style={{ flex: '1 1 45%', borderRadius: 10, background: '#f44336', color: '#fff', textTransform: 'none' }}
                >
                    Delete
                </Button>
            </div>
        </div>
    </Fade>
</Modal>

{/* Change Password Modal */}
<Modal
    open={changePassModal}
    onClose={handlCloseChangePassModal}
    closeAfterTransition
    BackdropComponent={Backdrop}
    BackdropProps={{ timeout: 500 }}
>
    <Fade in={changePassModal}>
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
            <h2 style={{ margin: 0, color: '#333', fontWeight: 600 }}>Change Password</h2>
            <Divider style={{ marginBottom: 10 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Password</label>
                <TextField fullWidth type="password" variant="outlined" size="small" value={password} onChange={e => setPassword(e.target.value)} />

                <label style={{ fontSize: 14, fontWeight: 500 }}>Confirm Password</label>
                <TextField fullWidth type="password" variant="outlined" size="small" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                <Button
                    variant="outlined"
                    onClick={handlCloseChangePassModal}
                    style={{ flex: '1 1 45%', borderRadius: 10, color: '#555', borderColor: '#ccc', textTransform: 'none' }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Save />}
                    onClick={handleChangePassword}
                    disabled={loader}
                    style={{ flex: '1 1 45%', borderRadius: 10, background: 'linear-gradient(90deg, #1e88e5, #42a5f5)', color: '#fff', textTransform: 'none' }}
                >
                    Submit
                </Button>
            </div>
        </div>
    </Fade>
</Modal>
        </div >
    );
}

export default Users;