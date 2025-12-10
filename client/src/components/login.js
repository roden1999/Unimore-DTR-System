import React, { useState, useContext } from 'react';
import {
  Card,
  TextField,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Popover,
  Box
} from '@material-ui/core';
import { Visibility, VisibilityOff } from '@material-ui/icons';
import UserContext from './context/userContext';
import axios from 'axios';
import moment from 'moment';

const Login = () => {
  const { setUserData } = useContext(UserContext);

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [signInLoader, setSignInLoader] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [anchorEl, setAnchorEl] = useState(null);

  const onLogin = async () => {
    setSignInLoader(true);
    const url = window.apihost + "login";

    await axios.post(url, { userName, password })
      .then((response) => {
        sessionStorage.setItem("auth-token", response.data.token);
        sessionStorage.setItem("userData", JSON.stringify(response.data));
        sessionStorage.setItem("user", JSON.stringify(response.data.user));

        // Default date setup
        const from = moment().startOf('month').format('MM/DD/yyyy');
        const to = moment().format('MM/DD/yyyy');

        const emptyEmp = JSON.stringify({ emp: [] });
        const emptyDept = JSON.stringify({ dept: [] });

        sessionStorage.setItem("dlSemp", emptyEmp);
        sessionStorage.setItem("dlSdept", emptyDept);
        sessionStorage.setItem("dlSfromDate", from);
        sessionStorage.setItem("dlStoDate", to);

        sessionStorage.setItem("payrollemp", emptyEmp);
        sessionStorage.setItem("payrolldept", emptyDept);
        sessionStorage.setItem("payrollfromDate", from);
        sessionStorage.setItem("payrolltoDate", to);

        sessionStorage.setItem("dtrSemp", emptyEmp);
        sessionStorage.setItem("dtrSdept", emptyDept);
        sessionStorage.setItem("dtrSfromDate", from);
        sessionStorage.setItem("dtrStoDate", to);

        sessionStorage.setItem("rawSemp", emptyEmp);
        sessionStorage.setItem("rawSfromDate", from);
        sessionStorage.setItem("rawStoDate", to);

        setUserData(response.data);
        setSignInLoader(false);
      })
      .catch((err) => {
        setErrMsg(err.response?.data?.message || "Login failed");
        setSignInLoader(false);
      });
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #4F73FF, #4BC0C8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 420,
          padding: 30,
          borderRadius: 20,
          backdropFilter: "blur(10px)",
          background: "rgba(255, 255, 255, 0.85)",
          boxShadow: "0px 10px 30px rgba(0,0,0,0.2)"
        }}
      >

        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <img
            src="unimore-logo-landscape.png"
            style={{ width: "70%", height: "auto" }}
            alt="logo"
          />
        </div>

        {/* Error message */}
        {errMsg && (
          <Typography style={{ color: "red", textAlign: "center", marginBottom: 10 }}>
            {errMsg}
          </Typography>
        )}

        {/* Username */}
        <TextField
          fullWidth
          variant="filled"
          label="Username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          style={{ marginBottom: 20 }}
        />

        {/* Password */}
        <TextField
          fullWidth
          variant="filled"
          label="Password"
          type={visiblePassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: 20 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setVisiblePassword(!visiblePassword)}>
                  {visiblePassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        {/* Sign In */}
        <Button
          fullWidth
          variant="contained"
          color="primary"
          style={{
            padding: "12px 0",
            fontSize: "1rem",
            borderRadius: 30,
            textTransform: "none"
          }}
          onClick={onLogin}
          disabled={signInLoader}
        >
          {!signInLoader ? "Sign In" : <CircularProgress size={26} />}
        </Button>

        {/* Forgot Password */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Typography
            style={{ cursor: "pointer", fontWeight: 600 }}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            Forgot Password?
          </Typography>

          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center"
            }}
          >
            <Typography style={{ padding: 15 }}>
              Contact admin to change your password.
            </Typography>
          </Popover>
        </div>
      </Card>
    </Box>
  );
};

export default Login;