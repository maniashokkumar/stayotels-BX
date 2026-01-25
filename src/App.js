import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './Theme/theme';
import { CssBaseline, StyledEngineProvider } from '@mui/material';
import './i18n';
import './assets/scss/app.scss';
import '@fortawesome/fontawesome-free/css/all.min.css';
import AppRoutes from '../src/Routes/index';
import { authenticateUser } from './features/Login/loginSlice';
import { Snackbar, AlertDialog } from './components/index';
import SessionLogin from './features/SessionLogin/SessionLogin';


function App() {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = useSelector((state) => state.loginReducer.user);
  const showSessionPopup = useSelector((state) => state.loginReducer.showSessionPopup);

  useEffect(() => {
    async function fetchInit() {
      try {
        const response = await dispatch(authenticateUser());
        if (response.payload && response.payload.email) {
          if (location.pathname) {
            navigate(location.pathname);
          } else {
            navigate('/manage-location');
          }
        }
      } catch (e) {
        console.error(e);
      }

    };
    fetchInit(); // eslint-disable-next-line
  }, [])


  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme()}>
        <CssBaseline />
        <div className="App">
          <Snackbar />
          <AlertDialog
            modalName="session-login-modal"
            open={showSessionPopup}
            hideConfirmationButtons={true}
            hideCloseButton={true}
          >
            <SessionLogin
              show={showSessionPopup}
            />
          </AlertDialog> 
          <AppRoutes
            user={user}
          />
        </div>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
