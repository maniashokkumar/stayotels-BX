import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Breadcrumb, Loader } from "../../../components/index";
import {
  InputField,
  CustomMultipleSelect,
  CustomSelectField,
  MultiLineInput,
  NumberComponent,
  NumericInputComponent,
  RadioButton,
} from "../../../components/ReactHookForm/index";
import { Grid, Button, CardMedia } from "@mui/material";
import noimage from "../../../assets/images/no_image.jpg";
import { showSnackbar, fetchLookupList } from "../../../redux/reducer/appSlice";
import { updateTableState } from "../../Hotel/ManageHotel/manageHotelTableSlice";
import { createHotel, updateHotel, loccationList } from "./CreateHotelApi";
import { axiosPrService } from "../../../axios/axiosInstance";

import {
  FLOW_TYPE,
  AMENITIES_ID,
  LOCATION_ID,
  typeOfRooms,
  AWS_URL,
} from "../../../Utils/constants";
import "./CreateHotel.scss";

import DropzoneUploader from "react-dropzone-uploader";
import "react-dropzone-uploader/dist/styles.css";

function CreateHotel() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const lookup = useSelector((state) => state.appReducer.lookup);
  const flow = useSelector((state) => state.manageHotelTableReducer.flow);
  const selectedAmenitiesData = useSelector(
    (state) => state.manageAmenitiesTableReducer.selectedAmenitiesData
  );
  const selectedLocationData = useSelector(
    (state) => state.manageLocationTableReducer.selectedLocationData
  );
  const selectedHotelData = useSelector(
    (state) => state.manageHotelTableReducer.selectedHotelData
  );
  const showSessionPopup = useSelector(
    (state) => state.loginReducer.showSessionPopup
  );

  console.log("lookup", lookup.location);

  const createHotelForm = {
    hotelName: [],
    amenitiesId: [],
    locationId: "",
    policies: "",
    accessibility: "",
    email: "",
    description: "",
    address: "",
    state: "",
    country: "",
    pincode: "",
    hotelLocation: "",
    hotelType: [],
    isTopHotels: false,
    reviews: "",
  };

  const { handleSubmit, control, reset, setValue } = useForm({
    defaultValues: createHotelForm,
  });
  const [pageLoader, setPageLoader] = useState(false);
  const [onSumbitLoader, setOnSumbitLoader] = useState(false);
  const [hasAmenities, setHasAmenities] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [validation, setValidation] = useState(true);
  const [amenitiesId, setAmenitiesId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [isTopHotels, setIsTopHotels] = useState(false);
  const [type, setType] = useState("");
  const [locSer, setLocSer] = useState([]);
  const [inputContent, setInputContent] = useState(
    "Drop/Browse a Hotels Images"
  );
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState([]);
  const [propertyType, setPropertyType] = useState([]);
  const [uploaderKey, setUploaderKey] = useState(Date.now());
  const [existingImages, setExistingImages] = useState([]);

  const onPageLoad = async () => {
    // fetchLookupOptions();
    //if (!lookup.role) {
    await dispatch(fetchLookupList("location"));
    await dispatch(fetchLookupList("amenities"));
    loc();
    //}
  };

  // const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  // const ALLOWED_FILE_TYPES = ["image/jpg","image/jpeg", "image/png"];
  // const MAX_FILES = 5;

  // // const handleFileChange = ({ file, meta, status, remove }) => {
  // //   console.log("File meta:", meta.status);
  // //   setUploading(true);
  // //   if (meta.status === "preparing") {
  // //   } else if (meta.status === "done") {
  // //     // setUploadedFile(file);
  // //     setUploadedFile((prevFiles) => [...prevFiles, file]);
  // //   } else if (meta.status === "removed") {
  // //     // setUploadedFile((prevFiles) =>
  // //     //   prevFiles.filter((f) => f.file !== file));
  // //     setUploadedFile((prevFiles) => prevFiles.filter((f) => f !== file));
  // //   } else if (meta.status === "rejected_file_type") {
  // //   }
  // //   setUploading(false);
  // // };

  // const handleFileChange = ({ file, meta, status, remove }) => {
  //   console.log("File meta:", meta.status);
  //   setUploading(true);

  //   if (meta.status === "preparing") {
  //     // Validation checks before adding
  //     if (!ALLOWED_FILE_TYPES.includes(file.type)) {
  //       dispatch(
  //         showSnackbar({
  //           type: "error",
  //           message: "Invalid file type. Only JPEG and PNG are allowed.",
  //         })
  //       );
  //       remove(); // Remove invalid file
  //       setUploading(false);
  //       return;
  //     }

  //     if (file.size > MAX_FILE_SIZE) {
  //       dispatch(
  //         showSnackbar({
  //           type: "error",
  //           message: "File size exceeds the 5MB limit.",
  //         })
  //       );
  //       remove();
  //       setUploading(false);
  //       return;
  //     }

  //     if (uploadedFile.length >= MAX_FILES) {
  //       dispatch(
  //         showSnackbar({
  //           type: "error",
  //           message: `You can upload a maximum of ${MAX_FILES} images.`,
  //         })
  //       );
  //       remove();
  //       setUploading(false);
  //       return;
  //     }

  //     // Prevent duplicate files (check name or content)
  //     if (uploadedFile.some((f) => f.name === file.name)) {
  //       dispatch(
  //         showSnackbar({
  //           type: "error",
  //           message: "This file has already been uploaded.",
  //         })
  //       );
  //       remove();
  //       setUploading(false);
  //       return;
  //     }
  //   }

  //   else if (meta.status === "done") {
  //     setUploadedFile((prevFiles) => [...prevFiles, file]);
  //   }

  //   else if (meta.status === "removed") {
  //     setUploadedFile((prevFiles) => prevFiles.filter((f) => f !== file));
  //   }

  //   setUploading(false);
  // };

  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

  const handleFileChange = ({ file, meta, status, remove }) => {
    console.log("File meta:", meta.status);
    setUploading(true);

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      dispatch(
        showSnackbar({
          type: "error",
          message:
            "Invalid file type. Only JPG, JPEG, and PNG files are allowed.",
        })
      );
      setUploading(false);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      dispatch(
        showSnackbar({
          type: "error",
          message:
            "File size exceeds the 5MB limit. Please upload a smaller file.",
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
    setExistingImages((prevImages) => prevImages.filter((_, i) => i !== index));
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

  useEffect(() => {
    // didMount
    async function fetchInit() {
      dispatch(updateTableState({ hotelCreated: false }));
      onPageLoad();
    }
    fetchInit();
  }, [showSessionPopup]);

  useEffect(() => {
    if (flow === FLOW_TYPE.EDIT && selectedHotelData) {
      console.log("selectedHotelData", selectedHotelData);
      setPageLoader(true);
      console.log("roooo", lookup.location);
      setType(selectedHotelData.locationId);

      const createHotelForm = {
        hotelName: selectedHotelData.hotelName,
        amenitiesId: selectedHotelData.amenitiesId,
        locationId: selectedHotelData.locationId,
        policies: selectedHotelData.policies,
        accessibility: selectedHotelData.accessibility,
        description: selectedHotelData.description,
        email: selectedHotelData.email,
        address: selectedHotelData.address,
        state: selectedHotelData.state,
        country: selectedHotelData.country,
        pincode: selectedHotelData.pincode,
        hotelLocation: selectedHotelData.hotelLocation,
        hotelType: selectedHotelData.hotelType,
        isTopHotels: selectedHotelData.isTopHotels,
        reviews: selectedHotelData.reviews,
      };
      reset(createHotelForm);
      if (selectedHotelData.hotelImages) {
        setExistingImages(selectedHotelData.hotelImages.map((img) => img));
      }
      setPageLoader(false);
    }
  }, [selectedHotelData, lookup, showSessionPopup]);

  // const submitHandler = async (formData) => {
  //   setOnSumbitLoader(true);

  //   if (uploadedFile.length === 0 && existingImages.length === 0) {
  //     dispatch(
  //       showSnackbar({
  //         type: "error",
  //         message: "Please upload at least one image.",
  //       })
  //     );
  //     setOnSumbitLoader(false);
  //     return;
  //   }

  //   if (formData.reviews) {
  //     formData.reviews = parseFloat(formData.reviews);
  //   }

  //   let response = null;
  //   let hotelId = null;

  //   console.log("Formdate", formData);
  //   if (flow === FLOW_TYPE.EDIT) {
  //     console.log("selectedHotelData.hotelId", selectedHotelData.hotelId);
  //     response = await updateHotel({
  //       data: formData,
  //       id: selectedHotelData.hotelId,
  //       dispatch,
  //     });
  //   } else {
  //     formData.amenitiesId = amenitiesId;
  //     formData.locationId = type;
  //     // formData.isTopHotels = isTopHotels ? true :false ;
  //     response = await createHotel({ data: formData, dispatch });
  //   }

  //   console.log("response:::::::::", response);
  //   setOnSumbitLoader(false);

  //   if (response.message === "success" || response === "Success") {
  //     hotelId = response.data?.hotelId
  //       ? response.data?.hotelId
  //       : selectedHotelData.hotelId;

  //     if (hotelId) {
  //       await uploadImages(uploadedFile, existingImages, hotelId);
  //     }

  //     dispatch(updateTableState({ hotelCreated: true }));
  //     dispatch(
  //       showSnackbar({
  //         type: "success",
  //         message: `Hotel ${
  //           flow === FLOW_TYPE.EDIT ? "updated" : "created"
  //         } successfully.`,
  //       })
  //     );

  //     navigate("/manage-hotel");
  //   } else if (response === "Hotel already exists") {
  //     dispatch(
  //       showSnackbar({
  //         type: "error",
  //         message:
  //           "Hotel already exists at this location. Please enter a different name or location.",
  //       })
  //     );
  //   } else if (response === "Hotel name already exists") {
  //     dispatch(
  //       showSnackbar({
  //         type: "error",
  //         message:
  //           "Hotel already exists at this location. Please enter a different name or location.",
  //       })
  //     );
  //   } else {
  //     dispatch(
  //       showSnackbar({
  //         type: "error",
  //         message: response.messge
  //           ? response.messge
  //           : "Failed to create/update hotel. Please try again.",
  //       })
  //     );
  //   }
  // };

  const submitHandler = async (formData) => {
    setOnSumbitLoader(true);

    // Ensure at least one image exists
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

    // Validate uploaded files before submission
    const invalidFiles = uploadedFile.filter(
      (file) =>
        !ALLOWED_FILE_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE
    );

    if (invalidFiles.length > 0) {
      dispatch(
        showSnackbar({
          type: "error",
          message:
            "One or more files are invalid. Please check the file type and size (Max: 5MB).",
        })
      );
      setOnSumbitLoader(false);
      return;
    }

    if (formData.reviews) {
      formData.reviews = parseFloat(formData.reviews);
    }

    let response = null;
    let hotelId = null;

    console.log("FormData:", formData);

    if (flow === FLOW_TYPE.EDIT) {
      response = await updateHotel({
        data: formData,
        id: selectedHotelData.hotelId,
        dispatch,
      });
    } else {
      formData.amenitiesId = amenitiesId;
      formData.locationId = type;
      response = await createHotel({ data: formData, dispatch });
    }

    setOnSumbitLoader(false);

    if (response.message === "success" || response === "Success") {
      hotelId = response.data?.hotelId ?? selectedHotelData.hotelId;

      if (hotelId) {
        await uploadImages(uploadedFile, existingImages, hotelId);
      }

      dispatch(updateTableState({ hotelCreated: true }));
      dispatch(
        showSnackbar({
          type: "success",
          message: `Hotel ${
            flow === FLOW_TYPE.EDIT ? "updated" : "created"
          } successfully.`,
        })
      );
      navigate("/manage-hotel");
    } else {
      dispatch(
        showSnackbar({
          type: "error",
          message: response.message
            ? response.message
            : "Failed to create/update hotel. Please try again.",
        })
      );
    }
  };

  const uploadImages = async (files, path, Id) => {
    console.log("files", files);
    try {
      const formData = new FormData();
      if (files.length > 0) {
        files.forEach((file) => formData.append("image", file, file.name));
      }
      if (path.length > 0) {
        formData.append("imagePath", JSON.stringify(path));
      }
      const response = await axiosPrService.post(
        `/hotel/upload/${Id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("resss", response);
    } catch (error) {
      console.log("err", error);
    }
  };

  const handlePropertyTypeChange = (e) => {
    const selectedValues = e.target.value;
    setPropertyType(selectedValues);
    console.log("Selected Property Types:", selectedValues);
  };

  console.log("ama", amenitiesId);

  const handleAmenitiesChange = async (e) => {
    const selectedValues = e.target.value;
    setAmenitiesId(selectedValues);

    if (selectedValues.includes(AMENITIES_ID)) {
      setHasAmenities(true);
    } else {
      setHasAmenities(false);
      setValidation(true);
    }
  };

  const handleLocationChange = async (e) => {
    let locationId = e.target.value;
    setType(locationId);
  };

  const options = [
    { label: "Yes", value: true },
    { label: "No", value: false },
  ];
  const handleRadioChange = (e) => {
    setIsTopHotels(e.target.value === "true"); // Converts to boolean
  };

  return (
    <div className="createHotel-page page">
      <Breadcrumb
        pageTitle={t("Create Hotel")}
        breadcrumbList={[
          {
            title: t("Home"),
            url: "/",
          },
          {
            title: t("Hotel"),
            url: "/manage-hotel",
          },
          {
            title:
              flow === FLOW_TYPE.EDIT ? t("Update Hotel") : t("Create Hotel"),
            url: "/create-hotel",
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
            <InputField
              id="hotelName"
              label={"Hotel Name"}
              control={control}
              variant="outlined"
              rules={{
                required: "Hotel Name is required",
                // pattern: {
                //   value: /^(?!\s)(?!.*\s$)[A-Za-z\s!@#$%^&*(),.?":{}|<>/-]+$/,
                //   message:
                //     "Only alphabets and special characters allowed, no leading or trailing spaces",
                // },
                validate: (value) =>
                  value.trim() !== "" || "Only spaces are not allowed",
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
            <CustomSelectField
              id="locationId"
              label={t("Location")}
              control={control}
              variant="outlined"
              rules={{ required: t("Location is required") }}
              handleCustomInputChange={(e) => handleLocationChange(e)}
              placeholder={t("Select Location")}
              options={locSer}
              values={type}
            />

            <CustomMultipleSelect
              id="hotelType"
              label={t("Property Type")}
              control={control}
              variant="outlined"
              rules={{ required: t("Property Type is required") }}
              handleCustomInputChange={(e) => handlePropertyTypeChange(e)}
              placeholder={t("Select Property Type")}
              multiple={true} // Enable multiple selection
              options={typeOfRooms.type}
            />

            <InputField
              id="email"
              label={t("Email")}
              control={control}
              variant="outlined"
              rules={{
                required: t("Email is required"),
                pattern: {
                  value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                  message: t("Please enter a valid email address"),
                },
              }}
            />

            <InputField
              id="address"
              label={"Address"}
              control={control}
              variant="outlined"
              // rules={{ required: "Address is required" }}
              rules={{
                required: "Address is required",
                minLength: {
                  value: 1,
                  message: "Address must be at least 1 character long",
                },
                maxLength: {
                  value: 150,
                  message: "Address cannot exceed 150 characters",
                },
              }}
            />

            <InputField
              id="state"
              label={"State"}
              control={control}
              variant="outlined"
              // rules={{ required: "State is required" }}
              rules={{
                required: "State is required",
                pattern: {
                  value: /^(?!\s)[A-Za-z\s]+(?<!\s)$/,
                  message:
                    "Only alphabets allowed, no leading or trailing spaces",
                },
                validate: (value) =>
                  value.trim() !== "" || "Only spaces are not allowed",
                minLength: {
                  value: 1,
                  message: "State must be at least 1 character long",
                },
                maxLength: {
                  value: 25,
                  message: "State cannot exceed 25 characters",
                },
              }}
            />

            <InputField
              id="country"
              label={"Country"}
              control={control}
              variant="outlined"
              rules={{
                required: "Country is required",
                pattern: {
                  value: /^(?!\s)[A-Za-z\s]+(?<!\s)$/,
                  message:
                    "Only alphabets allowed, no leading or trailing spaces",
                },
                validate: (value) =>
                  value.trim() !== "" || "Only spaces are not allowed",
                minLength: {
                  value: 1,
                  message: "Country must be at least 1 character long",
                },
                maxLength: {
                  value: 25,
                  message: "Country cannot exceed 25 characters",
                },
              }}
            />

            <NumericInputComponent
              id="pincode"
              label={"Pincode"}
              control={control}
              variant="outlined"
              rules={{
                required: t("Pincode is required"),
                pattern: {
                  value: /^[1-9][0-9]{5}$/,
                  message: t("Please enter a valid Pincode"),
                },
              }}
            />

            <InputField
              id="hotelLocation"
              label="Google Map Link"
              control={control}
              variant="outlined"
              rules={{
                required: "Google Map link is required",
                pattern: {
                  value: /^https:\/\/www\.google\.com\/maps\/embed\?.+$/,
                  message: "Invalid Google Map embed link format",
                },
              }}
            />

            <MultiLineInput
              id="description"
              label={"Overview"}
              control={control}
              variant="outlined"
              multiline={true}
              rows={3}
              rules={{ required: "Overview is required" }}
            />

            <MultiLineInput
              id="policies"
              label={"Policies"}
              control={control}
              variant="outlined"
              multiline={true}
              rows={3}
              rules={{ required: "Policies is required" }}
            />

            <MultiLineInput
              id="accessibility"
              label={"Accessibility"}
              control={control}
              variant="outlined"
              multiline={true}
              rows={3}
              rules={{ required: "Accessibility is required" }}
            />

            {/* <NumericInputComponent
              id="reviews"
              label={"Rating"}
              control={control}
              variant="outlined"
              rules={{
                required: t("Rating is required"),
                min: { value: 0, message: t("Rating must be at least 0") },
                max: { value: 5, message: t("Rating cannot be more than 5") },
                pattern: {
                  value: /^[0-5](\.\d+)?$/,
                  message: t("Please enter a valid rating between 0 and 5"),
                },
              }}
            /> */}
            <NumericInputComponent
              id="reviews"
              label={"Rating"}
              control={control}
              variant="outlined"
              rules={{
                required: t("Rating is required"),
                min: { value: 0, message: t("Rating must be at least 0") },
                max: { value: 5, message: t("Rating cannot be more than 5") },
                pattern: {
                  value: /^(?:[0-4](\.\d{1})?|5(?:\.0)?)$/,
                  message: t(
                    "Please enter a valid rating between 0 and 5 with at most one decimal place"
                  ),
                },
              }}
            />
          </div>
          <label>Is Top Destination</label>
          <div className="flex items-center gap-4">
            <RadioButton
              id="isTopHotels"
              control={control}
              options={options}
              handleChanger={handleRadioChange}
              row
            />
          </div>
        </div>

        <div className="card-wrapper-default" style={{ marginTop: "20px" }}>
          <div className="title-header">{t("Hotel Images")}</div>
          <Grid item xs={12} md={12}>
            {flow === FLOW_TYPE.EDIT && selectedHotelData ? (
              <>
                <Grid
                  sx={{
                    border: 2,
                    borderColor: "#D3D3D3",
                    display: "flex",
                    overflow: "scroll",
                    paddingTop: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <Grid container sx={{ display: "flex", flexWrap: "wrap" }}>
                    {existingImages.map((img, index) => (
                      <Grid key={index}>
                        <div
                          style={{
                            position: "relative",
                            display: "inline-block",
                          }}
                        >
                          <CardMedia
                            component="img"
                            sx={{ width: 100, height: 100, margin: "10px" }}
                            image={`${AWS_URL}${img}`}
                            onError={(e) => (e.target.src = noimage)}
                          />
                          <Button
                            sx={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              minWidth: "30px",
                              height: "30px",
                              background: "rgba(0,0,0,0.5)",
                              color: "white",
                              borderRadius: "50%",
                              fontSize: "12px",
                              padding: "5px",
                              "&:hover": { background: "rgba(0,0,0,0.8)" },
                            }}
                            onClick={() => removeExistingImage(index)}
                          >
                            ✖
                          </Button>
                        </div>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
                <DropzoneUploader
                  styles={{ dropzone: { minHeight: 100, maxHeight: 100 } }}
                  key={uploaderKey}
                  onChangeStatus={handleFileChange}
                  inputContent="Drop/Browse a Hotel Image (JPG/JPEG/PNG only)"
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
                inputContent="Drop/Browse a Hotel Image (JPG/JPEG/PNG only)"
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

export default CreateHotel;
