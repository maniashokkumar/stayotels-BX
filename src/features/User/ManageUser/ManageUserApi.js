import { axiosPrService, axiosPbService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice';
import { isArray } from '../../../Utils/commonUtils';

export const fetchLookupOptionsSearch = (columnName, lookupKey, data, dispatch) => {
  const baseColumnName = columnName.replace(/Name$/, '');
  console.log("columnName::",columnName)
  console.log("lookupKey::",lookupKey)
  console.log("data::",data)
  return axiosPrService.post(`/master/search/${[baseColumnName]}`, data)
    .then(res => {
      let responseData = []
      if (res.status === 200 && isArray(res.data)) {
        responseData = res.data.map(el => {
          console.log("EEEEEEEEEEE",el)
          return {
            label: el[lookupKey],
            value: el[baseColumnName + "Id"],
          }
        })
        return responseData;
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data ? res.data : "Unable to load lookup option" }));
        return responseData;
      }
    }).catch(e => {
      if (e.status !== 401) {
        dispatch(showSnackbar({ type: "error", message: e.message }));
        return [];
      }
    })
};

export const deactivateActivateUser = ({ userId, userName }, data, dispatch) => {
  return axiosPrService.post(`/master/user/${userId}/update`, data)
    .then(res => {
      const { isActive } = data;
      if (res.status === 200) {
        dispatch(showSnackbar({ type: "success", message: `User ${isActive ? "Activated" : "Deactivated"} Successfully ` }));
        return res.data
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data ? res.data : `Unable to ${isActive ? "Activated" : "Deactivated"} user` }));
        return res.data
      }
    }).catch(e => {
      if (e.status !== 401) {
        dispatch(showSnackbar({ type: "error", message: e.message }));
        return false;
      }
    })
};

export const deleteUser = ({ userId, userName }, data, dispatch) => {
  return axiosPrService.post(`master/user/${userId}/update`, data)
    .then(res => {
      if (res.status === 200) {
        dispatch(showSnackbar({ type: "success", message: `User deleted successfully.` }));
        return res.data
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data ? res.data : `Unable to delete user` }));
        return res.data
      }
    }).catch(e => {
      if (e.status !== 401) {
        dispatch(showSnackbar({ type: "error", message: e.message }));
        return false;
      }
    })
};

export const resendAPI = ( data, dispatch) => {
  return axiosPbService.post(`/profile/sendcode`, data)
    .then(res => {
      if (res.status === 200) {
        dispatch(showSnackbar({ type: "success", message: `OTP sent successfully!` }));
        return res.data
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data ? res.data : `Unable to send otp` }));
        return res.data
      }
    }).catch(e => {
      if (e.status !== 401) {
        dispatch(showSnackbar({ type: "error", message: e.message }));
        return false;
      }
    })
};