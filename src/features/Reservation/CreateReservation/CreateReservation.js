import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Breadcrumb, Loader } from "../../../components/index";
import {
  InputField,
  CustomSelectField,
  KeyBoardDatePicker,
  NumericInputComponent,
  NumberComponent,
} from "../../../components/ReactHookForm/index";
import { Button } from "@mui/material";
import { axiosPrService } from "../../../axios/axiosInstance";
import { fetchLookupList, showSnackbar } from "../../../redux/reducer/appSlice";
import { updateTableState } from "../../Reservation/ManageReservation/manageReservationTableSlice";
import {
  createReservation,
  updateReservation,
  hotelList,
  availableRoomsByHotel,
} from "./CreateReservationApi";
import dayjs from "dayjs";
import { FLOW_TYPE } from "../../../Utils/constants";
import "./CreateReservation.scss";
import { CircularProgress } from "@mui/material";
import { id } from "date-fns/locale";

function CreateReservation() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const today = dayjs();
  const lookup = useSelector((state) => state.appReducer.lookup);
  const flow = useSelector((state) => state.manageReservationTableReducer.flow);
  const selectedReservationData = useSelector(
    (state) => state.manageReservationTableReducer.selectedReservationData
  );
  const showSessionPopup = useSelector(
    (state) => state.loginReducer.showSessionPopup
  );
  const loginUser = useSelector((state) => state.loginReducer.user);

  const createReservationForm = {
    hotelId: "",
    roomId: "",
    cdnintnoOfPersons: "",
    noofRooms: "",
    checkInDate: "",
    checkOutDate: "",
  };

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: createReservationForm,
  });
  const [pageLoader, setPageLoader] = useState(false);
  const [onSumbitLoader, setOnSumbitLoader] = useState(false);
  const [roomOptions, setRoomOptions] = useState([]);
  const [availableRoomsRaw, setAvailableRoomsRaw] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState("");
  const [hotelListData, setHotelListData] = useState([]);
  const [formDate, setFormData] = useState({});
  const [isPriceAvailable, setIsPriceAvailable] = useState(false);

  const watchCheckInDate = watch("checkInDate");
  const watchCheckOutDate = watch("checkOutDate");
  const watchHotelId = watch("hotelId");
  const watchNoOfRooms = watch("noofRooms");
  const watchNoOfPersons = watch("cdnintnoOfPersons");

  const onPageLoad = async () => {
    // fetchLookupOptions();
    //if (!lookup.role) {
    await dispatch(fetchLookupList("role"));
    //}
  };

  useEffect(() => {
    // didMount
    async function fetchInit() {
      dispatch(updateTableState({ reservationCreated: false }));
      onPageLoad();
    }
    fetchInit();
    fetchHotels();
  }, [showSessionPopup]);

  useEffect(() => {
    if (flow === FLOW_TYPE.EDIT && selectedReservationData) {
      console.log("selectedReservationData", selectedReservationData);
      setPageLoader(true);
      setSelectedHotel(selectedReservationData.hotelId);
      const createReservationForm = {
        hotelId: selectedReservationData.hotelId,
        cdnintnoOfPersons: selectedReservationData.noOfPersons,
        noofRooms: selectedReservationData.noOfRooms,
        checkInDate: selectedReservationData.checkIn,
        checkOutDate: selectedReservationData.checkOut,
      };
      reset(createReservationForm);
      setPageLoader(false);
    }
  }, [selectedReservationData, lookup, showSessionPopup]);

  const fetchHotels = async () => {
    try {
      const res = await hotelList({ dispatch });
      const hotels = Array.isArray(res.data) ? res.data : [];
      setHotelListData(
        hotels.map((item) => ({ label: item.hotelName, value: item.hotelId }))
      );
    } catch (error) {
      console.error("Error fetching hotels:", error);
    }
  };

  // const submitHandler = async (formData) => {
  //   const checkIn = dayjs(formData.checkInDate);
  //   const checkOut = dayjs(formData.checkOutDate);

  //   clearErrors(["checkInDate", "checkOutDate"]);

  //   if (!formData.checkInDate) {
  //     setError("checkInDate", {
  //       type: "manual",
  //       message: "Check-in date is required!",
  //     });
  //   }
  //   if (!formData.checkOutDate) {
  //     setError("checkOutDate", {
  //       type: "manual",
  //       message: "Check-out date is required!",
  //     });
  //   }
  //   if (checkIn.isSame(checkOut)) {
  //     setError("checkOutDate", {
  //       type: "manual",
  //       message: "Check-out date and check-in date cannot be the same!",
  //     });
  //     return;
  //   }

  //   if (checkIn.isAfter(checkOut)) {
  //     setError("checkOutDate", {
  //       type: "manual",
  //       message: "Check-out date must be after check-in date!",
  //     });
  //     return;
  //   }

  //   const formattedCheckInDate = checkIn.format("YYYY-MM-DD");
  //   const formattedCheckOutDate = checkOut.format("YYYY-MM-DD");

  //   formData.checkInDate = formattedCheckInDate;
  //   formData.checkOutDate = formattedCheckOutDate;
  //   formData.noofRooms = parseInt(formData.noofRooms);
  //   formData.cdnintnoOfPersons = parseInt(formData.cdnintnoOfPersons);

  //   setFormData(formData);

  //   try {
  //     setOnSumbitLoader(true);
  //     const response = await priceCalculation({ data: formData, dispatch });

  //     if (response && Array.isArray(response)) {
  //       console.log("Price res data>>>", response);
  //       const roomOptions = response.map((item) => ({
  //         label: item.roomName,
  //         value: item.roomId,
  //         price: item.basePrice,
  //       }));
  //       setRoomOptions(roomOptions);
  //     }
  //     setOnSumbitLoader(false);
  //   } catch (error) {
  //     console.error("Error fetching price:", error);
  //   }
  // };

  const submitHandler = async (formData) => {
    const checkIn = dayjs(formData.checkInDate);
    const checkOut = dayjs(formData.checkOutDate);
    
    if (!checkIn.isValid() || !checkOut.isValid()) return;
    
    const loginUserObj = loginUser || {};
    const fullName = loginUserObj.name || "";
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || "";
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
    const email = loginUserObj.email || "";
    let phone = loginUserObj.phone || "";

    const requestedRooms = Number(formData.noofRooms || 0);
    const enteredPersons = Number(formData.cdnintnoOfPersons || 0);

    const selectedRoomData = (availableRoomsRaw || []).find(
      (r) => r?.roomId === formData.roomId
    );

    if (!selectedRoomData) {
      dispatch(showSnackbar({ type: "error", message: "Please select a room." }));
      return;
    }

    const availableRooms = Number(selectedRoomData?.totolNoRooms ?? 0);
    const baseGuests = Number(selectedRoomData?.noOfPersons ?? 0);
    const allowExtra = selectedRoomData?.allowExtraPerson === true || selectedRoomData?.allowExtraPerson === "true";
    const maxExtra = Number(selectedRoomData?.maxExtraPersons ?? 0);
    const maxGuestsPerRoom = baseGuests + (allowExtra ? maxExtra : 0);
    const maxGuestsTotal = maxGuestsPerRoom * requestedRooms;

    if (requestedRooms <= 0 || enteredPersons <= 0) {
      dispatch(showSnackbar({ type: "error", message: "Please enter No of Persons and Total No of Rooms first." }));
      return;
    }

    if (requestedRooms > availableRooms) {
      dispatch(showSnackbar({ type: "error", message: `Not enough rooms available. Only ${availableRooms} rooms left.` }));
      return;
    }

    if (maxGuestsPerRoom > 0 && enteredPersons > maxGuestsTotal) {
      dispatch(showSnackbar({ type: "error", message: `Max capacity exceeded. This room type allows up to ${maxGuestsTotal} guests for ${requestedRooms} rooms. Please increase Total No of Rooms or select another room type.` }));
      return;
    }

    if (phone && typeof phone === "string" && phone.trim().length > 0) {
      if (!phone.startsWith("+91")) {
        phone = `+91${phone}`;
      }
    }

    const finalData = {
      ...formData,
      checkInDate: checkIn.format("YYYY-MM-DD"),
      checkOutDate: checkOut.format("YYYY-MM-DD"),
      firstName,
      lastName,
      email,
      phoneNumber: phone,
      isHotelBlocked: true,
      noofRooms: requestedRooms,
      cdnintnoOfPersons: enteredPersons,
    };

    setOnSumbitLoader(true);
    const response = await createReservation({ data: finalData, dispatch });
    setOnSumbitLoader(false);

    if (response === "success") {
      dispatch(updateTableState({ reservationCreated: true }));
      dispatch(showSnackbar({ type: "success", message: `Reservation created successfully` }));
      navigate("/manage-reservation");
    } else {
      const errorMsg = typeof response === 'string' ? response : (response?.message || "Unable to create reservation");
      dispatch(showSnackbar({ type: "error", message: errorMsg }));
    }
  };
  const handleHotelChange = async (e) => {
    let hotelId = e.target.value;
    setSelectedHotel(hotelId);
  };

  const isDisabled = flow === FLOW_TYPE.EDIT;

  // Single-step: fetch rooms as soon as hotel + dates are present.
  useEffect(() => {
    const canFetch =
      watchHotelId &&
      watchCheckInDate &&
      watchCheckOutDate;

    if (!canFetch) {
      setAvailableRoomsRaw([]);
      setRoomOptions([]);
      setIsPriceAvailable(false);
      return;
    }

    const checkIn = dayjs(watchCheckInDate);
    const checkOut = dayjs(watchCheckOutDate);
    if (!checkIn.isValid() || !checkOut.isValid()) return;
    if (checkIn.isSame(checkOut) || checkIn.isAfter(checkOut)) {
      setIsPriceAvailable(false);
      return;
    }

    const formattedCheckInDate = checkIn.format("YYYY-MM-DD");
    const formattedCheckOutDate = checkOut.format("YYYY-MM-DD");

    const payload = {
      hotelId: watchHotelId,
      checkInDate: formattedCheckInDate,
      checkOutDate: formattedCheckOutDate,
    };

    (async () => {
      try {
        setOnSumbitLoader(true);
        const response = await availableRoomsByHotel({ data: payload, dispatch });
        if (response && Array.isArray(response)) {
          setAvailableRoomsRaw(response);
          setIsPriceAvailable(true);
        } else {
          setAvailableRoomsRaw([]);
          setRoomOptions([]);
          setIsPriceAvailable(false);
        }
      } finally {
        setOnSumbitLoader(false);
      }
    })();
  }, [watchHotelId, watchCheckInDate, watchCheckOutDate, dispatch]);

  useEffect(() => {
    // Keep the ReservationForm payload in sync (used for create-time validation + pricing).
    if (!watchHotelId || !watchCheckInDate || !watchCheckOutDate) return;

    const checkIn = dayjs(watchCheckInDate);
    const checkOut = dayjs(watchCheckOutDate);
    if (!checkIn.isValid() || !checkOut.isValid()) return;

    const formattedCheckInDate = checkIn.format("YYYY-MM-DD");
    const formattedCheckOutDate = checkOut.format("YYYY-MM-DD");
    const noofRooms = parseInt(watchNoOfRooms || "0", 10);
    const cdnintnoOfPersons = parseInt(watchNoOfPersons || "0", 10);

    setFormData({
      hotelId: watchHotelId,
      checkInDate: formattedCheckInDate,
      checkOutDate: formattedCheckOutDate,
      noofRooms,
      cdnintnoOfPersons,
    });
  }, [watchHotelId, watchCheckInDate, watchCheckOutDate, watchNoOfRooms, watchNoOfPersons]);

  useEffect(() => {
    const requestedRooms = parseInt(watchNoOfRooms || "0", 10) || 0;
    const roomOpts = (availableRoomsRaw || []).map((item) => {
      const availableRooms = Number(item?.totolNoRooms ?? 0);
      const baseGuests = Number(item?.noOfPersons ?? 0);
      const allowExtra = item?.allowExtraPerson === true || item?.allowExtraPerson === "true";
      const maxExtra = Number(item?.maxExtraPersons ?? 0);
      const maxGuestsPerRoom = baseGuests + (allowExtra ? maxExtra : 0);

      return {
        label: `${item.roomName} (${availableRooms} available)`,
        value: item.roomId,
        disabled: requestedRooms > 0 ? availableRooms < requestedRooms : false,
        availableRooms,
        maxGuestsPerRoom,
      };
    });
    setRoomOptions(roomOpts);
  }, [availableRoomsRaw, watchNoOfRooms]);

  const hotelDisabled = isDisabled || !watchCheckInDate || !watchCheckOutDate;

  return (
    <div className="createReservation-page page">
      <Breadcrumb
        pageTitle={t("Create Reservation")}
        breadcrumbList={[
          {
            title: t("Home"),
            url: "/",
          },
          {
            title: t("Reservation"),
            url: "/manage-reservation",
          },
          {
            title:
              flow === FLOW_TYPE.EDIT
                ? t("Update Reservation")
                : t("Create Reservation"),
            url: "/create-reservation",
          },
        ]}
        hideBreadcrumb={true}
      />
      <div className="form-card card-wrapper-default">
        {pageLoader && (
          <Loader
            pageLoader={true}
            pageLoaderCustomStyles={{ margin: "-20px" }}
          />
        )}
        <form onSubmit={handleSubmit((data) => submitHandler(data))}>
          <div className="form-fields-block">
            <KeyBoardDatePicker
              id="checkInDate"
              label={t("Check In Date")}
              control={control}
              variant="outlined"
              disablePast
              minDate={today}
              rules={{ required: "Check In Date is required" }}
            />

            <KeyBoardDatePicker
              id="checkOutDate"
              label={t("Check Out Date")}
              control={control}
              variant="outlined"
              disablePast
              minDate={today}
              rules={{ required: "Check Out Date is required" }}
              error={!!errors.checkOutDate}
              helperText={errors.checkOutDate?.message}
            />

            <CustomSelectField
              id="hotelId"
              label={t("Hotel Name")}
              control={control}
              variant="outlined"
              options={hotelListData}
              values={selectedHotel}
              disabled={hotelDisabled}
              handleCustomInputChange={(e) => handleHotelChange(e)}
              rules={{ required: "Hotel is required" }}
            />

            {isPriceAvailable && (
              <CustomSelectField
                id="roomId"
                label={t("Room Name")}
                control={control}
                variant="outlined"
                options={roomOptions}
                rules={{ required: "Room Name is required" }}
              />
            )}

            <NumericInputComponent
              id="cdnintnoOfPersons"
              label={"No of Persons"}
              control={control}
              variant="outlined"
              inputProps={{ min: 1 }}
              // rules={{ required: "Number of Persons is required" }}
              rules={{
                validate: (value) => {
                  if (value === "") {
                    return "No of Persons is required";
                  }
                  if (isNaN(value)) {
                    return "Please enter a valid number";
                  }
                  const numericValue = parseFloat(value);
                  if (numericValue <= 0) {
                    return "No of Persons must be greater than 0";
                  }
                  if (numericValue > 25) {
                    return "The number of persons cannot exceed 25";
                  }
                  if (!/^\d{1,4}$/.test(value)) {
                    return "The No of Persons cannot be a decimal";
                  }
                  return true;
                },
              }}
            />

            {/* <NumericInputComponent
              id="noofRooms"
              label={"Total No of Rooms"}
              control={control}
              variant="outlined"
              // rules={{ required: "Total No of Rooms is required" }}
              rules={{
                validate: (value) => {
                  if (value === '') {
                    return 'Total No of Rooms is required';
                  }
                  if (isNaN(value)) {
                    return 'Please enter a valid number';
                  }
                  if (parseFloat(value) <= 0) {
                    return 'No of Rooms must be greater than 0';
                  }
                  if (parseFloat(value) === 0) {
                    return 'No of Rooms must not be 0';
                  }
                  if (!/^\d{1,4}$/.test(value)) {
                    return 'The number of rooms cannot be a decimal.';
                  }
                  
                  return true; 
                },
              }}
            /> */}
            <NumericInputComponent
              id="noofRooms"
              label={"Total No of Rooms"}
              control={control}
              variant="outlined"
              inputProps={{ min: 1 }}
              rules={{
                validate: (value) => {
                  if (!value.trim()) {
                    return "Total No of Rooms is required.";
                  }
                  if (!/^\d+$/.test(value)) {
                    return "Total No of Rooms cannot be a decimal";
                  }
                  const numericValue = parseInt(value, 10);
                  if (numericValue <= 0) {
                    return "No of Rooms must be greater than 0.";
                  }
                  if (numericValue > 9999) {
                    return "Please enter a maximum of 4 digits.";
                  }

                  return true;
                },
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
    </div>
  );
}

export default CreateReservation;
