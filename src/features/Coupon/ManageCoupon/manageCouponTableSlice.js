import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { axiosPrService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice';
import { FLOW_TYPE } from '../../../Utils/constants';

export const fetchCouponList = createAsyncThunk('/fetchManageCouponList', async ({ data, params }, { dispatch }) => {
    params.page = params.page + 1;
    let result = { total: 0, data: [] };

    return await axiosPrService.get('/coupon/getallcoupon', { params }, { dispatch })
        .then(res => {
            if (res.status === 200 && Array.isArray(res.data)) {
                result = { total: Number(res.headers['x-total-records']), data: res.data };
                return result;
            } else {
                dispatch(showSnackbar({ type: "error", message: res.data ? res.data : "Service unavailable" }));
                return result;
            }
        }).catch(e => {
            if (e.status !== 401) {
                dispatch(showSnackbar({ type: "error", message: e.message }));
            }
            return result;
        });
});


const initialState = {
    // table 
    data: [],
    loading: false,
    error: null,

    page: 0,
    total: 0,
    rowsPerPage: 10,
    sortBy: "",
    sortKey: "",
    appliedFilterList: [],

    flow: FLOW_TYPE.NEW,
    selectedCouponData: null,
};

export const manageCouponTableReducer = createSlice({
    name: 'manageCouponTableReducer',
    initialState,
    reducers: {
        updateCouponTableState(state, { payload }) {
            for (let key in payload) {
                state[key] = payload[key]
            }
        },
    },
    extraReducers: {
        [fetchCouponList.pending]: (state, action) => {
            state.loading = true
        },
        [fetchCouponList.fulfilled]: (state, action) => {
            state.loading = false;
            state.data = action.payload?.data || [];
            state.total = action.payload?.total || 0;
        },
        [fetchCouponList.rejected]: (state, action) => {
            state.loading = false;
            state.data = [];
            state.error = true;
        },
    }
});

export const { updateCouponTableState } = manageCouponTableReducer.actions;

export default manageCouponTableReducer.reducer;
