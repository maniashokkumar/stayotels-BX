import React, { Suspense } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import { Header, SideDrawer } from "./index";
import { useDispatch, useSelector } from "react-redux";
import { toggleLeftDrawer } from "../../redux/reducer/appSlice";
import { styled, useTheme } from "@mui/material/styles";
import { drawerWidth } from "../../Theme/constants/constants";
import { useMediaQuery } from "@mui/material";
import { Outlet } from "react-router-dom";
import "./MainLayout.scss";

const Main = styled("main")(({ theme, open }) => {
  return {
    ...(!open && {
      marginLeft: -drawerWidth + "px",
      [theme.breakpoints.down("md")]: {
        marginLeft: 0,
      },
      width: "100%"
    }),
    ...(open && {
      width: `calc(100% - ${drawerWidth + "px"})`,
      [theme.breakpoints.down("md")]: {
        width: "100%"
      },
    }),
    /* Match fixed AppBar + Toolbar height (84px was too tall on small screens → grey strip under header) */
    marginTop: theme.spacing(7),
    [theme.breakpoints.up("sm")]: {
      marginTop: theme.spacing(8),
    },
    transition: "all 0.2s",
  };
});

export default function MainLayout(props) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const matchUpMd = useMediaQuery(theme.breakpoints.up("md"));
  const leftDrawerOpened = useSelector((state) => state.appReducer.leftDrawerOpened);

  const toggleLeftDrawerHandler = () => {
    dispatch(toggleLeftDrawer());
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        enableColorOnDark
        elevation={0}
        color="inherit"
        sx={{
          bgcolor: theme.palette.background.default,
        }}
      >
        <Header
          toggleLeftDrawerHandler={toggleLeftDrawerHandler}
          matchUpMd={matchUpMd}
        />
      </AppBar>
      <Suspense fallback="loading">
        <SideDrawer
          matchUpMd={matchUpMd}
          leftDrawerOpened={leftDrawerOpened}
          toggleLeftDrawerHandler={toggleLeftDrawerHandler}
          drawerWidth={drawerWidth}
        />
      </Suspense>
      <Main
        className={`main-section ${leftDrawerOpened ? "left-drawer-opened" : ""}`}
        theme={theme}
        open={leftDrawerOpened}
      >
        <Outlet />
      </Main>
    </Box>
  );
}
