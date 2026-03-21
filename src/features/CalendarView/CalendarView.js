import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from "react-hook-form";
import { useTranslation } from 'react-i18next';
import { Breadcrumb, Loader } from '../../components/index';
import { CustomSelectField } from '../../components/ReactHookForm';
import { Grid, Box, Button } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Tippy from '@tippy.js/react';
import 'tippy.js/dist/tippy.css';
import { listHotel, listRoom, listCalendarDate } from "./CalendarViewApi";
import DailyReservationModal from "./DailyReservationModal";
import './CalendarView.scss';


function CalendarView() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [pageLoader, setPageLoader] = useState(false);
    const [optionsHotel, setOptionsHotel] = useState([]);
    const [optionsRoom, setOptionsRoom] = useState([]);
    const [selectedHotel, setSelectedHotel] = useState("");
    const [selectedRoom, setSelectedRoom] = useState("");
    const [bookings, setBookings] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [modalData, setModalData] = useState({ open: false, date: "" });

    const calendarRef = useRef(null);
    const { control } = useForm();

    useEffect(() => {

        fetchHotelList();
        // fetchRoomList();
    }, []);

    useEffect(() => {
        if (selectedHotel && selectedRoom) {
            fetchCalendarData();
        }
    }, [selectedHotel, selectedRoom, currentDate]);

    const fetchHotelList = async () => {
        let param = {};
        let tempHotel = [];
        setPageLoader(true);
        const response = await listHotel({ data: param, dispatch });
        // console.log("fetchHotelList>>>>>>", response);
        response.map((item) => {
            let dataJson = { label: item.hotelName, value: item.hotelId };
            tempHotel.push(dataJson);
        });
        setOptionsHotel(tempHotel);
        setPageLoader(false);
    }


    const handleHotelSelect = async (hotelId) => {
        // console.log("hotelId", hotelId);
        let params = { hotelId: hotelId };
        let tempRooms = [];
        setSelectedHotel(hotelId);
        setSelectedRoom("");
        setBookings([]);
        setPageLoader(true);
        const response = await listRoom({ data: params, dispatch })
        // console.log("fetchRoomList>>>>>>", response);
        response.map((item) => {
            let dataJson = { label: item.roomName, value: item.roomId };
            tempRooms.push(dataJson);
        });
        setOptionsRoom(tempRooms);
        setPageLoader(false);
    };

    const handleRoomSelect = async (roomId) => {
        setSelectedRoom(roomId);
        fetchCalendarData(roomId);
    };

    const fetchCalendarData = async (roomId = selectedRoom) => {
        if (!selectedHotel || !roomId) return;
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        setPageLoader(true);
        const response = await listCalendarDate({ data: { hotelId: selectedHotel, roomId, year, month }, dispatch });
        setBookings(response.map(item => ({
            title: "Room Status",
            start: item.date,
            extendedProps: {
                totalRooms: item.totalRooms,
                availableRooms: item.availableRooms,
                bookedRooms: item.bookedRooms,
                lockedRooms: item.lockedRooms || 0
            }
        })));
        setPageLoader(false);
    };

    const handleDateChange = (change) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + change);

            if (calendarRef.current) {
                calendarRef.current.getApi().gotoDate(newDate);
            }

            return newDate;
        });
    };

    const handleEventClick = (info) => {
        setModalData({
            open: true,
            date: info.event.startStr
        });
    };

    const handleDateClick = (info) => {
        setModalData({
            open: true,
            date: info.dateStr
        });
    };

    // const renderEventContent = (eventInfo) => {
    //     if (eventInfo.event.extendedProps.availableRooms === 0) {
    //         return (
    //             <div style={{ fontSize: "14px", backgroundColor: "red", fontWeight: "bold", border: "2px solid red", padding: '5px', borderRadius: '2px' }}>
    //                 Sold Out
    //             </div>
    //         );
    //     } else {
    //         return (
    //             <div style={{ fontSize: "14px", padding: '2px 5px' }}>
    //                 <strong>Available :</strong> {eventInfo.event.extendedProps.availableRooms} <br />
    //                 <strong>Booked :</strong> {eventInfo.event.extendedProps.bookedRooms} <br />
    //                 <strong>Total :</strong> {eventInfo.event.extendedProps.totalRooms}
    //             </div>
    //         );
    //     }
    // };

    const renderEventContent = (eventInfo) => {
        const isMobile = window.innerWidth < 600;

        const containerStyle = {
            fontSize: isMobile ? "12px" : "14px",
            backgroundColor: eventInfo.event.extendedProps.availableRooms === 0 ? "red" : "#4A90E2",
            color: "white",
            padding: isMobile ? "2px 4px" : "5px",
            borderRadius: "4px",
            // textAlign: "center",
            lineHeight: "1.4",
        };

        const textStyle = {
            marginBottom: isMobile ? "2px" : "4px",
        };

        return (
            // <div style={containerStyle}>
            //     <div style={textStyle}>
            //         <strong>Available:</strong> {eventInfo.event.extendedProps.availableRooms}
            //     </div>
            //     <div style={textStyle}>
            //         <strong>Booked:</strong> {eventInfo.event.extendedProps.bookedRooms}
            //     </div>
            //     <div style={textStyle}>
            //         <strong>Total:</strong> {eventInfo.event.extendedProps.totalRooms}
            //     </div>
            // </div>
            <div style={containerStyle}>
                <div className="event-detail">
                    Available: {eventInfo.event.extendedProps.availableRooms}
                </div>
                <div className="event-detail">
                    Booked: {eventInfo.event.extendedProps.bookedRooms}
                </div>
                {eventInfo.event.extendedProps.lockedRooms > 0 && (
                    <div className="event-detail" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Locked: {eventInfo.event.extendedProps.lockedRooms}
                        <Tippy content="Rooms currently held for pending payments (May available, if user not complete the payment in 8 mins)" delay={[100, 0]} arrow={true}>
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                <InfoIcon style={{ fontSize: isMobile ? "10px" : "14px", cursor: 'help', color: '#ffd700' }} />
                            </span>
                        </Tippy>
                    </div>
                )}
                <div className="event-detail">
                    Total: {eventInfo.event.extendedProps.totalRooms}
                </div>
            </div>
        );
    };


    return (
        <div className={"calendar-page page"}>
            <Breadcrumb
                pageTitle={t("Manage Calendar")}
                breadcrumbList={[
                    {
                        title: t("Home"),
                        url: "/",
                    },
                    {
                        title: t("Calendar view"),
                        url: "/calendar",
                    },
                ]}
                hideBreadcrumb
            />

            {pageLoader && (<Loader pageLoader={true} pageLoaderCustomStyles={{ margin: "-20px" }} />)}

            <div className="form-card card-wrapper-default">

                <div className="form-fields-block">
                    <CustomSelectField
                        id="hotelId"
                        label={t("Hotel")}
                        control={control}
                        variant="outlined"
                        options={optionsHotel}
                        values={selectedHotel}
                        handleCustomInputChange={(e) => handleHotelSelect(e.target.value)}
                    />
                    <CustomSelectField
                        id="roomId"
                        label={t("Room")}
                        control={control}
                        variant="outlined"
                        options={optionsRoom}
                        values={selectedRoom}
                        handleCustomInputChange={(e) => handleRoomSelect(e.target.value)}
                    />
                </div>
            </div>

            <Grid item xs={12} mt={3}>
                <div className="card-wrapper-default">
                    <div className="max-w-2xl mx-auto p-4 border rounded-lg shadow-md">
                        <Box display="flex" justifyContent="flex-end" gap={2} mb={2}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => handleDateChange(-1)}
                                className="submit-button"
                            >
                                ← Prev
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => handleDateChange(1)}
                                className="submit-button"
                            >
                                Next →</Button>
                        </Box>
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            events={bookings}
                            headerToolbar={{
                                left: "",
                                center: "title",
                                right: "",
                            }}
                            eventContent={renderEventContent}
                            eventClick={handleEventClick}
                            dateClick={handleDateClick}
                        />
                    </div>
                </div>
            </Grid>

            <DailyReservationModal
                open={modalData.open}
                handleClose={() => setModalData({ ...modalData, open: false })}
                date={modalData.date}
                hotelId={selectedHotel}
                roomId={selectedRoom}
            />
        </div>
    )
}

export default CalendarView
