import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from "@mui/material/styles";
import { useTranslation } from 'react-i18next';
import Box from "@mui/material/Box";
import { Drawer } from "@mui/material";
import MenuList from "./MenuList/MenuList";
import { Logo } from '../../../components/index';
import { fetchStoreList } from '../../../redux/reducer/appSlice';


export default function SideDrawer(props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const storelookup = useSelector((state) => state.appReducer.storelookup);
  const { leftDrawerOpened, drawerWidth, toggleLeftDrawerHandler, matchUpMd } = props;
  const [pageLoader, setPageLoader] = useState(false);

  let storeOptions = [];

  if (storelookup && storelookup.storeDetails && storelookup.storeDetails.length > 0) {
    storeOptions = storelookup.storeDetails[0].storeOptions || [];
  }

  useEffect(() => {
    onPageLoad();
  }, []);

  const onPageLoad = async () => {
    setPageLoader(true);
    await dispatch(fetchStoreList('storeDetails'));
    setPageLoader(false);
  }

  const menuList = [
    {
      id: "calendar",
      title: t('Inventory'),
      url: "/inventory",
      icon: "calendar",
      isLast: false,
      lastChild: false
    },
    {
      id: "reservation",
      title: t('Reservation'),
      url: "/manage-reservation",
      icon: "reservation",
      isLast: false,
      lastChild: false
    },
    {
      id: "booking-database",
      title: t('Booking Database'),
      url: "/booking-database",
      icon: "booking-database",
      isLast: false,
      lastChild: false
    },
    {
      id: "cancellations",
      title: t('Cancellations'),
      url: "/manage-cancellation",
      icon: "cancellations",
      isLast: false,
      lastChild: false
    },
    {
      id: "coupons",
      title: t('Coupons'),
      url: "/manage-coupon",
      icon: "coupons",
      isLast: false,
      lastChild: false
    },
    {
      id: "location",
      title: t('Location'),
      url: "/manage-location",
      icon: "location",
      isLast: false,
      lastChild: false
    },
    {
      id: "amenities",
      title: t('Amenities'),
      url: "/manage-amenities",
      icon: "amenities",
      isLast: false,
      lastChild: false
    },
    {
      id: "hotel",
      title: t('Hotel'),
      url: "/manage-hotel",
      icon: "hotel",
      isLast: false,
      lastChild: false
    },
    {
      id: "room",
      title: t('Rooms'),
      url: "/manage-rooms",
      icon: "rooms",
      isLast: false,
      lastChild: false
    },
    {
      id: "price",
      title: t('Price'),
      url: "/manage-price",
      icon: "price",
      isLast: false,
      lastChild: false
    },
    {
      id: "user",
      title: t('User'),
      url: "/manage-user",
      icon: "users",
      isLast: false,
      lastChild: false
    },

  ];

  const permissions = JSON.parse(window.localStorage.getItem('roles')) || [];
  const filteredMenuList = menuList.filter((menuItem) => {
    if (storeOptions.length === 1 && storeOptions.includes('BILLING') && menuItem.id === 'theme') {
      return false;
    }
    if (menuItem.id === 'location' && !permissions.includes("LOCATION:VIEW")) {
      return false;
    }
    if (menuItem.id === 'user' && !permissions.includes("USER:VIEW")) {
      return false;
    }
    return true;
  });


  return (
    <Box
      component="nav"
      sx={{
        display: "flex",
        height: leftDrawerOpened ? "100vh" : "auto",
      }}
    >
      <Drawer
        className="side-drawer-wrapper "
        variant={matchUpMd ? "persistent" : "temporary"}
        open={leftDrawerOpened}
        onClose={toggleLeftDrawerHandler}
        container={document.querySelector("document body")}
        anchor="left"
        sx={{
          "& .MuiDrawer-paper": {
            background: theme.palette.background.primary,
            color: theme.palette.text.primary,
            borderRight: "none",
            top: {
              sm: "0",
              md: "64px",
            },
            padding: "15px",
            width: drawerWidth,
          },
          width: drawerWidth,
        }}
        ModalProps={{ keepMounted: true }}
      >
        <>
          <Box sx={{ display: { xs: "flex", md: "none" } }} >
            <Link
              to={`/inventory`}
            >
              <Logo />
            </Link>
          </Box>
          <MenuList toggleLeftDrawerHandler={toggleLeftDrawerHandler} menuList={filteredMenuList} />
        </>
      </Drawer>
    </Box>
  );
}