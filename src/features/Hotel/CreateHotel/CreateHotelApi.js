
import { axiosPrService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice'


export const createHotel = async ({ data, dispatch }) => {
  return axiosPrService.post('/hotel/create', data)
    .then(res => {
      if (res.status === 200) {
        if (res.data.message === "Hotel already exists") {
          dispatch(showSnackbar({ type: "error", message: "Hotel already exists at this location. Please enter a different name or location." }));
          return res.data?.message;
        } else {
          return res.data;
        }
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data?.message || "Unable to create hotel" }));
        return null;
      }
    })
    .catch(e => {
      dispatch(showSnackbar({ type: "error", message: e.message || "Server error" }));
      return null;
    });
};

export const updateHotel = ({ data, id, dispatch }) => {
  return axiosPrService.post(`/master/hotels/${id}/update`, data)
    .then(res => {
      let result = ""
      if (res.status === 200) {
        // console.log("RRRRRRRRR",res.data)
        if (res.data === "Hotel name already exists") {
          dispatch(showSnackbar({ type: "error", message: "Hotel already exists. Try a different name." }));
          return res.data;
        } else {
          return res.data;
        }
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data ? res.data : "Unable to update hotel" }));
        return result
      }
    })
    .catch(e => {
      dispatch(showSnackbar({ type: "error", message: e.message }));
    })
}


export const loccationList = ({ id, data, dispatch }) => {
  return axiosPrService.post(`/master/search/location?perPage=100`, {})
    .then(res => {
      // console.log("res dataaaaaa usecase:: " + res);
      if (res.data.status === 401) {
        //handleUnauthorized(dispatch);
        return null;
      }
      else {
        return res;
      }
    }).catch(e => {
      dispatch(showSnackbar({ type: "error", message: e.message }));
      return null;
    })
};