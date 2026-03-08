import React from 'react';
import { TextField } from '@mui/material';
import { Controller } from "react-hook-form";
import InputAdornment from '@mui/material/InputAdornment';

function InputField({ id, label, type, readOnly = false, textAlign = 'left', control, rules, variant = "outlined", fullWidth = true, disabled, icon, helpText, handleCustomInputChange }) {
  return (
    <div className="form-field">
      <Controller
        name={id}
        control={control}
        rules={rules}
        // rules={id==="businessNamelCase" ? {required:"Business Name in Lowercase is Required",validate :(value:any)=> {return value.toLowerCase()===value?null:"Business Name in Lowercase must contain lowercase letters!!"}}: rules}
        render={({
          field: { onChange, value },
          fieldState: { error },
          formState,
        }) => {
          return <TextField
            disabled={disabled ? true : false}
            type={type}
            value={value}
            label={label}
            InputProps={{
              readOnly: readOnly,
              endAdornment: (
                <InputAdornment position='end'>
                  {icon}
                </InputAdornment>
              )
            }}
            variant={variant}
            onChange={(e) => {
              if (typeof handleCustomInputChange === 'function') {
                handleCustomInputChange(e);
              }
              onChange(e);
            }}
            error={!!error}
            id={id}
            inputProps={{ min: 0, style: { textAlign: textAlign } }}
            helperText={error ? error.message : helpText}
            fullWidth={fullWidth}
          />
        }}
      />
    </div>
  )
}

export default InputField
