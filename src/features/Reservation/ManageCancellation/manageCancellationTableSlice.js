import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosPrService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice';

export const fetchCancellationList = createAsyncThunk('/fetchManageCancellationList', async ({ data, params }, { dispatch }) => {
    let result = { total: 0, data: [] };

    return await axiosPrService.post('/reservation/cancellation-list', data, { params }, { dispatch })
        .then(res => {
            if (res.status === 200 && Array.isArray(res.data)) {
                res.data.forEach(item => {
                    if (item.cancelledAt) {
                        const date = new Date(item.cancelledAt);
                        item.cancelledAtFormatted = date.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }).replace(',', '');
                    }
                });
                result = { total: res.data.length || 0, data: res.data };
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

export const updateRefundDetails = createAsyncThunk('/updateRefundDetails', async ({ id, refundStatus }, { dispatch, getState }) => {
    try {
        const res = await axiosPrService.post('/reservation/update-refund-status', {
            reservationId: id,
            refundStatus,
        });
        if (res.status === 200) {
            dispatch(showSnackbar({ type: 'success', message: 'Refund status updated successfully' }));
            const prev = getState().manageCancellationTableReducer.lastCancellationSearch;
            dispatch(fetchCancellationList(prev || { data: {}, params: {} }));
            return { id, refundStatus };
        }
        const errMsg = typeof res.data === 'string' ? res.data : 'Failed to update refund status';
        dispatch(showSnackbar({ type: 'error', message: errMsg }));
        return null;
    } catch (e) {
        const msg = e.response?.data && typeof e.response.data === 'string' ? e.response.data : (e.message || 'Request failed');
        dispatch(showSnackbar({ type: 'error', message: msg }));
        return null;
    }
});

const initialState = {
    data: [],
    loading: false,
    error: null,
    page: 0,
    total: 0,
    rowsPerPage: 10,
    sortBy: "cancelledAt",
    sortKey: "desc",
    appliedFilterList: [],
    lastCancellationSearch: { data: {}, params: {} },
};

export const manageCancellationTableSlice = createSlice({
    name: 'manageCancellationTableSlice',
    initialState,
    reducers: {
        updateCancellationTableState(state, { payload }) {
            for (let key in payload) {
                state[key] = payload[key]
            }
        },
    },
    extraReducers: {
        [fetchCancellationList.pending]: (state, action) => {
            state.loading = true;
            if (action.meta?.arg) {
                state.lastCancellationSearch = action.meta.arg;
            }
        },
        [fetchCancellationList.fulfilled]: (state, action) => {
            state.loading = false;
            state.data = action.payload?.data || [];
            state.total = action.payload?.total || 0;
        },
        [fetchCancellationList.rejected]: (state) => {
            state.loading = false;
            state.data = [];
            state.error = true;
        },
        [updateRefundDetails.fulfilled]: (state, action) => {
            if (action.payload) {
                const index = state.data.findIndex(item => item.reservationId === action.payload.id);
                if (index !== -1) {
                    state.data[index] = { ...state.data[index], refundStatus: action.payload.refundStatus };
                }
            }
        }
    }
});

export const { updateCancellationTableState } = manageCancellationTableSlice.actions;
export default manageCancellationTableSlice.reducer;
