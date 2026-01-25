import { axiosPrService } from '../../axios/axiosInstance';
import { showSnackbar } from '../../redux/reducer/appSlice'


export const listHotel = async ({ data, dispatch }) => {
  return axiosPrService.post('master/search/hotels?perPage=50', data)
    .then(res => {
      if (res.status === 200) {
       // console.log(res.data);
        return res.data;
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data ? res.data : "Service unavailable" }));
        return res.data;
      }
    }).catch(e => {
      if (e.status !== 401) {
        dispatch(showSnackbar({ type: "error", message: e.message }));
        return []
      }
    });
};


export const listRoom = async ({ data, dispatch }) => {
    return axiosPrService.post('/master/search/rooms?perPage=50', data)
      .then(res => {
        if (res.status === 200) {
         // console.log(res.data);
          return res.data;
        } else {
          dispatch(showSnackbar({ type: "error", message: res.data ? res.data : "Service unavailable" }));
          return res.data;
        }
      }).catch(e => {
        if (e.status !== 401) {
          dispatch(showSnackbar({ type: "error", message: e.message }));
          return []
        }
      });
  };


  export const listCalendarDate = async ({ data, dispatch }) => {
    return axiosPrService.post('/calendar/view', data)
      .then(res => {
        console.log("calendar list >>>>>>", res);
        if (res.status === 200) {
         // console.log(res.data);
          return res.data;
        } else {
          dispatch(showSnackbar({ type: "error", message: res.data ? res.data : "Service unavailable" }));
          return res.data;
        }
      }).catch(e => {
        if (e.status !== 401) {
          dispatch(showSnackbar({ type: "error", message: e.message }));
          return []
        }
      });
  };