import { axiosPrService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice'


export const createPrice = async ({ data, dispatch }) => {
  try {
    const res = await axiosPrService.post('/amount/create', data);
    console.log("resssss",res)
    if (res.status === 200) {
      if (res.data.message === "selected date/day range already exists. Choose another period."){
        dispatch(showSnackbar({ type: "error", message: "Selected date/day range already exists!" }));
        return null;
      }
      else{
      return res.data;
      }
    }else{
    dispatch(showSnackbar({ type: "error", message: res.data?.message || "Unable to create price" }));
    return null;
    }
  } catch (error) {
    dispatch(showSnackbar({ type: "error", message: error.message || "Server error" }));
    return null;
  }
};

export const updatePrice = ({ data, priceId, dispatch }) => {

  return axiosPrService.post(`/amount/update/price/${priceId}`, data)
    .then(res => {
      if (res.status === 200) {
        if (res.data.message === "The updated price period conflicts with an existing entry. Please select a different set of days."){
          dispatch(showSnackbar({ type: "error", message: "The updated price period conflicts with an existing entry. Please select a different date/day range!" }));
          return null;
        }
        else if (res.data.message === "The updated price period conflicts with an existing entry. Please select a different date range."){
          dispatch(showSnackbar({ type: "error", message: "The updated price period conflicts with an existing entry. Please select a different date/day range!" }));
          return null;
        }
        else{
        return res.data;
        }
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data?.message || "Unable to update price" }));
        return null;
      }
    })
    .catch(e => {
      dispatch(showSnackbar({ type: "error", message: e.message }));
    })
}

export const hotelList = ({ id, data, dispatch }) => {
  return axiosPrService.post(`/master/search/hotels?perPage=100`,{})
    .then(res => {
      console.log("data",res.data)
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

export const roomList = ({ id, data, dispatch }) => {
  return axiosPrService.post(`/master/search/rooms?perPage=100`,{})
    .then(res => {
      console.log("data",res.data)
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