import React from 'react';
import { TextField } from '@mui/material';
import { Controller } from "react-hook-form";

function CustomInputField({ id, label,values,type, readOnly=false,control,handleCustomInputChange,rules, variant = "outlined", fullWidth = true, disabled, helpText }) {
  console.log("rules :: ",rules);
  return (
    <div className="form-field">
      <Controller
        name={id}
        control={control}
         rules={rules}
        render={({
          field: { onChange, value },
          fieldState: { error },
          formState,
        }) => {
          return <TextField
            disabled={disabled ? true : false}
            type={type}
            value={values}
            label={label}
            variant={variant}
            InputProps={{readOnly: readOnly}}
            onChange={e => {
                  console.log("Input Changed");
                  handleCustomInputChange(e);
                  onChange(e.target.value);
              }}
            error={rules && rules.required!==null ? !!error : false}
            // error={!!error}
            id={id}
            helperText={rules && rules.required!==null && error ? error.message : helpText}
            // helperText={error ? error.message : helpText}
            fullWidth={fullWidth}
          />
        }}
      />
    </div>
  )
}

export default CustomInputField
