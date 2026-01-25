import { axiosPrService } from "../../../axios/axiosInstance";
import { showSnackbar } from "../../../redux/reducer/appSlice";
import { isArray } from "../../../Utils/commonUtils";

export const fetchLookupOptionsSearch = (
  columnName,
  lookupKey,
  data,
  dispatch
) => {
  const baseColumnName = columnName.replace(/Name$/, '');
  let testcolumn;
  if(columnName === 'roomName'){
    testcolumn = 'rooms';
  }else if(columnName === 'hotelName') {
    testcolumn = 'hotels';
  }
  return axiosPrService
    .post(`/master/search/${[testcolumn]}`, data)
    .then((res) => {
      let responseData = [];
      if (res.status === 200 && isArray(res.data)) {
        responseData = res.data.map((el) => {
          return {
            label: el[lookupKey],
            value: el[baseColumnName + "Id"],
          };
        });
        return responseData;
      } else {
        dispatch(
          showSnackbar({
            type: "error",
            message: res.data ? res.data : "Unable to load lookup option",
          })
        );
        return responseData;
      }
    })
    .catch((e) => {
      if (e.status !== 401) {
        dispatch(showSnackbar({ type: "error", message: e.message }));
        return [];
      }
    });
};

// export const deletePrice = ({ pricingId }, data, dispatch) => {
//   return axiosPrService
//     .post(`/amount/update/price/${pricingId}`, data)
//     .then((res) => {
//       if (res.status === 200) {
//         if (res.data.message === "success") {
//           dispatch(
//             showSnackbar({
//               type: "success",
//               message: `Price deleted Successfully `,
//             })
//           );
//           return res.data.message;
//         }
//       } else {
//         dispatch(
//           showSnackbar({
//             type: "error",
//             message: res.data ? res.data : `Unable to delete price`,
//           })
//         );
//         return res.data;
//       }
//     })
//     .catch((e) => {
//       if (e.status !== 401) {
//         dispatch(showSnackbar({ type: "error", message: e.message }));
//         return false;
//       }
//     });
// };
export const deletePrice = ({ pricingId }, data, dispatch) => {
  return axiosPrService
    .post(`/amount/update/price/${pricingId}`, data)
    .then((res) => {
      console.log("res",res);
      if (res.status === 200 && res.data.message === "success") {
        dispatch(
          showSnackbar({
            type: "success",
            message: `Price deleted successfully.`,
          })
        );
        return "success";
      } else {
        dispatch(
          showSnackbar({
            type: "error",
            message: res.data.message ? res.data.message : `Unable to delete price`,
          })
        );
        return res.data;
      }
    })
    .catch((e) => {
      if (e.response && e.response.status !== 401) {
        dispatch(showSnackbar({ type: "error", message: e.message || "An error occurred" }));
      }
      return false;
    });
};
