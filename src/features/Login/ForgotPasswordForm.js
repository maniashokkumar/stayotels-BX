import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { useTranslation } from 'react-i18next';
import { Button } from '@mui/material';
import { InputField } from '../../components/ReactHookForm/index';
import './Login.scss';
import { showSnackbar } from '../../redux/reducer/appSlice';


import { forgotPassword } from './loginSlice';

function ForgotPasswordForm({showForm}) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
 // const navigate = useNavigate();

  const loginFormDefaultValues = {
    email: "",
   }

  const { handleSubmit, control } = useForm({ defaultValues: loginFormDefaultValues });

  const submitHandler = async (formData) => {
    console.log(formData);
    formData.type = 'forget'
    let response = await dispatch(forgotPassword(formData))
    console.log(response);
    if (response.payload==="Success" || response.payload === "success") {
      dispatch(showSnackbar({ message: "Verification code has been sent to your email", type: "success" }));
      showForm('login');
    }
  }
  return (
    <div>
      <form onSubmit={handleSubmit((data) => submitHandler(data))}>
        <InputField
          id="email"
          label={t("Email")}
          control={control}
          variant="standard"
          rules={{ required: "Email is required", pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Please enter a valid email address" } }}
        />
       <Button
          fullWidth
          type="submit"
          variant="contained"
          color="primary"
          className="submit-button"
        >
          {t("Send Verification Code")}
      </Button>
        {<div className="signup-block">
          <p><span className="link" onClick={()=> showForm('login')}>{t("Sign In")}</span></p>
        </div>
        }
      </form>
    </div>
  )
}

export default ForgotPasswordForm
