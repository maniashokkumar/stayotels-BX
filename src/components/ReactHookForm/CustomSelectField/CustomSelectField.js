import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { default as SelectMUI } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { fetchLookupList, showSnackbar } from '../../../redux/reducer/appSlice';


import { Controller } from "react-hook-form";

function CustomSelectField({ id, label, values, control, handleCustomInputChange, rules, variant = "standard", fullWidth = true, disabled, options, placeholder, multiple, readOnly, IconComponent, size }) {
  const dispatch = useDispatch();
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
          const selectValue =
            values !== undefined ? (values ?? "") : (value ?? "");
          return (<FormControl variant={variant} className="form-control" fullWidth={fullWidth} error={error ? error : null} size={size || undefined}>
            <InputLabel id={id}>{label}</InputLabel>
            <SelectMUI
              className="select-input-field"
              id={id}
              value={selectValue}
              disabled={disabled ? true : false}
              onChange={e => {
                if (!readOnly) {
                  console.log("Input Changed");
                  if (typeof handleCustomInputChange === 'function') {
                    handleCustomInputChange(e);
                  }
                  onChange(e.target.value);
                } else {
                  dispatch(showSnackbar({ type: "error", message: `Permission Denied.` }));
                }
              }}
              IconComponent={IconComponent || KeyboardArrowDownIcon}
              label={variant === "outlined" ? label : undefined}
              fullWidth={fullWidth}
              size={size || undefined}
              error={!!error}
              // helperText={error ? error.message : null}
              multiple={multiple ? multiple : undefined}
            >
              {options.length > 0 ? (
                options.map((el, i) => (
                  <MenuItem key={el.value + i} value={el.value} disabled={!!el.disabled}>
                    {el.label}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No data found.</MenuItem>
              )}
            </SelectMUI>
            {error && <FormHelperText>{error.message}</FormHelperText>}
          </FormControl>
          )
        }}
      />
    </div>
  )
}

export default CustomSelectField
