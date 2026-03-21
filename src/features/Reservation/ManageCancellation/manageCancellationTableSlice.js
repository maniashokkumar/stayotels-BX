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

export const updateRefundDetails = createAsyncThunk('/updateRefundDetails', async ({ id, data }, { dispatch }) => {
    return await axiosPrService.post(`/reservation/reservation/update`, {
        reservationId: id,
        ...data
    }, {}, { dispatch })
        .then(res => {
            if (res.status === 200) {
                dispatch(showSnackbar({ type: "success", message: "Refund details updated successfully" }));
                return { id, data };
            } else {
                dispatch(showSnackbar({ type: "error", message: "Failed to update refund details" }));
                return null;
            }
        }).catch(e => {
            dispatch(showSnackbar({ type: "error", message: e.message }));
            return null;
        });
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
        [fetchCancellationList.pending]: (state) => {
            state.loading = true;
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
                    state.data[index] = { ...state.data[index], ...action.payload.data };
                }
            }
        }
    }
});

export const { updateCancellationTableState } = manageCancellationTableSlice.actions;
export default manageCancellationTableSlice.reducer;
