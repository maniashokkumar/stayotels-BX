import { axiosPrService, axiosPbService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice'


export const createReservation = async ({ data, dispatch }) => {
  try {
    const res = await axiosPrService.post('/reservation/reservation', data);
    console.log("resssss",res)
    if (res.status === 200) {
      if(res.data === "Not enough rooms available. Only 0 rooms left.") {
        dispatch(showSnackbar({ type: "error", message: "Selected room is sold out! Try a different room type or date." }));
      }else{
        return res.data;
      }
    }else{
      dispatch(showSnackbar({ type: "error", message: res.data?.message || "Unable to create reservation" }));
      return res.data;
    }
   

  } catch (error) {
    dispatch(showSnackbar({ type: "error", message: error.message || "Server error" }));
    return error;
  }
};

export const updateReservation = ({ data, reservationId, dispatch }) => {
  return axiosPrService.post(`reservation/reservation/${reservationId}/update`, data)
    .then(res => {
      let result = ""
      if (res.status === 200) {
        if (res.data === "Success") {
          result = res.data
          return result
        } else {
          console.log('else')
          dispatch(showSnackbar({ type: "error", message: res.data ? res.data : "Unable to update reservation" }));
          return result
        }
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data ? res.data : "Unable to update reservation" }));
        return result
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

export const priceCalculation = async ({ data, dispatch }) => {
  try {
    const res = await axiosPbService.post("/room/search/room", data);
    console.log("API Response:", res);

    if (res.status === 200) {
      return res.data;
    }
    console.log("Price calculation failed");
    dispatch(showSnackbar({ type: "error", message: res.data?.message || "Unable to fetch price" }));
    return null;
  } catch (error) {
    dispatch(showSnackbar({ type: "error", message: error.message || "Server error" }));
    return null;
  }
};

export const priceUpdate = async ({ data, dispatch }) => {
  try {
    const res = await axiosPbService.post("/room/list/rooms", data);
    console.log("API Response:", res);

    if (res.status === 200) {
      return res.data;
    }
    console.log("Price calculation failed");
    dispatch(showSnackbar({ type: "error", message: res.data?.message || "Unable to fetch price" }));
    return null;
  } catch (error) {
    dispatch(showSnackbar({ type: "error", message: error.message || "Server error" }));
    return null;
  }
};