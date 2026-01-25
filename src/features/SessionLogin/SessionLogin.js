import React from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { useTranslation } from 'react-i18next';

import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined';
import { Button } from '@mui/material';
import { InputField } from '../../components/ReactHookForm/index';
import VisibilityIcon from '@mui/icons-material/Visibility';
import IconButton from '@mui/material/IconButton';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { login, logout, toggleSessionPopup } from '../Login/loginSlice';
import './SessionLogin.scss';

function SessionLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useSelector((state) => state.loginReducer.user);
  const [showPassword, setShowPassword] = React.useState(false);

  const loginFormDefaultValues = {
    username: user?.email,
    password: ""
  }

  const { handleSubmit, control } = useForm({ defaultValues: loginFormDefaultValues });

  const submitHandler = async (formData) => {
    let response = await dispatch(login(formData))
    // console.log(response, 'response');
    if (response.payload?.email) {
      dispatch(toggleSessionPopup(false));
    }
  }

  const logoutHandler = () => {
    dispatch(logout());
    dispatch(toggleSessionPopup(false));
    navigate('/login');
  };

  const handleClickShowPassword = () => {setShowPassword(!showPassword);}

  return (
    <div className="form-card session-login-page">
      <div className="title-block">
        <RestoreOutlinedIcon className="time-icon" />
        <h2 className="title">{t('YourSessionHasBeenExpired')}</h2>
      </div>

      <form onSubmit={handleSubmit((data) => submitHandler(data))}>
        <InputField
          id="username"
          label={t("Email")}
          control={control}
          variant="standard"
          rules={{ required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Please enter a valid email address" } }}
          disabled={true}
        />
        <InputField
          id="password"
          label={t("Password")}
          type={showPassword ? 'text' : 'password'}
          control={control}
          variant="standard"
          rules={{ required: "Password is required" }}
          icon ={
            <IconButton aria-label='toggle password visibility' onClick={handleClickShowPassword}>
              {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          }
        />
        <Button
          fullWidth
          type="submit"
          variant="contained"
          color="primary"
          className="submit-button"
        >
          {t("Sign in")}
      </Button>
        <div className="logout-block">
          <p>{t("Not you,")} <span className="link" onClick={logoutHandler}>{t("Logout")}</span></p>
        </div>
      </form>
    </div>
  )
}

export default SessionLogin
