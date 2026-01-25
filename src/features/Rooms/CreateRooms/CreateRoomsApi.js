import { axiosPrService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice'

export const createRooms = ({ data, dispatch }) => {
  return axiosPrService.post('/room/create', data)    
    .then(res => {
      console.log("Response:", res);
      if (res.status === 200) {
        if (res.data.message === "Room already exists") {
          dispatch(showSnackbar({ type: "error", message: "Room already exists. Try a different name." }));
          return res.data?.message; 
        } else {
          return res.data;
        }
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data?.message || "Unable to create room" }));
        return null;
      }
    }) 
    .catch(e => {
      dispatch(showSnackbar({ type: "error", message: e.message || "Server error" }));
      return null;
    });
};


export const updateRooms = ({ data, id, dispatch }) => {

  return axiosPrService.post(`/master/rooms/${id}/update`, data)
    .then(res => {
      let result = ""
      if (res.status === 200) {
        console.log("RRRRRRRRR",res.data)
        if (res.data === "Room name already exists") {
          dispatch(showSnackbar({ type: "error", message: "Room already exists. Try a different name." }));
          return res.data; 
        } else {
          return res.data;
        }
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data ? res.data : "Unable to update room" }));
        return result
      }
    })
    .catch(e => {
      dispatch(showSnackbar({ type: "error", message: e.message }));
    })
}


export const loccationList = ({ id, data, dispatch }) => {
  return axiosPrService.post(`/master/search/location?perPage=100`,{})
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