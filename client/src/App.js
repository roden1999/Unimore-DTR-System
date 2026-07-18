import React, { useState, useEffect } from 'react';

import { ThemeProvider } from '@material-ui/core/styles';

import Main from './components/main';
import Login from './components/login';
import ModuleSelection from './components/moduleSelection';
import ToolsModule from './components/tools/ToolsModule';
import UserContext from './components/context/userContext';
import theme from './theme';

const axios = require('axios');

function App() {
  const [userData, setUserData] = useState({
    token: undefined,
    user: undefined,
  });
  const [loader, setLoader] = useState(true);
  const [path, setPath] = useState(window.location.pathname);

  // HR module routes.
  const HR_PATHS = ['/employee', '/department', '/timelogs', '/holiday', '/shifts', '/shift-assignment', '/users'];

  const navigate = (to) => {
    window.history.pushState({}, '', to);
    setPath(to);
  };

  // Keep state in sync with browser back/forward.
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    setTimeout(() => setLoader(false), 2000)
  }, [loader, setLoader]);

  // Land on /home once logged in if no specific route was requested.
  useEffect(() => {
    if (!loader && userData.user && (path === '/' || path === '')) {
      window.history.replaceState({}, '', '/home');
      setPath('/home');
    }
  }, [loader, userData.user, path]);

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
        {loader === false && userData.user && HR_PATHS.includes(path) &&
          <Main path={path} navigate={navigate} onExitModule={() => navigate('/home')} />
        }

        {loader === false && userData.user && path.startsWith('/tools') &&
          <ToolsModule path={path} navigate={navigate} onExitModule={() => navigate('/home')} />
        }

        {loader === false && userData.user && !HR_PATHS.includes(path) && !path.startsWith('/tools') &&
          <ModuleSelection onSelectHR={() => navigate('/employee')} onSelectTools={() => navigate('/tools/tools')} />
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
