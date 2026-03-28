import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Typography,
    Box,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AlertDialog } from '../../components/index';

const DailyReservationModal = ({ open, handleClose, date, roomBreakdown = [], daySummary = null }) => {
    const { t } = useTranslation();

    const hasBreakdown = Array.isArray(roomBreakdown) && roomBreakdown.length > 0;

    return (
        <AlertDialog
            open={open}
            closeModalHandler={handleClose}
            title={`${date} · ${t("Inventory")}`}
            maxWidth="lg"
            fullWidth={true}
            hideConfirmationButtons={true}
            modalName="daily-reservation-modal"
        >
            <Box sx={{ minHeight: 'auto', p: 0 }}>
                {daySummary && (
                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            <strong>{t("Total rooms")}:</strong> {daySummary.totalRooms}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>{t("Booked")}:</strong> {daySummary.bookedRooms}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>{t("Available")}:</strong> {daySummary.availableRooms}
                        </Typography>
                        {(daySummary.lockedRooms || 0) > 0 && (
                            <Typography variant="body2" color="text.secondary">
                                <strong>{t("Locked (Booking in progress)")}:</strong> {daySummary.lockedRooms}
                            </Typography>
                        )}
                    </Box>
                )}

                {hasBreakdown && (
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600, letterSpacing: '0.02em' }}>
                            {t("By room type")}
                        </Typography>
                        <Box
                            sx={{
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                overflow: 'hidden',
                                bgcolor: '#fff',
                            }}
                        >
                            {roomBreakdown.map((row, index) => {
                                const soldOut = row.availableRooms === 0;
                                const key = row.roomId || row.roomName || String(index);
                                return (
                                    <Accordion
                                        key={key}
                                        disableGutters
                                        elevation={0}
                                        sx={{
                                            '&:before': { display: 'none' },
                                            borderBottom: '1px solid #eef2f6',
                                            '&:last-of-type': { borderBottom: 'none' },
                                            bgcolor: '#fafdfb',
                                        }}
                                    >
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon sx={{ color: '#64748b' }} />}
                                            sx={{
                                                minHeight: 52,
                                                px: 2,
                                                '& .MuiAccordionSummary-content': {
                                                    alignItems: 'center',
                                                    gap: 1.5,
                                                    flexWrap: 'wrap',
                                                    my: 1,
                                                },
                                            }}
                                        >
                                            <Typography
                                                variant="subtitle2"
                                                sx={{
                                                    fontWeight: 700,
                                                    color: '#14532d',
                                                    flex: '1 1 140px',
                                                    minWidth: 0,
                                                    lineHeight: 1.35,
                                                }}
                                            >
                                                {row.roomName || row.roomId}
                                            </Typography>
                                            {soldOut ? (
                                                <Chip label={t("Sold out")} size="small" color="error" sx={{ height: 22 }} />
                                            ) : (
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                                    {t("Available")}: {row.availableRooms}
                                                </Typography>
                                            )}
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ px: 2, pb: 2, pt: 0, bgcolor: '#f8fafc' }}>
                                            <Stack spacing={1.25} sx={{ pt: 0.5 }}>
                                                {[
                                                    [t('Total'), row.totalRooms],
                                                    [t('Booked'), row.bookedRooms],
                                                    [t('Locked (Booking in progress)'), row.lockedRooms ?? 0],
                                                    [t('Available'), row.availableRooms],
                                                ].map(([label, val]) => (
                                                    <Box
                                                        key={label}
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            gap: 2,
                                                        }}
                                                    >
                                                        <Typography variant="body2" color="text.secondary">
                                                            {label}
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={700} color="#0f172a">
                                                            {val}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </AccordionDetails>
                                    </Accordion>
                                );
                            })}
                        </Box>
                    </Box>
                )}

                {!hasBreakdown && !daySummary && (
                    <Typography variant="body2" color="text.secondary">
                        {t("No room-type breakdown for this date (select a day in the loaded month).")}
                    </Typography>
                )}
            </Box>
        </AlertDialog>
    );
};

export default DailyReservationModal;
