import React, { useEffect, useState, useRef, useMemo } from "react";
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
  Collapse,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { fetchLookupList, showSnackbar } from "../../../redux/reducer/appSlice";
import { updateTableState } from "../../Reservation/ManageReservation/manageReservationTableSlice";
import {
  createReservation,
  completeGuestBilling,
  completeAddOns,
  completeMealPlan,
  completePayments,
  completeFinalize,
  hotelList,
  availableRoomsByHotel,
  fetchHotelMealPlansActive,
  fetchBookingQuote,
} from "./CreateReservationApi";
import dayjs from "dayjs";
import CpRoomCartPanel from "./CpRoomCartPanel";
import CpQuoteSummary from "./CpQuoteSummary";
import {
  buildBookingQuotePayload,
  buildCpSelectedRoomsFromCart,
  isQuoteReady,
  summarizeQuoteGst,
} from "../../../Utils/gstQuoteUtils";
import { mealPlanRateTitle, totalCartGuests, totalCartRooms } from "../../../Utils/cpMealPlanUtils";
import { FLOW_TYPE } from "../../../Utils/constants";
import {
  reservationGst,
  reservationGrandTotal,
  reservationRoomGst,
  reservationMealPreTax,
  reservationMealGst,
  mealPlanDisplayLabel,
} from "../reservationDisplayUtils";
import { dropdownLabel, mealPlanCodeOption } from "../../Hotel/HotelMealPlans/mealPlanCodeOptions";
import "./CreateReservation.scss";

