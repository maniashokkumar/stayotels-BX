import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
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
  disabled, size, styles, handleCustomInputChange, required, message,
  InputProps = {}
}) {
  const classes = useStyles();
  const isRequired = required;

  return (
    <div className="form-field">
      <Controller
        name={id}
        control={control}
        rules={rules} // Use passed-in rules directly
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
            InputProps={InputProps} // Pass InputProps to TextField
            onChange={(e) => {
              const val = e.target.value.trim();
              onChange(val);
              if (handleCustomInputChange) {
                handleCustomInputChange(val);
              }
            }}
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
