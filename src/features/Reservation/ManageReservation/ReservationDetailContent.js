import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Box, IconButton, Typography, Divider, Stack, Button, TextField, MenuItem } from '@mui/material';
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
  statusLabel,
  channelLabel,
  cpSourceLabel,
  displayAdultGuestCount,
  paymentStatusLine,
  nightsBetween,
} from '../reservationDisplayUtils';
import { DetailRow, SectionCard } from '../ReservationDrawerShared';

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
  const room = Number(booking?.totalCost) || 0;
  const sup = Number(booking?.supplementTotal) || 0;
  return room + sup;
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
    setCollectAmount('');
    setCollectMethod('CASH');
    setCollectRef('');
    setCollectMode(false);
  }, [reservation]);

  useEffect(() => {
    setRefundStatusLocal(normalizeRefundStatusForEdit(reservation?.refundStatus));
  }, [reservation?.reservationId, reservation?.refundStatus]);

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
      if (arr.length > 0 && !arr.some((r) => r?.roomId === form.roomId)) {
        setForm((s) => ({ ...s, roomId: arr[0]?.roomId || '' }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editMode, reservation?.hotelId, form.checkInDate, form.checkOutDate, form.roomId, dispatch]);

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
    if (!editMode || !selectedRoom || liveNights == null) return null;
    const basePrice = Number(selectedRoom?.basePrice);
    const rooms = Number(form.noofRooms);
    if (!Number.isFinite(basePrice) || basePrice <= 0) return null;
    if (!Number.isFinite(rooms) || rooms <= 0) return null;
    return basePrice * rooms * liveNights;
  }, [editMode, selectedRoom, form.noofRooms, liveNights]);
  const liveDelta = useMemo(() => {
    if (livePreviewTotal == null) return null;
    return livePreviewTotal - Number(reservation?.totalCost || 0);
  }, [livePreviewTotal, reservation?.totalCost]);

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
    setSaving(true);
    const nights = dayjs(form.checkOutDate).diff(dayjs(form.checkInDate), 'day');
    const maybeBasePrice = Number(selectedRoom?.basePrice);
    const derivedPrice =
      Number.isFinite(maybeBasePrice) && maybeBasePrice > 0 && Number.isFinite(nights) && nights > 0
        ? maybeBasePrice * Number(form.noofRooms) * nights
        : Number(reservation.totalCost || 0);
    const body = {
      roomId: form.roomId,
      checkInDate: dayjs(form.checkInDate).format('YYYY-MM-DD'),
      checkOutDate: dayjs(form.checkOutDate).format('YYYY-MM-DD'),
      noofRooms: Number(form.noofRooms),
      cdnintnoOfPersons: Number(form.cdnintnoOfPersons),
      price: derivedPrice,
      changeType: 'AMENDMENT',
    };
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
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {reservation.rooms || reservation.roomName || '—'}
                  </Typography>
                </>
              ) : (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Stack spacing={1.25} sx={{ mb: 1 }}>
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
                    {formError ? (
                      <Typography variant="caption" color="error">
                        {formError}
                      </Typography>
                    ) : null}
                  </Stack>
                </LocalizationProvider>
              )}
              <Divider sx={{ my: 1.5 }} />
              <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Typography variant="caption" color="text.secondary">
                  {editMode ? t('Current amount') : t('Amount')}
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {formatMoney(reservation.totalCost)}
                </Typography>
              </Stack>
              {editMode ? (
                <>
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t('Updated amount (preview)')}
                    </Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {livePreviewTotal != null ? formatMoney(livePreviewTotal) : '—'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mt: 0.25 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t('Difference')}
                    </Typography>
                    <Box
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
                              ? 'rgba(46, 125, 50, 0.12)'
                              : liveDelta > 0
                                ? 'rgba(211, 47, 47, 0.12)'
                                : 'rgba(100, 116, 139, 0.08)',
                      }}
                    >
                      {liveDelta == null ? '—' : formatMoney(Math.abs(liveDelta))}
                      {liveDelta == null ? '' : liveDelta < 0 ? ` ${t('refund')}` : liveDelta > 0 ? ` ${t('additional')}` : ''}
                    </Box>
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

