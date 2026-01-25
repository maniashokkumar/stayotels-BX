import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosPrService } from '../../axios/axiosInstance';

export const fetchLookupList = createAsyncThunk('/fetchLookupList', async (columnName, { dispatch }) => {
  return await axiosPrService.post(`/master/search/${columnName}?perPage=100`, {})
    .then(res => {
      let data = { label: columnName, list: [] }
      if (res.status === 200 && res && res.data) {
        data.list = res.data
        return data;
      } else {
        return data
      }
    }).catch(e => {
      if (e.status !== 401) {
        dispatch(showSnackbar({ type: "error", message: e.message }));
      }
    })
})

export const fetchTechnicianList = createAsyncThunk('/fetchTechnicianList', async (columnName, { dispatch }) => {
 
  return await axiosPrService.post(`/master/search/${columnName}?perPage=100`, {roleId:"ROL00002"})
    .then(res => {
      let data = { label: columnName, list: [] }
      if (res.status === 200 && res && res.data) {
        data.list = res.data
        return data;
      } else {
        return data
      }
    }).catch(e => {
      if (e.status !== 401) {
        dispatch(showSnackbar({ type: "error", message: e.message }));
      }
    })
})

export const fetchStoreList = createAsyncThunk('/fetchStoreList', async (columnName,{ dispatch }) => {
 
  return await axiosPrService.post(`/master/search/store`, {})
    .then(res => {
      let data = { label: columnName, list: [] }
      if (res.status === 200 && res && res.data) {
        data.list = res.data
        return data;
      } else {
        return data
      }
    }).catch(e => {
      if (e.status !== 401) {
        dispatch(showSnackbar({ type: "error", message: e.message }));
      }
    })
})


const snackbarDataInitialState = Object.freeze({
  show: false,
  message: "",
  type: "",
  anchorOrigin: {
    vertical: 'top',
    horizontal: 'center',
  },
  autoHideDuration: 4000,
});

const initialState = {
  leftDrawerOpened: false,
  snackbarData: snackbarDataInitialState,
  projectPanel: null,
  // userLanguage is tracked here only to update localState in overview and dashboard page
  userLanguage: null,

  lookup: {},
  tlookup: {},
  clookup:{},
  pclookup:{},
  psclookup:{},
  storelookup:{},
  lookupLoading: false,
  lookupError: null,
  ulookupLoading: false,
  ulookupError: null,
  pclookupLoading: false,
  pclookupError: null,
  psclookupLoading: false,
  psclookupError: null,
  clookupLoading: false,
  clookupError: null,
  storelookupLoading: false,
  storelookupError: null
};

export const appSlice = createSlice({
  name: 'appReducer',
  initialState,
  reducers: {
    toggleLeftDrawer(state) {
      state.leftDrawerOpened = !state.leftDrawerOpened;
    },
    showSnackbar(state, action) {
      const { payload } = action;
      state.snackbarData.show = true
      state.snackbarData.message = payload.message;
      state.snackbarData.type = payload.type;
      if (payload.anchorOrigin) {
        state.snackbarData.anchorOrigin = payload?.origin;
      }
      if (payload.autoHideDuration) {
        state.snackbarData.autoHideDuration = payload.autoHideDuration;
      }
    },
    clearSnackbar(state) {
      state.snackbarData.show = false
    },
    setProjectPanel(state, action) {
      state.projectPanel = action.payload
    },
    setUserLanguage(state, action) {
      state.userLanguage = action.payload
    }
  },
  extraReducers: {
    
    [fetchTechnicianList.pending]: (state, action) => {
      state.tlookupLoading = true
    },
    [fetchLookupList.pending]: (state, action) => {
      state.lookupLoading = true
    },
    [fetchStoreList.pending]: (state, action) => {
      state.storelookupLoading = true
    },
    [fetchLookupList.fulfilled]: (state, action) => {
      const columnName = action.payload.label;
      const formatLabel = { label: "", value: "" };
      if (columnName === "role") {
        formatLabel.label = "roleDescription"
        formatLabel.value = "roleId"
      }else if(columnName === "user") {
        formatLabel.label = "userName"
        formatLabel.value = "userId"
      }
      let data = action.payload.list.map(el => {
                  return {
                    ...el,
                    label: el[formatLabel.label],
                    value: el[formatLabel.value]
                  }
                });

      state.lookup[action.payload.label] = data
      state.lookupLoading = false;
    },
    [fetchTechnicianList.fulfilled]: (state, action) => {
      const columnName = action.payload.label;
      const formatLabel = { label: "", value: "" };
      if (columnName === "user") {
        formatLabel.label = "userName"
        formatLabel.value = "userId"
      } 
      let data = action.payload.list.map(el => {
        return {
          ...el,
          label: el[formatLabel.label],
          value: el[formatLabel.value]
        }
      })
      state.tlookupLoading = false;
      state.tlookup[action.payload.label] = data
    },
    [fetchStoreList.fulfilled]: (state, action) => {
      const columnName = action.payload.label;
      const formatLabel = { label: "", value: "" };
      if (columnName === "storeDetails") {
        formatLabel.label = "businessName"
        formatLabel.value = "businessName"
      } 

      let data = action.payload.list.map(el => {
        return {
          ...el,
          label: el[formatLabel.label],
          value: el[formatLabel.value]
        }
      })
      state.storelookupLoading = false;
      state.storelookup[action.payload.label] = data
    },
    
    [fetchLookupList.rejected]: (state, action) => {
      state.lookupLoading = false;
      state.lookupError = true;
    },
    [fetchTechnicianList.rejected]: (state, action) => {
      state.tlookupLoading = false;
      state.tlookupError = true;
    },
    [fetchStoreList.rejected]: (state, action) => {
      state.storelookupLoading = false;
      state.storelookupError = true;
    },
  }
});

export const { toggleLeftDrawer,showSnackbar,clearReduxCache, clearSnackbar, setProjectPanel, setUserLanguage } = appSlice.actions;

export default appSlice.reducer;
