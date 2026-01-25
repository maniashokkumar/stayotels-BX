import ForgotPasswordForm from './ForgotPasswordForm';
import { Box } from "@mui/material";
import { Logo } from '../../components/index';
import Link from '@mui/material/Link';
import { useTranslation } from 'react-i18next';

function ForgotPassword(props) {

  const { t } = useTranslation();

  const currentYear = new Date().getFullYear();
  return (
    <div className="login-page">
      <div className="login-aside">
        <Logo />
        <div className="content-wrapper">
          <div className="content">
            <h2 className="title">{t("Welcome")}</h2>
            <p className="text">
               A simple, customizable, and, scalable SaaS based e-commerce platform to quick start your online business in minutes!            </p>
          </div>
        </div>

        <Box className="copy-right-block" sx={{ display: { xs: 'none', md: 'block' } }}>Developed & Maintained By&nbsp; 
           <Link target="_blank" href="https://www.tripletsoft.com" color='white' underline="hover">Tripletsoft</Link>
        </Box>
      </div>
      <div className="login-form-wrapper">
        <div className="card-wrapper-default login-card form-card">
          <span className={"title"}>{t("Forgot Password?")}</span>
          <ForgotPasswordForm />
        </div>
      </div>
      <Box className="copy-right-block" sx={{ display: { xs: 'block', md: 'none' } }}>© {currentYear} Buildurstore</Box>
      <Box className="copy-right-block" sx={{ display: { xs: 'block', md: 'none' } }}>Developed & Maintained By&nbsp; 
           <Link target="_blank" href="https://www.tripletsoft.com" color='black' underline="hover">Tripletsoft</Link>
      </Box>
    </div>

  )
}

export default ForgotPassword
