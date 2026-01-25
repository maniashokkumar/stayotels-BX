import { axiosPrService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice'


export const createLocation = async ({ data, dispatch }) => {
  return axiosPrService.post('/location/location', data)
    .then(res => {
      if (res.status === 200) {
        if (res.data.message === "Location already exists") {
          dispatch(showSnackbar({ type: "error", message: "Location already exists!" }));
          return res.data?.message;
        } else {
          return res.data;
        }
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data?.message || "Unable to create location" }));
        return null;
      }
    })
    .catch(e => {
      dispatch(showSnackbar({ type: "error", message: e.message || "Server error" }));
      return null;
    });
};

export const updateLocation = ({ data, locationId, dispatch }) => {
  return axiosPrService.post(`/master/location/${locationId}/update`, data)
    .then(res => {
      let result = ""
      if (res.status === 200) {
        // console.log("RRRRRRRRR",res.data)
        if (res.data === "location name already exists") {
          dispatch(showSnackbar({ type: "error", message: "Location already exists!" }));
          return res.data;
        } else {
          return res.data;
        }
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data ? res.data : "Unable to update location" }));
        return result
      }
    })
    .catch(e => {
      dispatch(showSnackbar({ type: "error", message: e.message }));
    })
}