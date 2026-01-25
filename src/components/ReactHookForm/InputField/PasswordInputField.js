import React from 'react';
import { TextField } from '@mui/material';
import { Controller } from "react-hook-form";
import InputAdornment from '@mui/material/InputAdornment';
import { makeStyles } from '@material-ui/core/styles';
const useStyles = makeStyles(theme => ({
  redAsterisk: {
    '& .MuiInputLabel-asterisk': {
      color: 'red',
    },
  },
}));
function InputField({ id, label,type,readOnly=false,maxLength, textAlign='left', control, rules, variant = "outlined", fullWidth = true, disabled,size ,icon,value,required,message,onChange,handleCustomInputChange}) {

  const classes = useStyles();
  const isRequired = required;

  const handleChange = (onChange) => (event) => {
    const newValue = event.target.value;
    // You can add additional logic here before passing the value to the form
    console.log("Field changed:", newValue);
    onChange(newValue); // Pass the updated value to react-hook-form
  };

  return (
    <div className="form-field">
         {/* Conditionally render the message above the TextField */}
         {message && message.length > 0 && (
        <div className='Editfieldmsg' style={{fontFamily:"'Roboto', sans-serif",fontSize:"0.75rem", color: '#e9ac14',marginBottom:"10px" }}>
          {"This field is edited"}
        </div>
      )}
      <Controller
        name={id}
        control={control}
        rules={rules}
        // rules={id==="businessNamelCase" ? {required:"Business Name in Lowercase is Required",validate :(value:any)=> {return value.toLowerCase()===value?null:"Business Name in Lowercase must contain lowercase letters!!"}}: rules}
        render={({
          field: { onChange, value },
          fieldState: { error },
          formState,
        }) => {
          return <TextField
            disabled={disabled ? true : false}
            type={type}
            size= {size}
            value={value ?? ""} 
            label={label}
            InputLabelProps={{ shrink: true, required: isRequired , className: classes.redAsterisk,}}
            InputProps={{
              readOnly: readOnly,
              endAdornment:(
                <InputAdornment position='end'>
                  {icon}
                </InputAdornment>
              )}}
            variant={variant}
            onChange={e=>{
              handleCustomInputChange(e);
              onChange(e.target.value);
            }}
            error={!!error}
            id={id}
            inputProps={{min: 0,maxLength:maxLength, style: { textAlign: textAlign }}} 
            helperText={error ? error.message : message }
            // message = {message && message.length > 0 ? message : null}
            fullWidth={fullWidth}
          />
        }}
      />
    </div>
  )
}

export default InputField
