import React from 'react';
import { TextField,Autocomplete } from '@mui/material';
import { Controller } from "react-hook-form";

function CustomAutoComplete({ id, label, onInputChange,type,values, control, rules,handleCustomInputChange, handleCustomKeyDown,options,variant = "standard",getOptionLabel, fullWidth = true, disabled }) {
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
                    id={id}
                    options={options}
                    value={values}
                    noOptionsText="Enter to create a new option"
                    getOptionLabel={(option) => option.title}
                    onChange((e)=>{
                      handleCustomInputChange(e);
                      onChange(e.target,value);
                    })
                    onInputChange={onInputChange}
                    renderInput={(params) => (
                            <TextField
                              {...params}
                              label={label}
                              variant="standard"
                              onKeyDown={(e) => {
                                  handleCustomKeyDown(e);

                                //   e.key === "Enter" &&
                                //   options.findIndex((o) => o.title === inputValue) === -1
                                // ) {
                                //   setOptions((o) => o.concat({ title: inputValue }));
                                // }
                              }}
                              fullWidth={fullWidth}
                            />
                          )}
                    fullWidth={fullWidth}
                     getOptionLabel={getOptionLabel ? getOptionLabel : (option) => {
                        return option.value ? option.value : ""
                      }}
                  />
        }
      }
      />
    </div>
  )
}

export default CustomAutoComplete
