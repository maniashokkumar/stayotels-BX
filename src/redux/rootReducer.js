import { combineReducers } from 'redux';
import appReducer from './reducer/appSlice';
import loginReducer from '../features/Login/loginSlice';
import manageUserTableReducer from '../features/User/ManageUser/manageUserTableSlice';
import manageLocationTableReducer from '../features/Location/ManageLocation/manageLocationTableSlice';
import manageAmenitiesTableReducer from '../features/Amenities/ManageAmenities/manageAmenitiesTableSlice';
import managePriceTableReducer from '../features/Price/ManagePrice/managePriceTableSlice';
import manageHotelTableReducer from '../features/Hotel/ManageHotel/manageHotelTableSlice';
import manageRoomsTableReducer from '../features/Rooms/ManageRooms/manageRoomsTableSlice';
import manageReservationTableReducer from '../features/Reservation/ManageReservation/manageReservationTableSlice';
import manageCouponTableReducer from '../features/Coupon/ManageCoupon/manageCouponTableSlice';

const rootReducer = combineReducers({
  appReducer,
  loginReducer,
  manageUserTableReducer,
  manageLocationTableReducer,
  manageAmenitiesTableReducer,
  managePriceTableReducer,
  manageHotelTableReducer,
  manageRoomsTableReducer,
  manageReservationTableReducer,
  manageCouponTableReducer,

});

// const clearReducer = (state, action) => {
//   console.log('clear reducer called.......................');
//   if (action.type === 'clearReduxCache') {
//     state = undefined;
//   }
//   return rootReducer(state, action);
// };

export default rootReducer