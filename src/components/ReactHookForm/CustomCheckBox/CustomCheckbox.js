import React from "react";
import { Controller } from "react-hook-form";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

const CustomCheckbox = ({ id, label, control, handleChanger, rules, options }) => {
  return (
    <div className="form-field">
      <Controller
        name={id}
        control={control}
        rules={rules}
        render={({ field: { onChange, value = [] }, fieldState: { error } }) => {
          // Handle checkbox change
          const handleChange = (event) => {
            const newValue = event.target.value;
            let updatedValues = [...value];

            if (updatedValues.includes(newValue)) {
              updatedValues = updatedValues.filter((val) => val !== newValue);
            } else {
              updatedValues.push(newValue);
            }

            onChange(updatedValues);
            if (handleChanger) handleChanger(updatedValues);
          };

          return (
            <FormControl component="fieldset" error={!!error}>
              <legend>{label}</legend>
              <FormGroup>
                {options.map((el, i) => (
                  <FormControlLabel
                    key={i}
                    control={
                      <Checkbox
                        checked={value.includes(el.value)}
                        onChange={handleChange}
                        value={el.value}
                      />
                    }
                    label={el.label}
                  />
                ))}
              </FormGroup>
              {error && <FormHelperText>{error.message}</FormHelperText>}
            </FormControl>
          );
        }}
      />
    </div>
  );
};

export default CustomCheckbox;
