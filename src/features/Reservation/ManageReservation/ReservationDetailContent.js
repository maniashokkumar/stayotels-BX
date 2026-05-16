import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Box, IconButton, Typography, Divider, Stack, Button, TextField, MenuItem, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  availableRoomsByHotel,
  collectReservationPayment,
  updateReservation,
  updateReservationRefundStatus,
} from '../CreateReservation/CreateReservationApi';
import { showSnackbar } from '../../../redux/reducer/appSlice';
import {
  guestName,
  guestEmail,
  guestPhone,
  formatMoney,
  reservationGst,
  reservationGrandTotal,
  reservationPreTax,
  statusLabel,
  channelLabel,
  cpSourceLabel,
  displayAdultGuestCount,
  paymentStatusLine,
  nightsBetween,
} from '../reservationDisplayUtils';
import { DetailRow, SectionCard } from '../ReservationDrawerShared';
import GstSummary from '../../../components/GstSummary/GstSummary';
import {
  buildBookingQuotePayload,
  buildCpQuoteRoomsFromForm,
  summarizeQuoteGst,
  isQuoteReady,
} from '../../../Utils/gstQuoteUtils';
import { fetchBookingQuote } from '../CreateReservation/CreateReservationApi';

const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER'];

function normalizeRefundStatusForEdit(code) {
  const c = (code || 'PENDING').toUpperCase();
  if (c === 'COMPLETED') return 'PROCESSED';
  if (c === 'PROCESSED' || c === 'NOT_APPLICABLE' || c === 'PENDING') return c;
  return 'PENDING';
}

function ledgerSum(booking) {
  const led = booking?.paymentLedger;
  if (!Array.isArray(led)) return 0;
  return led.reduce((acc, p) => acc + (Number(p?.amount) || 0), 0);
}

function payableGrandTotal(booking) {
  return reservationGrandTotal(booking);
}

function paymentAdjustmentLabel(booking, t) {
  const type = (booking?.paymentAdjustmentType || '').toUpperCase();
  if (type === 'REFUND_DUE') return t('Refund due');
  if (type === 'ADDITIONAL_PAYMENT_DUE') return t('Additional payment due');
  if (type === 'NONE') return t('No change');
  return booking?.paymentAdjustmentType || null;
}

/**
 * @param {object} props
 * @param {object|null} props.reservation
 * @param {boolean} props.showClose
 * @param {function} [props.onClose]
 */
