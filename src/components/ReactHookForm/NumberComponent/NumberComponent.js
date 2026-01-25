import React from 'react';
import { TextField } from '@mui/material';
import { Controller } from "react-hook-form";
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  redAsterisk: {
    '& .MuiFormLabel-asterisk': {
      color: 'red',
    },
  },
}));

function NumberComponent({
  id, label, control, rules, variant = "standard", fullWidth = true,
  disabled, size, styles, handleCustomInputChange, required, message
}) {
  const classes = useStyles();
  const isRequired = required;

  return (
    <div className="form-field">
      <Controller
        name={id}
        control={control}
        rules={{
          ...rules,
          validate: (value) => {
            const trimmedValue = value.trim();
            return (
              /^\+91[6-9]\d{9}$/.test(trimmedValue) || 
              "Please enter a valid Indian mobile number with country code '+91'"
            );
          },
        }}
        render={({
          field: { onChange, value },
          fieldState: { error },
        }) => (
          <TextField
            disabled={!!disabled}
            type="tel"
            value={value || ''}
            size={size}
            label={label}
            variant={variant}
            style={styles || null}
            InputLabelProps={{
              shrink: true,
              required: isRequired,
              className: classes.redAsterisk,
            }}
            inputProps={{
              pattern: "^\+91[6-9]\\d{9}$",
            }}
            onChange={(e) => onChange(e.target.value.trim())}
            error={!!error}
            id={id}
            helperText={error ? error.message : message}
            fullWidth={fullWidth}
          />
        )}
      />
    </div>
  );
}

export default NumberComponent;
