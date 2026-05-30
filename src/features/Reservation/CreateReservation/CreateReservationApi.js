import { axiosPrService, axiosPbService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice'


export const createReservation = async ({ data, dispatch }) => {
  try {
    const res = await axiosPrService.post('/reservation/reservation', data);
    console.log("resssss",res)
    if (res.status === 200) {
      return res.data;
    }else{
      dispatch(showSnackbar({ type: "error", message: res.data?.message || "Unable to create reservation" }));
      return res.data;
    }
   

  } catch (error) {
    dispatch(showSnackbar({ type: "error", message: error.message || "Server error" }));
    return error;
  }
};

export const completeGuestBilling = async ({ body, dispatch }) => {
  try {
    const res = await axiosPrService.post('/reservation/completion/guest-billing', body);
    if (res.status === 200 && res.data?.success) return res.data;
    const msg = typeof res.data === 'string' ? res.data : res.data?.message || 'Unable to save guest details';
    dispatch(showSnackbar({ type: 'error', message: msg }));
    return null;
  } catch (e) {
    dispatch(showSnackbar({ type: 'error', message: e.message || 'Server error' }));
    return null;
  }
};

export const fetchHotelMealPlansActive = async ({ hotelId, dispatch }) => {
  try {
    const res = await axiosPrService.get(`/hotel/${hotelId}/meal-plans/active`);
    if (res.status === 200) return res.data;
    dispatch(showSnackbar({ type: 'error', message: 'Unable to load meal plans' }));
    return [];
  } catch (e) {
    dispatch(showSnackbar({ type: 'error', message: e.message || 'Server error' }));
    return [];
  }
};

export const completeMealPlan = async ({ body, dispatch }) => {
  try {
    const res = await axiosPrService.post('/reservation/completion/meal-plan', body);
    if (res.status === 200 && res.data?.success) return res.data;
    const msg = typeof res.data === 'string' ? res.data : res.data?.message || 'Unable to save meal plan';
    dispatch(showSnackbar({ type: 'error', message: msg }));
    return null;
  } catch (e) {
    const msg =
      (e.response && typeof e.response.data === 'string' && e.response.data) ||
      e.response?.data?.message ||
      e.message ||
      'Server error';
    dispatch(showSnackbar({ type: 'error', message: msg }));
    return null;
  }
};

export const updateReservationMealPlan = async ({ body, dispatch }) => {
  try {
    const res = await axiosPrService.post('/reservation/update-meal-plan', body);
    if (res.status === 200 && res.data?.success) return res.data;
    const msg = typeof res.data === 'string' ? res.data : res.data?.message || 'Unable to update meal plan';
    dispatch(showSnackbar({ type: 'error', message: msg }));
    return null;
  } catch (e) {
    const msg =
      (e.response && typeof e.response.data === 'string' && e.response.data) ||
      e.response?.data?.message ||
      e.message ||
      'Server error';
    dispatch(showSnackbar({ type: 'error', message: msg }));
    return null;
  }
};

export const completeAddOns = async ({ body, dispatch }) => {
  try {
    const res = await axiosPrService.post('/reservation/completion/add-ons', body);
    if (res.status === 200 && res.data?.success) return res.data;
    const msg = typeof res.data === 'string' ? res.data : res.data?.message || 'Unable to save add-ons';
    dispatch(showSnackbar({ type: 'error', message: msg }));
    return null;
  } catch (e) {
    dispatch(showSnackbar({ type: 'error', message: e.message || 'Server error' }));
    return null;
  }
};

export const completePayments = async ({ body, dispatch }) => {
  try {
    const res = await axiosPrService.post('/reservation/completion/payments', body);
    if (res.status === 200 && res.data?.success) return res.data;
    const msg = typeof res.data === 'string' ? res.data : res.data?.message || 'Unable to save payments';
    dispatch(showSnackbar({ type: 'error', message: msg }));
    return null;
  } catch (e) {
    dispatch(showSnackbar({ type: 'error', message: e.message || 'Server error' }));
    return null;
  }
};

/** Cancellation or amendment refund bookkeeping (RESERVATION:EDIT). */
export const updateReservationRefundStatus = async ({ reservationId, refundStatus, dispatch }) => {
  try {
    const res = await axiosPrService.post('/reservation/update-refund-status', {
      reservationId,
      refundStatus,
    });
    if (res.status === 200) {
      dispatch(showSnackbar({ type: 'success', message: 'Refund status updated successfully' }));
      return true;
    }
    const errMsg = typeof res.data === 'string' ? res.data : 'Failed to update refund status';
    dispatch(showSnackbar({ type: 'error', message: errMsg }));
    return false;
  } catch (e) {
    const msg =
      (e.response && typeof e.response.data === 'string' && e.response.data) ||
      e.message ||
      'Request failed';
    dispatch(showSnackbar({ type: 'error', message: msg }));
    return false;
  }
};

/** Record a single payment on blocked/confirmed reservations (no overpayment). */
export const collectReservationPayment = async ({ body, dispatch }) => {
  try {
    const res = await axiosPrService.post('/reservation/payment/collect', body);
    if (res.status === 200 && res.data?.success) return res.data;
    const msg =
      typeof res.data === 'string' ? res.data : res.data?.message || 'Unable to record payment';
    dispatch(showSnackbar({ type: 'error', message: msg }));
    return null;
  } catch (e) {
    const msg =
      (e.response && typeof e.response.data === 'string' && e.response.data) ||
      e.response?.data?.message ||
      e.message ||
      'Server error';
    dispatch(showSnackbar({ type: 'error', message: msg }));
    return null;
  }
};

export const completeFinalize = async ({ body, dispatch }) => {
  try {
    const res = await axiosPrService.post('/reservation/completion/finalize', body);
    if (res.status === 200 && res.data?.success) return res.data;
    const msg = typeof res.data === 'string' ? res.data : res.data?.message || 'Unable to finalize';
    dispatch(showSnackbar({ type: 'error', message: msg }));
    return null;
  } catch (e) {
    dispatch(showSnackbar({ type: 'error', message: e.message || 'Server error' }));
    return null;
  }
};

export const updateReservation = ({ data, reservationId, dispatch }) => {
  return axiosPrService.post(`reservation/reservation/${reservationId}/update`, data)
    .then(res => {
      let result = ""
      if (res.status === 200) {
        const msg = typeof res.data === 'string' ? res.data : '';
        if (msg === "Success" || /updated successfully/i.test(msg)) {
          result = "Success";
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
      if (res.data.status === 401) {
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

export const fetchBookingQuote = async ({ data, dispatch }) => {
  try {
    const res = await axiosPbService.post('/book/quote', data);
    if (res.status === 200) {
      return res.data;
    }
    dispatch(showSnackbar({ type: 'error', message: res.data?.error || 'Unable to fetch tax quote' }));
    return null;
  } catch (error) {
    dispatch(showSnackbar({ type: 'error', message: error.message || 'Server error' }));
    return null;
  }
};

export const availableRoomsByHotel = async ({ data, dispatch }) => {
  try {
    const res = await axiosPbService.post("/room/search/available-rooms", data);
    if (res.status === 200) {
      return res.data;
    }
    dispatch(showSnackbar({ type: "error", message: res.data?.message || "Unable to fetch rooms" }));
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
