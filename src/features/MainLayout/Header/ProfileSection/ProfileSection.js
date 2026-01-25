import { useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { IconButton, List, ListItemButton, ListItemIcon, Typography, ListItemText, Divider } from "@mui/material";
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PersonIcon from '@mui/icons-material/Person';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import { logout } from '../../../Login/loginSlice';
//import { clearReduxCache } from '../../../../redux/reducer/appSlice';

import { Popover } from "../../../../components/index";

const ProfileSection = (props) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useSelector((state) => state.loginReducer.user);
 // console.log("user - json => " + JSON.stringify(user));
  const roleDescription = window.localStorage.getItem("roleDescription");
  const userName = window.localStorage.getItem("userName");

  const [profilePopover, setProfilePoppover] = useState({
    anchorEl: null,
    data: null,
  });

  const closePopoverHandler = () => {
    setProfilePoppover({ anchorEl: null, data: null });
  };

  const openPopoverHandler = (event) => {
    setProfilePoppover({ anchorEl: event.currentTarget, data: null });
  };

  const routeHandler = (path) => {
    if (path === "/logout") {
      dispatch(logout());
    //  dispatch(clearReduxCache());
    window.localStorage.removeItem('billingType');
    window.localStorage.removeItem('roleDescription');
    window.localStorage.removeItem("userName")
      navigate('/login');
    }
  };

  return (
    <div className="user-profile">
      <IconButton aria-label="user-profile" className="user-icon font-icons" onClick={openPopoverHandler}>
        <PersonIcon />
      </IconButton>
      <Popover
        id={"profile-popover"}
        open={profilePopover.anchorEl ? true : false}
        anchorEl={profilePopover.anchorEl}
        handleClose={closePopoverHandler}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <div className="profile-card">
          <div className="card-header">
            <h4 className="user-name">{userName}</h4>
            <p className="role-name">{roleDescription}</p>
          </div>
          <Divider />
          <div className="card-body">
            <List component="nav">
              {/*<ListItemButton>
                <ListItemIcon>
                  <SettingsOutlinedIcon />
                </ListItemIcon>
                <ListItemText primary={<Typography variant="body2">{t('Settings')}</Typography>} />
              </ListItemButton>*/}
              <ListItemButton onClick={() => { routeHandler('/logout') }}>
                <ListItemIcon>
                  <LogoutOutlinedIcon />
                </ListItemIcon>
                <ListItemText primary={<Typography variant="body2">{t('Logout')}</Typography>} />
              </ListItemButton>
            </List>
          </div>
        </div>
      </Popover>
    </div>
  );
};

export default ProfileSection;
