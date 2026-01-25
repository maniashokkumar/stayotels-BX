import { axiosPrService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice';
import { isArray } from '../../../Utils/commonUtils';

export const fetchLookupOptionsSearch = (columnName, lookupKey, data, dispatch) => {
  return axiosPrService.post(`/master/search/${[columnName]}`, data)
    .then(res => {
      let responseData = []
      if (res.status === 200 && isArray(res.data)) {
        responseData = res.data.map(el => {
          return {
            label: el[lookupKey],
            value: el[columnName + "Id"],
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

export const deleteAmenities = ({ amenitiesId }, data, dispatch) => {
  return axiosPrService.post(`/master/amenities/${amenitiesId}/update`, data)
    .then(res => {
      console.log("master response :::: ",res);
      if (res.status === 200) {
        if (res.data === "Unable to delete Amenity. Amenity is assigned to Hotels."){
          dispatch(showSnackbar({ type: "error", message: `Amenities has been assigned to the hotel(s) and cannot be deleted!` }));
          return res.data
        } 
        else{
          dispatch(showSnackbar({ type: "success", message: `Amenities deleted successfully.` }));
          return res.data
        }
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data ? `Amenities have been assigned to the hotel/room and cannot be deleted!` : `` }));
        return res.data
      }
    }).catch(e => {
      if (e.status !== 401) {
        dispatch(showSnackbar({ type: "error", message: e.message }));
        return false;
      }
    })
};