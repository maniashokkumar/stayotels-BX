import { axiosPrService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice';
import { isArray } from '../../../Utils/commonUtils';

export const fetchLookupOptionsSearch = (columnName, lookupKey, data, dispatch) => {
  let baseColumnName = columnName.replace(/Name$/, '');
  if (columnName === 'hotelName') {
    baseColumnName = 'hotels';
  }

  return axiosPrService.post(`/master/search/${baseColumnName}`, data)
    .then(res => {
      let responseData = [];
      if (res.status === 200 && Array.isArray(res.data)) {
        responseData = res.data.map(el => ({
          label: el[lookupKey],
          value: el[baseColumnName + "Id"],
        }));
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
    });
};

export const deleteRooms = ({ roomId }, data, dispatch) => {
  return axiosPrService.post(`/master/rooms/${roomId}/update`, data)
    .then(res => {
      if(res.data === "Unable to delete Room. Active price are there."){
        dispatch(showSnackbar({ type: "error", message: `Room has been assigned to the hotel/price and cannot be deleted!` }));
        return res.data
      }else{
        dispatch(showSnackbar({ type: "success", message: `Room deleted successfully.` }));
        return res.data
      }
    }).catch(e => {
      if (e.status !== 401) {
        dispatch(showSnackbar({ type: "error", message: e.message }));
        return false;
      }
    })
};


