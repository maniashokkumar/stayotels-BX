import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Breadcrumb, Loader } from "../../../components/index";
import {
    InputField,
    CustomSelectField,
    KeyBoardDatePicker,
    NumericInputComponent,
} from "../../../components/ReactHookForm/index";
import {
    Button,
    Switch,
    FormControlLabel,
    Autocomplete,
    TextField,
    Chip,
    FormHelperText,
    FormControl,
} from "@mui/material";
import { showSnackbar } from "../../../redux/reducer/appSlice";
import { updateCouponTableState } from "../ManageCoupon/manageCouponTableSlice";
import { createCoupon, updateCoupon, hotelList } from "./CreateCouponApi";
import dayjs from "dayjs";
import { FLOW_TYPE } from "../../../Utils/constants";
import "./CreateCoupon.scss";

function CreateCoupon() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const today = dayjs();

    const flow = useSelector((state) => state.manageCouponTableReducer.flow);
    const selectedCouponData = useSelector((state) => state.manageCouponTableReducer.selectedCouponData);

    const defaultValues = {
        code: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        minAmount: "",
        maxDiscount: "",
        expiryDate: null,
        usageLimit: "",
        hotelIds: [],
        isActive: true
    };

    const { handleSubmit, control, reset, watch, setValue } = useForm({
        defaultValues: defaultValues,
        mode: "onChange"
    });

    const discountType = watch("discountType");
    const [pageLoader, setPageLoader] = useState(false);
    const [onSubmitLoader, setOnSubmitLoader] = useState(false);
    const [hotelOptions, setHotelOptions] = useState([]);

    useEffect(() => {
        fetchHotels();
    }, []);

    useEffect(() => {
        if (flow === FLOW_TYPE.EDIT && selectedCouponData) {
            const existingHotelIds = selectedCouponData.hotelIds
                ? selectedCouponData.hotelIds
                : selectedCouponData.hotelId
                    ? [selectedCouponData.hotelId]
                    : [];
            reset({
                ...selectedCouponData,
                hotelIds: existingHotelIds,
                expiryDate: selectedCouponData.expiryDate ? dayjs(selectedCouponData.expiryDate) : null
            });
        }
    }, [selectedCouponData, flow]);

    const fetchHotels = async () => {
        try {
            const res = await hotelList({ dispatch });
            if (res && res.data) {
                const hotels = Array.isArray(res.data) ? res.data : [];
                setHotelOptions(
                    hotels.map(h => ({
                        label: h.hotelName,
                        value: h.hotelId,
                        locationName: h.locationName || "",
                        state: h.state || "",
                    }))
                );
            }
        } catch (e) {
            console.error(e);
        }
    };

    const submitHandler = async (formData) => {
        setOnSubmitLoader(true);
        formData.code = formData.code.toUpperCase();
        formData.expiryDate = formData.expiryDate ? dayjs(formData.expiryDate).format("YYYY-MM-DD") : null;
        if (!formData.hotelIds || formData.hotelIds.length === 0) {
            formData.hotelIds = null;
        }

        // Coerce numeric fields — HTML inputs always return strings
        formData.discountValue = formData.discountValue !== "" && formData.discountValue !== undefined ? parseFloat(formData.discountValue) : null;
        formData.minAmount = formData.minAmount !== "" && formData.minAmount !== undefined ? parseFloat(formData.minAmount) : null;
        formData.maxDiscount = formData.maxDiscount !== "" && formData.maxDiscount !== undefined ? parseFloat(formData.maxDiscount) : null;
        formData.usageLimit = formData.usageLimit !== "" && formData.usageLimit !== undefined ? parseInt(formData.usageLimit, 10) : null;

        let response;
        if (flow === FLOW_TYPE.EDIT) {
            response = await updateCoupon({ data: formData, couponId: selectedCouponData.couponId, dispatch });
        } else {
            response = await createCoupon({ data: formData, dispatch });
        }

        setOnSubmitLoader(false);
        if (response === "Success") {
            dispatch(showSnackbar({ type: "success", message: `Coupon ${flow === FLOW_TYPE.EDIT ? "updated" : "created"} successfully` }));
            navigate("/manage-coupon");
        }
    };

    return (
        <div className="createCoupon-page page">
            <Breadcrumb
                pageTitle={flow === FLOW_TYPE.EDIT ? t("Update Coupon") : t("Create Coupon")}
                breadcrumbList={[
                    { title: t("Home"), url: "/" },
                    { title: t("Coupons"), url: "/manage-coupon" },
                    { title: flow === FLOW_TYPE.EDIT ? t("Update Coupon") : t("Create Coupon"), url: "/create-coupon" }
                ]}
                hideBreadcrumb={true}
            />

            <div className="form-card card-wrapper-default">
                {pageLoader && <Loader pageLoader={true} pageLoaderCustomStyles={{ margin: "-20px" }} />}

                <form onSubmit={handleSubmit(submitHandler)}>
                    <div className="form-fields-block">
                        <InputField
                            id="code"
                            label={t("Coupon Code")}
                            control={control}
                            variant="outlined"
                            rules={{ required: t("Coupon Code is required") }}
                            handleCustomInputChange={(e) => {
                                setValue("code", e.target.value.toUpperCase());
                            }}
                        />

                        <CustomSelectField
                            id="discountType"
                            label={t("Discount Type")}
                            control={control}
                            variant="outlined"
                            options={[
                                { label: t("Percentage"), value: "PERCENTAGE" },
                                { label: t("Flat"), value: "FLAT" }
                            ]}
                            rules={{ required: t("Discount Type is required") }}
                            placeholder={t("Select Type")}
                        />

                        <NumericInputComponent
                            id="discountValue"
                            label={t("Discount Value")}
                            control={control}
                            variant="outlined"
                            rules={{
                                required: t("Discount Value is required"),
                                min: { value: 0, message: t("Discount value cannot be negative") },
                                validate: (val) => {
                                    if (discountType === "PERCENTAGE" && (val < 1 || val > 100)) return t("Percentage must be 1-100");
                                    return true;
                                }
                            }}
                        />

                        <NumericInputComponent
                            id="minAmount"
                            label={t("Minimum Booking Amount")}
                            control={control}
                            variant="outlined"
                            rules={{ min: { value: 0, message: t("Minimum amount cannot be negative") } }}
                        />

                        {discountType === "PERCENTAGE" && (
                            <NumericInputComponent
                                id="maxDiscount"
                                label={t("Maximum Discount")}
                                control={control}
                                variant="outlined"
                                rules={{ min: { value: 0, message: t("Maximum discount cannot be negative") } }}
                            />
                        )}

                        <KeyBoardDatePicker
                            id="expiryDate"
                            label={t("Expiry Date")}
                            control={control}
                            variant="outlined"
                            disablePast
                            minDate={today}
                            rules={{ required: t("Expiry Date is required") }}
                        />

                        <NumericInputComponent
                            id="usageLimit"
                            label={t("Usage Limit")}
                            control={control}
                            variant="outlined"
                            rules={{
                                required: t("Usage Limit is required"),
                                min: { value: 1, message: t("Usage limit must be at least 1") }
                            }}
                        />

                        {/* Searchable Multi-Select Hotel Field */}
                        <div className="form-field">
                            <Controller
                                name="hotelIds"
                                control={control}
                                render={({ field: { onChange, value }, fieldState: { error } }) => {
                                    const selectedOptions = hotelOptions.filter(opt =>
                                        Array.isArray(value) && value.includes(opt.value)
                                    );
                                    return (
                                        <FormControl fullWidth variant="outlined" error={!!error}>
                                            <Autocomplete
                                                multiple
                                                id="hotelIds-autocomplete"
                                                options={hotelOptions}
                                                value={selectedOptions}
                                                onChange={(_, newValue) => {
                                                    onChange(newValue.map(opt => opt.value));
                                                }}
                                                getOptionLabel={(option) => option.label}
                                                isOptionEqualToValue={(option, val) => option.value === val.value}
                                                filterSelectedOptions
                                                renderOption={(props, option) => (
                                                    <li {...props} key={option.value}>
                                                        <span>{option.label}</span>
                                                        {(option.locationName || option.state) && (
                                                            <span style={{ color: "#777", marginLeft: "6px", fontSize: "0.85em" }}>
                                                                ({[option.locationName, option.state].filter(Boolean).join(", ")})
                                                            </span>
                                                        )}
                                                    </li>
                                                )}
                                                renderTags={(tagValue, getTagProps) =>
                                                    tagValue.map((option, index) => (
                                                        <Chip
                                                            key={option.value}
                                                            label={
                                                                <span>
                                                                    {option.label}
                                                                    {(option.locationName || option.state) && (
                                                                        <span style={{ color: "#777", fontSize: "0.85em", marginLeft: "4px" }}>
                                                                            ({[option.locationName, option.state].filter(Boolean).join(", ")})
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            }
                                                            size="small"
                                                            {...getTagProps({ index })}
                                                        />
                                                    ))
                                                }
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        variant="outlined"
                                                        label={t("Hotels (Optional)")}
                                                        placeholder={selectedOptions.length === 0 ? t("Search and select hotels...") : ""}
                                                        error={!!error}
                                                    />
                                                )}
                                                noOptionsText={t("No hotels found")}
                                            />
                                            {error && <FormHelperText>{error.message}</FormHelperText>}
                                        </FormControl>
                                    );
                                }}
                            />
                        </div>

                        <div className="form-field" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                            <Controller
                                name="isActive"
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
                                        label={t("Active")}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "right", marginTop: "20px", gap: "10px" }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate("/manage-coupon")}
                            disabled={onSubmitLoader}
                        >
                            {t("Cancel")}
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={onSubmitLoader}
                        >
                            {onSubmitLoader ? t("Loading...") : (flow === FLOW_TYPE.EDIT ? t("Update") : t("Create"))}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateCoupon;
