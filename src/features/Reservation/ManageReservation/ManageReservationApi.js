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

/** Cancel booking (status CANCELLED); reservation row stays in DB for lists and refunds. */
export const cancelReservationFromControlPanel = ({ reservationId }, dispatch) => {
  return axiosPrService
    .post('/reservation/control-panel/cancel', { reservationId })
    .then((res) => {
      if (res.status === 200 && res.data?.success) {
        dispatch(showSnackbar({ type: 'success', message: 'Reservation cancelled' }));
        return true;
      }
      const msg =
        typeof res.data === 'string' ? res.data : res.data?.message || 'Unable to cancel reservation';
      dispatch(showSnackbar({ type: 'error', message: msg }));
      return false;
    })
    .catch((e) => {
      const msg =
        (e.response && typeof e.response.data === 'string' && e.response.data) ||
        e.message ||
        'Request failed';
      dispatch(showSnackbar({ type: 'error', message: msg }));
      return false;
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