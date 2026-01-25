import React from 'react';
import { useDispatch, useSelector } from "react-redux";

import { default as SnackbarMui } from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { clearSnackbar } from "../../redux/reducer/appSlice";

import './Snackbar.scss';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function Snackbar() {
  const dispatch = useDispatch();

  const snackbarData = useSelector(state => state.appReducer.snackbarData);

  const { message, show, autoHideDuration, anchorOrigin, type } = snackbarData;

  function handleClose() {
    dispatch(clearSnackbar());
  }

  return (
    <SnackbarMui
      anchorOrigin={anchorOrigin}
      open={show}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      aria-describedby="app-snackbar"
    >
      <Alert severity={type} sx={{ width: '100%', minWidth: "180px", fontWeight: "500" }}>
        <span className="snackbar-content">{message}</span>
      </Alert>
    </SnackbarMui>
  );
}

// 'error' | 'info' | 'success' | 'warning'