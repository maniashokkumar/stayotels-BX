// import React from 'react';
// import {DesktopDatePicker} from '@mui/x-date-pickers';
// //import AdapterDateFns from '@mui/lab/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// import { TextField } from '@mui/material';
// import { Controller } from "react-hook-form";
// import { makeStyles } from '@mui/styles';

// function KeyBoardDatePicker({ id, label,type, control, rules, isRequired, variant = "standard", fullWidth = true, disabled,disablePast }) {
//  const helperTextStyles = makeStyles(theme => ({
//   root: {
//     margin: 4,
//     color: "red"
//   },
//   error: {
//     "&.MuiFormHelperText-root.Mui-error": {
//       color: theme.palette.common.red
//     }
//   }
// }));

// const helperTestClasses = helperTextStyles();
//   return (
//     <div className="form-field">
//       <Controller
//         name={id}
//         control={control}
//         rules={rules}
//         render={({
//           field: { onChange, value },
//           fieldState: { error },
//           formState,
//         }) => {
//           return <LocalizationProvider dateAdapter={AdapterDayjs}>
//                     <DesktopDatePicker
//                         disabled={disabled ? true : false}
//                         value={value}
//                         label={label}
//                         disablePast={disablePast}
//                         format="MM/dd/yyyy"
//                         InputLabelProps={{ shrink: true, required: true }}
//                         onChange={onChange}
//                         id={id}
//                         renderInput={(params) => <TextField FormHelperTextProps={{ classes: helperTestClasses }} InputLabelProps={{ shrink: true, required: isRequired, }} variant={variant}  error={!!error} helperText={error ? error.message : null} fullWidth={fullWidth}  {...params} />}
//                       />
//                 </LocalizationProvider>
//         }}
//       />
//     </div>
//   )
// }

// export default KeyBoardDatePicker

import React from "react";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TextField } from "@mui/material";
import { Controller } from "react-hook-form";

function KeyBoardDatePicker({
  id,
  label,
  control,
  rules,
  isRequired,
  variant = "standard",
  fullWidth = true,
  disabled,
  disablePast,
  minDate,
  size,
}) {
  return (
    <div className="form-field">
      <Controller
        name={id}
        control={control}
        rules={rules}
        render={({
          field: { onChange, value },
          fieldState: { error },
        }) => (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DesktopDatePicker
              disabled={disabled}
              value={value}
              label={label}
              disablePast={disablePast}
              minDate={minDate}
              format="MM/dd/yyyy"
              InputLabelProps={{ shrink: true, required: isRequired }}
              onChange={onChange}
              id={id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant={variant}
                  fullWidth={fullWidth}
                  size={size}
                  error={!!error} 
                  helperText={error ? error.message : null} 
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(0, 0, 0, 0.23)", // Default hover border color
                      },
                      "&.Mui-error .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#d32f2f", 
                      },
                    },
                    "& .MuiFormLabel-root": {
                      color: "#080808", // Default label color
                    },
                    "& .Mui-error.MuiFormLabel-root": {
                      color: "#d32f2f", 
                    },
                  }}
                />
              )}
            />
          </LocalizationProvider>
        )}
      />
    </div>
  );
}

export default KeyBoardDatePicker;

