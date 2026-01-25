import React from 'react';
import {TextField } from '@mui/material';

import {DesktopDatePicker} from '@mui/x-date-pickers';
// import {DesktopDatePicker,MuiPickersUtilsProvider} from '@mui/x-date-pickers';
//import AdapterDateFns from '@mui/lab/AdapterDateFns';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'

const DesktopdatePicker = (props) => {
  const { id,sx,label,error,value,onInputChange,onChange,variant = "standard", fullWidth = true, disabled } = props;
  return (
    <div className="form-field">
         <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DesktopDatePicker
                  disabled={disabled ? true : false}
                  labelId={id}
                  label={label}
                  format={"MM/dd/yyyy"}
                  InputLabelProps={{ shrink: true, required: true }}
                   id={id ? id : undefined}
                   sx={sx ? sx : undefined}
                  helperText={error ? error.message : null}
                  fullWidth={fullWidth}
                  renderInput={(params) => <TextField variant={variant} helperText={params?.inputProps?.placeholder} fullWidth={fullWidth}  {...params} />}
                  value={value}
                  onChange={onChange}
                  onInputChange={onInputChange}

                />
        </LocalizationProvider>
    </div>
  )
}

export default DesktopdatePicker;
