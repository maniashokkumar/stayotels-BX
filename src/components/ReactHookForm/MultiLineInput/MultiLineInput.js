import React from 'react';
import { TextField } from '@mui/material';
import { Controller } from "react-hook-form";
import InputAdornment from '@mui/material/InputAdornment';

function MultiLineInput({
    id,
    label,
    type,
    readOnly = false,
    textAlign = 'left',
    control,
    rules,
    variant = "outlined",
    fullWidth = true,
    disabled,
    icon,
    helpText,
    multiline = false, // Add multiline prop
    rows = 4 // Set a default value for the number of rows (you can change this)
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
          }) => {
            return (
              <TextField
                disabled={disabled ? true : false}
                type={type}
                value={value}
                label={label}
                InputProps={{
                  readOnly: readOnly,
                  endAdornment: icon && (
                    <InputAdornment position="end">
                      {icon}
                    </InputAdornment>
                  ),
                }}
                variant={variant}
                onChange={onChange}
                error={!!error}
                id={id}
                inputProps={{
                  min: 0,
                  style: { textAlign: textAlign },
                }}
                helperText={error ? error.message : helpText}
                fullWidth={fullWidth}
                multiline={multiline} // Enable multiline if true
                rows={rows} // Set number of rows for textarea
              />
            );
          }}
        />
      </div>
    );
  }
  
  export default MultiLineInput;
  