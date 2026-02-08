import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Breadcrumb, Loader } from "../../../components/index";
import {
  InputField,
  CustomSelect,
  CustomInputField,
  CustomSelectField,
  CustomCheckbox,
  RadioButton,
  RadioButtonGroup,
  NumberComponent,
} from "../../../components/ReactHookForm/index";
import { Button, Box, ListItem, FormControlLabel, Checkbox, InputAdornment } from "@mui/material";
import { fetchLookupList, showSnackbar } from "../../../redux/reducer/appSlice";
import { updateTableState, fetchUserList } from "../../User/ManageUser/manageUserTableSlice";
import { createUser, updateUser, roleList, hotelList } from "./CreateUserApi";

import { FLOW_TYPE, TECHNICIAN_ROLE_ID } from "../../../Utils/constants";
import "./CreateUser.scss";

function CreateUser() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const lookup = useSelector((state) => state.appReducer.lookup);
  const flow = useSelector((state) => state.manageUserTableReducer.flow);
  const selectedUserData = useSelector(
    (state) => state.manageUserTableReducer.selectedUserData
  );
  const showSessionPopup = useSelector(
    (state) => state.loginReducer.showSessionPopup
  );

  const createUserForm = {
    userEmail: "",
    userName: "",
    phone: "",
    roleId: "",
    myCheckbox: ""
  };

  const { handleSubmit, control, reset, setValue } = useForm({
    defaultValues: createUserForm,
  });
  const [pageLoader, setPageLoader] = useState(false);
  const [onSumbitLoader, setOnSumbitLoader] = useState(false);
  const [hasTechnician, setHasTechnician] = useState(false);
  const [hasEmailEntered, setHasEmailEntered] = useState(false);
  const [validation, setValidation] = useState(true);
  const [flg, setFlg] = useState("");
  const [isflg, setIsflg] = useState(false);
  const [selectedHotels, setSelectedHotels] = useState([]);
  const [allHotels, setAllHotels] = useState(null);
  const [selectedHotelType, setSelectedHotelType] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState([]);
  const [roleValues, setRoleValues] = useState("");
  const [hotels, setHotels] = useState([]);
  const [isAllHotels, setIsAllHotels] = useState(false);
  const [hotelLoader, setHotelLoader] = useState(false);
  const [existingPhoneNumbers, setExistingPhoneNumbers] = useState([]);
  const onPageLoad = async () => {
    loc();
  };

  useEffect(() => {
    // didMount
    async function fetchInit() {
      dispatch(updateTableState({ userCreated: false }));
      onPageLoad();
      fetchHotels();
      fetchAllUsers();
    }
    fetchInit();
    const roleDescription = window.localStorage.getItem("roleDescription");
    setFlg(roleDescription);
  }, [showSessionPopup]);




  const fetchHotels = async () => {
    setHotelLoader(true);
    try {
      let data = {};
      const response = await hotelList({ data, dispatch });
      setHotels(response.data);
    } catch (error) {
      console.error("Error fetching hotels:", error);
    }
    finally {
      setHotelLoader(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      // Fetch users to check for duplicate phone numbers
      // We pass a large perPage to get as many as possible for validation
      const res = await dispatch(fetchUserList({ data: {}, params: { page: 0, perPage: 1000 } })).unwrap();
      if (res && res.data) {
        const phoneNumbers = res.data.map(user => user.phone).filter(Boolean);
        setExistingPhoneNumbers(phoneNumbers);
      }
    } catch (error) {
      console.error("Error fetching all users for validation:", error);
    }
  };


  useEffect(() => {
    if (flow === FLOW_TYPE.EDIT && selectedUserData) {
      console.log("selectedUserData", selectedUserData);
      setPageLoader(true);
      setRoleValues(selectedUserData.roleId);
      setSelectedHotels(selectedUserData.hotelRights);
      setIsAllHotels(selectedUserData.isAllHotels);

      let temp = "";

      if (selectedUserData.isAllHotels) {
        temp = "All Hotels"
      } else {
        temp = "Specific Hotels"
        setSelectedHotelType("Specific Hotels");
      }

      if (
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(
          selectedUserData.userEmail
        )
      ) {
        setUserEmail(selectedUserData.userEmail);
        setValue("userEmail", selectedUserData.userEmail);
      } else {
        setUserEmail("");
        setValue("");
        setValidation(false);
      }

      let phoneVal = selectedUserData.phone;
      if (phoneVal && phoneVal.startsWith("+91")) {
        phoneVal = phoneVal.substring(3);
      }

      const createUserForm = {
        userName: selectedUserData.userName,
        userEmail: selectedUserData.userEmail,
        roleId: selectedUserData.roleId,
        phone: phoneVal,
        myCheckbox: temp,
      };
      reset(createUserForm);
      setPageLoader(false);
    }
  }, [selectedUserData, lookup, showSessionPopup, allHotels]);

  const handleSelectedHotelsChange = (hotels) => {
    setSelectedHotels(hotels);
    console.log("Selected Hotels ifff:", hotels);
  };

  const handleIsHotelRights = (hotels) => {
    setIsflg(hotels);
    console.log("Selected Hotels issss:", hotels);
  };

  const submitHandler = async (formData) => {
    try {

      if (formData.phone && !formData.phone.startsWith("+91")) {
        formData.phone = `+91${formData.phone}`;
      }

      if (formData.userEmail.length === 0) {
        if (formData.phone.length === 13) {
          formData.userEmail = formData.phone.substring(3, 13);
        }
      }

      formData.isAllHotels = isAllHotels;
      formData.hotelRights = isAllHotels === true ? [] : selectedHotels;

      if (!isAllHotels) {
        if (!selectedHotels || selectedHotels.length === 0) {
          dispatch(
            showSnackbar({
              type: "error",
              message: `Select one or more hotels.`,
            })
          );
          return;
        }
      }

      console.log(formData, "formData submitHandler");
      setOnSumbitLoader(true);
      let response = null;
      if (flow === FLOW_TYPE.EDIT) {
        let userId = selectedUserData.userId;
        response = await updateUser({ data: formData, userId, dispatch });
      } else {
        console.log("create user invoked");
        response = await createUser({ data: formData, dispatch });
      }
      console.log("response", response);
      setOnSumbitLoader(false);
      if (
        response &&
        (response.toLowerCase() === "success" ||
          response.toLowerCase() === "usersuccess")
      ) {
        dispatch(updateTableState({ userCreated: true }));
        dispatch(
          showSnackbar({
            type: "success",
            message: `User ${flow === FLOW_TYPE.EDIT ? "updated" : "created"
              } successfully.`,
          })
        );
        navigate("/manage-user");
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  const handleRoleChange = async (e) => {
    let roleId = e.target.value;
    console.log("role", roleId);
    setRoleValues(roleId);
  };

  const handleEmailChange = async (e) => {
    let email = e.target.value.toLowerCase();
    setUserEmail(email);
    if (email !== "" && email.length !== 0) {
      setHasEmailEntered(true);
      setValidation(true);
    } else {
      if (hasTechnician === true) {
        setValidation(false);
      } else {
        setValidation(true);
      }
      setHasEmailEntered(false);
    }
  };


  const handleHotelCheckboxChange = (hotelId) => {
    setSelectedHotels((prevSelected) =>
      prevSelected.includes(hotelId)
        ? prevSelected.filter((id) => id !== hotelId)
        : [...prevSelected, hotelId]
    );
  };


  async function loc() {
    let res = await roleList({ dispatch });
    let temp = [];
    let category = res.data;
    category.map((item) => {
      let dataJson = { label: item.roleName, value: item.roleId };
      temp.push(dataJson);
    });
    setRoles(temp);

    console.log("temp", temp);
  }


  const handleRadioChange = (value) => {
    console.log("Selected Radio Option:", value.target.value);
    setSelectedHotelType(value.target.value);

    if (value.target.value === "All Hotels") {
      setSelectedHotels([]);
      setIsAllHotels(true)

    } else {
      setIsAllHotels(false);
    }
  };

  const options = [
    { label: "All Hotels", value: "All Hotels" },
    { label: "Specific Hotels", value: "Specific Hotels" },
  ];


  console.log("s", selectedHotelType)
  return (
    <div className="createUser-page page">
      <Breadcrumb
        pageTitle={t("Create User")}
        breadcrumbList={[
          {
            title: t("Home"),
            url: "/",
          },
          {
            title: t("User"),
            url: "/manage-user",
          },
          {
            title:
              flow === FLOW_TYPE.EDIT ? t("Update User") : t("Create User"),
            url: "/create-user",
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
            <InputField
              id="userName"
              label={t("User Name")}
              control={control}
              variant="outlined"
              rules={{ required: t("User Name is required"), pattern: { value: /^[A-Za-z\s]+$/, message: t("Alphabets Only"), }, maxLength: { value: 50, message: t("Maximum 50 characters allowed"), }, }}
            />

            <CustomInputField
              id="userEmail"
              label={t("Email")}
              control={control}
              values={userEmail}
              disabled={flow === FLOW_TYPE.EDIT ? true : false}
              variant="outlined"
              handleCustomInputChange={(e) => handleEmailChange(e)}
              rules={
                validation
                  ? {
                    required: t("Email is required"),
                    pattern: {
                      value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                      message: t("Please enter a valid email address"),
                    },
                  }
                  : { required: null }
              }
            />

            <NumberComponent
              id="phone"
              label={t("Mobile")}
              control={control}
              disabled={flow === FLOW_TYPE.EDIT ? true : false}
              variant="outlined"
              rules={{
                required: t("Mobile Number is required"),
                pattern: {
                  value: /^[6-9]\d{9}$/,
                  message: t(
                    "Please enter a valid 10-digit Indian mobile number"
                  ),
                },
                validate: (value) => {
                  if (flow === FLOW_TYPE.EDIT) return true; // Skip for edit if disabled, but here it is disabled anyway
                  const fullPhone = `+91${value}`;
                  if (existingPhoneNumbers.includes(fullPhone)) {
                    return t("Phone number already exists");
                  }
                  return true;
                }
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

            <CustomSelectField
              id="roleId"
              label={t("Role")}
              control={control}
              variant="outlined"
              rules={{ required: t("Role is required") }}
              handleCustomInputChange={(e) => handleRoleChange(e)}
              placeholder={t("Select Role")}
              options={roles}
              values={roleValues}

            />

            <RadioButtonGroup
              id="myCheckbox"
              label="Hotel Rights"
              control={control}
              options={options}
              handleChanger={handleRadioChange}
              rules={{ required: "At least one option must be selected" }}
              row
            />


            {hotelLoader ? (
              <Loader pageLoader={true} />
            ) : (
              selectedHotelType === "Specific Hotels" && hotels.length > 0 && (
                <Box display="grid" gridTemplateColumns="repeat(5, 1fr)" sx={{ maxHeight: "200px", overflowY: "auto" }} gap={2} mt={2}>
                  {hotels.map((hotel) => (
                    <ListItem key={hotel.id} sx={{ width: "auto", p: 0 }}>
                      <FormControlLabel
                        control={<Checkbox checked={(selectedHotels || []).includes(hotel.hotelId)} style={{ marginLeft: "16px" }} onChange={() => handleHotelCheckboxChange(hotel.hotelId)} />}
                        label={hotel.hotelName}
                      />
                    </ListItem>
                  ))}
                </Box>
              )
            )}

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

export default CreateUser;
