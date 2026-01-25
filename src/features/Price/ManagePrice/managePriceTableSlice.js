import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { axiosPrService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice';
import { isArray } from '../../../Utils/commonUtils';
import { FLOW_TYPE } from '../../../Utils/constants';

export const fetchPriceList = createAsyncThunk('/fetchManagePriceList', async ({ data, params }, { dispatch }) => {
  params.page = params.page + 1;
  let result = { total: 0, data: [] }
  return await axiosPrService.post('/amount/search/price', data, { params }, { dispatch })
    .then(res => {
      if (res.status === 200 && Array.isArray(res.data)) {
        res.data.forEach(item => {
          // Format checkIn date
          if (item.fromDate) {
            const checkInDate = new Date(item.fromDate);
            item.fromDate = checkInDate.toISOString().split("T")[0]; // Converts to YYYY-MM-DD
          }

          // Format checkOut date
          if (item.toDate) {
            const checkOutDate = new Date(item.toDate);
            item.toDate = checkOutDate.toISOString().split("T")[0]; // Converts to YYYY-MM-DD
          }

          // if (item.days) {
          //   const checkOutDay = item.days.length > 0  ? item.days : "N/A";
          //   item.days = checkOutDay; 
          // }

          // if (item.days) {
          //   item.days = item.days.length > 0 ? item.days : []; 
          // }
        
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
        return result;
      }
    });
});

export const fetchPriceListTableColumnConfig = createAsyncThunk('/fetchPriceTableConfig', async ({ params }, { dispatch }) => {
  let result = [];
  return await axiosPrService.get('/configuration/price', { params }, { dispatch })
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
  selectedPriceData: null,
};

export const managePriceTableReducer = createSlice({
  name: 'managePriceTableReducer',
  initialState,
  reducers: {
    updateTableState(state, { payload }) {
      for (let key in payload) {
        state[key] = payload[key]
      }
    },
  },
  extraReducers: {
    [fetchPriceList.pending]: (state, action) => {
      state.loading = true
    },
    [fetchPriceList.fulfilled]: (state, action) => {
      state.loading = false;
      state.data = action.payload?.data || [];
      state.total = action.payload?.total || 0;
    },
    [fetchPriceList.rejected]: (state, action) => {
      state.loading = false;
      state.data = [];
      state.error = true;
    },

    [fetchPriceListTableColumnConfig.pending]: (state, action) => {
      state.loading = true
    },
    [fetchPriceListTableColumnConfig.fulfilled]: (state, action) => {
      state.loading = false;
      state.columnsOriginalResponse = action.payload
    },
    [fetchPriceListTableColumnConfig.rejected]: (state, action) => {
      state.loading = false;
      state.columnsOriginalResponse = [];
      state.columnsError = true;
    },
  }
});

export const { updateTableState } = managePriceTableReducer.actions;

export default managePriceTableReducer.reducer;