export default function ReservationDetailContent({ reservation, showClose, onClose, onSaved }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const titleId = 'reservation-detail-drawer-title';
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roomOptions, setRoomOptions] = useState([]);
  const [form, setForm] = useState({
    roomId: '',
    checkInDate: null,
    checkOutDate: null,
    noofRooms: '',
    cdnintnoOfPersons: '',
  });
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState('CASH');
  const [collectRef, setCollectRef] = useState('');
  const [collectSaving, setCollectSaving] = useState(false);
  const [collectMode, setCollectMode] = useState(false);
  const [refundStatusLocal, setRefundStatusLocal] = useState('PENDING');
  const [refundStatusSaving, setRefundStatusSaving] = useState(false);
  const [roomLineEdits, setRoomLineEdits] = useState([]);
  const [editQuoteLoading, setEditQuoteLoading] = useState(false);
  const [editQuoteError, setEditQuoteError] = useState(null);
  const [editQuoteSummary, setEditQuoteSummary] = useState(null);

  useEffect(() => {
    setEditMode(false);
    setRoomOptions([]);
    setForm({
      roomId: reservation?.roomId || '',
      checkInDate: reservation?.checkIn ? dayjs(reservation.checkIn) : null,
      checkOutDate: reservation?.checkOut ? dayjs(reservation.checkOut) : null,
      noofRooms: reservation?.noOfRooms != null ? String(reservation.noOfRooms) : '',
      cdnintnoOfPersons: reservation?.noOfPersons != null ? String(reservation.noOfPersons) : '',
    });
    // Initialise per-line edits for multi-room reservations
    const lines = Array.isArray(reservation?.roomLines) ? reservation.roomLines : [];
    setRoomLineEdits(
      lines.length > 1
        ? lines.map((l) => ({
            roomId: l.roomId || '',
            roomName: l.roomName || l.roomId || '',
            noOfRooms: String(l.noOfRooms ?? 1),
            noOfPersons: String(l.noOfPersons ?? 1),
            lineTotal: l.lineTotal ?? null,
          }))
        : []
    );
    setCollectAmount('');
    setCollectMethod('CASH');
    setCollectRef('');
    setCollectMode(false);
  }, [reservation]);

  useEffect(() => {
    setRefundStatusLocal(normalizeRefundStatusForEdit(reservation?.refundStatus));
  }, [reservation?.reservationId, reservation?.refundStatus]);

  const isMultiRoomReservation = useMemo(() => {
    const r = reservation?.rooms || '';
    return r.includes(',');
  }, [reservation?.rooms]);

  useEffect(() => {
    if (!editMode || !reservation?.hotelId || !form.checkInDate || !form.checkOutDate) return;
    if (!dayjs(form.checkInDate).isValid() || !dayjs(form.checkOutDate).isValid()) return;
    if (!dayjs(form.checkOutDate).isAfter(dayjs(form.checkInDate), 'day')) return;

    let cancelled = false;
    (async () => {
      const payload = {
        hotelId: reservation.hotelId,
        checkInDate: dayjs(form.checkInDate).format('YYYY-MM-DD'),
        checkOutDate: dayjs(form.checkOutDate).format('YYYY-MM-DD'),
      };
      const rows = await availableRoomsByHotel({ data: payload, dispatch });
      if (cancelled) return;
      const arr = Array.isArray(rows) ? rows : [];
      setRoomOptions(arr);
      // For single-room only: reset roomId if the selected one is no longer available
      if (!isMultiRoomReservation && arr.length > 0 && !arr.some((r) => r?.roomId === form.roomId)) {
        setForm((s) => ({ ...s, roomId: arr[0]?.roomId || '' }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editMode, reservation?.hotelId, form.checkInDate, form.checkOutDate, form.roomId, isMultiRoomReservation, dispatch]);

  const selectedRoom = useMemo(
    () => roomOptions.find((r) => r?.roomId === form.roomId) || null,
    [roomOptions, form.roomId]
  );
  const liveNights = useMemo(() => {
    if (!form.checkInDate || !form.checkOutDate) return null;
    const n = dayjs(form.checkOutDate).diff(dayjs(form.checkInDate), 'day');
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [form.checkInDate, form.checkOutDate]);

  const livePreviewTotal = useMemo(() => {
    if (!editMode || liveNights == null) return null;

    if (isMultiRoomReservation && roomLineEdits.length > 1) {
      // Multi-room: sum each line's qty × basePrice × nights
      if (roomOptions.length === 0) return null; // prices not loaded yet
      let total = 0;
      for (const line of roomLineEdits) {
        const qty = Number(line.noOfRooms);
        if (!Number.isFinite(qty) || qty <= 0) return null;
        const roomOpt = roomOptions.find((r) => r?.roomId === line.roomId);
        if (!roomOpt) return null; // room not in options yet
        const basePrice = Number(roomOpt.basePrice);
        if (!Number.isFinite(basePrice) || basePrice <= 0) return null;
        total += basePrice * qty * liveNights;
      }
      return total;
    }

    // Single-room
    if (!selectedRoom) return null;
    const basePrice = Number(selectedRoom?.basePrice);
    const rooms = Number(form.noofRooms);
    if (!Number.isFinite(basePrice) || basePrice <= 0) return null;
    if (!Number.isFinite(rooms) || rooms <= 0) return null;
    return basePrice * rooms * liveNights;
  }, [editMode, selectedRoom, form.noofRooms, liveNights, isMultiRoomReservation, roomLineEdits, roomOptions]);


  const liveDelta = useMemo(() => {
    if (livePreviewTotal == null) return null;
    return livePreviewTotal - Number(reservation?.totalCost || 0);
  }, [livePreviewTotal, reservation?.totalCost]);

  const persistedPreTax = reservationPreTax(reservation);
  const persistedGst = reservationGst(reservation);
  const persistedGrand = reservationGrandTotal(reservation);

  const editQuotePayload = useMemo(() => {
    if (!editMode || !reservation?.hotelId || !form.checkInDate || !form.checkOutDate) return null;
    if (!dayjs(form.checkInDate).isValid() || !dayjs(form.checkOutDate).isValid()) return null;
    const selectedRooms = buildCpQuoteRoomsFromForm({
      isMultiRoom: isMultiRoomReservation,
      roomLineEdits,
      form,
      roomOptions,
    });
    if (!selectedRooms?.length) return null;
    return buildBookingQuotePayload({
      hotelId: reservation.hotelId,
      checkInDate: dayjs(form.checkInDate).format('YYYY-MM-DD'),
      checkOutDate: dayjs(form.checkOutDate).format('YYYY-MM-DD'),
      cdnintnoOfPersons: isMultiRoomReservation && roomLineEdits.length > 1
        ? roomLineEdits.reduce((s, l) => s + (Number(l.noOfPersons) || 0), 0)
        : Number(form.cdnintnoOfPersons) || 0,
      selectedRooms,
      couponCode: null,
    });
  }, [
    editMode,
    reservation?.hotelId,
    form,
    roomLineEdits,
    roomOptions,
    isMultiRoomReservation,
  ]);

  useEffect(() => {
    if (!editQuotePayload) {
      setEditQuoteSummary(null);
      setEditQuoteError(null);
      return undefined;
    }
    let cancelled = false;
    setEditQuoteLoading(true);
    setEditQuoteError(null);
    (async () => {
      const quote = await fetchBookingQuote({ data: editQuotePayload, dispatch });
      if (cancelled) return;
      if (!quote) {
        setEditQuoteError('Unable to load tax quote');
        setEditQuoteSummary(null);
      } else {
        const summary = summarizeQuoteGst(quote);
        if (!summary.valid) {
          setEditQuoteError(summary.error || 'Unable to calculate tax');
          setEditQuoteSummary(null);
        } else {
          setEditQuoteSummary(summary);
        }
      }
      setEditQuoteLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [editQuotePayload, dispatch]);

  const persistedCgstSgst = useMemo(() => {
    const rows = reservation?.taxBreakdown;
    if (!Array.isArray(rows) || rows.length === 0) {
      const half = persistedGst / 2;
      return { cgst: half, sgst: persistedGst - half };
    }
    let cgst = 0;
    let sgst = 0;
    for (const r of rows) {
      cgst += Number(r.cgst) || 0;
      sgst += Number(r.sgst) || 0;
    }
    return { cgst, sgst };
  }, [reservation?.taxBreakdown, persistedGst]);

  const displayPreTax = editMode
    ? editQuoteSummary?.preTax ?? livePreviewTotal ?? persistedPreTax
    : persistedPreTax;
  const displayGst = editMode ? editQuoteSummary?.gst ?? persistedGst : persistedGst;
  const displayCgst = editMode ? editQuoteSummary?.cgst ?? 0 : persistedCgstSgst.cgst;
  const displaySgst = editMode ? editQuoteSummary?.sgst ?? 0 : persistedCgstSgst.sgst;
  const editQuoteReady = isQuoteReady(editQuoteSummary, editQuoteLoading, editQuoteError);
  const displayGrand = editMode
    ? editQuoteReady
      ? editQuoteSummary.total
      : persistedGrand
    : persistedGrand;
  const supplementTotal = Number(reservation?.supplementTotal) || 0;
  const totalPayableDisplay = roundMoney(displayGrand + supplementTotal);

  function roundMoney(v) {
    return Math.round((Number(v) || 0) * 100) / 100;
  }

  const formError = useMemo(() => {
    if (!editMode) return '';
    if (!form.roomId) return t('Room type is required');
    if (!form.checkInDate || !dayjs(form.checkInDate).isValid()) return t('Check-in date is required');
    if (!form.checkOutDate || !dayjs(form.checkOutDate).isValid()) return t('Checkout date is required');
    if (!dayjs(form.checkOutDate).isAfter(dayjs(form.checkInDate), 'day')) {
      return t('Checkout date must be after check-in date');
    }
    const rooms = Number(form.noofRooms);
    const persons = Number(form.cdnintnoOfPersons);
    if (!Number.isFinite(rooms) || rooms <= 0) return t('Total No of Rooms must be greater than 0');
    if (!Number.isFinite(persons) || persons <= 0) return t('No of Persons must be greater than 0');
    if (selectedRoom) {
      const baseGuests = Number(selectedRoom?.noOfPersons ?? 0);
      const allowExtra = selectedRoom?.allowExtraPerson === true || selectedRoom?.allowExtraPerson === 'true';
      const maxExtra = Number(selectedRoom?.maxExtraPersons ?? 0);
      const maxGuestsPerRoom = baseGuests + (allowExtra ? maxExtra : 0);
      const maxGuestsTotal = maxGuestsPerRoom * rooms;
      if (maxGuestsPerRoom > 0 && persons > maxGuestsTotal) {
        return t('Max capacity exceeded for selected room type');
      }
    }
    return '';
  }, [editMode, form, selectedRoom, t]);

  const handleSave = async () => {
    if (!reservation?.reservationId || formError) return;
    if (editMode && editQuotePayload && !editQuoteLoading && !editQuoteReady) {
      dispatch(
        showSnackbar({
          type: 'error',
          message: t('Unable to confirm price for this change. Please fix errors or wait for the quote.'),
        })
      );
      return;
    }
    setSaving(true);
    let body;
    if (isMultiRoomReservation && roomLineEdits.length > 1) {
      // Multi-room: send updated per-line qty/persons + dates; keep price server-computed.
      body = {
        checkInDate: dayjs(form.checkInDate).format('YYYY-MM-DD'),
        checkOutDate: dayjs(form.checkOutDate).format('YYYY-MM-DD'),
        roomLines: roomLineEdits.map((l) => ({
          roomId: l.roomId,
          noofRooms: Number(l.noOfRooms) || 1,
          noOfPersons: Number(l.noOfPersons) || 1,
        })),
        noofRooms: roomLineEdits.reduce((s, l) => s + (Number(l.noOfRooms) || 0), 0),
        cdnintnoOfPersons: roomLineEdits.reduce((s, l) => s + (Number(l.noOfPersons) || 0), 0),
        changeType: 'AMENDMENT',
      };
    } else {
      body = {
        roomId: form.roomId,
        checkInDate: dayjs(form.checkInDate).format('YYYY-MM-DD'),
        checkOutDate: dayjs(form.checkOutDate).format('YYYY-MM-DD'),
        noofRooms: Number(form.noofRooms),
        cdnintnoOfPersons: Number(form.cdnintnoOfPersons),
        changeType: 'AMENDMENT',
      };
    }
    const ok = await updateReservation({
      data: body,
      reservationId: reservation.reservationId,
      dispatch,
    });
    setSaving(false);
    if (ok === 'Success') {
      setEditMode(false);
      if (onSaved) await onSaved();
    }
  };

  const payableTotal = reservation ? payableGrandTotal(reservation) : 0;
  const collectedTotal =
    reservation?.totalCollectedAmount != null && Number.isFinite(Number(reservation.totalCollectedAmount))
      ? Number(reservation.totalCollectedAmount)
      : ledgerSum(reservation);
  const dueAmount =
    reservation?.paymentPendingAmount != null && Number.isFinite(Number(reservation.paymentPendingAmount))
      ? Number(reservation.paymentPendingAmount)
      : Math.max(0, payableTotal - collectedTotal);
  const allowPaymentCollect = (() => {
    if (!reservation) return false;
    const st = (reservation.status || '').toUpperCase();
    if (st === 'CANCELLED') return false;
    return st === 'HOTEL_BLOCKED' || st === 'CONFIRMED';
  })();
  const canCollectPayment = allowPaymentCollect && dueAmount > 0.009;

  const statusUpper = (reservation?.status || '').toUpperCase();
  const showRefundStatusEditor =
    reservation &&
    (statusUpper === 'CANCELLED' ||
      ((statusUpper === 'HOTEL_BLOCKED' || statusUpper === 'CONFIRMED') &&
        Number(reservation.refundAmount) > 0));
  const refundStatusNormalizedSaved = normalizeRefundStatusForEdit(reservation?.refundStatus);
  const refundStatusUnchanged = refundStatusLocal === refundStatusNormalizedSaved;

  const handleRefundStatusSave = async () => {
    if (!reservation?.reservationId || !showRefundStatusEditor || refundStatusUnchanged) return;
    setRefundStatusSaving(true);
    const ok = await updateReservationRefundStatus({
      reservationId: reservation.reservationId,
      refundStatus: refundStatusLocal,
      dispatch,
    });
    setRefundStatusSaving(false);
    if (ok && onSaved) await onSaved();
  };

  const handleCollectPayment = async () => {
    if (!reservation?.reservationId || !canCollectPayment) return;
    const amt = Number(String(collectAmount).replace(',', '.'));
    if (!Number.isFinite(amt) || amt <= 0) {
      dispatch(showSnackbar({ type: 'error', message: t('Enter a valid amount') }));
      return;
    }
    if (amt > dueAmount + 0.0001) {
      dispatch(showSnackbar({ type: 'error', message: t('Amount cannot exceed amount due') }));
      return;
    }
    setCollectSaving(true);
    const ok = await collectReservationPayment({
      body: {
        reservationId: reservation.reservationId,
        amount: amt,
        method: collectMethod,
        reference: collectRef || undefined,
      },
      dispatch,
    });
    setCollectSaving(false);
    if (ok?.success) {
      setCollectAmount('');
      setCollectRef('');
      setCollectMode(false);
      if (onSaved) await onSaved();
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          flexShrink: 0,
        }}
      >
        <Typography id={titleId} variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
          {t('Reservation')}
        </Typography>
        {showClose && onClose ? (
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: 'primary.contrastText' }}
            aria-label={t('Close')}
          >
            <CloseIcon />
          </IconButton>
        ) : null}
      </Box>

      <Box sx={{ overflow: 'auto', flex: 1, p: 2, bgcolor: 'grey.50', minHeight: 0 }}>
        {!reservation ? (
          <Typography color="text.secondary">{t('No reservation selected')}</Typography>
        ) : (
          <>
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 2,
                p: 2,
                mb: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('FROM')}
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {reservation.checkIn ? dayjs(reservation.checkIn).format('D MMM YYYY') : '—'}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', alignSelf: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {(() => {
                      const n = nightsBetween(reservation.checkIn, reservation.checkOut);
                      if (n === '—') return '—';
                      return `${n} ${t('Nights')}`;
                    })()}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('TO')}
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {reservation.checkOut ? dayjs(reservation.checkOut).format('D MMM YYYY') : '—'}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <SectionCard title={t('BOOKING DETAILS')}>
              {!editMode ? (
                <>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    {reservation.noOfRooms || 0} {t('Room(s)')} | {displayAdultGuestCount(reservation)}{' '}
                    {t('Adults')}
                    {reservation.noOfChildren != null ? ` + ${reservation.noOfChildren} ${t('Children')}` : ''}
                  </Typography>
                  {/* Per-room-type breakdown from roomLines (new bookings) */}
                  {Array.isArray(reservation.roomLines) && reservation.roomLines.length > 0 ? (
                    <Box
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        overflow: 'hidden',
                        mb: 1,
                      }}
                    >
                      {reservation.roomLines.map((line, i) => (
                        <Box
                          key={i}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            px: 1.5,
                            py: 0.75,
                            bgcolor: i % 2 === 0 ? 'grey.50' : 'background.paper',
                            borderTop: i > 0 ? '1px solid' : 'none',
                            borderColor: 'divider',
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {line.roomName || line.roomId}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {line.noOfRooms} {t('room(s)')} · {line.noOfPersons} {t('guest(s)')}
                            </Typography>
                          </Box>
                          {line.lineTotal != null ? (
                            <Typography variant="body2" fontWeight={700}>
                              {formatMoney(line.lineTotal)}
                            </Typography>
                          ) : null}
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {reservation.rooms || reservation.roomName || '—'}
                    </Typography>
                  )}
                </>
              ) : (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Stack spacing={1.25} sx={{ mb: 1 }}>
                    {/* Date pickers — always shown in edit mode */}
                    <DatePicker
                      label={t('Check-in')}
                      value={form.checkInDate}
                      onChange={(v) => setForm((s) => ({ ...s, checkInDate: v }))}
                      renderInput={(params) => <TextField {...params} size="small" />}
                    />
                    <DatePicker
                      label={t('Checkout')}
                      value={form.checkOutDate}
                      onChange={(v) => setForm((s) => ({ ...s, checkOutDate: v }))}
                      renderInput={(params) => <TextField {...params} size="small" />}
                    />

                    {isMultiRoomReservation && roomLineEdits.length > 1 ? (
                      /* Multi-room: show per-line editable rows */
                      <>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {t('Room breakdown')}
                        </Typography>
                        {roomLineEdits.map((line, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              p: 1.25,
                              bgcolor: 'grey.50',
                            }}
                          >
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                              {line.roomName}
                            </Typography>
                            <Stack direction="row" spacing={1}>
                              <TextField
                                label={t('Rooms')}
                                size="small"
                                type="number"
                                inputProps={{ min: 1, step: 1 }}
                                value={line.noOfRooms}
                                onChange={(e) =>
                                  setRoomLineEdits((prev) => {
                                    const next = [...prev];
                                    next[idx] = { ...next[idx], noOfRooms: e.target.value };
                                    return next;
                                  })
                                }
                                sx={{ flex: 1 }}
                              />
                              <TextField
                                label={t('Guests')}
                                size="small"
                                type="number"
                                inputProps={{ min: 1, max: 25, step: 1 }}
                                value={line.noOfPersons}
                                onChange={(e) =>
                                  setRoomLineEdits((prev) => {
                                    const next = [...prev];
                                    next[idx] = { ...next[idx], noOfPersons: e.target.value };
                                    return next;
                                  })
                                }
                                sx={{ flex: 1 }}
                              />
                            </Stack>
                          </Box>
                        ))}
                        <Typography variant="caption" color="text.secondary">
                          {t('Total')}: {roomLineEdits.reduce((s, l) => s + (Number(l.noOfRooms) || 0), 0)} {t('room(s)')} ·{' '}
                          {roomLineEdits.reduce((s, l) => s + (Number(l.noOfPersons) || 0), 0)} {t('guest(s)')}
                        </Typography>
                      </>
                    ) : (
                      /* Single room: original form fields */
                      <>
                        <TextField
                          select
                          label={t('Room type')}
                          size="small"
                          value={form.roomId}
                          onChange={(e) => setForm((s) => ({ ...s, roomId: e.target.value }))}
                        >
                          {roomOptions.map((opt) => (
                            <MenuItem key={opt.roomId} value={opt.roomId}>
                              {opt.roomName || opt.roomId}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          label={t('Total No of Rooms')}
                          size="small"
                          type="number"
                          value={form.noofRooms}
                          onChange={(e) => setForm((s) => ({ ...s, noofRooms: e.target.value }))}
                        />
                        <TextField
                          label={t('No of Persons')}
                          size="small"
                          type="number"
                          value={form.cdnintnoOfPersons}
                          onChange={(e) => setForm((s) => ({ ...s, cdnintnoOfPersons: e.target.value }))}
                        />
                      </>
                    )}

                    {formError ? (
                      <Typography variant="caption" color="error">
                        {formError}
                      </Typography>
                    ) : null}
                  </Stack>
                </LocalizationProvider>
              )}
              <Divider sx={{ my: 1.5 }} />
              
              <GstSummary
                compact
                ready={editMode ? editQuoteReady : true}
                preTax={displayPreTax}
                gst={displayGst}
                cgst={displayCgst}
                sgst={displaySgst}
                total={displayGrand}
                ratePercent={editMode ? editQuoteSummary?.ratePercent : null}
                mixedRates={editMode ? editQuoteSummary?.mixedRates : false}
                loading={editMode && editQuoteLoading}
                error={editMode ? editQuoteError : null}
              />

              {!editMode && reservation?.taxBreakdown?.length > 0 && (
                <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('GST breakdown')}
                  </Typography>
                  <Tooltip
                    title={
                      <Box sx={{ p: 0.5 }}>
                        {reservation.taxBreakdown.map((tx, idx) => (
                          <Typography key={idx} variant="caption" display="block">
                            {tx.roomName || tx.stayDate}: {tx.gstRate}% — ₹{Number(tx.gstAmount || 0).toFixed(2)}
                          </Typography>
                        ))}
                      </Box>
                    }
                  >
                    <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary', cursor: 'pointer' }} />
                  </Tooltip>
                </Stack>
              )}

              {supplementTotal > 0 && (
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('Add-ons')}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatMoney(supplementTotal)}
                  </Typography>
                </Stack>
              )}

              <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mt: 1 }}>
                <Typography variant="body2" fontWeight={700}>
                  {t('Total payable')}
                </Typography>
                <Typography variant="h6" fontWeight={800} color="primary">
                  {formatMoney(totalPayableDisplay)}
                </Typography>
              </Stack>

              {editMode ? (
                <>
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mt: 1, pt: 1, borderTop: '1px dashed #ddd' }}>
                    <Typography variant="caption" color="text.secondary">
                      {t('Updated total (includes previewed rooms)')}
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="secondary">
                      {livePreviewTotal != null ? formatMoney(livePreviewTotal) : '—'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mt: 0.25 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t('Difference')}
                    </Typography>
                    <Typography
                      sx={{
                        px: liveDelta == null ? 0 : 1,
                        py: liveDelta == null ? 0 : 0.35,
                        borderRadius: 1,
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        lineHeight: 1.2,
                        color:
                          liveDelta == null
                            ? 'text.secondary'
                            : liveDelta < 0
                              ? 'success.dark'
                              : liveDelta > 0
                                ? 'error.main'
                                : 'text.secondary',
                        bgcolor:
                          liveDelta == null
                            ? 'transparent'
                            : liveDelta < 0
                              ? 'success.50'
                              : liveDelta > 0
                                ? 'error.50'
                                : 'grey.100',
                      }}
                    >
                      {liveDelta == null
                        ? '—'
                        : `${liveDelta > 0 ? '+' : ''}${formatMoney(liveDelta)}`}
                    </Typography>
                  </Stack>
                  {livePreviewTotal == null ? (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {t('Live preview unavailable for selected values. Final amount is validated on save.')}
                    </Typography>
                  ) : null}
                </>
              ) : null}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {t('Status')}: {statusLabel(reservation, t)}
              </Typography>
              {reservation.orderId ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {t('Order')}: #{reservation.orderId}
                </Typography>
              ) : null}
              <DetailRow label={t('Sales channel')} value={channelLabel(reservation, t)} />
              <DetailRow label={t('Booking source')} value={cpSourceLabel(reservation, t)} />
              <DetailRow label={t('Source reference')} value={reservation.sourceReference} />
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} justifyContent="flex-end">
                {!editMode ? (
                  <Button variant="outlined" size="small" onClick={() => setEditMode(true)}>
                    {t('Edit reservation')}
                  </Button>
                ) : (
                  <>
                    <Button variant="text" size="small" onClick={() => setEditMode(false)} disabled={saving}>
                      {t('Discard')}
                    </Button>
                    <Button variant="contained" size="small" onClick={handleSave} disabled={Boolean(formError) || saving}>
                      {saving ? t('Saving...') : t('Save changes')}
                    </Button>
                  </>
                )}
              </Stack>
            </SectionCard>

            <SectionCard title={t('PAYMENT')}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <Box component="span" color="text.secondary">
                  {t('Payment status')}:{' '}
                </Box>
                <Box component="span" fontWeight={700}>
                  {paymentStatusLine(reservation, t)}
                </Box>
              </Typography>
              <DetailRow label={t('Total (room + supplements)')} value={formatMoney(payableTotal)} />
              <DetailRow label={t('Collected')} value={formatMoney(collectedTotal)} />
              <DetailRow label={t('Amount due')} value={formatMoney(dueAmount)} />
              {Number(reservation.refundAmount) > 0 &&
              reservation.refundStatus &&
              (reservation?.status || '').toUpperCase() !== 'CANCELLED' ? (
                <Typography
                  variant="body2"
                  color="error.main"
                  sx={{ display: 'block', mt: 0.75, fontWeight: 700 }}
                >
                  {t('Refund pending')}: {formatMoney(reservation.refundAmount)} ({reservation.refundStatus})
                </Typography>
              ) : null}
              {showRefundStatusEditor ? (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}>
                    {t('Refund status')}
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                    <TextField
                      select
                      size="small"
                      label={t('Status')}
                      value={refundStatusLocal}
                      onChange={(e) => setRefundStatusLocal(e.target.value)}
                      disabled={refundStatusSaving}
                      sx={{ minWidth: { sm: 200 } }}
                    >
                      <MenuItem value="PENDING">{t('Pending')}</MenuItem>
                      <MenuItem value="PROCESSED">{t('Refund processed')}</MenuItem>
                      <MenuItem value="NOT_APPLICABLE">{t('No Refund Needed')}</MenuItem>
                    </TextField>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleRefundStatusSave}
                      disabled={refundStatusUnchanged || refundStatusSaving}
                    >
                      {refundStatusSaving ? t('Saving...') : t('Update refund status')}
                    </Button>
                  </Stack>
                </Box>
              ) : null}
              {Array.isArray(reservation.paymentLedger) && reservation.paymentLedger.length > 0 ? (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {t('Payment history')}
                  </Typography>
                  {reservation.paymentLedger.map((row, i) => (
                    <Typography key={`${row.paidAt || i}-${i}`} variant="caption" sx={{ display: 'block', mt: 0.35 }}>
                      {row.method || '—'} · {formatMoney(row.amount)}
                      {row.reference ? ` · ${row.reference}` : ''}
                    </Typography>
                  ))}
                </Box>
              ) : null}
              {allowPaymentCollect ? (
                <Box sx={{ mt: 1.5 }}>
                  {!collectMode ? (
                    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.5 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setCollectMode(true)}
                        disabled={!canCollectPayment}
                      >
                        {t('Collect payment')}
                      </Button>
                    </Stack>
                  ) : (
                    <>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}
                      >
                        {t('Record payment')}
                      </Typography>
                      <Stack spacing={1.25}>
                        <TextField
                          select
                          variant="outlined"
                          fullWidth
                          label={t('Method')}
                          size="small"
                          value={collectMethod}
                          onChange={(e) => setCollectMethod(e.target.value)}
                          disabled={!canCollectPayment || collectSaving}
                        >
                          {PAYMENT_METHODS.map((m) => (
                            <MenuItem key={m} value={m}>
                              {m.replace(/_/g, ' ')}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          variant="outlined"
                          fullWidth
                          label={t('Amount')}
                          size="small"
                          type="number"
                          inputProps={{ min: 0, step: '0.01', max: dueAmount > 0 ? dueAmount : undefined }}
                          value={collectAmount}
                          onChange={(e) => setCollectAmount(e.target.value)}
                          disabled={!canCollectPayment || collectSaving}
                          placeholder={t('0.00')}
                          helperText={canCollectPayment ? `${t('Due')}: ${formatMoney(dueAmount)}` : t('Nothing due')}
                          FormHelperTextProps={{ sx: { mx: 0 } }}
                        />
                        <TextField
                          variant="outlined"
                          fullWidth
                          label={t('Reference (optional)')}
                          size="small"
                          value={collectRef}
                          onChange={(e) => setCollectRef(e.target.value)}
                          disabled={!canCollectPayment || collectSaving}
                          placeholder={t('Txn id, receipt no., etc.')}
                        />
                        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 0.5 }}>
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => setCollectMode(false)}
                            disabled={collectSaving}
                          >
                            {t('Discard')}
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={handleCollectPayment}
                            disabled={!canCollectPayment || collectSaving}
                          >
                            {collectSaving ? t('Saving...') : t('Collect payment')}
                          </Button>
                        </Stack>
                      </Stack>
                    </>
                  )}
                </Box>
              ) : null}
              {(reservation?.status || '').toUpperCase() === 'CANCELLED' ? (
                <>
                  {reservation.refundAmount != null && Number(reservation.refundAmount) > 0 ? (
                    <DetailRow label={t('Refund amount')} value={formatMoney(reservation.refundAmount)} />
                  ) : null}
                  <DetailRow label={t('Razorpay payment ID')} value={reservation.razorpayPaymentId} />
                </>
              ) : null}
              {reservation?.previousTotalCost != null || reservation?.revisedTotalCost != null ? (
                <>
                  <Divider sx={{ my: 1.25 }} />
                  <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                    {t('Payment revision')}
                  </Typography>
                  <DetailRow label={t('Previous amount')} value={formatMoney(reservation.previousTotalCost)} />
                  <DetailRow label={t('Updated amount')} value={formatMoney(reservation.revisedTotalCost ?? reservation.totalCost)} />
                  <DetailRow label={t('Revision type')} value={paymentAdjustmentLabel(reservation, t)} />
                  <DetailRow label={t('Adjustment amount')} value={formatMoney(reservation.paymentAdjustmentAmount)} />
                  <DetailRow
                    label={t('Revised at')}
                    value={
                      reservation?.paymentRevisionUpdatedAt
                        ? dayjs(reservation.paymentRevisionUpdatedAt).format('D MMM YYYY, h:mm A')
                        : null
                    }
                  />
                </>
              ) : null}
            </SectionCard>

            <SectionCard title={t('GUEST')}>
              <Typography variant="body1" fontWeight={600}>
                {guestName(reservation)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, wordBreak: 'break-all' }}>
                {guestEmail(reservation)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {guestPhone(reservation)}
              </Typography>
            </SectionCard>

            {reservation.hotels ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 0.5 }}>
                {t('Hotel')}: {reservation.hotels}
              </Typography>
            ) : null}
          </>
        )}
      </Box>
    </>
  );
}

