import React, { useState, useEffect, useMemo } from 'react';

import { ThemeProvider } from '@material-ui/core/styles';
import { CssBaseline, IconButton, Tooltip } from '@material-ui/core';
import { Brightness4, Brightness7 } from '@material-ui/icons';

import Main from './components/main';
import Login from './components/login';
import ModuleSelection from './components/moduleSelection';
import MaintenanceModule from './components/maintenance/MaintenanceModule';
import AccountingModule from './components/accounting/AccountingModule';
import ProductionModule from './components/production/ProductionModule';
import ManagementModule from './components/management/ManagementModule';
import ITModule from './components/it/ITModule';
import QualityModule from './components/quality/QualityModule';
import DispatchModule from './components/dispatch/DispatchModule';
import SalesModule from './components/sales/SalesModule';
import AdministrationModule from './components/administration/AdministrationModule';
import RequiredPasswordChange from './components/auth/RequiredPasswordChange';
import EmployeeAccountHome from './components/employeePortal/EmployeeAccountHome';
import UteslaModule from './components/utesla/UteslaModule';
import UserContext from './components/context/userContext';
import createAppTheme from './theme';

const axios = require('axios');

function App() {
  const [userData, setUserData] = useState({
    token: undefined,
    user: undefined,
  });
  const [loader, setLoader] = useState(true);
  const [path, setPath] = useState(window.location.pathname);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('unimore-theme') === 'dark');
  const theme = useMemo(() => createAppTheme(darkMode ? 'dark' : 'light'), [darkMode]);

  // HR module routes.
  const HR_PATHS = ['/dashboard', '/employee', '/department', '/timelogs', '/holiday', '/shifts', '/shift-assignment', '/leave-requests', '/overtime-requests', '/hr/approvals'];
  const moduleRoles = {
    hr: ['HR', 'HR Staff'], maintenance: ['Maintenance', 'Device Manager'],
    production: ['Production'], accounting: ['Accounting'], management: ['Management'], it: ['IT'], quality: ['QA'], dispatch: ['Dispatch'], sales: ['Sales'],
    administration: ['Administrator'], employeePortal: ['Employee'], utesla: ['UTESLA'],
  };
  const role = userData.user?.role;
  const canAccess = (module) => role === 'Administrator' || (moduleRoles[module] || []).includes(role);
  const passwordChangeRequired = Boolean(userData.user?.mustChangePassword);
  const pathModule = HR_PATHS.includes(path) ? 'hr'
    : path.startsWith('/maintenance') ? 'maintenance'
      : path.startsWith('/production') ? 'production'
        : path.startsWith('/accounting') ? 'accounting'
          : path.startsWith('/management') ? 'management'
            : path.startsWith('/it') ? 'it'
              : path.startsWith('/quality') ? 'quality'
                : path.startsWith('/dispatch') ? 'dispatch'
                  : path.startsWith('/sales') ? 'sales'
                    : path.startsWith('/administration') ? 'administration'
                      : path.startsWith('/employee-portal') ? 'employeePortal'
                        : path.startsWith('/utesla') ? 'utesla' : null;

  const toggleDarkMode = () => setDarkMode((current) => {
    localStorage.setItem('unimore-theme', current ? 'light' : 'dark');
    return !current;
  });

  useEffect(() => {
    const root = document.documentElement;
    const variables = {
      '--app-bg-default': theme.palette.background.default,
      '--app-bg-paper': theme.palette.background.paper,
      '--app-bg-subtle': darkMode ? '#162033' : '#F4F4F4',
      '--app-bg-muted': darkMode ? '#263244' : '#F9FAFB',
      '--app-border': darkMode ? '#374151' : '#E5E7EB',
      '--app-text-primary': theme.palette.text.primary,
      '--app-text-secondary': theme.palette.text.secondary,
      '--app-primary': theme.palette.primary.main,
    };
    Object.entries(variables).forEach(([name, value]) => root.style.setProperty(name, value));
    root.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode, theme]);

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
    const token = sessionStorage.getItem("auth-token");
    if (token) axios.defaults.headers.common['auth-token'] = token;
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
        { headers: { "auth-token": token } }
      );
      if (response.data) {
        axios.defaults.headers.common['auth-token'] = token;
      } else if (token) {
        sessionStorage.clear();
        delete axios.defaults.headers.common['auth-token'];
        setUserData({ token: undefined, user: undefined });
      }
    };

    checkLogin().catch(() => {});
  }, []);
  return (
    <ThemeProvider theme={theme}>
    <CssBaseline />
    <UserContext.Provider value={{ userData, setUserData }}>
      <div
        style={{
          margin: 0,
          padding: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          '--app-bg-default': theme.palette.background.default,
          '--app-bg-paper': theme.palette.background.paper,
          '--app-bg-subtle': darkMode ? '#162033' : '#F4F4F4',
          '--app-bg-muted': darkMode ? '#263244' : '#F9FAFB',
          '--app-border': darkMode ? '#374151' : '#E5E7EB',
          '--app-text-primary': theme.palette.text.primary,
          '--app-text-secondary': theme.palette.text.secondary,
          '--app-primary': theme.palette.primary.main,
        }}
      >
        {loader === false && userData.user && passwordChangeRequired && <RequiredPasswordChange />}

        {loader === false && userData.user && !passwordChangeRequired && HR_PATHS.includes(path) && canAccess('hr') &&
          <Main path={path} navigate={navigate} onExitModule={() => navigate('/home')} />
        }

        {loader === false && userData.user && !passwordChangeRequired && path.startsWith('/maintenance') && canAccess('maintenance') &&
          <MaintenanceModule path={path} navigate={navigate} onExitModule={() => navigate('/home')} />
        }

        {loader === false && userData.user && !passwordChangeRequired && path.startsWith('/production') && canAccess('production') &&
          <ProductionModule path={path} navigate={navigate} onExitModule={() => navigate('/home')} />
        }

        {loader === false && userData.user && !passwordChangeRequired && path.startsWith('/accounting') && canAccess('accounting') &&
          <AccountingModule path={path} navigate={navigate} onExitModule={() => navigate('/home')} />
        }

        {loader === false && userData.user && !passwordChangeRequired && path.startsWith('/management') && canAccess('management') &&
          <ManagementModule path={path} navigate={navigate} onExitModule={() => navigate('/home')} />
        }

        {loader === false && userData.user && !passwordChangeRequired && path.startsWith('/it') && canAccess('it') &&
          <ITModule path={path} navigate={navigate} onExitModule={() => navigate('/home')} />
        }

        {loader === false && userData.user && !passwordChangeRequired && path.startsWith('/quality') && canAccess('quality') &&
          <QualityModule path={path} navigate={navigate} onExitModule={() => navigate('/home')} />
        }

        {loader === false && userData.user && !passwordChangeRequired && path.startsWith('/dispatch') && canAccess('dispatch') &&
          <DispatchModule path={path} navigate={navigate} onExitModule={() => navigate('/home')} />
        }

        {loader === false && userData.user && !passwordChangeRequired && path.startsWith('/sales') && canAccess('sales') &&
          <SalesModule path={path} navigate={navigate} onExitModule={() => navigate('/home')} />
        }

        {loader === false && userData.user && !passwordChangeRequired && path.startsWith('/administration') && canAccess('administration') &&
          <AdministrationModule path={path} navigate={navigate} onExitModule={() => navigate('/home')} />
        }

        {loader === false && userData.user && !passwordChangeRequired && path.startsWith('/employee-portal') && canAccess('employeePortal') &&
          <EmployeeAccountHome onExitModule={() => navigate('/home')} />
        }

        {loader === false && userData.user && !passwordChangeRequired && path.startsWith('/utesla') && canAccess('utesla') &&
          <UteslaModule path={path} navigate={navigate} onExitModule={() => navigate('/home')} />
        }

        {loader === false && userData.user && !passwordChangeRequired && (!pathModule || !canAccess(pathModule)) &&
          <ModuleSelection
            onSelectHR={() => navigate('/dashboard')}
            onSelectMaintenance={() => navigate('/maintenance/inventory/tools')}
            onSelectProduction={() => navigate('/production/create-dr')}
            onSelectAccounting={() => navigate('/accounting/salary')}
            onSelectManagement={() => navigate('/management/dashboard')}
            onSelectIT={() => navigate('/it/dashboard')}
            onSelectQuality={() => navigate('/quality/dashboard')}
            onSelectDispatch={() => navigate('/dispatch/dashboard')}
            onSelectSales={() => navigate('/sales/dashboard')}
            onSelectAdministration={() => navigate('/administration/dashboard')}
            onSelectEmployeePortal={() => navigate('/employee-portal')}
            onSelectUtesla={() => navigate('/utesla/dashboard')}
          />
        }

        {loader === false && !userData.user &&
          <Login />
        }
        <Tooltip title={darkMode ? 'Use light mode' : 'Use dark mode'}>
          <IconButton onClick={toggleDarkMode} aria-label="Toggle dark mode" style={{
            position: 'fixed', left: 18, bottom: 18, zIndex: 2000,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: '0 4px 16px rgba(0,0,0,.22)',
          }}>
            {darkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Tooltip>
      </div>
    </UserContext.Provider >
    </ThemeProvider>
  );
}

export default App;
