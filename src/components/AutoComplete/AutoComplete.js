import React from "react";
import TextField from "@mui/material/TextField";
import { default as AutocompleteMUI } from "@mui/material/Autocomplete";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import './AutoComplete.scss';

function Autocomplete(props) {
  const { value, onChange, inputValue, onInputChange, id, sx, hideCloseIcon, variant } = props;
  return (
    <AutocompleteMUI
      className={`auto-complete-wrapper ${hideCloseIcon ? "hideCloseIcon" : ""}`}
      id={id ? id : undefined}
      sx={sx ? sx : undefined}
      options={props.options}
      renderInput={(params) => <TextField variant={variant} {...params} label={props.label} placeholder={props.placeholder} />}
      value={value}
      inputValue={inputValue}
      onInputChange={onInputChange}
      onChange={onChange}
      popupIcon={<KeyboardArrowDownIcon />}
      isOptionEqualToValue={(option, value) => {
        return option.id === value.id
      }}
    // open={true}
    />
  );
};

export default Autocomplete;

// expects : {label : "Shaktish kumar", id : "shaktish"}
