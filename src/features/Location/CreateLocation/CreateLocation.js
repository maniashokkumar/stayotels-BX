import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Breadcrumb, Loader } from "../../../components/index";
import { InputField } from "../../../components/ReactHookForm/index";
import { Grid, Button, CardMedia } from "@mui/material";
import { axiosPrService } from "../../../axios/axiosInstance";
import { fetchLookupList, showSnackbar } from "../../../redux/reducer/appSlice";
import { updateTableState } from "../../Location/ManageLocation/manageLocationTableSlice";
import { createLocation, updateLocation } from "./CreateLocationApi";
import { FLOW_TYPE, AWS_URL } from "../../../Utils/constants";
import noimage from "../../../assets/images/no_image.jpg";
import "./CreateLocation.scss";
import DropzoneUploader from "react-dropzone-uploader";
import "react-dropzone-uploader/dist/styles.css";
import { Padding } from "@mui/icons-material";

function CreateLocation() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const lookup = useSelector((state) => state.appReducer.lookup);
  const flow = useSelector((state) => state.manageLocationTableReducer.flow);
  const selectedLocationData = useSelector(
    (state) => state.manageLocationTableReducer.selectedLocationData
  );
  const showSessionPopup = useSelector(
    (state) => state.loginReducer.showSessionPopup
  );

  const createLocationForm = {
    locationName: "",
    city: "",
    state: "",
    country: "",
  };

  const { handleSubmit, control, reset, setValue } = useForm({
    defaultValues: createLocationForm,
  });
  const [pageLoader, setPageLoader] = useState(false);
  const [onSumbitLoader, setOnSumbitLoader] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploaderKey, setUploaderKey] = useState(Date.now());
  const [inputContent, setInputContent] = useState(
    "Drop/Browse a Location Image"
  );

  
  const handleFileChange = ({ file, meta, status, remove }) => {
    console.log("File meta:", meta.status);
    setUploading(true);
  
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    const maxSize = 2 * 1024 * 1024; 
    console.log("File",file)
    if (meta.status === "preparing") {
    } else if (meta.status === "done") {
      if (!allowedTypes.includes(file.type)) {
        dispatch(showSnackbar({
          type: "error",
          message: "Invalid file type! Only JPG, JPEG, and PNG are allowed."
        }));
        remove();
        return;
      }
      
      if (file.size > maxSize) {
        dispatch(showSnackbar({
          type: "error",
          message: "File size exceeds 2MB limit."
        }));
        remove();
        return;
      }
  
      setUploadedFile(file);
    } else if (meta.status === "removed") {
      setUploadedFile(null);
      setUploaderKey(Date.now());
    }else{
      dispatch(showSnackbar({
        type: "error",
        message: "Invalid file type! Only JPG, JPEG, and PNG are allowed."
      }))
    }
  
    setUploading(false);
  };
  
  const onPageLoad = async () => {
    // fetchLookupOptions();
    //if (!lookup.role) {
    await dispatch(fetchLookupList("role"));
    //}
  };

  useEffect(() => {
    // didMount
    async function fetchInit() {
      dispatch(updateTableState({ locationCreated: false }));
      onPageLoad();
    }
    fetchInit();
  }, [showSessionPopup]);

  useEffect(() => {
    if (flow === FLOW_TYPE.EDIT && selectedLocationData) {
      console.log("selectedLocationData", selectedLocationData);
      setPageLoader(true);

      const createLocationForm = {
        latitude: selectedLocationData.latitude,
        longitude: selectedLocationData.longitude,
        locationName: selectedLocationData.locationName,
        city: selectedLocationData.city,
        state: selectedLocationData.state,
        country: selectedLocationData.country,
      };
      reset(createLocationForm);
      if (selectedLocationData.image) {
        const imageUrl = selectedLocationData.image
          ? `${AWS_URL}${selectedLocationData.image}` 
          : null;
        setUploadedFile(imageUrl);
      }
      setPageLoader(false);
    }
  }, [selectedLocationData, lookup, showSessionPopup]);


  const submitHandler = async (formData) => {
    if (!uploadedFile) {
      dispatch(showSnackbar({
        type: "error",
        message: "Location image is required."
      }));
      return;
    }
  
    if (uploadedFile instanceof File) {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      const maxSize = 2 * 1024 * 1024; 
  
      if (!allowedTypes.includes(uploadedFile.type)) {
        dispatch(showSnackbar({
          type: "error",
          message: "Invalid file type! Only JPG, JPEG, and PNG are allowed."
        }));
        return;
      }
  
      if (uploadedFile.size > maxSize) {
        dispatch(showSnackbar({
          type: "error",
          message: "File size exceeds 2MB limit."
        }));
        return;
      }
    }
  
    setOnSumbitLoader(true);
    let response = null;
    let locationId = null;
  
    if (flow === FLOW_TYPE.EDIT) {
      locationId = selectedLocationData.locationId;
      response = await updateLocation({ data: formData, locationId, dispatch });
    } else {
      response = await createLocation({ data: formData, dispatch });
    }
  
    setOnSumbitLoader(false);
  
    if (response.message === "success" || response === "Success") {
      locationId = response.data?.locationId ? response.data?.locationId : selectedLocationData.locationId;
      if (locationId) {
        await uploadImage(uploadedFile, locationId);
      }
      dispatch(updateTableState({ locationCreated: true }));
      dispatch(showSnackbar({
        type: "success",
        message: `Location ${flow === FLOW_TYPE.EDIT ? "updated" : "created"} successfully.`,
      }));
      navigate("/manage-location");
    } else {
      dispatch(showSnackbar({
        type: "error",
        message: response.message ? response.message : "Failed to create/update location. Please try again.",
      }));
    }
  };
  
  
  const uploadImage = async (files, Id) => {
    // console.log("uploadImage",files)
    // console.log("Id",Id)
    try {
      const formData = new FormData();
      if (files !== null) {
        formData.append("image", files, files.name);
      } else {
        formData.append("image", null);
      }

      const response = await axiosPrService.post(
        `/location/upload/${Id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // console.log("GGGGGGG",response)
    } catch (error) {
      console.log("error", error);
    }
  };

  console.log("uploadfile", uploadedFile);
  return (
    <div className="createLocation-page page">
      <Breadcrumb
        pageTitle={t("Create Location")}
        breadcrumbList={[
          {
            title: t("Home"),
            url: "/",
          },
          {
            title: t("Location"),
            url: "/manage-location",
          },
          {
            title:
              flow === FLOW_TYPE.EDIT
                ? t("Update Location")
                : t("Create Location"),
            url: "/create-location",
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
              id="locationName"
              label={"Location Name"}
              control={control}
              variant="outlined"
              //rules={{ required: "Location Name is required" }}
              rules={{
                required: "Location Name is required",
                // pattern: {
                //   value: /^(?!\s)[A-Za-z\s]+(?<!\s)$/,
                //   message:
                //     "Only alphabets allowed, no leading or trailing spaces",
                // },
                validate: (value) =>
                  value.trim() !== "" || "Only spaces are not allowed",
                minLength: {
                  value: 1,
                  message: "Location Name must be at least 1 character long",
                },
                maxLength: {
                  value: 25,
                  message: "Location Name cannot exceed 25 characters",
                },
              }}
            />

            <InputField
              id="city"
              label={"City"}
              control={control}
              variant="outlined"
              // rules={{ required: "City is required" }}
              rules={{
                required: "City is required",
                pattern: {
                  value: /^(?!\s)[A-Za-z\s]+(?<!\s)$/,
                  message:
                    "Only alphabets allowed, no leading or trailing spaces",
                },
                validate: (value) =>
                  value.trim() !== "" || "Only spaces are not allowed",
                minLength: {
                  value: 1,
                  message: "City must be at least 1 character long",
                },
                maxLength: {
                  value: 25,
                  message: "City cannot exceed 25 characters",
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
              // rules={{ required: "Country is required" }}
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
          </div>
        </div>

        <div className="card-wrapper-default" style={{ marginTop: "20px" }}>
          <div className="title-header">{t("Location Image")}</div>
          <Grid item xs={12} md={12}>
            {flow === FLOW_TYPE.EDIT && selectedLocationData ? (
              <div style={{ display: "flex", width: "100%" }}>
                <CardMedia
                  component="img"
                  sx={{ width: 100, height: 100, margin: "10px" }}
                  image={AWS_URL + selectedLocationData.image}
                  onError={(e) => {
                    e.target.src = noimage;
                  }}
                />
                <DropzoneUploader
                  styles={{
                    dropzone: {
                      minHeight: 100,
                      maxHeight: 100,
                      margin: "10px",
                    },
                  }}
                  key={uploaderKey}
                  onChangeStatus={handleFileChange}
                  inputContent="Drop/Browse a Location Image (JPG/JPEG/PNG only)"
                  accept="image/jpeg, image/png, image/jpg"
                  inputWithFilesContent="Change Image"
                  maxFiles={1}
                  maxSizeBytes={2 * 1024 * 1024}
                />
              </div>
            ) : (
              <DropzoneUploader
                styles={{ dropzone: { minHeight: 100, maxHeight: 100 } }}
                key={uploaderKey}
                onChangeStatus={handleFileChange}
                inputContent="Drop/Browse a Location Image (JPG/JPEG/PNG only)"
                accept="image/jpeg, image/png, image/jpg"
                inputWithFilesContent="Change Image"
                maxFiles={1}
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

export default CreateLocation;
