import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from "react-hook-form";
import VisibilityIcon from '@mui/icons-material/Visibility';
import IconButton from '@mui/material/IconButton';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Button } from '@mui/material';
import { PasswordInputField } from '../../components/ReactHookForm/index';
import './Login.scss';
import { Box } from "@mui/material";
import Link from '@mui/material/Link';
import { makeStyles } from '@mui/styles';
import bgimage from "../../assets/images/bg1.png";

import { setPassword } from './loginSlice';

function SetPasswordForm({email,token}) {
  const useStyles = makeStyles({
    button: {},
    validationMessage: {
      display: 'flex',
      alignItems: 'center',
      transition: 'color 0.3s ease, transform 0.3s ease',
      marginBottom: '8px',
      fontSize: '14px',
    },
    checkIcon: {
      marginRight: '8px',
      transition: 'opacity 0.3s ease',
    },
    success: {
      color: 'green',
    },
    error: {
      color: 'red',
    },
    heading: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '10px',
      marginRight: '15rem',
    },
  });

  const currentYear = new Date().getFullYear();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [enEmail, setEnEmail] = useState('');
  const [enToken, setEnToken] = useState('');
  const [pageLoader, setPageLoader] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const classes = useStyles();
  const [validations, setValidations] = useState({
    length: false,
    uppercase: false,
    specialChar: false,
    digit: false,
  });
  // const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [passwordValue, setPasswordValue] = useState(null);

  const { handleSubmit, control, watch } = useForm({
    defaultValues: {
      password: ""
    }
  });

console.log("Email",email)

  // useEffect(() => {
  //   if (!loaded) {
  //     // const queryParams = new URLSearchParams(location.search);

  //     // const encodeData = queryParams.get('data');

  //     if (encodeData) {
  //       const decodeData = atob(encodeData);
  //       const decodedParams = new URLSearchParams(decodeData.split('?')[1]);
  //       const email = decodedParams.get('email')?.replace(/ /g, '+') || '';
  //       const token = decodedParams.get('token')?.replace(/ /g, '+') || '';

  //       setEnEmail(email);
  //       setEnToken(token);
  //     }
  //     setLoaded(true);
  //   }
  // }, [location.search, loaded,encodeData]);

  useEffect(() => {
    const subscription = watch((value) => {
      const password = value.password;
      setValidations({
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        specialChar: /[!@#$%^&*]/.test(password),
        digit: /\d/.test(password),
      });
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const handleNavigate = () => {
    navigate('/login');
  };

  const submitHandler = async (formData) => {
    setPageLoader(true);
    const formDataWithHiddenValues = {
      ...formData,
      userEmail: email,
      token: token
    };

    let response = await dispatch(setPassword(formDataWithHiddenValues))
    // const { handleSubmit, control } = useForm({ defaultValues: loginFormDefaultValues });

    // const submitHandler = async (formData) => {

    if (response.payload === "Success" || response.payload === "success") {
      navigate('/login');
    }
    setPageLoader(false);
  }

  function ispassword(e) {
    setPasswordValue(e.target.value);
  }

  const handleLogin =()=>{
    navigate("/login");
  }
  const handleClickShowPassword = () => { setShowPassword(!showPassword); }

  return (
    <div className="login-page">
       <div className="login-aside">
        {/*<Logo />*/}
        <div className="content-wrapper">
          {/* <div className="content">
            <h2 className="title"> Welcome</h2>

            <p className="text">
              A streamlined solution for monitoring bookings, coordinating
              staff, and facilitating efficient hotel operations.
            </p>
          </div> */}
          <div className="content">
            <h2 className="title"> Welcome</h2>
            <div className="image-wrapper">
              <img
                src={bgimage}
                alt="Hotel Booking Icon"
                className="booking-icon"
              />
            </div>
            <p className="text">
              A streamlined solution for monitoring bookings, coordinating
              staff, and facilitating efficient hotel operations.
            </p>
          </div>
        </div>
        <Box
          className="copy-right-block"
          sx={{ display: { xs: "none", md: "block" } }}
        >
          © {currentYear} Developed & Maintained By&nbsp;
          <Link
            target="_blank"
            href="https://www.tripletsoft.com"
            color="white"
            underline="hover"
          >
            Tripletsoft
          </Link>
        </Box>
      </div>
      <div className="login-form-wrapper">
        <div className="card-wrapper-default login-card form-card">
          <h3 className='title-h3'>Set Password</h3>
          <form onSubmit={handleSubmit((data) => submitHandler(data))}>
            <PasswordInputField
              id="password"
              label={t("New Password")}
              type={showPassword ? 'text' : 'password'}
              inputProps={{
                autocomplete: 'new-password',
                form: {
                  autocomplete: 'off',
                },
              }}
              handleCustomInputChange={(e) => ispassword(e)}
              control={control}
              variant="standard"
              rules={{
                required: "Password is required",
                minLength: {
                  value: 8,
                },
                pattern: {
                  value: /^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,}$/,
                }
              }}
              icon={
                <IconButton aria-label='toggle password visibility' onClick={handleClickShowPassword}>
                  {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                </IconButton>
              }
            />
            {passwordValue != null && passwordValue.length > 0 &&
              <>
                <h4 >Password must contain</h4>
                <ul className="password-requirements">
                  <li className={`${classes.validationMessage} ${validations.length ? classes.success : classes.error}`}>
                    <span className={classes.checkIcon}>{validations.length ? '✔️' : '❌'}</span>
                    Password must be at least 8 characters long
                  </li>
                  <li className={`${classes.validationMessage} ${validations.uppercase ? classes.success : classes.error}`}>
                    <span className={classes.checkIcon}>{validations.uppercase ? '✔️' : '❌'}</span>
                    Password must contain at least one uppercase letter
                  </li>
                  <li className={`${classes.validationMessage} ${validations.specialChar ? classes.success : classes.error}`}>
                    <span className={classes.checkIcon}>{validations.specialChar ? '✔️' : '❌'}</span>
                    Password must contain at least one special character
                  </li>
                  <li className={`${classes.validationMessage} ${validations.digit ? classes.success : classes.error}`}>
                    <span className={classes.checkIcon}>{validations.digit ? '✔️' : '❌'}</span>
                    Password must contain at least one numeric digit
                  </li>
                </ul>
              </>
            }
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              className="submit-button"
            >
              {t("Set Password")}
            </Button>
            {<div className="signup-block">
              <p><span className="link" onClick={handleLogin}>{t("Sign In")}</span></p>
            </div>
            }

          </form>
        </div>
    
      </div>
             <Box
        className="copy-right-block"
        sx={{ display: { xs: "block", md: "none" } }}
      >
        © {currentYear} Developed & Maintained By&nbsp;
        <Link
          target="_blank"
          href="https://www.tripletsoft.com"
          color="black"
          underline="hover"
        >
          Tripletsoft
        </Link>
      </Box>
    </div>

  )
}

export default SetPasswordForm
