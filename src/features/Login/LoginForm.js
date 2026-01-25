import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { useTranslation } from 'react-i18next';
import { Button } from '@mui/material';
import { InputField } from '../../components/ReactHookForm/index';
import './Login.scss';

import VisibilityIcon from '@mui/icons-material/Visibility';
import IconButton from '@mui/material/IconButton';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { login } from './loginSlice';

function LoginForm({showForm}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);

  const loginFormDefaultValues = {
    username: "",
    password: ""
  }

  const { handleSubmit, control } = useForm({ defaultValues: loginFormDefaultValues });

  const submitHandler = async (formData) => {
    let response = await dispatch(login(formData))
    if (response.payload?.email) {
      navigate('/manage-location');
    }
  }

  const handleClickShowPassword = () => {setShowPassword(!showPassword);}

  const handleSetPass = () =>{
    navigate("/set-password")
  }

  return (
    <div>
      <form onSubmit={handleSubmit((data) => submitHandler(data))}>
        <InputField
          id="username"
          label={t("Email")}
          control={control}
          variant="standard"
          rules={{ required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Please enter a valid email address" } }}
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
        <div className="forgot-password-block">
         <span className="link" onClick={()=> showForm('forgot-password')}>{t("Forgot Password ?")}</span>
        </div>
        <Button
          fullWidth
          type="submit"
          variant="contained"
          color="primary"
          className="submit-button"
        >
          {t("Sign in")}
      </Button>
      </form>
    </div>
  )
}

export default LoginForm
