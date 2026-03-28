import { Box } from "@mui/material";
import { useSelector } from 'react-redux';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import { Logo } from '../../../../components/index';


import { Link } from "react-router-dom";

const LogoSection = (props) => {
  const { toggleLeftDrawerHandler } = props;
  const leftDrawerOpened = useSelector((state) => state.appReducer.leftDrawerOpened);
  return (
    <div className="logo-section">
      <Box sx={{
        flexGrow: 1,
        display: { xs: 'none', md: 'flex' }
      }} >
        <Link
          to={`/inventory`}
          style={{ textDecoration: 'none' }}
        >
          <Logo />
        </Link>
      </Box>
      <IconButton
       // size="large"
        edge="start"
        color="inherit"
        title={leftDrawerOpened ? "Close Drawer" : "Open Drawer"}
        aria-label="open drawer"
        onClick={toggleLeftDrawerHandler}
        sx={{ fontSize: "1.4rem", marginRight:'5px' }}
      >
        <MenuIcon />
      </IconButton>
    </div>
  )
}

export default LogoSection;