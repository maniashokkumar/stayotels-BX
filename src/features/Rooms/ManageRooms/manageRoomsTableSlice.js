import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { axiosPrService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice';
import { isArray } from '../../../Utils/commonUtils';
import { FLOW_TYPE } from '../../../Utils/constants';

export const fetchRoomsList = createAsyncThunk('/fetchManageRoomsList', async ({ data, params }, { dispatch }) => {
  params.page = params.page + 1;
  let result = { total: 0, data: [] }
  return await axiosPrService.post('/master/search/rooms', data, { params }, { dispatch })
    .then(res => {
      console.log("Room list >>>>>>", res);
      if (res.status === 200 && isArray(res.data)) {
        console.log(res.data);
        result = { total: Number(res.headers['x-total-records']), data: res.data }
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

export const fetchRoomsListTableColumnConfig = createAsyncThunk('/fetchRoomsTableConfig', async ({ params }, { dispatch }) => {
  let result = [];
  try {
    return await axiosPrService.get('/configuration/rooms', { params }, { dispatch })
    .then(res => {
      if (res.status === 200 && res.data) {
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
  } catch (error) {
    console.log("error",error);
  }
 
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
  selectedRoomsData: null,
};

export const manageRoomsTableReducer = createSlice({
  name: 'manageRoomsTableReducer',
  initialState,
  reducers: {
    updateTableState(state, { payload }) {
      for (let key in payload) {
        state[key] = payload[key]
      }
    },
  },
  extraReducers: {
    [fetchRoomsList.pending]: (state, action) => {
      state.loading = true
    },
    [fetchRoomsList.fulfilled]: (state, action) => {
      state.loading = false;
      state.data = action.payload?.data || [];
      state.total = action.payload?.total || 0;
    },
    [fetchRoomsList.rejected]: (state, action) => {
      state.loading = false;
      state.data = [];
      state.error = true;
    },

    [fetchRoomsListTableColumnConfig.pending]: (state, action) => {
      state.loading = true
    },
    [fetchRoomsListTableColumnConfig.fulfilled]: (state, action) => {
      state.loading = false;
      state.columnsOriginalResponse = action.payload
    },
    [fetchRoomsListTableColumnConfig.rejected]: (state, action) => {
      state.loading = false;
      state.columnsOriginalResponse = [];
      state.columnsError = true;
    },
  }
});

export const { updateTableState } = manageRoomsTableReducer.actions;

export default manageRoomsTableReducer.reducer;
