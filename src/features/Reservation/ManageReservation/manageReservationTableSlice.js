import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { axiosPrService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice';
import { isArray } from '../../../Utils/commonUtils';
import { FLOW_TYPE } from '../../../Utils/constants'; 

export const fetchReservationList = createAsyncThunk('/fetchManageReservationList', async ({ data, params }, { dispatch }) => {
  params.page = params.page + 1;
  let result = { total: 0, data: [] };

  /** Manage Reservation = CP channel; include soft-deleted rows so “Cancel” (admin delete) still appears with status label. */
  const body = { ...data, salesChannelexacis: 'CONTROL_PANEL', includeSoftDeleted: true };
  return await axiosPrService.post('/reservation/search/reservation', body, { params }, { dispatch })
    .then(res => {
      console.log("reservation list >>>>>>", res);
      if (res.status === 200 && Array.isArray(res.data)) {
        res.data.forEach(item => {
          // Format checkIn date
          if (item.checkIn) {
            const checkInDate = new Date(item.checkIn);
            item.checkIn = checkInDate.toISOString().split("T")[0]; 
          }
          // Format checkOut date
          if (item.checkOut) {
            const checkOutDate = new Date(item.checkOut);
            item.checkOut = checkOutDate.toISOString().split("T")[0];
          }
        });

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


export const fetchReservationListTableColumnConfig = createAsyncThunk('/fetchReservationTableConfig', async ({ params }, { dispatch }) => {
  let result = [];
  return await axiosPrService.get('/configuration/reservation', { params }, { dispatch })
    .then(res => {
      if (res.status === 200 && isArray(res.data)) {
        console.log("res.data"+JSON.stringify(res.data))
        let result = res.data[0].fields;
        console.log(result);
        return result
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data ? res.data : "Service unavailable" }));
        return result;
      }
    }).catch(e => {
      if (e.status !== 401) {
        dispatch(showSnackbar({ type: "error", message: e.message }));
        return result;
      }
    });
});



const initialState = {
  // table 
  data: [],
  loading: false,
  error: null,

  // columns 
  columnsOriginalResponse: [],
  columnsError: null,

  page: 0,
  total: 0,
  rowsPerPage: 10,
  sortBy: "",
  sortKey: "",
  appliedFilterList: [],

  flow: FLOW_TYPE.NEW,
  selectedReservationData: null,
  /** Hotel filter on manage list — used when opening Create Reservation */
  prefillHotelId: '',
};

export const manageReservationTableReducer = createSlice({
  name: 'manageReservationTableReducer',
  initialState,
  reducers: {
    updateTableState(state, { payload }) {
      for (let key in payload) {
        state[key] = payload[key]
      }
    },
  },
  extraReducers: {
    [fetchReservationList.pending]: (state, action) => {
      state.loading = true
    },
    [fetchReservationList.fulfilled]: (state, action) => {
      state.loading = false;
      state.data = action.payload?.data || [];
      state.total = action.payload?.total || 0;
    },
    [fetchReservationList.rejected]: (state, action) => {
      state.loading = false;
      state.data = [];
      state.error = true;
    },

    [fetchReservationListTableColumnConfig.pending]: (state, action) => {
      state.loading = true
    },
    [fetchReservationListTableColumnConfig.fulfilled]: (state, action) => {
      state.loading = false;
      state.columnsOriginalResponse = action.payload
    },
    [fetchReservationListTableColumnConfig.rejected]: (state, action) => {
      state.loading = false;
      state.columnsOriginalResponse = [];
      state.columnsError = true;
    },
  }
});

export const { updateTableState } = manageReservationTableReducer.actions;

export default manageReservationTableReducer.reducer;
