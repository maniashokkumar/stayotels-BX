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

  const loginUser = useSelector((state) => state.loginReducer.user);

  const [pageLoader, setPageLoader] = useState(false);
  const [hotelListData, setHotelListData] = useState([]);
  const [roomOptions, setRoomOptions] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState("");
  const [onSumbitLoader, setOnSumbitLoader] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");
  // In hotel-block flow, we don't need frontend price input.

  const flow = useSelector((state) => state.manageReservationTableReducer.flow);
  const showSessionPopup = useSelector((state) => state.loginReducer.showSessionPopup);

  useEffect(() => {
  }, [showSessionPopup]);

  const reservationForm = {
    roomId: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
  };

  const { handleSubmit, control, reset, setValue } = useForm({
    defaultValues: reservationForm,
  });

  useEffect(() => {
    if (!loginUser) return;
    const fullName = loginUser?.name || "";
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || "";
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
    reset({
      roomId: selectedRoom || "",
      firstName,
      lastName,
      email: loginUser?.email || "",
      phoneNumber: loginUser?.phone || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginUser]);


  const handleRoomSelect = (roomId) => {
    setSelectedRoom(roomId);
  };

  const submitHandler = async (formData) => {
    formData.hotelId = priceFormData.hotelId;
    formData.cdnintnoOfPersons = priceFormData.cdnintnoOfPersons;
    formData.noofRooms = priceFormData.noofRooms;
    formData.checkInDate = priceFormData.checkInDate;
    formData.checkOutDate = priceFormData.checkOutDate;

    // Mark this reservation as a hotel-side room block (not a customer booking).
    formData.isHotelBlocked = true;

    // Restrict flow based on max capacity (do not allow creating if guests exceed capacity).
    const requestedRooms = Number(priceFormData?.noofRooms || 0);
    const enteredPersons = Number(priceFormData?.cdnintnoOfPersons || 0);
    const selectedRoomData = (priceDetails || []).find(
      (r) => r?.value === formData.roomId
    );

    const availableRooms = Number(selectedRoomData?.availableRooms ?? 0);
    const maxGuestsPerRoom = Number(selectedRoomData?.maxGuestsPerRoom ?? 0);
    const maxGuestsTotal = maxGuestsPerRoom * requestedRooms;

    if (requestedRooms <= 0 || enteredPersons <= 0) {
      dispatch(
        showSnackbar({
          type: "error",
          message: "Please enter No of Persons and Total No of Rooms first.",
        })
      );
      return;
    }

    if (requestedRooms > availableRooms) {
      dispatch(
        showSnackbar({
          type: "error",
          message: `Not enough rooms available. Only ${availableRooms} rooms left.`,
        })
      );
      return;
    }

    if (maxGuestsPerRoom > 0 && enteredPersons > maxGuestsTotal) {
      dispatch(
        showSnackbar({
          type: "error",
          message: `Max capacity exceeded. This room type allows up to ${maxGuestsTotal} guests for ${requestedRooms} rooms. Please increase Total No of Rooms or select another room type.`,
        })
      );
      return;
    }

    const phone = formData.phoneNumber;
    if (phone && typeof phone === "string" && phone.trim().length > 0) {
      if (!phone.startsWith("+91")) {
        formData.phoneNumber = `+91${phone}`;
      }
    }

    setOnSumbitLoader(true);
    const response = await createReservation({ data: formData, dispatch });
    //    console.log(response, "response");
    setOnSumbitLoader(false);

    const createdOk =
      response &&
      (response.success === true || response === "success");
    if (createdOk) {
      dispatch(updateTableState({ reservationCreated: true }));
      dispatch(
        showSnackbar({
          type: "success",
          message: `Reservation created successfully`,
        })
      );
      navigate("/manage-reservation");
    } else {
      const msg =
        typeof response === "string"
          ? response
          : response?.message || "Unable to create reservation";
      dispatch(
        showSnackbar({
          type: "error",
          message: msg,
        })
      );
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
            options={priceDetails}
            values={selectedRoom}
            handleCustomInputChange={(e) => handleRoomSelect(e.target.value)}
            rules={{ required: "Room Name is required" }}
          />
          <InputField
            id="firstName"
            label={"First Name"}
            control={control}
            variant="outlined"
            readOnly={true}
            disabled={true}
          />
          <InputField
            id="lastName"
            label={"Last Name"}
            control={control}
            variant="outlined"
            readOnly={true}
            disabled={true}
          />
          <InputField
            id="email"
            label={"Email"}
            control={control}
            variant="outlined"
            readOnly={true}
            disabled={true}
          />
          <NumberComponent
            id="phoneNumber"
            label={"Phone Number"}
            control={control}
            variant="outlined"
            rules={{
              validate: (value) => {
                if (!value) return true; // optional
                const raw = String(value).replace(/\D/g, "");
                const tenDigit =
                  raw.length >= 12 && raw.startsWith("91") ? raw.slice(2) : raw;
                if (tenDigit.length !== 10) return t("Invalid phone number");
                if (!/^[6-9]\d{9}$/.test(tenDigit)) return t("Invalid phone number");
                return true;
              },
            }}
            disabled={true}
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
