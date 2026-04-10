import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Breadcrumb, Loader } from "../../../components/index";
import {
  InputField,
  CustomSelectField,
  KeyBoardDatePicker,
  NumericInputComponent,
} from "../../../components/ReactHookForm/index";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { fetchLookupList, showSnackbar } from "../../../redux/reducer/appSlice";
import { updateTableState } from "../../Reservation/ManageReservation/manageReservationTableSlice";
import {
  createReservation,
  completeGuestBilling,
  completeAddOns,
  completePayments,
  completeFinalize,
  hotelList,
  availableRoomsByHotel,
} from "./CreateReservationApi";
import dayjs from "dayjs";
import { FLOW_TYPE } from "../../../Utils/constants";
import "./CreateReservation.scss";


function CreateReservation() {
  const navigate = useNavigate();
  const location = useLocation();
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

  const CP_SOURCE_OPTIONS = [
    { label: "Walk-in", value: "WALK_IN" },
    { label: "Direct enquiry", value: "DIRECT_ENQUIRY" },
    { label: "Phone", value: "PHONE" },
    { label: "Email", value: "EMAIL" },
    { label: "Other", value: "OTHER" },
  ];
  const WIZARD_STEP_LABELS = [
    "Room block",
    "Guest",
    "Add-ons",
    "Summary",
    "Payments",
  ];
  const PAYMENT_METHODS = ["CASH", "UPI", "CARD", "BANK_TRANSFER", "OTHER"];

  const createReservationForm = {
    hotelId: "",
    roomId: "",
    cdnintnoOfPersons: "",
    noofRooms: "",
    checkInDate: "",
    checkOutDate: "",
    cpSourceType: "WALK_IN",
    sourceReference: "",
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
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardMeta, setWizardMeta] = useState(null);
  const [guestForm, setGuestForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });
  const [addonRows, setAddonRows] = useState([{ label: "", unitPrice: "", quantity: "1" }]);
  const [paymentRows, setPaymentRows] = useState([
    { method: "CASH", amount: "", reference: "" },
  ]);
  const [markPaidFinalize, setMarkPaidFinalize] = useState(false);

  const watchCheckInDate = watch("checkInDate");
  const watchCheckOutDate = watch("checkOutDate");
  const watchHotelId = watch("hotelId");
  const watchNoOfRooms = watch("noofRooms");
  const watchNoOfPersons = watch("cdnintnoOfPersons");
  const pendingInventoryRoomIdRef = useRef(null);
  const showWizard = flow === FLOW_TYPE.NEW;
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
        cpSourceType: selectedReservationData.cpSourceType || "WALK_IN",
        sourceReference: selectedReservationData.sourceReference || "",
      };
      reset(createReservationForm);
      setPageLoader(false);
    }
  }, [selectedReservationData, lookup, showSessionPopup]);

  useEffect(() => {
    const block = location.state && location.state.inventoryBlock;
    if (!block || flow === FLOW_TYPE.EDIT) return;
    if (!hotelListData.length) return;
    const { hotelId, checkInDate, checkOutDate, roomId } = block;
    if (!hotelId || !checkInDate || !checkOutDate) return;
    const hotelOk = hotelListData.some((h) => h.value === hotelId);
    if (!hotelOk) {
      dispatch(
        showSnackbar({
          type: "warning",
          message: t("Selected hotel is not available for reservations."),
        })
      );
      navigate("/create-reservation", { replace: true, state: {} });
      return;
    }
    
    setSelectedHotel(hotelId);
    reset({
      hotelId,
      roomId: "",
      checkInDate: dayjs(checkInDate),
      checkOutDate: dayjs(checkOutDate),
      cdnintnoOfPersons: "",
      noofRooms: "",
      cpSourceType: "WALK_IN",
      sourceReference: "",
    });
    pendingInventoryRoomIdRef.current = roomId || null;
    navigate("/create-reservation", { replace: true, state: {} });
  }, [location.state, hotelListData, flow, dispatch, navigate, reset, t]);

  useEffect(() => {
    const rid = pendingInventoryRoomIdRef.current;
    if (!rid || !availableRoomsRaw.length) return;
    const found = availableRoomsRaw.find(
      (r) =>
        String(r.roomId ?? "").toLowerCase() === String(rid).toLowerCase()
    );
    if (found) {
      setValue("roomId", found.roomId, { shouldValidate: true, shouldDirty: true });
    }
    pendingInventoryRoomIdRef.current = null;
  }, [availableRoomsRaw, setValue]);

  useEffect(() => {
    const cb = location.state && location.state.completeBooking;
    if (!cb || !cb.reservationId) return;
    dispatch(updateTableState({ flow: FLOW_TYPE.NEW, selectedReservationData: null }));
    const c = cb.customer || {};
    setGuestForm({
      firstName: c.firstName || "",
      lastName: c.lastName || "",
      email: c.email || "",
      phoneNumber: c.phoneNumber || "",
    });
    setWizardMeta({
      reservationId: cb.reservationId,
      orderId: cb.orderId,
      totalCost: cb.totalCost,
      checkIn: cb.checkIn,
      checkOut: cb.checkOut,
      noOfRooms: cb.noOfRooms,
      noOfPersons: cb.noOfPersons,
      hotelLabel: cb.hotels,
      roomLabel: cb.rooms,
    });
    setWizardStep(1);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, dispatch, navigate, location.pathname]);


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

  /** @param {'block_only' | 'continue'} mode - block_only: save and go to manage; continue: save and next step (Guest) */
  const blockSubmit = async (formData, mode) => {
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
      cpSourceType: formData.cpSourceType || "WALK_IN",
      sourceReference: formData.sourceReference || "",
    };

    setOnSumbitLoader(true);
    const response = await createReservation({ data: finalData, dispatch });
    setOnSumbitLoader(false);

    const createdOk =
      response &&
      (response.success === true || response === "success");
    if (createdOk) {
      dispatch(updateTableState({ reservationCreated: true }));
      dispatch(
        showSnackbar({
          type: "success",
          message: t("Reservation created successfully"),
        })
      );
      if (showWizard && mode === "continue") {
        const hotelLabel =
          hotelListData.find((h) => h.value === formData.hotelId)?.label || "";
        const roomLabel =
          roomOptions.find((r) => r.value === formData.roomId)?.label || "";
        setWizardMeta({
          ...response,
          hotelLabel,
          roomLabel,
          noOfRooms: requestedRooms,
          noOfPersons: enteredPersons,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
        });
        const lu = loginUser || {};
        const fullN = (lu.name || "").trim().split(/\s+/).filter(Boolean);
        const gf = {
          firstName: fullN[0] || "",
          lastName: fullN.length > 1 ? fullN.slice(1).join(" ") : "",
          email: lu.email || "",
          phoneNumber: lu.phone || "",
        };
        let ph = gf.phoneNumber;
        if (ph && typeof ph === "string" && ph.trim() && !ph.startsWith("+91")) {
          ph = `+91${ph}`;
        }
        setGuestForm({ ...gf, phoneNumber: ph });
        setWizardStep(1);
      } else {
        navigate("/manage-reservation");
      }
    } else {
      const errorMsg =
        typeof response === "string"
          ? response
          : response?.message || "Unable to create reservation";
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


  const formatInr = (n) => {
    if (n == null || Number.isNaN(Number(n))) return "—";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "INR",
      }).format(Number(n));
    } catch {
      return String(n);
    }
  };

  const computeSupplementFromRows = () =>
    addonRows
      .filter((row) => (row.label || "").trim().length > 0)
      .reduce((sum, row) => {
        const q = Math.max(1, parseInt(row.quantity, 10) || 1);
        const p = Number(row.unitPrice) || 0;
        return sum + p * q;
      }, 0);

  const handleGuestNext = async () => {
    if (!wizardMeta?.reservationId) return;
    let phone = guestForm.phoneNumber || "";
    if (phone && !phone.startsWith("+91")) phone = `+91${phone}`;
    setOnSumbitLoader(true);
    const r = await completeGuestBilling({
      body: {
        reservationId: wizardMeta.reservationId,
        firstName: guestForm.firstName,
        lastName: guestForm.lastName,
        email: guestForm.email,
        phoneNumber: phone,
      },
      dispatch,
    });
    setOnSumbitLoader(false);
    if (r) setWizardStep(2);
  };

  const handleAddOnsNext = async () => {
    if (!wizardMeta?.reservationId) return;
    const addOns = addonRows
      .filter((row) => (row.label || "").trim().length > 0)
      .map((row) => ({
        label: row.label.trim(),
        unitPrice: Number(row.unitPrice) || 0,
        quantity: Math.max(1, parseInt(row.quantity, 10) || 1),
      }));
    setOnSumbitLoader(true);
    const r = await completeAddOns({
      body: {
        reservationId: wizardMeta.reservationId,
        addOns,
        supplementTotal: 0,
      },
      dispatch,
    });
    setOnSumbitLoader(false);
    if (r) {
      const sup =
        typeof r.supplementTotal === "number"
          ? r.supplementTotal
          : computeSupplementFromRows();
      setWizardMeta((m) =>
        m ? { ...m, supplementTotal: sup } : m
      );
      setWizardStep(3);
    }
  };

  const handleFinalize = async () => {
    if (!wizardMeta?.reservationId) return;
    const ledger = paymentRows
      .filter((row) => (row.amount || "").toString().trim().length > 0)
      .map((row) => ({
        method: row.method || "CASH",
        amount: Number(row.amount) || 0,
        reference: row.reference || "",
        paidAt: new Date().toISOString(),
      }));
    setOnSumbitLoader(true);
    const payOk = await completePayments({
      body: { reservationId: wizardMeta.reservationId, paymentLedger: ledger },
      dispatch,
    });
    if (!payOk) {
      setOnSumbitLoader(false);
      return;
    }
    const fin = await completeFinalize({
      body: {
        reservationId: wizardMeta.reservationId,
        markPaid: markPaidFinalize,
      },
      dispatch,
    });
    setOnSumbitLoader(false);
    if (fin) {
      dispatch(
        showSnackbar({ type: "success", message: t("Booking confirmed") })
      );
      navigate("/manage-reservation");
    }
  };


  const hotelDisabled = isDisabled || !watchCheckInDate || !watchCheckOutDate;

  const removeAddonRow = (idx) => {
    setAddonRows((rows) => {
      if (rows.length <= 1) {
        return [{ label: "", unitPrice: "", quantity: "1" }];
      }
      return rows.filter((_, i) => i !== idx);
    });
  };

  const renderWizardNavActions = (primaryButton) => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        flexWrap: "wrap",
        gap: 1,
        alignItems: "center",
      }}
    >
      <Button variant="text" onClick={() => navigate("/manage-reservation")}>
        {t("Finish later")}
      </Button>
      {wizardStep >= 1 && (
        <Button variant="text" onClick={() => setWizardStep((s) => s - 1)}>
          {t("Back")}
        </Button>
      )}
      {primaryButton}
    </Box>
  );

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
        {showWizard && (
          <Stepper activeStep={wizardStep} alternativeLabel sx={{ mb: 2 }}>
            {WIZARD_STEP_LABELS.map((label) => (
              <Step key={label}>
                <StepLabel>{t(label)}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}
        {showWizard && wizardStep === 1 && wizardMeta && (
          <Box sx={{ mb: 3 }} className="form-fields-block">
            <TextField
              fullWidth
              margin="normal"
              label={t("First name")}
              value={guestForm.firstName}
              onChange={(e) =>
                setGuestForm((g) => ({ ...g, firstName: e.target.value }))
              }
            />
            <TextField
              fullWidth
              margin="normal"
              label={t("Last name")}
              value={guestForm.lastName}
              onChange={(e) =>
                setGuestForm((g) => ({ ...g, lastName: e.target.value }))
              }
            />
            <TextField
              fullWidth
              margin="normal"
              label={t("Email")}
              value={guestForm.email}
              onChange={(e) =>
                setGuestForm((g) => ({ ...g, email: e.target.value }))
              }
            />
            <TextField
              fullWidth
              margin="normal"
              label={t("Phone")}
              value={guestForm.phoneNumber}
              onChange={(e) =>
                setGuestForm((g) => ({ ...g, phoneNumber: e.target.value }))
              }
            />
            <Box sx={{ mt: 2, width: "100%", flexBasis: "100%" }}>
              {renderWizardNavActions(
                <Button variant="contained" onClick={handleGuestNext} disabled={onSumbitLoader}>
                  {onSumbitLoader ? t("Loading...") : t("Continue")}
                </Button>
              )}
            </Box>
          </Box>
        )}
        {showWizard && wizardStep === 2 && wizardMeta && (
          <Box sx={{ mb: 3 }}>
            {addonRows.map((row, idx) => (
              <Box
                key={idx}
                sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1, alignItems: "center" }}
              >
                <TextField
                  label={t("Description")}
                  value={row.label}
                  onChange={(e) => {
                    const next = [...addonRows];
                    next[idx] = { ...next[idx], label: e.target.value };
                    setAddonRows(next);
                  }}
                />
                <TextField
                  label={t("Amount")}
                  type="number"
                  value={row.unitPrice}
                  onChange={(e) => {
                    const next = [...addonRows];
                    next[idx] = { ...next[idx], unitPrice: e.target.value };
                    setAddonRows(next);
                  }}
                />
                <TextField
                  label={t("Qty")}
                  type="number"
                  value={row.quantity}
                  onChange={(e) => {
                    const next = [...addonRows];
                    next[idx] = { ...next[idx], quantity: e.target.value };
                    setAddonRows(next);
                  }}
                />
                <Tooltip title={t("Remove line")}>
                  <IconButton
                    edge="end"
                    aria-label={t("Remove line")}
                    onClick={() => removeAddonRow(idx)}
                    sx={{
                      color: "#d32f2f",
                      "&:hover": {
                        backgroundColor: "rgba(211, 47, 47, 0.08)",
                      },
                    }}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1,
                alignItems: "center",
                mt: 2,
              }}
            >
              <Button
                variant="outlined"
                onClick={() =>
                  setAddonRows((rows) => [...rows, { label: "", unitPrice: "", quantity: "1" }])
                }
              >
                {t("Add line")}
              </Button>
              {renderWizardNavActions(
                <Button variant="contained" onClick={handleAddOnsNext} disabled={onSumbitLoader}>
                  {onSumbitLoader ? t("Loading...") : t("Continue")}
                </Button>
              )}
            </Box>
          </Box>
        )}
        {showWizard && wizardStep === 3 && wizardMeta && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Box sx={{ fontWeight: 700, mb: 2 }}>{t("Summary")}</Box>

            <Box sx={{ fontWeight: 600, fontSize: 14, mb: 0.5 }}>
              {t("Stay")}
            </Box>
            <Box sx={{ fontSize: 14, color: "text.secondary", mb: 1 }}>
              {wizardMeta.hotelLabel || "—"} · {wizardMeta.roomLabel || "—"}
            </Box>
            <Box sx={{ fontSize: 14, mb: 0.5 }}>
              {wizardMeta.checkIn
                ? dayjs(wizardMeta.checkIn).format("D MMM YYYY")
                : "—"}{" "}
              →{" "}
              {wizardMeta.checkOut
                ? dayjs(wizardMeta.checkOut).format("D MMM YYYY")
                : "—"}
            </Box>
            <Box sx={{ fontSize: 14, color: "text.secondary" }}>
              {wizardMeta.noOfRooms ?? "—"} {t("room(s)")} · {wizardMeta.noOfPersons ?? "—"}{" "}
              {t("guests")}
            </Box>
            <Box sx={{ fontSize: 14, mt: 1 }}>
              {t("Order")}: #{wizardMeta.orderId} · {t("Reservation")}:{" "}
              {wizardMeta.reservationId}
            </Box>

            <Box sx={{ fontWeight: 600, fontSize: 14, mt: 2, mb: 0.5 }}>
              {t("Guest")}
            </Box>
            <Box sx={{ fontSize: 14 }}>
              {guestForm.firstName} {guestForm.lastName}
            </Box>
            <Box sx={{ fontSize: 14, color: "text.secondary" }}>
              {guestForm.email}
            </Box>
            <Box sx={{ fontSize: 14, color: "text.secondary" }}>
              {guestForm.phoneNumber}
            </Box>

            <Box sx={{ fontWeight: 600, fontSize: 14, mt: 2, mb: 0.5 }}>
              {t("Add-ons")}
            </Box>
            {addonRows.filter((row) => (row.label || "").trim()).length === 0 ? (
              <Box sx={{ fontSize: 14, color: "text.secondary" }}>—</Box>
            ) : (
              addonRows
                .filter((row) => (row.label || "").trim())
                .map((row, idx) => {
                  const q = Math.max(1, parseInt(row.quantity, 10) || 1);
                  const p = Number(row.unitPrice) || 0;
                  return (
                    <Box key={idx} sx={{ fontSize: 14, mb: 0.5 }}>
                      {row.label.trim()} × {q} @ {formatInr(p)} ={" "}
                      {formatInr(p * q)}
                    </Box>
                  );
                })
            )}

            <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Box sx={{ fontSize: 14 }}>{t("Room subtotal")}</Box>
                <Box sx={{ fontSize: 14, fontWeight: 600 }}>
                  {formatInr(wizardMeta.totalCost)}
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Box sx={{ fontSize: 14 }}>{t("Add-ons")}</Box>
                <Box sx={{ fontSize: 14, fontWeight: 600 }}>
                  {formatInr(
                    wizardMeta.supplementTotal != null
                      ? wizardMeta.supplementTotal
                      : computeSupplementFromRows()
                  )}
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Box sx={{ fontSize: 15, fontWeight: 700 }}>{t("Grand total")}</Box>
                <Box sx={{ fontSize: 15, fontWeight: 700 }}>
                  {formatInr(
                    Number(wizardMeta.totalCost || 0) +
                      Number(
                        wizardMeta.supplementTotal != null
                          ? wizardMeta.supplementTotal
                          : computeSupplementFromRows()
                      )
                  )}
                </Box>
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              {renderWizardNavActions(
                <Button variant="contained" onClick={() => setWizardStep(4)}>
                  {t("Continue")}
                </Button>
              )}
            </Box>
          </Box>
        )}
        {showWizard && wizardStep === 4 && wizardMeta && (
          <Box sx={{ mb: 3 }}>
            {paymentRows.map((row, idx) => (
              <Box
                key={idx}
                sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1, alignItems: "center" }}
              >
                <TextField select label={t("Method")} value={row.method} onChange={(e) => {
                  const next = [...paymentRows];
                  next[idx] = { ...next[idx], method: e.target.value };
                  setPaymentRows(next);
                }} sx={{ minWidth: 160 }}>
                  {PAYMENT_METHODS.map((m) => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  label={t("Amount")}
                  type="number"
                  value={row.amount}
                  onChange={(e) => {
                    const next = [...paymentRows];
                    next[idx] = { ...next[idx], amount: e.target.value };
                    setPaymentRows(next);
                  }}
                />
                <TextField
                  label={t("Reference")}
                  value={row.reference}
                  onChange={(e) => {
                    const next = [...paymentRows];
                    next[idx] = { ...next[idx], reference: e.target.value };
                    setPaymentRows(next);
                  }}
                />
              </Box>
            ))}
            <FormControlLabel
              sx={{ display: "block", mt: 2 }}
              control={
                <Checkbox
                  checked={markPaidFinalize}
                  onChange={(e) => setMarkPaidFinalize(e.target.checked)}
                />
              }
              label={t("Mark reservation as paid")}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1,
                alignItems: "center",
                mt: 2,
              }}
            >
              <Button
                variant="outlined"
                onClick={() =>
                  setPaymentRows((rows) => [...rows, { method: "CASH", amount: "", reference: "" }])
                }
              >
                {t("Add payment")}
              </Button>
              {renderWizardNavActions(
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleFinalize}
                  disabled={onSumbitLoader}
                >
                  {onSumbitLoader ? t("Loading...") : t("Finalize booking")}
                </Button>
              )}
            </Box>
          </Box>
        )}
        <form
          onSubmit={handleSubmit((data) => {
            if (!showWizard) {
              blockSubmit(data, "block_only");
            }
          })}
          style={{
            display: !showWizard || wizardStep === 0 ? "block" : "none",
          }}
        >
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

            <CustomSelectField
              id="cpSourceType"
              label={t("Booking source")}
              control={control}
              variant="outlined"
              options={CP_SOURCE_OPTIONS}
              disabled={isDisabled}
            />

            <InputField
              id="sourceReference"
              label={t("Source reference (optional)")}
              control={control}
              variant="outlined"
              disabled={isDisabled}
            />

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
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {showWizard && wizardStep === 0 ? (
              <>
                <Button
                  type="button"
                  variant="outlined"
                  color="primary"
                  sx={{ mt: 2 }}
                  className="submit-button"
                  disabled={onSumbitLoader}
                  onClick={handleSubmit((data) => blockSubmit(data, "block_only"))}
                >
                  {onSumbitLoader ? t("Loading...") : t("Block")}
                </Button>
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                  className="submit-button"
                  disabled={onSumbitLoader}
                  onClick={handleSubmit((data) =>
                    blockSubmit(data, "continue")
                  )}
                >
                  {onSumbitLoader ? t("Loading...") : t("Block & continue")}
                </Button>
              </>
            ) : (
              !showWizard && (
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                  className="submit-button"
                  disabled={onSumbitLoader}
                >
                  {onSumbitLoader ? t("Loading...") : t("Create")}
                </Button>
              )
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateReservation;
