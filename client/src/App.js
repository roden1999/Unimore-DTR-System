import React, { useState, useEffect } from 'react';

import { ThemeProvider } from '@material-ui/core/styles';

import Main from './components/main';
import Login from './components/login';
import ModuleSelection from './components/moduleSelection';
import UserContext from './components/context/userContext';
import theme from './theme';

const axios = require('axios');

function App() {
  const [userData, setUserData] = useState({
    token: undefined,
    user: undefined,
  });
  const [loader, setLoader] = useState(true);
  const [activeModule, setActiveModule] = useState(undefined);

  useEffect(() => {
    setTimeout(() => setLoader(false), 2000)
  }, [loader, setLoader]);

  useEffect(() => {
    const data = sessionStorage.getItem("userData");
    if (data) setUserData(JSON.parse(data));
  }, []);

  useEffect(() => {
    const checkLogin = async () => {
      let token = sessionStorage.getItem("auth-token");
      if (token === null) {
        sessionStorage.setItem("auth-token", "");
        token = "";
      }
      const response = await axios.post(window.apihost + "login/tokenIsValid",
        null,
        { headers: { "x-auth-token": token } }
      );
      if (response.data) {
        console.log(response.data);
        const user = await axios.get(window.apihost + "login/tokenIsValid",
          {
            headers: { "x-auth-token": token },
          });
        setUserData({
          token,
          user: response.data,
        });
      }
    };

    checkLogin();
  }, []);
  return (
    <ThemeProvider theme={theme}>
    <UserContext.Provider value={{ userData, setUserData }}>
      <div
        style={{
          margin: 0,
          padding: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {loader === false && userData.user && activeModule === 'HR' &&
          <Main onExitModule={() => setActiveModule(undefined)} />
        }

        {loader === false && userData.user && activeModule !== 'HR' &&
          <ModuleSelection onSelectHR={() => setActiveModule('HR')} />
        }

        {loader === false && !userData.user &&
          <Login />
        }
      </div>
    </UserContext.Provider >
    </ThemeProvider>
  );
}

export default App;
