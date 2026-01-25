import { axiosPrService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice'

export const createAmenities = ({ data, dispatch }) => {
  return axiosPrService.post('/master/amenities', data)
    .then(res => {
      console.log("master response :::: ",res);
      let result = {};
      if (res.status === 200) {
            result = res.data
            return result
            } else {
              dispatch(showSnackbar({ type: "error", message: res.data ? res.data : "Unable to create amenities" }));
              return result
            }
    })
    .catch(e => {
      dispatch(showSnackbar({ type: "error", message: e.message }));
    })
}

export const updateAmenities = ({ data, amenitiesId, dispatch }) => {

  return axiosPrService.post(`/master/amenities/${amenitiesId}/update`, data)
    .then(res => {
      //console.log("master response :::: ",res);
      let result = {};
      if (res.status === 200) {
        result = res.data
        return result
        } else {
          dispatch(showSnackbar({ type: "error", message: res.data ? res.data : "Unable to update amenities" }));
          return result
        }
    })
    .catch(e => {
      dispatch(showSnackbar({ type: "error", message: e.message }));
    })
}