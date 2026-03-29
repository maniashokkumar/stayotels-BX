import React, { useEffect, useState } from "react";
import { useDispatch } from 'react-redux';
import { useForm } from "react-hook-form";
import { useTranslation } from 'react-i18next';
import { Breadcrumb, Loader } from '../../components/index';
import { CustomSelectField } from '../../components/ReactHookForm';
import { Box, Stack, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import 'tippy.js/dist/tippy.css';
import { listHotel, listCalendarHotelView } from "./CalendarViewApi";
import DailyReservationModal from "./DailyReservationModal";
import InventoryResponsiveMonthGrid from "./InventoryResponsiveMonthGrid";
import './CalendarView.scss';


function CalendarView() {
    const dispatch = useDispatch();
    const { t, i18n } = useTranslation();

    const monthOptions = React.useMemo(() =>
        Array.from({ length: 12 }, (_, i) => ({
            value: i,
            label: new Date(2000, i, 1).toLocaleString(i18n.language || "en", { month: "short" }),
        })),
        [i18n.language]
    );

    const yearOptions = React.useMemo(() => {
        const y = new Date().getFullYear();
        const years = [];
        for (let i = y - 3; i <= y + 5; i += 1) {
            years.push(i);
        }
        return years;
    }, []);

    const [pageLoader, setPageLoader] = useState(false);
    const [optionsHotel, setOptionsHotel] = useState([]);
    const [selectedHotel, setSelectedHotel] = useState("");
    const [monthInventoryRaw, setMonthInventoryRaw] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [modalData, setModalData] = useState({
        open: false,
        date: "",
        roomBreakdown: [],
        daySummary: null,
    });

    const { control } = useForm();

    const inventoryByDate = React.useMemo(() => {
        const m = new Map();
        (monthInventoryRaw || []).forEach((item) => {
            m.set(item.date, {
                totalRooms: item.totalRooms,
                bookedRooms: item.bookedRooms,
                availableRooms: item.availableRooms,
                lockedRooms: item.lockedRooms || 0,
            });
        });
        return m;
    }, [monthInventoryRaw]);

    useEffect(() => {
        fetchHotelList();
    }, []);

    useEffect(() => {
        if (selectedHotel) {
            fetchCalendarData();
        }
    }, [selectedHotel, currentDate]);

    const fetchHotelList = async () => {
        let param = {};
        setPageLoader(true);
        const response = await listHotel({ data: param, dispatch });
        const tempHotel = response.map((item) => ({ label: item.hotelName, value: item.hotelId }));
        setOptionsHotel(tempHotel);
        if (tempHotel.length > 0) {
            setSelectedHotel(tempHotel[0].value);
        }
        setPageLoader(false);
    };

    const handleHotelSelect = async (hotelId) => {
        setSelectedHotel(hotelId);
        setMonthInventoryRaw([]);
    };

    const getDayPayload = (dateStr) => {
        const raw = monthInventoryRaw.find((d) => d.date === dateStr);
        if (!raw) {
            return { roomBreakdown: [], daySummary: null };
        }
        return {
            roomBreakdown: raw.roomBreakdown || [],
            daySummary: {
                totalRooms: raw.totalRooms,
                bookedRooms: raw.bookedRooms,
                availableRooms: raw.availableRooms,
                lockedRooms: raw.lockedRooms || 0,
            },
        };
    };

    const fetchCalendarData = async () => {
        if (!selectedHotel) return;
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        setPageLoader(true);
        const response = await listCalendarHotelView({ data: { hotelId: selectedHotel, year, month }, dispatch });
        setMonthInventoryRaw(Array.isArray(response) ? response : []);
        setPageLoader(false);
    };

    const openDayModal = (dateStr) => {
        const { roomBreakdown, daySummary } = getDayPayload(dateStr);
        setModalData({
            open: true,
            date: dateStr,
            roomBreakdown,
            daySummary,
        });
    };


    return (
        <div className={"calendar-page page"}>
            <Breadcrumb
                className="breadcrumb-wrapper--trail-only"
                breadcrumbList={[
                    { title: t("Home"), url: "/" },
                    { title: t("Inventory"), url: "/inventory" },
                ]}
            />

            {pageLoader && (<Loader pageLoader={true} pageLoaderCustomStyles={{ margin: "-20px" }} />)}

            <div className="card-wrapper-default calendar-inventory-card calendar-inventory-card--unified">
                <div className="calendar-card-inner">
                    <Stack spacing={2} sx={{ width: "100%", mb: 2 }} className="inventory-filters-stack">
                        <Box sx={{ width: "100%" }}>
                            <CustomSelectField
                                id="hotelId"
                                label={t("Hotel")}
                                control={control}
                                variant="outlined"
                                size="small"
                                options={optionsHotel}
                                values={selectedHotel}
                                handleCustomInputChange={(e) => handleHotelSelect(e.target.value)}
                                IconComponent={ArrowDropDownIcon}
                            />
                        </Box>
                        <Stack
                            direction="row"
                            spacing={1.5}
                            sx={{
                                alignItems: "flex-start",
                                justifyContent: "flex-start",
                                flexWrap: "nowrap",
                                width: "100%",
                            }}
                        >
                            <FormControl size="small" sx={{ flex: 1, minWidth: 0, maxWidth: { sm: 200 } }}>
                                <InputLabel id="inventory-month-label">{t("Month")}</InputLabel>
                                <Select
                                    labelId="inventory-month-label"
                                    label={t("Month")}
                                    value={currentDate.getMonth()}
                                    onChange={(e) => {
                                        const monthIndex = Number(e.target.value);
                                        setCurrentDate((prev) => {
                                            const next = new Date(prev);
                                            next.setDate(1);
                                            next.setMonth(monthIndex);
                                            return next;
                                        });
                                    }}
                                >
                                    {monthOptions.map((m) => (
                                        <MenuItem key={m.value} value={m.value}>
                                            {m.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ flex: 1, minWidth: 0, maxWidth: { sm: 140 } }}>
                                <InputLabel id="inventory-year-label">{t("Year")}</InputLabel>
                                <Select
                                    labelId="inventory-year-label"
                                    label={t("Year")}
                                    value={currentDate.getFullYear()}
                                    onChange={(e) => {
                                        const year = Number(e.target.value);
                                        setCurrentDate((prev) => {
                                            const next = new Date(prev);
                                            next.setDate(1);
                                            next.setFullYear(year);
                                            return next;
                                        });
                                    }}
                                >
                                    {yearOptions.map((y) => (
                                        <MenuItem key={y} value={y}>
                                            {y}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Stack>
                    <div className="inventory-calendar-host">
                        <InventoryResponsiveMonthGrid
                            year={currentDate.getFullYear()}
                            monthIndex={currentDate.getMonth()}
                            inventoryByDate={inventoryByDate}
                            locale={i18n.language}
                            t={t}
                            onDayClick={openDayModal}
                        />
                    </div>
                </div>
            </div>

            <DailyReservationModal
                open={modalData.open}
                handleClose={() => setModalData((prev) => ({ ...prev, open: false }))}
                date={modalData.date}
                hotelId={selectedHotel}
                roomBreakdown={modalData.roomBreakdown}
                daySummary={modalData.daySummary}
            />
        </div>
    )
}

export default CalendarView
