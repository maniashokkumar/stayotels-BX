import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Breadcrumb, Loader } from "../../../components/index";
import dayjs from "dayjs";
import {
  InputField,
  CustomSelectField,
  KeyBoardDatePicker,
  NumberComponent,
  NumericInputComponent,
} from "../../../components/ReactHookForm/index";
import {
  Button,
  Tabs,
  Tab,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { fetchLookupList, showSnackbar } from "../../../redux/reducer/appSlice";
import { updateTableState } from "../../Price/ManagePrice/managePriceTableSlice";
import {
  createPrice,
  updatePrice,
  hotelList,
  roomList,
} from "./CreatePriceApi";

import { FLOW_TYPE } from "../../../Utils/constants";
import "./CreatePrice.scss";

function CreatePrice() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const lookup = useSelector((state) => state.appReducer.lookup);
  const flow = useSelector((state) => state.managePriceTableReducer.flow);
  const selectedPriceData = useSelector(
    (state) => state.managePriceTableReducer.selectedPriceData
  );
  const showSessionPopup = useSelector(
    (state) => state.loginReducer.showSessionPopup
  );

  const createPriceForm = {
    hotelId: "",
    roomId: "",
    fromDate: "",
    toDate: "",
    price: "",
  };

  const { handleSubmit, control, reset, setValue, setError,
    clearErrors,
    formState: { errors }, } = useForm({
    defaultValues: createPriceForm,
  });
  const [pageLoader, setPageLoader] = useState(false);
  const [onSumbitLoader, setOnSumbitLoader] = useState(false);
  const [hotelSer, setHotelSer] = useState([]);
  const [roomSer, setRoomSer] = useState([]);
  const [hotelValue, setHotelValue] = useState("");
  const [roomValue, setRoomValue] = useState("");
  const [selectedDays, setSelectedDays] = React.useState([]);
  const [type, setType] = useState("date");
  const [displayDays, setDisplayDays] = useState("");
  const [displayDate, setDisplayDate] = useState("");

  const [activeTab, setActiveTab] = useState(0);

  const [filterData, setFilterData] = useState({
    productKey: null,
  });
  const [filterDayData, setFilterDayData] = useState({
    productDayKey: null,
  });
  const [dayValidation, setDayValidation] = useState("");

  const [selectedDaysnew, setSelectedDaysnew] = useState([]);
  const [allRooms, setAllRooms] = useState([]);


  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const days = [
    { id: 1, label: "Sunday", value: "Sunday" },
    { id: 2, label: "Monday", value: "Monday" },
    { id: 3, label: "Tuesday", value: "Tuesday" },
    { id: 4, label: "Wednesday", value: "Wednesday" },
    { id: 5, label: "Thursday", value: "Thursday" },
    { id: 6, label: "Friday", value: "Friday" },
    { id: 7, label: "Saturday", value: "Saturday" },
  ];

  const handleDaySelectionChange = (event) => {
    const value = event.target.value;

    setSelectedDaysnew((prevSelectedDays) => {
      const daysArray = prevSelectedDays || [];

      return daysArray.includes(value)
        ? daysArray.filter((day) => day !== value)
        : [...daysArray, value];
    });

    setDayValidation("");
  };

  useEffect(() => {
    if (type !== "date") {
      setValue("fromDate", null);
      setValue("toDate", null);
    }
    if (type === "date") {
      setSelectedDaysnew([]);
    }
  }, [type, setValue]);

  // const handleDayListChange = (event) => {
  //   let productDayKey = [];
  //   if (filterDayData.productDayKey !== null) {
  //     productDayKey = [...filterDayData.productDayKey];
  //   }
  //   let index = productDayKey.findIndex((el) => el === event.target.value);

  //   if (index === -1) {
  //     productDayKey.push(event.target.value);
  //   } else {
  //     productDayKey.splice(index, 1);
  //   }
  //   console.log("productDayKeydddd", productDayKey);
  //   setFilterDayData({ productDayKey: productDayKey });
  //   setDayValidation("");
  // };

  const onPageLoad = async () => {
    await dispatch(fetchLookupList("hotel"));
    hotel();
    room();
    //}
  };

  async function hotel() {
    let res = await hotelList({ dispatch });
    let temp = [];

    let category = Array.isArray(res.data) ? res.data : [];

    console.log("category", category);

    category.forEach((item) => {
      let dataJson = { label: item.hotelName, value: item.hotelId };
      temp.push(dataJson);
    });
    console.log("temp hotel>>>>>>>>", temp);
    setHotelSer(temp);
  }

  async function room() {
    let res = await roomList({ dispatch });
    let category = Array.isArray(res.data) ? res.data : [];

    let temp = category.map((item) => ({
      label: item.roomName,
      value: item.roomId,
      hotelId: item.hotelId,
    }));

    console.log("All rooms:", temp);
    setAllRooms(temp);
  }

  useEffect(() => {
    async function fetchInit() {
      dispatch(updateTableState({ priceCreated: false }));
      onPageLoad();
    }
    fetchInit();
  }, [showSessionPopup]);



  useEffect(() => {
    if (flow === FLOW_TYPE.EDIT && selectedPriceData) {
      console.log("selectedPriceData", selectedPriceData);
      setPageLoader(true);
      setHotelValue(selectedPriceData.hotelId);
      setRoomValue(selectedPriceData.roomId);
      setSelectedDaysnew(selectedPriceData.days);

      const filteredRooms = allRooms.filter(
        (room) => room.hotelId === selectedPriceData.hotelId
      );
      console.log("filteredRooms:::::::::", filteredRooms);
      console.log("allRooms:::::::::", allRooms);
      setRoomSer(filteredRooms);

      // if (selectedPriceData.days !== "N/A") {
      //   setType("day");
      // } else {
      //   setType("date");
      // }

      if (Array.isArray(selectedPriceData.days) && selectedPriceData.days.length > 0) {
        setType("day");
      } else {
        setType("date");
      }      

      const createPriceForm = {
        hotelId: selectedPriceData.hotelId,
        roomId: selectedPriceData.roomId,
        fromDate: selectedPriceData.fromDate,
        toDate: selectedPriceData.toDate,
        price: selectedPriceData.price,
      };
      reset(createPriceForm);
      setPageLoader(false);
    }
  }, [selectedPriceData, lookup, showSessionPopup, allRooms]);

  // const submitHandler = async (formData) => {
  //   // console.log("formData submitHandler>>>>>>>>", formData);
  //   // setOnSumbitLoader(true);

  //   // if (type === "date") {
  //   //   if (!formData.fromDate || !formData.toDate) {
  //   //     dispatch(
  //   //       showSnackbar({ type: "error", message: "Both dates are required!." })
  //   //     );
  //   //     setOnSumbitLoader(false);
  //   //     return;
  //   //   }

  //   //   const fromDate = dayjs(formData.fromDate);
  //   //   const toDate = dayjs(formData.toDate);

  //   //   // if (fromDate.isAfter(toDate)) {
  //   //   //   dispatch(
  //   //   //     showSnackbar({
  //   //   //       type: "error",
  //   //   //       message: "From Date cannot be after To Date!",
  //   //   //     })
  //   //   //   );
  //   //   //   setOnSumbitLoader(false);
  //   //   //   return;
  //   //   // }

  //   //   //  if (fromDate.isAfter(toDate) || toDate.isSame(toDate)) {
  //   //   //     dispatch(showSnackbar({ 
  //   //   //       type: "error", 
  //   //   //       message: "From Date cannot be the same as or after To Date!" 
  //   //   //     }));
  //   //   //     return;
  //   //   //   }

  //   //   if (fromDate.isSame(toDate)) {
  //   //     setError("toDate", { type: "manual", message: "From Date and To Date cannot be the same!" });
  //   //     return;
  //   //   }
    
  //   //   if (fromDate.isAfter(toDate)) {
  //   //     setError("toDate", { type: "manual", message: "From Date cannot be after To Date!" });
  //   //     return;
  //   //   }
    
  //   //   // Clear errors if validation passes
  //   //   clearErrors("toDate");
    
  //   //   // Proceed with form submission
  //   //   console.log("Form submitted successfully!", formData);

  //   //   formData.fromDate = dayjs(fromDate).format("YYYY-MM-DD");
  //   //   formData.toDate = dayjs(toDate).format("YYYY-MM-DD");
  //   //   formData.days = [];
  //   // }

  //   // if (type === "day") {
  //   //   if (selectedDaysnew.length === 0) {
  //   //     dispatch(
  //   //       showSnackbar({
  //   //         type: "error",
  //   //         message: "Please select at least one day!.",
  //   //       })
  //   //     );
  //   //     setOnSumbitLoader(false);
  //   //     return;
  //   //   }
  //   //   formData.fromDate = null;
  //   //   formData.toDate = null;
  //   //   formData.days = selectedDaysnew;
  //   //   console.log("selectedDaysnew >>>>>>", selectedDaysnew);
  //   // }
  //   // console.log("complete form data >>>>>>", formData);
  //   // let response = null;

    
  //   if (flow === FLOW_TYPE.EDIT) {
  //     let priceId = selectedPriceData.pricingId;
  //     // console.log("uid -edit ::" + priceId);
  //     // console.log("uid -edit- name ::" + selectedPriceData.firstName);
  //     response = await updatePrice({ data: formData, priceId, dispatch });
  //   } else {
  //     // console.log("create price invoked");
  //     response = await createPrice({ data: formData, dispatch });
  //   }
  //   console.log(response, "response");
  //   setOnSumbitLoader(false);

  //   if (
  //     response &&
  //     (response.message.toLowerCase() === "price added successfully" ||
  //       response.message.toLowerCase() === "price updated successfully")
  //   ) {
  //     dispatch(updateTableState({ priceCreated: true }));
  //     dispatch(
  //       showSnackbar({
  //         type: "success",
  //         message: `Price ${
  //           flow === FLOW_TYPE.EDIT ? "updated" : "created"
  //         } successfully.`,
  //       })
  //     );
  //     navigate("/manage-price");
  //   }
  // };

  const submitHandler = async (formData) => {
    try {
      console.log("formData submitHandler>>>>>>>>", formData);
      setOnSumbitLoader(true);
  
      if (type === "date") {
        if (!formData.fromDate || !formData.toDate) {
          dispatch(
            showSnackbar({ type: "error", message: "Both dates are required!." })
          );
          setOnSumbitLoader(false);
          return;
        }
  
        const fromDate = dayjs(formData.fromDate);
        const toDate = dayjs(formData.toDate);
  
        if (fromDate.isSame(toDate)) {
          setError("toDate", {
            type: "manual",
            message: "From Date and To Date cannot be the same!",
          });
          setOnSumbitLoader(false);
          return;
        }
  
        if (fromDate.isAfter(toDate)) {
          setError("toDate", {
            type: "manual",
            message: "From Date cannot be after To Date!",
          });
          setOnSumbitLoader(false);
          return;
        }
  
        clearErrors("toDate");
  
        formData.fromDate = dayjs(fromDate).format("YYYY-MM-DD");
        formData.toDate = dayjs(toDate).format("YYYY-MM-DD");
        formData.days = [];
      }
  
      if (type === "day") {
        if (selectedDaysnew.length === 0) {
          dispatch(
            showSnackbar({
              type: "error",
              message: "Please select at least one day!.",
            })
          );
          setOnSumbitLoader(false);
          return;
        }
        formData.fromDate = null;
        formData.toDate = null;
        formData.days = selectedDaysnew;
      }
  
      console.log("complete form data >>>>>>", formData);
      let response = null;
  
      if (flow === FLOW_TYPE.EDIT) {
        let priceId = selectedPriceData.pricingId;
        response = await updatePrice({ data: formData, priceId, dispatch });
      } else {
        response = await createPrice({ data: formData, dispatch });
      }
  
      console.log("API Response:", response);
  
      if (response &&(
        response.message.toLowerCase() === "price added successfully" ||
        response.message.toLowerCase() === "price updated successfully"
      )) {
        dispatch(updateTableState({ priceCreated: true }));
        dispatch(
          showSnackbar({
            type: "success",
            message: `Price ${
              flow === FLOW_TYPE.EDIT ? "updated" : "created"
            } successfully.`,
          })
        );
        navigate("/manage-price");
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      // dispatch(
      //   showSnackbar({ type: "error", message: "Something went wrong. Try again!" })
      // );
    } finally {
      setOnSumbitLoader(false);
    }
  };
  
  const handleChangePowerEnergy = (event, value) => {
    setType(value);
  };

  const handleHotelChange = async (e) => {
    let hotelId = e.target.value;
    setHotelValue(hotelId);

    const filteredRooms = allRooms.filter((room) => room.hotelId === hotelId);
    setRoomSer(filteredRooms);

    setRoomValue("");
    setValue("roomId", "");
  };

  const handleRoomChange = async (e) => {
    let roomId = e.target.value;
    setRoomValue(roomId);
  };

  const today = dayjs();

  return (
    <div className="createPrice-page page">
      <Breadcrumb
        pageTitle={t("Create Price")}
        breadcrumbList={[
          {
            title: t("Home"),
            url: "/",
          },
          {
            title: t("Price"),
            url: "/manage-price",
          },
          {
            title:
              flow === FLOW_TYPE.EDIT ? t("Update Price") : t("Create Price"),
            url: "/create-price",
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
            <CustomSelectField
              id="hotelId"
              label={t("Hotel")}
              control={control}
              variant="outlined"
              rules={{ required: t("Hotel is required") }}
              handleCustomInputChange={(e) => handleHotelChange(e)}
              placeholder={t("Select Hotel")}
              options={hotelSer}
              values={hotelValue}
            />
            <CustomSelectField
              id="roomId"
              label={t("Room")}
              control={control}
              variant="outlined"
              rules={{ required: t("Room is required") }}
              handleCustomInputChange={(e) => handleRoomChange(e)}
              placeholder={t("Select Room")}
              options={roomSer}
              values={roomValue}
            />

            <NumericInputComponent
              id="price"
              label={"Price"}
              control={control}
              variant="outlined"
              rules={{
                validate: (value) => {
                  if (value === "") {
                    return "Price is required";
                  }
                  if (isNaN(value)) {
                    return "Please enter a valid price";
                  }
                  if (parseFloat(value) <= 0) {
                    return 'Price must be greater than 0';
                  }
                  if (parseFloat(value) === 0) {
                    return 'Price cannot be 0';
                  }
                  if (!/^\d{1,9}(\.\d{1,2})?$/.test(value)) {
                    return "Price must be a maximum of 9 digits and up to 2 decimal places";
                  }

                  return true;
                },
              }}
            />
          </div>

          <div className="form-fields-block">
            {flow === FLOW_TYPE.EDIT ? (
              <Tabs
                color="primary"
                value={type}
                exclusive
                size="small"
                onChange={handleChangePowerEnergy}
              >
                <Tab value="date" label={t("date")}>
                  Date
                </Tab>
                <Tab value="day" label={t("Day")}>
                  Day
                </Tab>
              </Tabs>
            ) : flow === FLOW_TYPE.SPECIAL ? (
              <Tabs
                color="primary"
                value={type}
                exclusive
                size="small"
                onChange={handleChangePowerEnergy}
              >
                <Tab value="date" label={t("date")}>
                  Date
                </Tab>
              </Tabs>
            ) : (
              <Tabs
                color="primary"
                value={type}
                exclusive
                size="small"
                onChange={handleChangePowerEnergy}
              >
                <Tab value="date" label={t("date")}>
                  Date
                </Tab>
                <Tab value="day" label={t("Day")}>
                  Day
                </Tab>
              </Tabs>
            )}
          </div>

          <div className="form-fields-block" style={{ marginTop: "20px" }}>
            {type === "date" ? (
              <>
                <KeyBoardDatePicker
                  id="fromDate"
                  label={t("From Date")}
                  control={control}
                  variant="outlined"
                  disablePast
                  minDate={today}
                  rules={{ required: "From Date is required" }}
                
                />

                <KeyBoardDatePicker
                  id="toDate"
                  label={t("To Date")}
                  control={control}
                  variant="outlined"
                  disablePast
                  minDate={today}
                  rules={{ required: "To Date is required" }}
                  error={!!errors.toDate}
                  helperText={errors.toDate?.message}

                />
              </>
            ) : (
              <div className="card-wrapper-default environment-card-wrapper">
                <FormGroup row>
                  {days.map((day) => (
                    <FormControlLabel
                      id="day"
                      key={day.id}
                      control={
                        <Checkbox
                          value={day.value}
                          onChange={handleDaySelectionChange}
                          checked={
                            selectedDaysnew?.includes(day.value) || false
                          }
                        />
                      }
                      label={day.label}
                    />
                  ))}
                </FormGroup>
              </div>
            )}
            <div></div>
            <div></div>
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
              {onSumbitLoader
                ? t("Loading...")
                : flow === FLOW_TYPE.EDIT
                ? t("Update")
                : t("Create")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePrice;
