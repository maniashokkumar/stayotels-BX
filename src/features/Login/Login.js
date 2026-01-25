import React, { useState, useEffect } from "react";
import LoginForm from "./LoginForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import SetPasswordForm from "./SetPasswordForm";
import { Box } from "@mui/material";
// import { Logo } from '../../components/index';
import Link from "@mui/material/Link";
import bgimage from "../../assets/images/bg1.png";

function Login(props) {
  const [type, setType] = useState("login");
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    window.onpopstate = function (e) {
      window.history.forward(1);
    };
  });

  const showForm = async (page) => {
    console.log(page);
    setType(page);
  };
  return (
    <div className="login-page">
      <div className="login-aside">
        {/*<Logo />*/}
        <div className="content-wrapper">
          {/* <div className="content">
            <h2 className="title"> Welcome</h2>

            <p className="text">
              A streamlined solution for monitoring bookings, coordinating
              staff, and facilitating efficient hotel operations.
            </p>
          </div> */}
          <div className="content">
            <h2 className="title"> Welcome</h2>
            <div className="image-wrapper">
              <img
                src={bgimage}
                alt="Hotel Booking Icon"
                className="booking-icon"
              />
            </div>
            <p className="text">
              A streamlined solution for monitoring bookings, coordinating
              staff, and facilitating efficient hotel operations.
            </p>
          </div>
        </div>
        <Box
          className="copy-right-block"
          sx={{ display: { xs: "none", md: "block" } }}
        >
          © {currentYear} Developed & Maintained By&nbsp;
          <Link
            target="_blank"
            href="https://www.tripletsoft.com"
            color="white"
            underline="hover"
          >
            Tripletsoft
          </Link>
        </Box>
      </div>
      <div className="login-form-wrapper">
        <div className="card-wrapper-default login-card form-card">
          {type === "login" && (
            <>
              <span className={"title"}>Login Account</span>
              <LoginForm showForm={showForm} />
            </>
          )}
          {type === "forgot-password" && (
            <>
              <span className={"title"}>Forgot Password</span>
              <ForgotPasswordForm showForm={showForm} />
            </>
          )}
        </div>
      </div>
      <Box
        className="copy-right-block"
        sx={{ display: { xs: "block", md: "none" } }}
      >
        © {currentYear} Developed & Maintained By&nbsp;
        <Link
          target="_blank"
          href="https://www.tripletsoft.com"
          color="black"
          underline="hover"
        >
          Tripletsoft
        </Link>
      </Box>
    </div>
  );
}

export default Login;
