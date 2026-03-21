import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosPbService, axiosPrService } from '../../axios/axiosInstance';

import * as qs from 'qs';
import jwt_decode from "jwt-decode";
import dayjs from 'dayjs';
import { showSnackbar } from '../../redux/reducer/appSlice';

export const isTokenExpired = async (tokenData) => {
  const authTokens = JSON.parse(tokenData);
  const decodedAccessToken = jwt_decode(authTokens?.accessToken);
  const isExpired = dayjs.unix(decodedAccessToken.exp).diff(dayjs()) < 1;
  return isExpired;
}

export const login = createAsyncThunk('/login', async (data, { dispatch }) => {

  return await axiosPbService.post('/profile/authenticate', data = qs.stringify(data),
    { headers: { 'content-type': 'application/x-www-form-urlencoded' } }
  ).then(res => {
    let data = res.data;
    let user = null;
    ///  console.log("data",data)

    if (data.user) {
      window.localStorage.setItem('userName', data.user.userName);
      window.localStorage.setItem('userId', data.user.userId);
      window.localStorage.setItem('userPhone', data.user.phone || "");
    }
    if (data.role) {
      window.localStorage.setItem('roleId', data.role.roleId);
      window.localStorage.setItem('roleDescription', data.role.roleDescription);
      window.localStorage.setItem('roles', JSON.stringify(data.role.permissions));
      console.log("Permissions",data.role.permissions);
    }
    if (data.access_token) {
      let authTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token
      }
      let decodedAccessToken = jwt_decode(authTokens.accessToken);
      user = {
        name: decodedAccessToken?.name || data?.user?.userName,
        email: decodedAccessToken?.email || data?.user?.userEmail,
        phone: data?.user?.phone || ""
      }

      window.localStorage.setItem('authTokens', JSON.stringify(authTokens));

      // Setting accessToken on axiosPrivateService
      axiosPrService.defaults.headers.Authorization = `Bearer ${authTokens.accessToken}`

    } else {
      console.log('login throw error');
      console.log('login throw error', data.error);
      // alert(data.error);
      if (data.error === "invalid_grant") {
        dispatch(showSnackbar({ message: "Invalid Username/password , Please provide proper Username and Password !!", type: "error" }));
      }
    }
    return user
  }).catch(e => {
    console.log(e, 'login catch errr');
  });
});

export const forgotPassword = createAsyncThunk('/forgotPassword', async (data, { dispatch }) => {
  return await axiosPbService.post('/profile/sendcode', data,
    { headers: { 'content-type': 'application/json' } }
  ).then(res => {
    let data = res.data;
    let user = null;

    if (data === "Success") {

    } else {
      console.log('forgot throw error');
      dispatch(showSnackbar({ message: data.error, type: "error" }));
    }
    return data
  }).catch(e => {
    console.log(e, 'forgot catch errr');
  });
});

export const setPassword = createAsyncThunk('/setPassword', async (data, { dispatch }) => {
  return await axiosPbService.post('/user/verify/password', data,
    { headers: { 'content-type': 'application/json' } }
  ).then(res => {
    let data = res.data;
    let user = null;

    if (data === "Success" || data === "success") {
      dispatch(showSnackbar({ message: "Password has been updated successfully", type: "success" }));
    }
    else if (data === "invalid code") {
      dispatch(showSnackbar({ message: "Invalid OTP Number", type: "error" }));
    }
    else {
      console.log('forgot throw error');
      console.log('forgot throw error', data.error);
      dispatch(showSnackbar({ message: "Unable to set password please contact admin", type: "error" }));
    }
    return data
  }).catch(e => {
    console.log(e, 'forgot catch errr');
  });
});

export const authenticateUser = createAsyncThunk('/authenticateUser',
  async () => {
    const authTokenData = window.localStorage.getItem('authTokens');
    let user = null;
    if (authTokenData) {
      const authTokens = JSON.parse(authTokenData);
      const decodedAccessToken = jwt_decode(authTokens.accessToken);
      const isExpired = dayjs.unix(decodedAccessToken.exp).diff(dayjs()) < 1;

      if (!isExpired) {
        user = {
          name: decodedAccessToken.name,
          email: decodedAccessToken.email,
          phone: window.localStorage.getItem('userPhone') || ""
        }
      } else {
        window.localStorage.removeItem('authTokens');
      }
      // console.log(isExpired, "isExpired");
    }
    return user;
  }
)


const initialState = {
  user: null,
  authLoading: null,
  showSessionPopup: false,
}

const loginSlice = createSlice({
  name: "user",
  initialState: initialState,
  reducers: {
    logout(state) {
      state = { ...initialState }
      window.localStorage.removeItem('authTokens');
      // window.localStorage.removeItem('storeId');
      // window.localStorage.removeItem("currencySymbol");
      // localStorage.clear();
      // redirect to login page
      // window.location.href = '/login';
    },
    toggleSessionPopup(state, action) {
      state.showSessionPopup = action.payload
    }
  },
  extraReducers: {
    [login.pending]: (state, action) => {
      state.authLoading = true
    },
    [login.fulfilled]: (state, action) => {
      state.status = "success";
      if (action.payload) {
        state.user = action.payload
      }
      state.authLoading = false;
    },
    [login.rejected]: (state, action) => {
      state.status = "failed";
      state.authLoading = false
    },
    [authenticateUser.pending]: (state, action) => {
      state.authLoading = true
    },
    [authenticateUser.fulfilled]: (state, action) => {
      state.status = "success";
      state.user = action.payload;
      state.authLoading = false;
    },
    [authenticateUser.rejected]: (state, action) => {
      state.status = "failed";
      state.authLoading = false
    },
  }
});
export const { logout, toggleSessionPopup } = loginSlice.actions;

export default loginSlice.reducer;