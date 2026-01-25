import React, { useEffect ,useState} from "react";
import logo from '../../assets/images/hotel.png';
import { AWS_URL} from '../../Utils/constants';


function Logo() {
console.log("event fired");
const STORE_ID = window.localStorage.getItem("storeId");
const [thumbnailPath,setThumbnailPath] = useState(window.localStorage.getItem("thumbnailPath"));

useEffect(()=>{
  window.addEventListener("storage",()=>{
    setThumbnailPath(window.localStorage.getItem("thumbnailPath"));
  });

},[]);

  return (
    <div className="logo-wrapper">
      <img height="63" src={AWS_URL + "/" + STORE_ID + "/" + thumbnailPath} onError={(event)=>event.target.setAttribute("src",logo)}  alt="Logo" className="app-logo" />
    </div>
  )
}

export default Logo
