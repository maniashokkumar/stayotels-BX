import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { store } from './redux/store';
import { Provider } from 'react-redux';
import { BrowserRouter } from "react-router-dom";
import './assets/scss/app.scss';
import { axiosPrService } from './axios/axiosInstance';
import { showSnackbar } from './redux/reducer/appSlice';
import { toggleSessionPopup } from './features/Login/loginSlice';

ReactDOM.render(

  <React.StrictMode>
    {/* <BrowserRouter> */}
    <BrowserRouter basename="/booking/">
      <Provider store={store}>
        <App />
      </Provider>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

axiosPrService.interceptors.response.use(function (response) {
  // Do something with response data
  return response;
}, function (error) {
  let status = error.response.status;
  let errorMessage = error.response.data.error;
  if (status === 401) {
    // 401 Unauthorized - authentication failed or user doesn't have permissions for requested operation.
    // show popup
    store.dispatch(toggleSessionPopup(true));
    return Promise.reject({ status, message: error.message });
  } else if (status === 404) {
    // 400 Bad Request - the request could not be understood or was missing required parameters
    store.dispatch(showSnackbar({ type: "error", message: errorMessage }));
    return Promise.reject({ status, message: error.message });
  }
  return Promise.reject({ status, message: error.message });
});
