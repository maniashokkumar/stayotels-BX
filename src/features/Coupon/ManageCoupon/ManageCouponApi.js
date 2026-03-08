import { axiosPrService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice';

export const deleteCoupon = ({ couponId }, dispatch) => {
    return axiosPrService.delete(`/coupon/delete/${couponId}`)
        .then(res => {
            if (res.status === 200 && (res.data === "Success" || res.data?.message === "Success")) {
                dispatch(showSnackbar({ type: "success", message: `Coupon deleted successfully.` }));
                return true;
            } else {
                dispatch(showSnackbar({ type: "error", message: res.data?.error || res.data?.message || `Unable to delete coupon` }));
                return false;
            }
        }).catch(e => {
            if (e.status !== 401) {
                dispatch(showSnackbar({ type: "error", message: e.message }));
                return false;
            }
        })
};
