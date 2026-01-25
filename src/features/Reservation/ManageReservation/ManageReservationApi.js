import { axiosPrService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice';
import { isArray } from '../../../Utils/commonUtils';
export const fetchLookupOptionsSearch = (
  columnName,
  lookupKey,
  data,
  dispatch
) => {
  const baseColumnName = columnName.replace(/Name$/, '');
  let testcolumn;
  if(columnName === 'roomName'){
    testcolumn = 'rooms';
  }else if(columnName === 'hotelName') {
    testcolumn = 'hotel';
  }
  return axiosPrService
    .post(`/master/search/${[testcolumn]}`, data)
    .then((res) => {
      let responseData = [];
      if (res.status === 200 && isArray(res.data)) {
        responseData = res.data.map((el) => {
          return {
            label: el[lookupKey],
            value: el[baseColumnName + "Id"],
          };
        });
        return responseData;
      } else {
        dispatch(
          showSnackbar({
            type: "error",
            message: res.data ? res.data : "Unable to load lookup option",
          })
        );
        return responseData;
      }
    })
    .catch((e) => {
      if (e.status !== 401) {
        dispatch(showSnackbar({ type: "error", message: e.message }));
        return [];
      }
    });
};

export const deleteReservation = ({ reservationId }, data, dispatch) => {
  return axiosPrService.post(`/reservation/reservation/${reservationId}/update`, data)
    .then(res => {
      if (res.status === 200) {
        dispatch(showSnackbar({ type: "success", message: `Reservation deleted successfully.` }));
        return res.data
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data ? res.data : `Unable to delete reservation` }));
        return res.data
      }
    }).catch(e => {
      if (e.status !== 401) {
        dispatch(showSnackbar({ type: "error", message: e.message }));
        return false;
      }
    })
};