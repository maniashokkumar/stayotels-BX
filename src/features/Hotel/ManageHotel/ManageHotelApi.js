import { axiosPrService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice';
import { isArray } from '../../../Utils/commonUtils';

export const fetchLookupOptionsSearch = (columnName, lookupKey, data, dispatch) => {
  const baseColumnName = columnName.replace(/Name$/, '');
  console.log("baseColumnName",baseColumnName)
  return axiosPrService.post(`/master/search/${[baseColumnName]}`, data)
    .then(res => {
      let responseData = []
      if (res.status === 200 && isArray(res.data)) {
        responseData = res.data.map(el => {
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

export const deleteHotel = ({ hotelId }, data, dispatch) => {
  return axiosPrService.post(`/master/hotels/${hotelId}/update`, data)
    .then(res => {
      if (res.status === 200) {
        if(res.data === "Unable to delete hotel. Active rooms are there."){
          dispatch(showSnackbar({ type: "error", message: `Hotel has been assigned to the rooms/price and cannot be deleted!` }));
          return res.data
        }else{
          dispatch(showSnackbar({ type: "success", message: `Hotel deleted successfully.` }));
          return res.data
        }
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data ? res.data : `Unable to delete hotel` }));
        return res.data
      }
    }).catch(e => {
      if (e.status !== 401) {
        dispatch(showSnackbar({ type: "error", message: e.message }));
        return false;
      }
    })
};