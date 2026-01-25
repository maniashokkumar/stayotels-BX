import React, { Suspense, useState, useEffect } from "react";
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import { LogoSection, ProfileSection, PanelDropdown } from './index';
import './Header.scss';
import { t } from "i18next";

export default function Header(props) {

  const dispatch = useDispatch();
  const { matchUpMd, toggleLeftDrawerHandler } = props;
  const [time, setTime] = useState(Date.now());
  const [showViewModal, setShowViewModal] = useState({
    show: false,
    data: null
});




  return (
    <div>
      <Toolbar className="header-wrapper">
        <Box sx={{ width: matchUpMd ? "228px" : "auto" }}>
          <LogoSection
            toggleLeftDrawerHandler={toggleLeftDrawerHandler}
          />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", width: matchUpMd ? "calc(100% - 228px)" : "100%", alignItems: "center" }}>
          <PanelDropdown />
          <Box className="right-side-section" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Suspense fallback="loading">
              <ProfileSection />
            </Suspense>
          </Box>
        </Box>
      </Toolbar>
    </div>
  )
}