function mealPlanSelectLabel(plan, t) {
  if (!plan) return "";
  const opt = mealPlanCodeOption(plan.code);
  if (opt) return dropdownLabel(opt, t);
  return `${plan.code} — ${plan.name}`;
}


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
  const prefillHotelIdFromStore = useSelector(
    (state) => state.manageReservationTableReducer.prefillHotelId
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
    "Meals & add-ons",
    "Summary",
    "Payments",
  ];
  const PAYMENT_METHODS = ["CASH", "UPI", "CARD", "BANK_TRANSFER", "OTHER"];

  const createReservationForm = {
    hotelId: "",
    roomId: "",
    cdnintnoOfPersons: "",
    noofRooms: "",
    checkInDate: today,
    checkOutDate: today.add(1, "day"),
    cpSourceType: "WALK_IN",
    sourceReference: "",
  };

  const {
    handleSubmit,
    control,
    register,
    reset,
    setValue,
    getValues,
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
  const [hotelMealPlans, setHotelMealPlans] = useState([]);
  const [selectedMealPlanId, setSelectedMealPlanId] = useState("");
  const [mealPlanPreview, setMealPlanPreview] = useState(null);
  const [mealBreakdownOpen, setMealBreakdownOpen] = useState(false);
  const [paymentRows, setPaymentRows] = useState([
    { method: "CASH", amount: "", reference: "" },
  ]);
  const [markPaidFinalize, setMarkPaidFinalize] = useState(false);
  const [roomLineRows, setRoomLineRows] = useState([
    { roomId: "", qty: "1", persons: "1" },
  ]);
  const [cartLines, setCartLines] = useState([]);
  const [blockMealPlans, setBlockMealPlans] = useState([]);
  const [quoteSummary, setQuoteSummary] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [mealsLockedAtBlock, setMealsLockedAtBlock] = useState(false);
  const roomLineHotelDateKeyRef = useRef("");

  const watchCheckInDate = watch("checkInDate");
  const watchCheckOutDate = watch("checkOutDate");
  const watchHotelId = watch("hotelId");
  const pendingInventoryRoomIdRef = useRef(null);

  const totalRoomLineUnits = useMemo(
    () => roomLineRows.reduce((s, r) => s + (parseInt(r.qty, 10) || 0), 0),
    [roomLineRows]
  );
  const totalLinePersons = useMemo(
    () => roomLineRows.reduce((s, r) => s + (parseInt(r.persons, 10) || 0), 0),
    [roomLineRows]
  );
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
        roomId: selectedReservationData.roomId || "",
        cdnintnoOfPersons: selectedReservationData.noOfPersons,
        noofRooms: selectedReservationData.noOfRooms,
        checkInDate: selectedReservationData.checkIn,
        checkOutDate: selectedReservationData.checkOut,
        cpSourceType: selectedReservationData.cpSourceType || "WALK_IN",
        sourceReference: selectedReservationData.sourceReference || "",
      };
      reset(createReservationForm);
      setRoomLineRows([
        {
          roomId: selectedReservationData.roomId || "",
          qty: String(selectedReservationData.noOfRooms ?? 1),
          persons: String(selectedReservationData.noOfPersons ?? 1),
        },
      ]);
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
    setRoomLineRows([{ roomId: roomId || "", qty: "1", persons: "1" }]);
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
      setRoomLineRows((rows) => {
        const next = rows.length ? [...rows] : [{ roomId: "", qty: "1", persons: "1" }];
        next[0] = { ...next[0], roomId: found.roomId };
        return next;
      });
    }
    pendingInventoryRoomIdRef.current = null;
  }, [availableRoomsRaw, setValue]);

  useEffect(() => {
    if (flow === FLOW_TYPE.EDIT) return;
    const key = `${watchHotelId}|${dayjs(watchCheckInDate).format("YYYY-MM-DD")}|${dayjs(watchCheckOutDate).format("YYYY-MM-DD")}`;
    if (!watchHotelId || !dayjs(watchCheckInDate).isValid() || !dayjs(watchCheckOutDate).isValid()) {
      return;
    }
    if (roomLineHotelDateKeyRef.current === "") {
      roomLineHotelDateKeyRef.current = key;
      return;
    }
    if (roomLineHotelDateKeyRef.current !== key) {
      roomLineHotelDateKeyRef.current = key;
      setRoomLineRows([{ roomId: "", qty: "1", persons: "1" }]);
    }
  }, [watchHotelId, watchCheckInDate, watchCheckOutDate, flow]);

  useEffect(() => {
    const first = roomLineRows[0]?.roomId || "";
    setValue("roomId", first, { shouldValidate: false, shouldDirty: true });
    setValue("noofRooms", String(totalRoomLineUnits), { shouldValidate: false, shouldDirty: true });
    setValue("cdnintnoOfPersons", String(Math.max(0, totalLinePersons)), {
      shouldValidate: false,
      shouldDirty: true,
    });
  }, [roomLineRows, totalRoomLineUnits, totalLinePersons, setValue]);

  /** First hotel in list once dates are set (hotel field is enabled); skips edit + calendar prefill. */
  useEffect(() => {
    if (flow === FLOW_TYPE.EDIT) return;
    if (!hotelListData.length) return;
    if (!watchCheckInDate || !watchCheckOutDate) return;

    const checkIn = dayjs(watchCheckInDate);
    const checkOut = dayjs(watchCheckOutDate);
    if (!checkIn.isValid() || !checkOut.isValid()) return;
    if (checkIn.isSame(checkOut) || checkIn.isAfter(checkOut)) return;

    const block = location.state && location.state.inventoryBlock;
    if (block && block.hotelId) return;

    const prefillFromNav = location.state?.prefillHotelId;
    const prefill = prefillFromNav || prefillHotelIdFromStore;
    if (prefill && hotelListData.some((h) => h.value === prefill)) {
      const currentId = getValues("hotelId");
      if (currentId !== prefill) {
        setSelectedHotel(prefill);
        setValue("hotelId", prefill, { shouldValidate: true, shouldDirty: true });
      }
      return;
    }

    const currentId = getValues("hotelId");
    if (currentId && hotelListData.some((h) => h.value === currentId)) {
      return;
    }

    const first = hotelListData[0];
    setSelectedHotel(first.value);
    setValue("hotelId", first.value, { shouldValidate: true, shouldDirty: true });
  }, [
    flow,
    hotelListData,
    watchCheckInDate,
    watchCheckOutDate,
    location.state,
    prefillHotelIdFromStore,
    getValues,
    setValue,
  ]);

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
      totalTax: cb.totalTax,
      checkIn: cb.checkIn,
      checkOut: cb.checkOut,
      noOfRooms: cb.noOfRooms,
      noOfPersons: cb.noOfPersons,
      hotelId: cb.hotelId,
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

    const lineCapacityMax = (roomId, unitCount) => {
      const row = (availableRoomsRaw || []).find((r) => r?.roomId === roomId);
      if (!row) return 0;
      const baseGuests = Number(row?.noOfPersons ?? 0);
      const allowExtra = row?.allowExtraPerson === true || row?.allowExtraPerson === "true";
      const maxExtra = Number(row?.maxExtraPersons ?? 0);
      const maxGuestsPerRoom = baseGuests + (allowExtra ? maxExtra : 0);
      return maxGuestsPerRoom * Math.max(0, unitCount);
    };

    const selectedRooms = buildCpSelectedRoomsFromCart(cartLines);
    if (selectedRooms.length === 0) {
      dispatch(
        showSnackbar({
          type: "error",
          message: t("Select at least one room and meal rate."),
        })
      );
      return;
    }

    if (!isQuoteReady(quoteSummary, quoteLoading, quoteError)) {
      dispatch(
        showSnackbar({
          type: "error",
          message: quoteError || t("Unable to calculate price. Check room selection."),
        })
      );
      return;
    }

    const guestCount =
      Number(formData.cdnintnoOfPersons) ||
      Number(getValues("cdnintnoOfPersons")) ||
      totalCartGuests(cartLines) ||
      1;

    const mergedLines = new Map();
    selectedRooms.forEach((line) => {
      const roomDoc = (availableRoomsRaw || []).find(
        (r) => String(r.id || r._id || "").toLowerCase() === String(line.id || "").toLowerCase()
      );
      const roomId = roomDoc?.roomId;
      if (!roomId) return;
      const qty = Number(line.quantity) || 0;
      const lineGuests = (line.instances || []).reduce((sum, inst) => {
        const base = Math.max(1, Number(roomDoc?.noOfPersons) || 1);
        const extra = Number(inst?.extraPersons) || 0;
        if (inst?.guests != null) {
          const guests = Math.max(0, Number(inst.guests) || 0);
          return sum + (guests >= base + extra ? guests : guests + extra);
        }
        return sum + base + extra;
      }, 0);
      const ex = mergedLines.get(roomId) || { noofRooms: 0, noOfPersons: 0 };
      mergedLines.set(roomId, {
        noofRooms: ex.noofRooms + qty,
        noOfPersons: ex.noOfPersons + lineGuests,
      });
    });
    const roomLines = Array.from(mergedLines.entries()).map(([roomId, v]) => ({
      roomId,
      noofRooms: v.noofRooms,
      noOfPersons: v.noOfPersons,
    }));
    const requestedRooms = roomLines.reduce((s, x) => s + x.noofRooms, 0);
    const enteredPersons = roomLines.reduce((s, x) => s + x.noOfPersons, 0);

    if (requestedRooms <= 0 || enteredPersons <= 0) {
      dispatch(
        showSnackbar({
          type: "error",
          message: t("Please enter guests and room quantities for each line."),
        })
      );
      return;
    }

    for (const line of roomLines) {
      const row = (availableRoomsRaw || []).find((r) => r?.roomId === line.roomId);
      if (!row) {
        dispatch(showSnackbar({ type: "error", message: t("Please select valid room types.") }));
        return;
      }
      const avail = Number(row?.totolNoRooms ?? 0);
      if (line.noofRooms > avail) {
        dispatch(
          showSnackbar({
            type: "error",
            message: t("Not enough rooms available for one of the selected types."),
          })
        );
        return;
      }
      const cap = lineCapacityMax(line.roomId, line.noofRooms);
      if (cap > 0 && line.noOfPersons > cap) {
        dispatch(
          showSnackbar({
            type: "error",
            message: t("Max capacity exceeded for the selected room mix."),
          })
        );
        return;
      }
    }

    let totalMaxGuests = 0;
    for (const line of roomLines) {
      totalMaxGuests += lineCapacityMax(line.roomId, line.noofRooms);
    }

    if (totalMaxGuests > 0 && enteredPersons > totalMaxGuests) {
      dispatch(
        showSnackbar({
          type: "error",
          message: t(
            "Max capacity exceeded for the selected room mix. Reduce guests or add rooms."
          ),
        })
      );
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
      roomId: roomLines[0].roomId,
      noofRooms: requestedRooms,
      cdnintnoOfPersons: guestCount,
      selectedRooms,
      cpSourceType: formData.cpSourceType || "WALK_IN",
      sourceReference: formData.sourceReference || "",
    };
    if (roomLines.length > 1) {
      finalData.roomLines = roomLines.map(({ roomId, noofRooms, noOfPersons }) => ({
        roomId,
        noofRooms,
        noOfPersons,
      }));
    }

    const roomLabelForWizard = cartLines
      .filter((l) => (Number(l.quantity) || 0) > 0)
      .map((l) => {
        const title = l.roomName || l.roomId;
        const plan = l.mealPlan ? ` · ${mealPlanRateTitle(l.mealPlan)}` : "";
        return `${title}${plan} ×${l.quantity}`;
      })
      .join(", ");

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
        setMealsLockedAtBlock(Boolean(response?.meals?.lines?.length || response?.meals?.totalPreTax > 0));
        setWizardMeta({
          ...response,
          hotelLabel,
          roomLabel: roomLabelForWizard,
          noOfRooms: requestedRooms,
          noOfPersons: guestCount,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          meals: response.meals,
          totalTax: response.totalTax,
          totalCost: response.totalCost,
          taxBreakdown: response.taxBreakdown,
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
      setCartLines([]);
      setQuoteSummary(null);
      setQuoteError(null);
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
          setCartLines([]);
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
    const noofRooms = totalCartRooms(cartLines) || totalRoomLineUnits;
    const guestField = Number(getValues("cdnintnoOfPersons")) || 0;
    const cdnintnoOfPersons = guestField > 0 ? guestField : totalCartGuests(cartLines) || totalLinePersons;

    setFormData({
      hotelId: watchHotelId,
      checkInDate: formattedCheckInDate,
      checkOutDate: formattedCheckOutDate,
      noofRooms,
      cdnintnoOfPersons,
    });
  }, [
    watchHotelId,
    watchCheckInDate,
    watchCheckOutDate,
    totalRoomLineUnits,
    totalLinePersons,
    cartLines,
    getValues,
  ]);

  useEffect(() => {
    if (!isPriceAvailable || !watchHotelId) {
      setBlockMealPlans([]);
      return;
    }
    fetchHotelMealPlansActive({ hotelId: watchHotelId, dispatch }).then((plans) => {
      setBlockMealPlans(Array.isArray(plans) ? plans : []);
    });
  }, [isPriceAvailable, watchHotelId, dispatch]);

  const blockQuotePayload = useMemo(() => {
    if (!isPriceAvailable || !watchHotelId || !watchCheckInDate || !watchCheckOutDate) {
      return null;
    }
    const selectedRooms = buildCpSelectedRoomsFromCart(cartLines);
    if (!selectedRooms.length) return null;
    const checkIn = dayjs(watchCheckInDate).format("YYYY-MM-DD");
    const checkOut = dayjs(watchCheckOutDate).format("YYYY-MM-DD");
    const guests =
      Number(getValues("cdnintnoOfPersons")) || totalCartGuests(cartLines) || 1;
    return buildBookingQuotePayload({
      hotelId: watchHotelId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      cdnintnoOfPersons: guests,
      selectedRooms,
      couponCode: null,
    });
  }, [
    isPriceAvailable,
    watchHotelId,
    watchCheckInDate,
    watchCheckOutDate,
    cartLines,
    getValues,
  ]);

  useEffect(() => {
    if (!blockQuotePayload) {
      setQuoteSummary(null);
      setQuoteError(null);
      return undefined;
    }
    let cancelled = false;
    setQuoteLoading(true);
    setQuoteError(null);
    fetchBookingQuote({ data: blockQuotePayload, dispatch })
      .then((quote) => {
        if (cancelled) return;
        const summary = summarizeQuoteGst(quote);
        if (!summary.valid) {
          setQuoteError(summary.error || "Unable to calculate tax");
          setQuoteSummary(null);
        } else {
          setQuoteSummary(summary);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQuoteError("Unable to load tax quote");
          setQuoteSummary(null);
        }
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [blockQuotePayload, dispatch]);

  useEffect(() => {
    const roomOpts = (availableRoomsRaw || []).map((item) => {
      const availableRooms = Number(item?.totolNoRooms ?? 0);
      const baseGuests = Number(item?.noOfPersons ?? 0);
      const allowExtra = item?.allowExtraPerson === true || item?.allowExtraPerson === "true";
      const maxExtra = Number(item?.maxExtraPersons ?? 0);
      const maxGuestsPerRoom = baseGuests + (allowExtra ? maxExtra : 0);

      return {
        label: `${item.roomName} (${availableRooms} available)`,
        value: item.roomId,
        disabled: availableRooms < 1,
        availableRooms,
        maxGuestsPerRoom,
      };
    });
    setRoomOptions(roomOpts);
  }, [availableRoomsRaw]);


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

  const mealNights = useMemo(() => {
    if (!wizardMeta?.checkIn || !wizardMeta?.checkOut) return 1;
    const n = dayjs(wizardMeta.checkOut).diff(dayjs(wizardMeta.checkIn), "day");
    return Math.max(1, n);
  }, [wizardMeta?.checkIn, wizardMeta?.checkOut]);

  const mealGuests = wizardMeta?.noOfPersons || 1;

  const computeMealPreview = (plan) => {
    if (!plan) return null;
    const price = Number(plan.pricePerPersonPerNight) || 0;
    const preTax = Math.round(price * mealGuests * mealNights * 100) / 100;
    const gstRate =
      plan.gstRatePercent != null
        ? Number(plan.gstRatePercent)
        : plan.category === "LUXURY"
          ? 18
          : 5;
    const tax = Math.round((preTax * gstRate) / 100 * 100) / 100;
    return { preTax, tax, gstRate, price };
  };

  useEffect(() => {
    if (wizardStep !== 2 || !wizardMeta?.hotelId) return;
    fetchHotelMealPlansActive({ hotelId: wizardMeta.hotelId, dispatch }).then((plans) => {
      const list = Array.isArray(plans) ? plans : [];
      setHotelMealPlans(list);
      if (!selectedMealPlanId) {
        const ep = list.find((p) => p.code === "EP");
        setSelectedMealPlanId(ep?.mealPlanId || list[0]?.mealPlanId || "");
      }
    });
  }, [wizardStep, wizardMeta?.hotelId, dispatch]);

  useEffect(() => {
    const plan = hotelMealPlans.find((p) => p.mealPlanId === selectedMealPlanId);
    setMealPlanPreview(computeMealPreview(plan));
    setMealBreakdownOpen(false);
  }, [selectedMealPlanId, hotelMealPlans, mealGuests, mealNights]);

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
    if (r) setWizardStep(mealsLockedAtBlock ? 3 : 2);
  };

  const handleAddOnsNext = async () => {
    if (!wizardMeta?.reservationId) return;
    if (!mealsLockedAtBlock && !selectedMealPlanId) {
      dispatch(showSnackbar({ type: "error", message: t("Please select a meal plan") }));
      return;
    }
    const addOns = addonRows
      .filter((row) => (row.label || "").trim().length > 0)
      .map((row) => ({
        label: row.label.trim(),
        unitPrice: Number(row.unitPrice) || 0,
        quantity: Math.max(1, parseInt(row.quantity, 10) || 1),
      }));
    setOnSumbitLoader(true);
    let mealR = null;
    if (!mealsLockedAtBlock) {
      mealR = await completeMealPlan({
        body: {
          reservationId: wizardMeta.reservationId,
          mealPlanId: selectedMealPlanId,
        },
        dispatch,
      });
      if (!mealR) {
        setOnSumbitLoader(false);
        return;
      }
    }
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
        m
          ? {
              ...m,
              supplementTotal: sup,
              meals: mealR?.meals ?? m.meals,
              totalTax: mealR?.totalTax ?? m.totalTax,
              totalCost: mealR?.totalCost ?? m.totalCost,
            }
          : m
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
            {mealsLockedAtBlock && (
              <Box
                sx={{
                  p: 2,
                  mb: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "grey.50",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {t("Meals locked from room selection")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("Meal plans were selected per room/rate in step 1. You can now add supplements and continue.")}
                </Typography>
              </Box>
            )}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
              {t("Meal plan")}
            </Typography>
            {mealsLockedAtBlock ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {mealPlanDisplayLabel(wizardMeta, t) || "—"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("Meals (excl. GST)")}: {formatInr(reservationMealPreTax(wizardMeta))} · {t("Meal GST")}:{" "}
                  {formatInr(reservationMealGst(wizardMeta))}
                </Typography>
              </Box>
            ) : hotelMealPlans.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t("No meal plans configured for this hotel. Configure them under Hotel → Edit.")}
              </Typography>
            ) : (
              <>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: { xs: 1, sm: 2 },
                    mb: 2,
                  }}
                >
                  {hotelMealPlans.map((plan) => {
                    const selected = selectedMealPlanId === plan.mealPlanId;
                    return (
                      <FormControlLabel
                        key={plan.mealPlanId}
                        sx={{
                          m: 0,
                          px: 1.5,
                          py: 0.75,
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: selected ? "primary.main" : "divider",
                          bgcolor: selected ? "action.selected" : "transparent",
                        }}
                        control={
                          <Checkbox
                            checked={selected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMealPlanId(plan.mealPlanId);
                              }
                            }}
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="body2" component="span">
                            {mealPlanSelectLabel(plan, t)}
                          </Typography>
                        }
                      />
                    );
                  })}
                </Box>

                {mealPlanPreview && mealPlanPreview.preTax > 0 && (
                  <Box
                    sx={{
                      mb: 2,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "grey.50",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => setMealBreakdownOpen((o) => !o)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setMealBreakdownOpen((o) => !o);
                        }
                      }}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        p: 1.5,
                        cursor: "pointer",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
                        <ExpandMoreIcon
                          sx={{
                            fontSize: 22,
                            transform: mealBreakdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                            color: "text.secondary",
                          }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {t("Meal charges for this stay")}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, flexShrink: 0 }}>
                        {formatInr(mealPlanPreview.preTax + mealPlanPreview.tax)}
                      </Typography>
                    </Box>
                    <Collapse in={mealBreakdownOpen}>
                      <Box sx={{ px: 2, pb: 2, pt: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.75,
                            fontSize: 14,
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {t("Rate")}
                          </Typography>
                          <Typography variant="body2">
                            {formatInr(mealPlanPreview.price)} {t("per guest, per night")}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.75,
                            fontSize: 14,
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {t("Guests & nights")}
                          </Typography>
                          <Typography variant="body2">
                            {mealGuests} {mealGuests === 1 ? t("guest") : t("guests")} ·{" "}
                            {mealNights} {mealNights === 1 ? t("night") : t("nights")}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.75,
                            fontSize: 14,
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {t("Meals (before tax)")}
                          </Typography>
                          <Typography variant="body2">
                            {formatInr(mealPlanPreview.preTax)}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0,
                            fontSize: 14,
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {t("Meal GST")} ({mealPlanPreview.gstRate}%)
                          </Typography>
                          <Typography variant="body2">{formatInr(mealPlanPreview.tax)}</Typography>
                        </Box>
                      </Box>
                    </Collapse>
                  </Box>
                )}
              </>
            )}

            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>
              {t("Other charges (optional)")}
            </Typography>
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
              {t("Meal plan")}
            </Box>
            <Box sx={{ fontSize: 14, mb: 1 }}>
              {mealPlanDisplayLabel(wizardMeta) || "—"}
              {reservationMealPreTax(wizardMeta) > 0 && (
                <Box component="span" sx={{ color: "text.secondary", ml: 1 }}>
                  ({formatInr(reservationMealPreTax(wizardMeta))} + {t("GST")}{" "}
                  {formatInr(reservationMealGst(wizardMeta))})
                </Box>
              )}
            </Box>

            <Box sx={{ fontWeight: 600, fontSize: 14, mt: 1, mb: 0.5 }}>
              {t("Other add-ons")}
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
                <Box sx={{ fontSize: 14 }}>{t("Room subtotal (excl. GST)")}</Box>
                <Box sx={{ fontSize: 14, fontWeight: 600 }}>
                  {formatInr(wizardMeta.totalCost)}
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Box sx={{ fontSize: 14 }}>{t("Room GST")}</Box>
                <Box sx={{ fontSize: 14, fontWeight: 600 }}>
                  {formatInr(reservationRoomGst(wizardMeta))}
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Box sx={{ fontSize: 14 }}>{t("Meal plan (excl. GST)")}</Box>
                <Box sx={{ fontSize: 14, fontWeight: 600 }}>
                  {formatInr(reservationMealPreTax(wizardMeta))}
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Box sx={{ fontSize: 14 }}>{t("Meal GST")}</Box>
                <Box sx={{ fontSize: 14, fontWeight: 600 }}>
                  {formatInr(reservationMealGst(wizardMeta))}
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Box sx={{ fontSize: 14 }}>{t("Other add-ons")}</Box>
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
                    reservationGrandTotal({
                      ...wizardMeta,
                      supplementTotal:
                        wizardMeta.supplementTotal != null
                          ? wizardMeta.supplementTotal
                          : computeSupplementFromRows(),
                    })
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
              size="small"
              disablePast
              minDate={today}
              rules={{ required: "Check In Date is required" }}
            />

            <KeyBoardDatePicker
              id="checkOutDate"
              label={t("Check Out Date")}
              control={control}
              variant="outlined"
              size="small"
              disablePast
              minDate={today.add(1, "day")}
              rules={{ required: "Check Out Date is required" }}
              error={!!errors.checkOutDate}
              helperText={errors.checkOutDate?.message}
            />

            <CustomSelectField
              id="hotelId"
              label={t("Hotel Name")}
              control={control}
              variant="outlined"
              size="small"
              options={hotelListData}
              values={selectedHotel}
              disabled={hotelDisabled}
              handleCustomInputChange={(e) => handleHotelChange(e)}
              rules={{ required: "Hotel is required" }}
            />

            {isPriceAvailable && (
              <div className="room-block-section" style={{ width: "100%", padding: "0 15px", marginBottom: 20 }}>
                <p className="title-header" style={{ marginBottom: 10 }}>
                  {t("Room & rate selection")}
                  <span style={{ fontWeight: 400, fontSize: "0.8rem", color: "#757575", marginLeft: 12 }}>
                    {t("Rooms")}: {totalCartRooms(cartLines)} &nbsp;|&nbsp; {t("Guests")}: {totalCartGuests(cartLines)}
                  </span>
                </p>
                <CpRoomCartPanel
                  availableRooms={availableRoomsRaw}
                  mealPlans={blockMealPlans}
                  cartLines={cartLines}
                  onCartChange={setCartLines}
                  totalGuests={Number(getValues("cdnintnoOfPersons")) || totalCartGuests(cartLines) || 1}
                />
                <Box sx={{ mt: 1.5 }}>
                  <CpQuoteSummary summary={quoteSummary} loading={quoteLoading} error={quoteError} />
                </Box>
              </div>
            )}

            <CustomSelectField
              id="cpSourceType"
              label={t("Booking source")}
              control={control}
              variant="outlined"
              size="small"
              options={CP_SOURCE_OPTIONS}
              disabled={isDisabled}
            />

            <InputField
              id="sourceReference"
              label={t("Source reference (optional)")}
              control={control}
              variant="outlined"
              size="small"
              disabled={isDisabled}
            />

            <input type="hidden" {...register("cdnintnoOfPersons")} />

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
                  variant="text"
                  sx={{ mt: 2 }}
                  onClick={() => navigate("/manage-reservation")}
                >
                  {t("Back")}
                </Button>
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
