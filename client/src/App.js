import React, { useState, useEffect } from 'react';

import Main from './components/main';
import Login from './components/login';
import UserContext from './components/context/userContext';

const axios = require('axios');

function App() {
  const [userData, setUserData] = useState({
    token: undefined,
    user: undefined,
  });
  const [loader, setLoader] = useState(true);

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
        {loader === false && userData.user &&
          <Main />
        }

        {loader === false && !userData.user &&
          <Login />
        }
      </div>
    </UserContext.Provider >
  );
}

export default App;
