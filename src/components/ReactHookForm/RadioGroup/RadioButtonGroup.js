import React from 'react';
import { Controller } from "react-hook-form";

import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';


function InputField({ id, label, type, control, rules, fullWidth = true, disabled, options, row ,value,handleChanger}) {
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
            <FormControl component="fieldset" fullWidth={fullWidth} error={error}>
              <FormLabel component="legend">{label}</FormLabel>
              <RadioGroup
                aria-label={label}
                name={`radio-buttons-group-${id}`}
                onChange={e => {
                  console.log("Input Changed");
                  handleChanger!==null && handleChanger!==undefined && handleChanger(e);
                  onChange(e.target.value);
              }}
                
                row={row}
                value={value}
              >
                {options && options.length > 0 && options.map((el, i) => {
                  console.log("options",options)
                  return (
                    <FormControlLabel
                      key={el.value + i}
                      value={el.value}
                      label={el.label}
                      control={<Radio />}
                    />)
                })}
              </RadioGroup>
              {error && <FormHelperText>{error.message}</FormHelperText>}
            </FormControl>
          )
        }}
      />
    </div>
  )
}

export default InputField