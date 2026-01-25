import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Breadcrumb, Loader } from "../../../components/index";
import { InputField } from "../../../components/ReactHookForm/index";
import { Button, FormHelperText, Link } from "@mui/material";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { fetchLookupList, showSnackbar } from "../../../redux/reducer/appSlice";
import { updateTableState } from "../../Amenities/ManageAmenities/manageAmenitiesTableSlice";
import { createAmenities, updateAmenities } from "./CreateAmenitiesApi";
import { FLOW_TYPE } from "../../../Utils/constants";
import "./CreateAmenities.scss";

function CreateAmenities() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const lookup = useSelector((state) => state.appReducer.lookup);
  const flow = useSelector((state) => state.manageAmenitiesTableReducer.flow);
  const selectedAmenitiesData = useSelector(
    (state) => state.manageAmenitiesTableReducer.selectedAmenitiesData
  );
  const showSessionPopup = useSelector(
    (state) => state.loginReducer.showSessionPopup
  );
  const [inputValue, setInputValue] = useState("");
  const [iconClass, setIconClass] = useState("");

  const createAmenitiesForm = {
    amenities: "",
    description: "",
    classPath: "",
  };

  const { handleSubmit, control, reset, setValue } = useForm({
    defaultValues: createAmenitiesForm,
  });
  const [pageLoader, setPageLoader] = useState(false);
  const [onSumbitLoader, setOnSumbitLoader] = useState(false);

  const onPageLoad = async () => {
    // fetchLookupOptions();
    //if (!lookup.role) {
    await dispatch(fetchLookupList("role"));
    //}
  };

  // Handle input change
  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  // Update icon class when button is clicked
  const handlePreviewClick = () => {
    setIconClass(inputValue); // Set the icon class for preview
  };

  useEffect(() => {
    // didMount
    async function fetchInit() {
      dispatch(updateTableState({ amenitiesCreated: false }));
      onPageLoad();
    }
    fetchInit();
  }, [showSessionPopup]);

  useEffect(() => {
    if (flow === FLOW_TYPE.EDIT && selectedAmenitiesData) {
      setPageLoader(true);

      const createAmenitiesForm = {
        amenities: selectedAmenitiesData.amenities,
        description: selectedAmenitiesData.description,
        classPath: selectedAmenitiesData.classPath,
      };
      reset(createAmenitiesForm);
      setPageLoader(false);
    }
  }, [selectedAmenitiesData, lookup, showSessionPopup]);

  const submitHandler = async (formData) => {
    setOnSumbitLoader(true);
    let response = null;
    if (flow === FLOW_TYPE.EDIT) {
      let amenitiesId = selectedAmenitiesData.amenitiesId;
      response = await updateAmenities({
        data: formData,
        amenitiesId,
        dispatch,
      });
    } else {
      response = await createAmenities({ data: formData, dispatch });
    }
    if (response === "Amenity already exists") {
      dispatch(showSnackbar({ type: "error", message: "Amenity already exists." }));
    }
    else {
      dispatch(updateTableState({ amenitiesCreated: true }));
      dispatch(showSnackbar({ type: "success", message: `Amenities ${flow === FLOW_TYPE.EDIT ? 'updated' : 'created'} successfully.` }));
      navigate('/manage-amenities');
    }
    setOnSumbitLoader(false);
  };

  return (
    <div className="createAmenities-page page">
      <Breadcrumb
        pageTitle={t("Create Amenities")}
        breadcrumbList={[
          {
            title: t("Home"),
            url: "/",
          },
          {
            title: t("Amenities"),
            url: "/manage-amenities",
          },
          {
            title:
              flow === FLOW_TYPE.EDIT
                ? t("Update Amenities")
                : t("Create Amenities"),
            url: "/create-amenities",
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
              id="amenities"
              label={"Amenities"}
              control={control}
              variant="outlined"
              //rules={{ required: "Amenities is required" }}
              rules={{
                required: "Amenities is required",
                pattern: {
                  value: /^(?!\s)[A-Za-z\s]+(?<!\s)$/,
                  message:
                    "Only alphabets allowed, no leading or trailing spaces",
                },
                validate: (value) =>
                  value.trim() !== "" || "Only spaces are not allowed",
                minLength: {
                  value: 1,
                  message: "Amenities must be at least 1 character long",
                },
                maxLength: {
                  value: 15,
                  message: "Amenities cannot exceed 15 characters",
                },
              }}
            />
            <InputField
              id="description"
              label={"Description"}
              control={control}
              variant="outlined"
              //rules={{ required: "Description is required" }}
              rules={{
                required: "Description is required",
                pattern: {
                  value: /^(?!\s)[A-Za-z\s]+(?<!\s)$/,
                  message:
                    "Only alphabets allowed, no leading or trailing spaces",
                },
                validate: (value) =>
                  value.trim() !== "" || "Only spaces are not allowed",
                minLength: {
                  value: 1,
                  message: "Description must be at least 1 character long",
                },
                maxLength: {
                  value: 50,
                  message: "Description cannot exceed 50 characters",
                },
              }}
            />
            <InputField
              label={"MUI Icon"}
              id="classPath"
              control={control}
              placeholder="e.g., fa-solid fa-house"
              variant="outlined"
              value={inputValue}
              rules={{ required: "Icon name is required" }}
              helpText={
                <FormHelperText>
                  For icons, click here{" "}
                  <Link href="https://mui.com/material-ui/material-icons" target="_blank" rel="noopener noreferrer">
                    icon reference
                  </Link>.
                </FormHelperText>
              }
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

export default CreateAmenities;
