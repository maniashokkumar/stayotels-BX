import { axiosPrService } from '../../../axios/axiosInstance';
import { showSnackbar } from '../../../redux/reducer/appSlice'

export const createUser = ({ data, dispatch }) => {
  return axiosPrService.post('/user/create', data)
    .then(res => {

      let result = ""
      if (res.status === 200) {
            // console.log("response : ",res.data);
            if (res.data === "Success") {
              result = res.data
              return result
            } else {
              if(res.data==="already exists"){
                res.data = "User Email ID or Phone Number already exists!";
              }
              dispatch(showSnackbar({ type: "error", message: res.data ? res.data : "Unable to create user" }));
              return result
            }
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data ? res.data : "Unable to create user" }));
        return result
      }
    })
    .catch(e => {
      dispatch(showSnackbar({ type: "error", message: e.message }));
    })
}

export const updateUser = ({ data, userId, dispatch }) => {

  return axiosPrService.post(`/master/user/${userId}/update`, data)
    .then(res => {
      let result = ""
      if (res.status === 200) {
        if (res.data === "Success") {
          result = res.data
          return result
        } else {
          console.log('else')
          dispatch(showSnackbar({ type: "error", message: res.data ? res.data : "Unable to update user" }));
          return result
        }
      } else {
        dispatch(showSnackbar({ type: "error", message: res.data ? res.data : "Unable to update user" }));
        return result
      }
    })
    .catch(e => {
      dispatch(showSnackbar({ type: "error", message: e.message }));
    })
}


export const roleList = ({ id, data, dispatch }) => {
  return axiosPrService.post(`/master/search/role?perPage=100`,{})
    .then(res => {
      // console.log("res dataaaaaa usecase:: " + res);
      if (res.data.status === 401) {
        //handleUnauthorized(dispatch);
        return null;
      }
      else {
        return res;
      }
    }).catch(e => {
      dispatch(showSnackbar({ type: "error", message: e.message }));
      return null;
    })
};


export const hotelList = ({ data, dispatch }) => {
  return axiosPrService.post(`/master/search/hotels?perPage=200`, data)
    .then(res => {
      console.log("data",res.data)
      // console.log("res dataaaaaa usecase:: " + res);
      if (res.data.status === 401) {
        //handleUnauthorized(dispatch);
        return null;
      }
      else {
        return res;
      }
    }).catch(e => {
      dispatch(showSnackbar({ type: "error", message: e.message }));
      return null;
    })
};