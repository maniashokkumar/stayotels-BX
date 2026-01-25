import React, { forwardRef } from "react";
import { useDispatch } from 'react-redux';
import {
  List,
  ListItemButton,
  ListItemText,
  Typography,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import './MenuList.scss';


export default function MenuList(props) {

  const [open, setOpen] = React.useState(true);

  const theme = useTheme();
  let { pathname } = useLocation();
  const dispatch = useDispatch();
  const { toggleLeftDrawerHandler, menuList } = props;
  const matchesSM = useMediaQuery(theme.breakpoints.down('lg'));
  const linkHandler = () => {
    if (matchesSM) {
      toggleLeftDrawerHandler();
    };
  }

  const handleClick = () => {
    //alert(1);
    setOpen(!open);
  };

  return (
    <div className="menu-list">
      <List>
        {menuList.map((item) => {
          let itemTarget = "_self";
          let selectedItem = false;
          if (item.target) { itemTarget = "_blank"; }

          if (item.url === "/manage-location" && pathname === "/") {
            selectedItem = true
          } else {
            item.url === pathname ? selectedItem = true : selectedItem = false
          }


          return (
            <ListItemButton
              // onClick={handleClick}
              className="sideDrawer-listItemButton"
              key={item.title}
              selected={selectedItem}
              component={forwardRef((props, ref) => (
                <Link
                  ref={ref}
                  {...props}
                  to={`${item.url}`}
                  target={itemTarget}
                />
              ))}
              sx={{
                borderRadius: '4px',
                marginBottom: item.lastChaild === true ? '50px' : '5px',
                borderBottom: item.isLast === true ? "1px solid gray" : "",
              }}

              onClick={() => {
                handleClick();
                linkHandler();
              }}

            >
              <span className={`icons ${item.icon}`}></span>
              <ListItemText
                primary={<Typography color="inherit"> {item.title} </Typography>}
              />
            </ListItemButton>
          );
        })}
      </List>
    </div>
  );
}


