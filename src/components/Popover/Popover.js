import React from "react";
import { default as PopoverMUI } from "@mui/material/Popover";

const Popover = (props) => {
  const { children, id, open, anchorEl, handleClose } = props;
  let {anchorOrigin, transformOrigin}  = props;

  if(!anchorOrigin) { anchorOrigin = { vertical : "bottom", horizontal : "center"} }
  if(!transformOrigin) { transformOrigin = { vertical : "top", horizontal : "center"}}

  return (
    <PopoverMUI
      id={id}
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
    >
      {children}
    </PopoverMUI>
  );
};

export default Popover;
