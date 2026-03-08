import { axiosPrService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice';

export const hotelList = ({ dispatch, searchText = '' }) => {
    return axiosPrService.post(`/master/search/hotels?perPage=100`, { hotelName: searchText })
        .then(res => {
            if (res.status === 200) {
                return res;
            } else {
                dispatch(showSnackbar({ type: "error", message: res.data ? res.data : "Service unavailable" }));
                return res;
            }
        }).catch(e => {
            if (e.response?.status !== 401) {
                const errorMessage = e.response?.data?.error || e.response?.data?.message || (typeof e.response?.data === 'string' ? e.response.data : e.message);
                dispatch(showSnackbar({ type: "error", message: errorMessage }));
            }
        });
};

export const createCoupon = ({ data, dispatch }) => {
    return axiosPrService.post('/coupon/create', data)
        .then(res => {
            if (res.status === 200 && (res.data === "Success" || res.data?.message === "Success")) {
                return "Success";
            } else {
                dispatch(showSnackbar({ type: "error", message: res.data?.error || res.data?.message || "Unable to create coupon" }));
                return res.data;
            }
        }).catch(e => {
            if (e.response?.status !== 401) {
                const errorMessage = e.response?.data?.error || e.response?.data?.message || e.message;
                dispatch(showSnackbar({ type: "error", message: errorMessage }));
            }
        });
};

export const updateCoupon = ({ data, couponId, dispatch }) => {
    return axiosPrService.post(`/coupon/edit/${couponId}`, data)
        .then(res => {
            if (res.status === 200 && (res.data === "Success" || res.data?.message === "Success")) {
                return "Success";
            } else {
                dispatch(showSnackbar({ type: "error", message: res.data?.error || res.data?.message || "Unable to update coupon" }));
                return res.data;
            }
        }).catch(e => {
            if (e.response?.status !== 401) {
                const errorMessage = e.response?.data?.error || e.response?.data?.message || (typeof e.response?.data === 'string' ? e.response.data : e.message);
                dispatch(showSnackbar({ type: "error", message: errorMessage }));
            }
        });
};
