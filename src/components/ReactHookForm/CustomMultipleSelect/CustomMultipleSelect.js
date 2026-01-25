import React, { useEffect, useState } from 'react';
import { default as SelectMUI } from '@mui/material/Select';
import MuiMenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { Controller } from "react-hook-form";
import { styled } from '@mui/material/styles';
import CardMedia from '@mui/material/CardMedia';
import Box from '@mui/material/Box';

const MenuItem = styled(MuiMenuItem)(({ theme }) => ({
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(1),
  },
}));

const CustomMultipleSelect = ({
  id,
  label,
  values,
  hasError = false,
  control,
  handleCustomInputChange,
  handlecustominputclick,
  rules,
  variant = "standard",
  fullWidth = true,
  disabled,
  options,
  placeholder,
  multiple,
  size,
  onEdit,
  onDelete,
  message,
  required,
}) => {
  const [eror, setEror] = useState({ message: "Field is Required" });

  useEffect(() => {
    if (message && message.length > 0) {
      setEror({ message: message });
    }
  }, [message]);

  return (
    <div className="form-field">
      <Controller
        name={id}
        control={control}
        rules={rules}
        render={({ field: { onChange, value }, fieldState: { error }, formState }) => (
          <FormControl
            variant={variant}
            className="form-control"
            fullWidth={fullWidth}
            error={!!error || hasError}
          >
            <InputLabel style={{ color: hasError && "#d32f2f" }} shrink={true} id={id}>
              <>
                {label} {required && <span style={{ color: '#d32f2f' }}>*</span>}
              </>
            </InputLabel>
            <SelectMUI
              className="select-input-field"
              id={id}
              labelId={id}
              size={size}
              notched={true}
              disabled={disabled}
              label={label}
              value={multiple ? (Array.isArray(value) ? value : []) : value} // Ensure value is an array for multiple
              onChange={(e) => {
                const newValue = multiple ? e.target.value : e.target.value; // Handle both single and multiple
                handleCustomInputChange(e);
                onChange(newValue);
              }}
              multiple={!!multiple} // Convert to boolean
              IconComponent={KeyboardArrowDownIcon}
              variant={variant}
              fullWidth={fullWidth}
              error={hasError}
            >
              {options &&
                options.length > 0 &&
                options.map((el, i) => (
                  <MenuItem key={i} value={el.value}> {/* Ensure `el.value` is used as value */}
                    {el.hasLogo ? (
                      <Box sx={{ display: 'flex', pl: el.hasLogo ? 1 : 0, pb: el.hasLogo ? 1 : 0 }}>
                        {el.hasLogo && (
                          <CardMedia
                            component="img"
                            style={{ width: "24px", height: "24px", marginRight: "12px" }}
                            image={el.logo}
                          />
                        )}
                        {el.label}
                      </Box>
                    ) : (
                      el.label
                    )}
                  </MenuItem>
                ))}
            </SelectMUI>
            {(hasError || error) && (
              <FormHelperText style={{ color: "#d32f2f" }}>
                {error ? error.message : eror.message}
              </FormHelperText>
            )}
          </FormControl>
        )}
      />
    </div>
  );
};

export default CustomMultipleSelect;
