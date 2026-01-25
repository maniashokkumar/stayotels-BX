import React from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CircularProgress from '@mui/material/CircularProgress';

import './AutoComplete.scss';

function AsyncAutoComplete(props) {

  const { inputValue, onInputChange, onChange, value, options, loading, id, sx, hideCloseIcon, variant, getOptionLabel, multiple, label } = props;
  return (
    <Autocomplete
      className={`auto-complete-wrapper ${hideCloseIcon ? "hideCloseIcon" : ""}`}
      id={id ? id : undefined}
      sx={sx ? sx : undefined}
      options={options || []}
      renderInput={(params) => (
        <TextField
          variant={variant}
          {...params}
          label={label}
          placeholder={props.placeholder}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color={"primary"} size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />)}
      inputValue={inputValue}
      value={value}
      onInputChange={onInputChange}
      onChange={onChange}
      popupIcon={<KeyboardArrowDownIcon />}
      getOptionLabel={getOptionLabel ? getOptionLabel : (option) => {
        return option.value ? option.value : ""
      }}

      // disable filtering on client
      filterOptions={(x) => x}

      loading={loading}
      noOptionsText={!loading && inputValue ? "No options found" : "Search"}
      multiple={multiple ? multiple : undefined}
    // open={true}
    />
  );
};

export default AsyncAutoComplete;

// expects : {label : "Shaktish kumar", value : "shaktish"}
