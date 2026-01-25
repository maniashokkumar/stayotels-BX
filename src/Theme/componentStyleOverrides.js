export default function componentStyleOverrides(theme) {
  return {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          color: theme.darkTextPrimary,
          fontFamily: 'Rubik',
          paddingTop: "5px",
          paddingBottom: "5px",
          "&.Mui-selected": {
            color: theme.palette.text.light,
            backgroundColor: theme.palette.primary.main,
            "&:hover": {
              backgroundColor: theme.palette.primary.main,
            },
            "& .MuiListItemIcon-root": {
              color: theme.palette.text.light,
            },
          },
          "&:hover": {
            backgroundColor: "rgba(25, 118, 210, 0.08)",
          },
        },
      },
    },
  };
}
