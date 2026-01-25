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
  priceCalculation,
} from "./CreateReservationApi";
import dayjs from "dayjs";
import { FLOW_TYPE } from "../../../Utils/constants";
import "./CreateReservation.scss";
import { CircularProgress } from "@mui/material";
import { id } from "date-fns/locale";
import ReservationForm from "./ReservationForm";

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

  const createReservationForm = {
    hotelId: "",
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
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: createReservationForm,
  });
  const [pageLoader, setPageLoader] = useState(false);
  const [onSumbitLoader, setOnSumbitLoader] = useState(false);
  const [roomOptions, setRoomOptions] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState("");
  const [hotelListData, setHotelListData] = useState([]);
  const [formDate, setFormData] = useState({});
  const [isPriceAvailable, setIsPriceAvailable] = useState(false);

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

    clearErrors(["checkInDate", "checkOutDate"]);

    if (!formData.checkInDate) {
      setError("checkInDate", {
        type: "manual",
        message: "Check-in date is required!",
      });
    }
    if (!formData.checkOutDate) {
      setError("checkOutDate", {
        type: "manual",
        message: "Check-out date is required!",
      });
    }
    if (checkIn.isSame(checkOut)) {
      setError("checkOutDate", {
        type: "manual",
        message: "Check-out date and check-in date cannot be the same!",
      });
      return;
    }

    if (checkIn.isAfter(checkOut)) {
      setError("checkOutDate", {
        type: "manual",
        message: "Check-out date must be after check-in date!",
      });
      return;
    }

    const formattedCheckInDate = checkIn.format("YYYY-MM-DD");
    const formattedCheckOutDate = checkOut.format("YYYY-MM-DD");

    formData.checkInDate = formattedCheckInDate;
    formData.checkOutDate = formattedCheckOutDate;
    formData.noofRooms = parseInt(formData.noofRooms);
    formData.cdnintnoOfPersons = parseInt(formData.cdnintnoOfPersons);

    setFormData(formData);

    try {
      setOnSumbitLoader(true);
      const response = await priceCalculation({ data: formData, dispatch });

      if (response && Array.isArray(response) && response.length > 0) {
        console.log("Price res data>>>", response);
        const roomOptions = response.map((item) => ({
          label: item.roomName,
          value: item.roomId,
          price: item.basePrice,
        }));
        setRoomOptions(roomOptions);
        setIsPriceAvailable(true);
      } else {
        setIsPriceAvailable(false);
        dispatch(
          showSnackbar({ message: "No rooms available.", type: "error" })
        );
      }
      setOnSumbitLoader(false);
    } catch (error) {
      console.error("Error fetching price:", error);
      setIsPriceAvailable(false);
    }
  };
  const handleHotelChange = async (e) => {
    let hotelId = e.target.value;
    setSelectedHotel(hotelId);
  };

  const isDisabled = flow === FLOW_TYPE.EDIT;

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
              disabled={isDisabled}
              handleCustomInputChange={(e) => handleHotelChange(e)}
              rules={{ required: "Hotel is required" }}
            />

            <NumericInputComponent
              id="cdnintnoOfPersons"
              label={"No of Persons"}
              control={control}
              variant="outlined"
              // rules={{ required: "Number of Persons is required" }}
              rules={{
                validate: (value) => {
                  if (value === "") {
                    return "No of Persons is required";
                  }
                  if (isNaN(value)) {
                    return "Please enter a valid number";
                  }
                  if (parseFloat(value) <= 0) {
                    return "No of Persons must be greater than 0";
                  }
                  if (parseFloat(value) === 0) {
                    return "No of Rooms must not be 0";
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
              style={{
                float: "right",
                marginRight: "0.0rem",
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              className="submit-button"
              disabled={onSumbitLoader}
            >
              {onSumbitLoader ? (
                <>
                  <CircularProgress size={20} />
                  {t("Loading...")}
                </>
              ) : (
                "Check Price"
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* <ReservationForm priceDetails={roomOptions} priceFormData={formDate} /> */}
      {isPriceAvailable && (
        <ReservationForm priceDetails={roomOptions} priceFormData={formDate} />
      )}
    </div>
  );
}

export default CreateReservation;
