import React, { useEffect, useState } from "react";
import logo from '../../assets/images/stayotelslogo.png';
import { AWS_URL } from '../../Utils/constants';


function Logo() {
  console.log("event fired");
  const STORE_ID = window.localStorage.getItem("storeId");
  const [thumbnailPath, setThumbnailPath] = useState(window.localStorage.getItem("thumbnailPath"));

  useEffect(() => {
    window.addEventListener("storage", () => {
      setThumbnailPath(window.localStorage.getItem("thumbnailPath"));
    });

  }, []);

  return (
    <div className="logo-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <img height="24" src={AWS_URL + "/" + STORE_ID + "/" + thumbnailPath} onError={(event) => event.target.setAttribute("src", logo)} alt="Logo" className="app-logo" style={{ height: '24px', width: 'auto', marginTop: '-4px' }} />
      <p style={{ 
        margin: 0, 
        color: "rgb(22, 36, 81)", 
        fontWeight: "bold", 
        lineHeight: "1", 
        letterSpacing: "0.5px", 
        fontSize: "22px", // Slightly smaller to match visual weight
        fontFamily: "'Mona Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        cursor: "pointer", 
        transition: "none" 
      }}>
        STAYOTELS
      </p>
    </div>
  )
}

export default Logo
