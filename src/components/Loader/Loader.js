import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

function Loader({ color, pageLoader, pageLoaderCustomStyles }) {
  let styles = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    zIndex: "1",
    height: "100%",
    width: "100%",
  }
  const pageLoaderStyles = {
    zIndex: 101,
    // background: "rgba(1, 1, 1, 0.2)",
    alignItems: "baseline",
    paddingTop: "80px",
    position: "absolute",
    ...pageLoaderCustomStyles,
  }
  if (pageLoader) {
    styles = { ...styles, ...pageLoaderStyles }
  }
  return (
    <Box
      className={`loader-wrapper`}
      sx={{
        ...styles,
      }}
    >
      <CircularProgress
        className="circular-loader"
        sx={{
          color: color ? color : "primary",
        }} />
    </Box>
  )
}

export default Loader
