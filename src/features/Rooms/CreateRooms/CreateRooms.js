import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Breadcrumb, Loader } from "../../../components/index";
import { axiosPrService } from "../../../axios/axiosInstance";

import {
  InputField,
  CustomMultipleSelect,
  CustomSelectField,
  NumberComponent,
  NumericInputComponent
} from "../../../components/ReactHookForm/index";
import { Grid, Button, CardMedia, Switch, FormControlLabel, FormGroup } from "@mui/material";
import noimage from '../../../assets/images/no_image.jpg'

import { showSnackbar, fetchLookupList } from "../../../redux/reducer/appSlice";
import { updateTableState } from "../../Rooms/ManageRooms/manageRoomsTableSlice";
import {
  createRooms,
  updateRooms,
  loccationList,
  hotelList,
} from "./CreateRoomsApi";

import {
  FLOW_TYPE, AWS_URL, typeOfRooms,
  AMENITIES_ID,
  LOCATION_ID,
  HOTEL_ID,
} from "../../../Utils/constants";
import "./CreateRooms.scss";
import DropzoneUploader from "react-dropzone-uploader";
import "react-dropzone-uploader/dist/styles.css";


function CreateRooms() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const lookup = useSelector((state) => state.appReducer.lookup);
  const flow = useSelector((state) => state.manageRoomsTableReducer.flow);
  const selectedAmenitiesData = useSelector(
    (state) => state.manageAmenitiesTableReducer.selectedAmenitiesData
  );
  const selectedLocationData = useSelector(
    (state) => state.manageLocationTableReducer.selectedLocationData
  );
  const selectedRoomsData = useSelector(
    (state) => state.manageRoomsTableReducer.selectedRoomsData
  );
  const showSessionPopup = useSelector(
    (state) => state.loginReducer.showSessionPopup
  );
  const selectedHotelData = useSelector(
    (state) => state.manageHotelTableReducer.selectedHotelData
  );

  console.log("lookup", lookup.location);

  const createRoomsForm = {
    roomName: "",
    basePrice: "",
    noOfPersons: "",
    noOfChildrens: "0",
    hotelId: "",
    locationId: "",
    amenitiesId: [],
    roomSize: "",
    totolNoRooms: "",
    roomType: "",
    noOfBathrooms: "",
    allowExtraPerson: false,
    maxExtraPersons: 0,
    extraPersonCharge: 0,
  };

  const { handleSubmit, control, reset, setValue, watch } = useForm({
    defaultValues: createRoomsForm,
  });

  const allowExtraPerson = watch("allowExtraPerson");
  const [pageLoader, setPageLoader] = useState(false);
  const [onSumbitLoader, setOnSumbitLoader] = useState(false);
  const [hasAmenities, setHasAmenities] = useState(false);
  const [setHotel, setHasHotel] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [validation, setValidation] = useState(true);
  const [amenitiesId, setAmenitiesId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [hotelId, setHotelId] = useState("");
  const [type, setType] = useState("");
  const [locSer, setLocSer] = useState([]);
  const [hotelSer, setHotelSer] = useState([]);
  const [hotelfilter, setHotelfilter] = useState([])
  const [hotelValue, setHotelValue] = useState("");
  const [locationValue, setLocationValue] = useState("");
  const [anmi, setAnmi] = useState([]);
  const [uploadedFile, setUploadedFile] = useState([]);
  const [roomType, setRoomType] = useState("");
  const [inputContent, setInputContent] = useState(
    "Drop/Browse a Rooms Images"
  );
  const [uploading, setUploading] = useState(false);
  const [uploaderKey, setUploaderKey] = useState(Date.now());
  const [existingImages, setExistingImages] = useState([]);

  const onPageLoad = async () => {
    // fetchLookupOptions();
    //if (!lookup.role) {
    await dispatch(fetchLookupList("location"));
    await dispatch(fetchLookupList("amenities"));
    await dispatch(fetchLookupList("hotel"));
    loc();
    hotel();
    //}
  };

  // const handleFileChange = ({ file, meta, status, remove }) => {
  //   console.log("File meta:", meta.status);
  //   console.log("File:", file);
  //   setUploading(true);
  //   if (meta.status === "preparing") {


  //   } else if (meta.status === "done") {


  //     // setUploadedFile(file);
  //     setUploadedFile((prevFiles) => [...prevFiles, file]);
  //   } else if (meta.status === "removed") {

  //     // setUploadedFile((prevFiles) =>
  //     //   prevFiles.filter((f) => f.file !== file));
  //     setUploadedFile((prevFiles) => prevFiles.filter(f => f !== file));
  //   }
  //   else if (meta.status === "rejected_file_type") {

  //   }
  //   setUploading(false);
  // };

  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const handleFileChange = ({ file, meta, status, remove }) => {
    console.log("File meta:", meta.status);
    console.log("File:", file);
    setUploading(true);

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      dispatch(
        showSnackbar({
          type: "error",
          message: "Invalid file type. Only JPG, JPEG, and PNG are allowed.",
        })
      );
      setUploading(false);
      return;
    }

    if (meta.status === "done") {
      setUploadedFile((prevFiles) => [...prevFiles, file]);
    } else if (meta.status === "removed") {
      setUploadedFile((prevFiles) => prevFiles.filter((f) => f !== file));
    }

    setUploading(false);
  };

  const removeExistingImage = (index) => {
    setExistingImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  async function loc() {
    let res = await loccationList({ dispatch });
    let temp = [];
    let category = res.data;
    category.map((item) => {
      // label: item.locationName,
      // value: item.locationId,
      let dataJson = { label: item.locationName, value: item.locationId };
      temp.push(dataJson);
    });
    setLocSer(temp);
  }

  async function hotel() {
    let res = await hotelList({ dispatch });
    let temp = [];

    let category = Array.isArray(res.data) ? res.data : []; // Ensure it's an array

    console.log("category", category);

    category.forEach((item) => {
      // Use forEach instead of map
      let dataJson = { label: item.hotelName, value: item.hotelId, locationId: item.locationId };
      temp.push(dataJson);
    });
    console.log("temp hotel>>>>>>>>", temp);
    setHotelSer(temp);
  }

  useEffect(() => {
    // didMount
    async function fetchInit() {
      dispatch(updateTableState({ roomsCreated: false }));
      onPageLoad();
    }
    fetchInit();
  }, [showSessionPopup]);

  useEffect(() => {
    if (flow === FLOW_TYPE.EDIT && selectedHotelData) {
      console.log("selectedHotelData", selectedHotelData);
      setPageLoader(true);
      setAmenitiesId(selectedHotelData.hotelId);
      //setValue("roleId",selectedUserData.roleId)

      if (selectedHotelData.hotelId === HOTEL_ID) {
        setHasHotel(true);
      } else {
        setHasHotel(false);
      }
    }
  }, [selectedHotelData, lookup, showSessionPopup]);

  useEffect(() => {
    if (flow === FLOW_TYPE.EDIT && selectedRoomsData) {
      console.log("selectedRoomsData", selectedRoomsData);
      setPageLoader(true);
      console.log("roooo", lookup.location);
      setLocationValue(selectedRoomsData.locationId);
      setHotelValue(selectedRoomsData.hotelId);
      setRoomType(selectedRoomsData.roomType);

      const filteredRoom = hotelSer.filter((room) => room.locationId === selectedRoomsData.locationId);

      setHotelfilter(filteredRoom);

      const createRoomsForm = {
        roomName: selectedRoomsData.roomName,
        basePrice: selectedRoomsData.basePrice,
        noOfPersons: selectedRoomsData.noOfPersons,
        noOfChildrens: selectedRoomsData.noOfChildrens,
        hotelId: selectedRoomsData.hotelId,
        locationId: selectedRoomsData.locationId,
        amenitiesId: selectedRoomsData.amenitiesId,
        roomSize: selectedRoomsData.roomSize,
        totolNoRooms: selectedRoomsData.totolNoRooms,
        roomType: selectedRoomsData.roomType,
        noOfBathrooms: selectedRoomsData.noOfBathrooms,
        allowExtraPerson: selectedRoomsData.allowExtraPerson || false,
        maxExtraPersons: selectedRoomsData.maxExtraPersons || 0,
        extraPersonCharge: selectedRoomsData.extraPersonCharge || 0,
      };
      reset(createRoomsForm);
      if (selectedRoomsData.roomImagePath) {
        setExistingImages(selectedRoomsData.roomImagePath.map(img => img));
      }
      setPageLoader(false);
    }
  }, [selectedRoomsData, lookup, showSessionPopup, hotelSer]);

  const submitHandler = async (formData) => {
    setOnSumbitLoader(true);
    if (uploadedFile.length === 0 && existingImages.length === 0) {
      dispatch(
        showSnackbar({
          type: "error",
          message: "Please upload at least one image.",
        })
      );
      setOnSumbitLoader(false);
      return;
    }

    const invalidFiles = uploadedFile.filter(
      (file) => !ALLOWED_FILE_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE
    );

    if (invalidFiles.length > 0) {
      dispatch(
        showSnackbar({
          type: "error",
          message: "One or more files are invalid. Please check the file type and size (Max: 5MB).",
        })
      );
      setOnSumbitLoader(false);
      return;
    }
    let response = null;
    let roomId = null;

    if (flow === FLOW_TYPE.EDIT) {
      // let id = selectedRoomsData.roomId;
      console.log("selectedRoomsData.roomId", selectedRoomsData.roomId)
      response = await updateRooms({ data: formData, id: selectedRoomsData.roomId, dispatch });
    } else {
      formData.amenitiesId = amenitiesId;
      formData.locationId = locationValue;

      formData.hotelId = hotelValue;

      response = await createRooms({ data: formData, dispatch });
    }

    // console.log("response:::::::::",response)

    if (response.message === "success" || response === "Success") {
      roomId = response.data?.roomId ? response.data?.roomId : selectedRoomsData.roomId;
      if (roomId) {
        // const allImage = [...existingImages, ...uploadedFile]
        console.log("existingImages>>>>>", existingImages);
        console.log("uploadedFile>>>>>", uploadedFile);
        // console.log("allImage>>>>>", allImage);
        // console.log("roomId>>>>>", roomId);
        await uploadImages(uploadedFile, existingImages, roomId);
      }
      dispatch(updateTableState({ roomsCreated: true }));
      dispatch(showSnackbar({ type: "success", message: `Room ${flow === FLOW_TYPE.EDIT ? 'updated' : 'created'} successfully.` }));

      navigate("/manage-rooms");

    }
    else if (response === "Room already exists") {
      dispatch(showSnackbar({ type: "error", message: response ? response : "Room already exists. Try a different name." }));
    }
    else if (response === "Room name already exists") {
      dispatch(showSnackbar({ type: "error", message: response ? response : "Room already exists. Try a different name." }));
    }
    else {
      dispatch(showSnackbar({ type: "error", message: response.messge ? response.messge : "Failed to create/update room. Please try again." }));
    }
    setOnSumbitLoader(false);
  };

  const uploadImages = async (files, path, Id) => {
    try {
      const formData = new FormData();
      if (files.length > 0) {
        files.forEach((file) => formData.append("image", file, file.name));
      }
      if (path.length > 0) {
        formData.append("imagePath", JSON.stringify(path));
      }
      const response = await axiosPrService.post(`/room/upload/${Id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      //  console.log("resss", response);
    } catch (error) {
      console.log("err", error);
    }
  };
  console.log("ama", amenitiesId);

  const handleAmenitiesChange = async (e) => {
    let selectedValues = e.target.value; // This is now an array for multiple selection
    setAmenitiesId(selectedValues); // Ensure amenitiesId is an array

    if (selectedValues.includes(AMENITIES_ID)) {
      // Check if specific ID is selected
      setHasAmenities(true);
    } else {
      setHasAmenities(false);
      setValidation(true);
    }
  };

  const handleLocationChange = async (e) => {
    let locationId = e.target.value;
    //setType(locationId);
    setLocationValue(locationId);
    const filteredRooms = hotelSer.filter((room) => room.locationId === locationId);
    setHotelfilter(filteredRooms);




  };

  const handleRoomTypeChange = (e) => {
    const type = e.target.value;
    setRoomType(type);
    //  console.log("type::::::::::",type);
  };

  const handleHotelChange = async (e) => {
    let hotelId = e.target.value;
    setHotelValue(hotelId);
  };


  return (
    <div className="createRooms-page page">
      <Breadcrumb
        pageTitle={t("Create Rooms")}
        breadcrumbList={[
          {
            title: t("Home"),
            url: "/",
          },
          {
            title: t("Rooms"),
            url: "/manage-rooms",
          },
          {
            title:
              flow === FLOW_TYPE.EDIT ? t("Update Rooms") : t("Create Rooms"),
            url: "/create-rooms",
          },
        ]}
        hideBreadcrumb={true}
      />
      {pageLoader && (
        <Loader
          pageLoader={true}
          pageLoaderCustomStyles={{ margin: "-20px" }}
        />
      )}
      <form onSubmit={handleSubmit((data) => submitHandler(data))}>
        <div className="form-card card-wrapper-default">
          <div className="form-fields-block">
            <CustomSelectField
              id="locationId"
              label={t("Location")}
              control={control}
              variant="outlined"
              rules={{ required: t("Location is required") }}
              handleCustomInputChange={(e) => handleLocationChange(e)}
              placeholder={t("Select Location")}
              options={locSer}
              values={locationValue}
            />

            <CustomSelectField
              id="hotelId"
              label={t("Hotel")}
              control={control}
              variant="outlined"
              rules={{ required: t("Hotel Name is required") }}
              handleCustomInputChange={(e) => handleHotelChange(e)}
              placeholder={t("Select Hotel")}
              options={hotelfilter}
              values={hotelValue}
            />

            <InputField
              id="roomName"
              label={"Room Name"}
              control={control}
              variant="outlined"
              rules={{
                required: "Room Name is required",
                pattern: {
                  value: /^(?!\s)(?!.*\s$)[A-Za-z\s!@#$%^&*(),.?":{}|<>/-]+$/,
                  message: "Only alphabets and special characters allowed, no leading or trailing spaces",
                },
                validate: (value) => value.trim() !== "" || "Only spaces are not allowed",
                minLength: {
                  value: 1,
                  message: "Hotel Name must be at least 1 character long",
                },
                maxLength: {
                  value: 50,
                  message: "Hotel Name cannot exceed 50 characters",
                },
              }}
            />

            <CustomSelectField
              id="roomType"
              label={t("Room Type")}
              control={control}
              variant="outlined"
              rules={{ required: t("Hotel Name is required") }}
              handleCustomInputChange={(e) => handleRoomTypeChange(e)}
              placeholder={t("Select Hotel")}
              options={typeOfRooms.type}
              values={roomType}
            />

            <CustomMultipleSelect
              id="amenitiesId"
              label={t("Amenities")}
              control={control}
              variant="outlined"
              rules={{ required: t("Amenities is required") }}
              handleCustomInputChange={(e) => handleAmenitiesChange(e)}
              placeholder={t("Select Amenities")}
              multiple={true} // Enable multiple selection
              options={
                Array.isArray(lookup.amenities)
                  ? lookup.amenities.map((item) => ({
                    label: item.amenities,
                    value: item.amenitiesId,
                  }))
                  : []
              }
            />

            <NumericInputComponent
              id="noOfPersons"
              label={"No of Persons"}
              control={control}
              variant="outlined"
              rules={{
                validate: (value) => {
                  if (value === '') {
                    return 'No of Persons is required';
                  }
                  if (isNaN(value)) {
                    return 'Please enter a valid number';
                  }
                  if (parseFloat(value) <= 0) {
                    return 'Number must be greater than 0';
                  }
                  if (parseFloat(value) === 0) {
                    return 'No of Persons cannot be 0';
                  }
                  if (!/^\d{1,4}$/.test(value)) {
                    return 'No of Persons cannot be a decimal';
                  }
                  return true;
                },
              }}
            />

            <NumericInputComponent
              id="noOfChildrens"
              label={"No of Childrens"}
              control={control}
              variant="outlined"
              rules={{
                validate: (value) => {
                  if (value === '' || value === null || value === undefined) {
                    return true; // allow empty (will set default 0 later)
                  }
                  if (isNaN(value)) {
                    return 'Please enter a valid number';
                  }
                  if (parseFloat(value) < 0) {
                    return 'Number must be 0 or greater';
                  }
                  if (!/^\d{1,4}$/.test(value)) {
                    return 'No of Childrens must be a whole number';
                  }
                  return true;
                },
              }}
            />

            <NumericInputComponent
              id="basePrice"
              label={"Base Price"}
              control={control}
              variant="outlined"

              rules={{
                validate: (value) => {
                  if (value === '') {
                    return 'Base Price is required';
                  }
                  if (isNaN(value)) {
                    return 'Please enter a valid number';
                  }
                  if (parseFloat(value) <= 0) {
                    return 'Price must be greater than 0';
                  }
                  if (parseFloat(value) === 0) {
                    return 'Price must cannot be 0';
                  }
                  if (!/^\d{1,9}(\.\d{1,2})?$/.test(value)) {
                    return 'Number must be a maximum of 9 digits and up to 2 decimal places';
                  }

                  return true;
                },
              }}

            />

            <NumericInputComponent
              id="totolNoRooms"
              label={"Total No of Rooms"}
              control={control}
              variant="outlined"
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
                  // if (parseInt(value) !== parseFloat(value)) {
                  //   return 'Number must be a whole number (no decimals)';
                  // }
                  if (!/^\d{1,4}$/.test(value)) {
                    return 'The number of rooms cannot be a decimal.';
                  }

                  // if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(value)) {
                  //   return 'Number must have up to 2 decimal places';
                  // }
                  return true; // Validation passed
                },
              }}
            />

            <NumericInputComponent
              id="noOfBathrooms"
              label={"No of Bathrooms"}
              control={control}
              variant="outlined"
              rules={{
                validate: (value) => {
                  if (value === '') {
                    return ' No of Bathrooms is required';
                  }
                  if (isNaN(value)) {
                    return 'Please enter a valid number';
                  }
                  if (parseFloat(value) <= 0) {
                    return 'No of Bathrooms must be greater than 0';
                  }
                  if (parseFloat(value) === 0) {
                    return 'No of Bathrooms must not be 0';
                  }
                  // if (parseInt(value) !== parseFloat(value)) {
                  //   return 'Number must be a whole number (no decimals)';
                  // }
                  if (!/^\d{1,4}$/.test(value)) {
                    return 'The number of bathrooms cannot be a decimal.';
                  }

                  // if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(value)) {
                  //   return 'Number must have up to 2 decimal places';
                  // }
                  return true; // Validation passed
                },
              }}
            />

            <div className="form-field" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Controller
                name="allowExtraPerson"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={t("Allow Extra Person")}
                  />
                )}
              />
            </div>

            <NumericInputComponent
              id="maxExtraPersons"
              label={"Max Extra Persons"}
              control={control}
              variant="outlined"
              disabled={!allowExtraPerson}
              rules={{
                validate: (value) => {
                  if (value === '' || value === null || value === undefined) {
                    return true;
                  }
                  if (isNaN(value)) {
                    return 'Please enter a valid number';
                  }
                  if (parseFloat(value) < 0) {
                    return 'Number must be 0 or greater';
                  }
                  if (!/^\d{1,4}$/.test(value)) {
                    return 'Max Extra Persons must be a whole number';
                  }
                  return true;
                },
              }}
            />

            <NumericInputComponent
              id="extraPersonCharge"
              label={"Extra Person Charge"}
              control={control}
              variant="outlined"
              disabled={!allowExtraPerson}
              rules={{
                validate: (value) => {
                  if (value === '' || value === null || value === undefined) {
                    return true;
                  }
                  if (isNaN(value)) {
                    return 'Please enter a valid number';
                  }
                  if (parseFloat(value) < 0) {
                    return 'Charge must be 0 or greater';
                  }
                  if (!/^\d{1,9}(\.\d{1,2})?$/.test(value)) {
                    return 'Number must be a maximum of 9 digits and up to 2 decimal places';
                  }
                  return true;
                },
              }}
            />

            <InputField
              id="roomSize"
              label={"Room Size"}
              control={control}
              variant="outlined"
              rules={{
                required: "Room Size is required",
                validate: (value) => {
                  if (parseFloat(value) <= 0) {
                    return 'Room Size must be greater than 0';
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="card-wrapper-default" style={{ marginTop: "20px" }}>
          <div className="title-header">{t("Room Images")}</div>
          <Grid item xs={12} md={12}>
            {(flow === FLOW_TYPE.EDIT && selectedRoomsData) ? (
              <>
                <Grid sx={{ border: 2, borderColor: "#D3D3D3", display: "flex", overflow: "scroll", paddingTop: "20px", marginBottom: '20px' }}>
                  <Grid container sx={{ display: 'flex', flexWrap: 'wrap' }}>
                    {existingImages.map((img, index) => (
                      <Grid key={index}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <CardMedia component="img" sx={{ width: 100, height: 100, margin: '10px' }} image={`${AWS_URL}${img}`} onError={e => e.target.src = noimage} />
                          <Button sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            minWidth: '30px',
                            height: '30px',
                            background: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            borderRadius: '50%',
                            fontSize: '12px',
                            padding: '5px',
                            '&:hover': { background: 'rgba(0,0,0,0.8)' }
                          }}
                            onClick={() => removeExistingImage(index)}>✖</Button>
                        </div>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
                <DropzoneUploader
                  styles={{ dropzone: { minHeight: 100, maxHeight: 100 } }}
                  key={uploaderKey}
                  onChangeStatus={handleFileChange}
                  inputContent="Drop/Browse a Rooms Image (JPG/JPEG/PNG only)"
                  accept="image/jpeg, image/png, image/jpg"
                  inputWithFilesContent="Add Image"
                  maxFiles={5}
                  maxSizeBytes={2 * 1024 * 1024}
                />
              </>
            ) : (
              <DropzoneUploader
                styles={{ dropzone: { minHeight: 100, maxHeight: 100 } }}
                key={uploaderKey}
                onChangeStatus={handleFileChange}
                inputContent="Drop/Browse a Rooms Image (JPG/JPEG/PNG only)"
                accept="image/jpeg, image/png, image/jpg"
                inputWithFilesContent="Add Image"
                maxFiles={5}
                maxSizeBytes={2 * 1024 * 1024}
              />
            )}
          </Grid>

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
        </div>
      </form>
    </div>
  );
}

export default CreateRooms;
