import React from 'react';
import { TextField } from '@mui/material';
import { Controller } from "react-hook-form";
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  redAsterisk: {
    '& .MuiInputLabel-asterisk': {
      color: 'red',
    },
  },
}));

function NumberComponent({
  id, label, type, control, rules, variant = "standard", fullWidth = true,
  disabled, size, styles, handleCustomInputChange, required, message, values
}) {
  const classes = useStyles();
  const isRequired = required;

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
          return (
            <TextField
              disabled={disabled ? true : false}
              type="number"
              value={value}
              size={size}
              label={label}
              variant={variant}
              style={styles ? styles : null}
              InputLabelProps={{
                shrink: true,
                required: isRequired,
                className: classes.redAsterisk,
              }}
              onChange={onChange}
              error={!!error}
              id={id}
              helperText={error ? error.message : message}
              fullWidth={fullWidth}
            />
          )
        }}
      />
    </div>
  )
}

export default NumberComponent;