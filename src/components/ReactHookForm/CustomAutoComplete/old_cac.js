import React from 'react';
import { TextField,Autocomplete } from '@mui/material';
import { Controller } from "react-hook-form";

function CustomAutoComplete({ id, label, type, control, rules, options,variant = "standard", fullWidth = true, disabled }) {
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
          return <Autocomplete
                    disablePortal
                    id={id}
                    options={options}
                    sx={{ width: 300 }}
                    disabled={disabled ? true : false}
                    InputLabelProps={{ shrink: true, required: true }}
                    helperText={error ? error.message : null}
                    onChange={onChange}
                    renderInput={(params) => <TextField {...params} label={label} />}
                    fullWidth={fullWidth}
                  />
        }
      }
      />
    </div>
  )
}

export default CustomAutoComplete
