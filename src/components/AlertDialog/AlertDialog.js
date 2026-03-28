import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { t } from "i18next";
import { Loader } from '../index'



import './AlertDialog.scss';

export default function AlertDialog(props) {
  const { title, sx, children, hideConfirmationButtons, open, closeModalHandler, submitModalHandler, confirmText, cancelText, modalName, fullScreen, hideCloseButton, loading, maxWidth, fullWidth } = props;

  return (
    <div className={`alert-dialog-wrapper`}>
      <Dialog
        maxWidth={maxWidth ? maxWidth : undefined}
        fullWidth={Boolean(fullWidth)}
        fullScreen={fullScreen ? fullScreen : false}
        open={open}
        onClose={closeModalHandler}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        className={`${modalName} alert-dialog`}
        sx={sx}
      >

        {title && <DialogTitle id="alert-dialog-title" className="alert-dialog-title"> {title} </DialogTitle>}
        {!hideCloseButton && <IconButton
          aria-label="close"
          onClick={closeModalHandler}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        }
        <DialogContent>
          <div className="alert-dialog-content-wrapper">
            {loading && <Loader pageLoader={true} pageLoaderCustomStyles={{ paddingTop: "10px" }} />}
            <div className="content">
              {children}
            </div>
          </div>
        </DialogContent>
        <DialogActions className={`${hideConfirmationButtons ? 'hide' : ""}`}>
          <Button onClick={closeModalHandler}>{cancelText ? cancelText : t("No")}</Button>
          <Button disabled={loading ? true : false} variant={"contained"} onClick={submitModalHandler} autoFocus> {confirmText ? confirmText : t("Yes")} </Button>
        </DialogActions>
      </Dialog >
    </div >
  );
}
