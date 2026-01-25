import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import { axiosPrService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice';
import { isArray } from '../../../Utils/commonUtils';
import { FLOW_TYPE } from '../../../Utils/constants';

export const fetchUserList = createAsyncThunk('/fetchManageUserList', async ({ data, params }, { dispatch }) => {
  params.page = params.page + 1;
  let result = { total: 0, data: [] }
  return await axiosPrService.post('/user/list', data, { params }, { dispatch })
    .then(res => {
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

export const fetchUserListTableColumnConfig = createAsyncThunk('/fetchUserTableConfig', async ({ params }, { dispatch }) => {
  let result = [];
  return await axiosPrService.get('/configuration/user', { params }, { dispatch })
    .then(res => {
      if (res.status === 200 && isArray(res.data)) {
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
  selectedUserData: null,
};

export const manageUserTableReducer = createSlice({
  name: 'manageUserTableReducer',
  initialState,
  reducers: {
    updateTableState(state, { payload }) {
      for (let key in payload) {
        state[key] = payload[key]
      }
    },
  },
  extraReducers: {
    [fetchUserList.pending]: (state, action) => {
      state.loading = true
    },
    [fetchUserList.fulfilled]: (state, action) => {
      state.loading = false;
      state.data = action.payload?.data || [];
      state.total = action.payload?.total || 0;
    },
    [fetchUserList.rejected]: (state, action) => {
      state.loading = false;
      state.data = [];
      state.error = true;
    },

    [fetchUserListTableColumnConfig.pending]: (state, action) => {
      state.loading = true
    },
    [fetchUserListTableColumnConfig.fulfilled]: (state, action) => {
      state.loading = false;
      state.columnsOriginalResponse = action.payload
    },
    [fetchUserListTableColumnConfig.rejected]: (state, action) => {
      state.loading = false;
      state.columnsOriginalResponse = [];
      state.columnsError = true;
    },
  }
});

export const { updateTableState } = manageUserTableReducer.actions;

export default manageUserTableReducer.reducer;
