import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    Chip
} from '@mui/material';
import { AlertDialog, Loader } from '../../components/index';
import { fetchDailyReservations } from './CalendarViewApi';

const DailyReservationModal = ({ open, handleClose, date, hotelId, roomId }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && date && hotelId && roomId) {
            getReservations();
        }
    }, [open, date, hotelId, roomId]);

    const getReservations = async () => {
        setLoading(true);
        // We search for reservations where this date falls between checkIn and checkOut
        // Note: Backend MasterDao handles 'dateto' and 'datefrom' as criteria prefixes
        // datetocheckIn: date (means checkIn <= date)
        // datefromcheckOut: date (means checkOut >= date)
        // However, the standard reservation search is usually by checkIn/checkOut overlap
        // For now, we will use a more direct approach if the backend supports it, 
        // or filter by dategte/datelte if it maps to ISODates.

        const searchCriteria = {
            hotelId: hotelId,
            roomId: roomId,
            date: date
        };

        const response = await fetchDailyReservations({ data: searchCriteria, dispatch });
        setReservations(response || []);
        setLoading(false);
    };

    const getStatusChip = (res) => {
        const isCancelled = res.status === "CANCELLED" || res.isCancelled || res.isDeleted;
        const isCompleted = res.status === "COMPLETED";
        const isHotelBlocked = res.status === "HOTEL_BLOCKED";

        if (isCancelled) return <Chip label={t("Cancelled")} color="error" size="small" />;
        if (isCompleted) return <Chip label={t("Completed")} color="info" size="small" />;
        if (isHotelBlocked) return <Chip label={t("Hotel Blocked")} color="warning" size="small" />;
        if (res.isPaid) return <Chip label={t("Confirmed")} color="success" size="small" />;
        return <Chip label={t("Pending")} color="warning" size="small" />;
    };

    return (
        <AlertDialog
            open={open}
            closeModalHandler={handleClose}
            title={`${t("Reservations for")} ${date}`}
            maxWidth="lg"
            fullWidth={true}
            hideConfirmationButtons={true}
            modalName="daily-reservation-modal"
        >
            <Box sx={{ minHeight: 'auto', p: 0 }}>
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '12px', border: '1px solid #eef2f6', overflowX: 'hidden' }}>
                    <Table size="medium">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>{t("Guest Name")}</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>{t("Dates")}</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>{t("Guests")}</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>{t("Contact Info")}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, color: '#475569' }}>{t("Status")}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>{t("Amount")}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 10, border: 0 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                                            <Loader pageLoader={false} />
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : reservations.length > 0 ? (
                                reservations.map((res) => (
                                    <TableRow key={res.reservationId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                {res.guestName || t("N/A")}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'monospace', fontSize: '11px' }}>
                                                #{res.orderId || res.reservationId}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500 }}>
                                                    {new Date(res.checkIn).toLocaleDateString()} - {new Date(res.checkOut).toLocaleDateString()}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                    {res.noOfRooms} {t("Rooms")}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" sx={{ color: '#334155' }}>
                                                    {res.noOfPersons} {t("Total")}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                    {res.noOfAdults} {t("Adults")}, {res.noOfChildren} {t("Children")}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" sx={{ color: '#334155', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <i className="fa-regular fa-envelope" style={{ fontSize: '10px' }}></i> {res.guestEmail}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                    <i className="fa-solid fa-phone" style={{ fontSize: '10px' }}></i> {res.guestPhone}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">{getStatusChip(res)}</TableCell>
                                        <TableCell align="right">
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                                {res.currency || "INR"} {res.totalCost ? res.totalCost.toLocaleString() : "0"}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                                        <Box sx={{ opacity: 0.5 }}>
                                            <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '32px', marginBottom: '8px', color: '#94a3b8' }}></i>
                                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                                                {t("No reservations found for this date")}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </AlertDialog>
    );
};

export default DailyReservationModal;
