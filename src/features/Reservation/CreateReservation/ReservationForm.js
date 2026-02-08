import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Breadcrumb, Loader } from "../../../components/index";
import dayjs from "dayjs";
import { FLOW_TYPE } from "../../../Utils/constants";
import {
  createReservation,
  updateReservation,
  priceCalculation,
  priceUpdate
} from "./CreateReservationApi";
import { fetchReservationList } from "../../Reservation/ManageReservation/manageReservationTableSlice"
import { updateTableState } from "../../Reservation/ManageReservation/manageReservationTableSlice";
import { fetchLookupList, showSnackbar } from "../../../redux/reducer/appSlice";
import {
  InputField,
  CustomSelectField,
  KeyBoardDatePicker,
  NumberComponent,
} from "../../../components/ReactHookForm/index";
import { Button, InputAdornment } from "@mui/material";
import "./CreateReservation.scss";

function ReservationForm({ priceDetails, priceFormData }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [pageLoader, setPageLoader] = useState(false);
  const [hotelListData, setHotelListData] = useState([]);
  const [roomOptions, setRoomOptions] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState("");
  const [onSumbitLoader, setOnSumbitLoader] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [price, setPrice] = useState("");
  const [listRoom, setListRoom] = useState([]);

  const flow = useSelector((state) => state.manageReservationTableReducer.flow);
  const showSessionPopup = useSelector((state) => state.loginReducer.showSessionPopup);

  useEffect(() => {
  }, [showSessionPopup]);

  const reservationForm = {
    price: "",
    roomId: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
  };

  const { handleSubmit, control, reset, setValue } = useForm({
    defaultValues: reservationForm,
  });


  const handleRoomSelect = (roomId) => {
    console.log("roomId", roomId);
    const selectedRoomData = priceDetails.find((room) => room.value === roomId);
    console.log("selectedRoomData", selectedRoomData);
    if (selectedRoomData) {
      setPrice(selectedRoomData.price);
      setValue("price", selectedRoomData.price);
    }
    setSelectedRoom(roomId);
  };

  const submitHandler = async (formData) => {
    formData.hotelId = priceFormData.hotelId;
    formData.cdnintnoOfPersons = priceFormData.cdnintnoOfPersons;
    formData.noofRooms = priceFormData.noofRooms;
    formData.checkInDate = priceFormData.checkInDate;
    formData.checkOutDate = priceFormData.checkOutDate;
    const phone = formData.phoneNumber;
    if (phone && !phone.startsWith("+91")) {
      formData.phoneNumber = `+91${phone}`;
    }

    let response = null;
    setOnSumbitLoader(true);
    response = await createReservation({ data: formData, dispatch });
    //    console.log(response, "response");
    setOnSumbitLoader(false);

    if (response === "success") {
      dispatch(updateTableState({ reservationCreated: true }));
      dispatch(
        showSnackbar({
          type: "success",
          message: `Reservation created successfully`,
        })
      );
      navigate("/manage-reservation");
    }

  };

  // console.log("Price Details: ", priceDetails);


  return (
    <div className="form-card card-wrapper-default" style={{ marginTop: "20px" }}>
      {pageLoader && <Loader pageLoader={true} pageLoaderCustomStyles={{ margin: "-20px" }} />}
      <form onSubmit={handleSubmit((data) => submitHandler(data))}>
        <div className="form-fields-block">
          <CustomSelectField
            id="roomId"
            label={t("Room Name")}
            control={control}
            variant="outlined"
            options={priceDetails.length === 0 ? listRoom : priceDetails}
            values={selectedRoom}
            handleCustomInputChange={(e) => handleRoomSelect(e.target.value)}
            rules={{ required: "Room Name is required" }}
          />

          <InputField
            id="price"
            label="Price"
            control={control}
            variant="outlined"
            value={price}
            disabled={true}
          />
          <InputField
            id="firstName"
            label={"First Name"}
            control={control}
            variant="outlined"
            rules={{ required: "First Name is required" }}
          />
          <InputField
            id="lastName"
            label={"Last Name"}
            control={control}
            variant="outlined"
            rules={{ required: "Last Name is required" }}
          />
          <InputField
            id="email"
            label={"Email"}
            control={control}
            variant="outlined"
            rules={{ required: t("Email is required"), pattern: { value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, message: t("Please enter a valid email address") } }}
          />
          <NumberComponent
            id="phoneNumber"
            label={"Phone Number"}
            control={control}
            variant="outlined"
            rules={{
              required: t("Phone Number is required"),
              pattern: {
                value: /^[6-9]\d{9}$/,
                message: t(
                  "Please enter a valid 10-digit Indian mobile number"
                ),
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">+91</InputAdornment>
              ),
            }}
            inputProps={{
              maxLength: 10
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "right" }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            style={{ float: "right", marginRight: "0.0rem" }}
            className="submit-button"
            disabled={onSumbitLoader ? true : false}
          >
            {onSumbitLoader ? t("Loading...") : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ReservationForm;
