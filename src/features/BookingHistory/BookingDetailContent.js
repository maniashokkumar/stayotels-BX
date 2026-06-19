import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  IconButton,
  Typography,
  Divider,
  Stack,
  Tooltip,
  Chip,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import dayjs from 'dayjs';
import {
  guestName,
  guestEmail,
  guestPhone,
  formatMoney,
  statusLabel,
  channelLabel,
  displayGuestSummary,
  paymentStatusLine,
  nightsBetween,
  reservationGrandTotal,
  reservationCollectedAmount,
  reservationPendingAmount,
  isPartiallyPaidBooking,
  reservationAdvancePercent,
  reservationRoomPreTax,
  reservationMealGst,
  reservationRoomGst,
  reservationMeals,
  mealPlanDisplayLabel,
  mealPlanCardLabel,
  canCollectReservationPayment,
  formatPaymentPaidAt,
} from '../Reservation/reservationDisplayUtils';
import { DetailRow, SectionCard } from '../Reservation/ReservationDrawerShared';
import { partialPaymentStatusChipLabel } from '../Reservation/PartialPaymentCardFooter';
import CollectPaymentPanel from '../Reservation/CollectPaymentPanel';
import PaymentLedgerRows from '../Reservation/PaymentLedgerRows';
import GstSummary from '../../components/GstSummary/GstSummary';
import { gstSummaryMealProps } from '../Reservation/mealsBlockUtils';
import { perRoomBookingRows } from './bookingDetailHelpers';
import { RoomLineCard } from './BookingDetailRows';

export default function BookingDetailContent({
  booking,
  showClose,
  onClose,
  titleId,
  closeBtnRef,
  onSaved,
}) {
  const { t } = useTranslation();

  return (
    <>
      <DrawerHeader showClose={showClose} onClose={onClose} titleId={titleId} closeBtnRef={closeBtnRef} t={t} />
      <Box sx={{ overflow: 'auto', flex: 1, p: booking ? 2 : 0, bgcolor: 'grey.50', minHeight: 0 }}>
        {!booking ? (
          <Box sx={{ p: 2 }}>
            <Typography color="text.secondary">{t('No booking selected')}</Typography>
          </Box>
        ) : (
          renderBookingDetail(booking, t, onSaved)
        )}
      </Box>
    </>
  );
}

function renderBookingDetail(booking, t, onSaved) {
  const meals = reservationMeals(booking);
  const roomPreTax = reservationRoomPreTax(booking);
  const mealGst = reservationMealGst(booking);
  const roomGst = reservationRoomGst(booking);
  const grandTotal = reservationGrandTotal(booking);
  const collectedTotal = reservationCollectedAmount(booking);
  const dueAmount = reservationPendingAmount(booking);
  const partialPay = isPartiallyPaidBooking(booking);
  const advancePct = reservationAdvancePercent(booking);
  const statusText = statusLabel(booking, t);
  const partialChipLabel = partialPay ? partialPaymentStatusChipLabel(booking, t, statusText) : statusText;
  const perRoomRows = perRoomBookingRows(booking);
  const mealLabel = mealPlanDisplayLabel(booking, t);
  const planCardLabel = mealPlanCardLabel(booking, t);
  const allowPaymentCollect = canCollectReservationPayment(booking);

  return (
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
              {t('Check-in')}
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {booking.checkIn ? dayjs(booking.checkIn).format('D MMM YYYY') : '—'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', alignSelf: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {(() => {
                const n = nightsBetween(booking.checkIn, booking.checkOut);
                return n === '—' ? '—' : `${n} ${t('Nights')}`;
              })()}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              {t('Check-out')}
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {booking.checkOut ? dayjs(booking.checkOut).format('D MMM YYYY') : '—'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <SectionCard title={t('ROOMS & GUESTS')}>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            {booking.noOfRooms || 0} {t('rooms total')} · {displayGuestSummary(booking, t)}
            {Number(booking.noOfChildren) > 0 ? ` · ${booking.noOfChildren} ${t('children')}` : ''}
          </Typography>
          {meals.mixedPlans ? (
            <Chip size="small" label={t('Different rates')} variant="outlined" color="primary" />
          ) : null}
        </Stack>

        {perRoomRows.length > 0 ? (
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            {perRoomRows.map((line, i) => (
              <RoomLineCard key={`${line.mealPlanId}-${line.lineNumber}-${i}`} line={line} roomIndex={i} t={t} />
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {booking.rooms || booking.roomName || '—'}
          </Typography>
        )}
      </SectionCard>

      <SectionCard title={t('PRICING')}>
        <GstSummary
          compact
          preTax={roomPreTax + meals.totalPreTax}
          roomPreTax={roomPreTax}
          {...gstSummaryMealProps(meals)}
          gst={roomGst}
          cgst={roomGst / 2}
          sgst={roomGst / 2}
          mealGst={mealGst}
          mealGstRatePercent={meals.gstRatePercent}
          total={grandTotal}
          couponDiscount={Number(booking.couponDiscount) || 0}
        />

        {Array.isArray(booking.taxBreakdown) && booking.taxBreakdown.length > 0 ? (
          <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {t('Room GST by night')}
            </Typography>
            <Tooltip
              title={
                <Box sx={{ p: 0.5, maxWidth: 280 }}>
                  {booking.taxBreakdown.map((tx, idx) => (
                    <Typography key={idx} variant="caption" display="block" sx={{ mb: 0.25 }}>
                      {tx.roomName || tx.stayDate}: {tx.gstRate}% — {formatMoney(tx.gstAmount)}
                    </Typography>
                  ))}
                </Box>
              }
            >
              <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary', cursor: 'pointer' }} />
            </Tooltip>
          </Stack>
        ) : null}

        <Divider sx={{ my: 1.5 }} />
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography variant="subtitle2" fontWeight={700}>
            {t('Total payable')}
          </Typography>
          <Typography variant="h6" fontWeight={700} color="primary.main">
            {formatMoney(grandTotal)}
          </Typography>
        </Stack>
      </SectionCard>

      {partialPay ? (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
            {advancePct}% {t('collected')} — {t('Collect remainder at check-in')}
          </Typography>
          <Typography variant="body2">
            {t('Guest paid')} <strong>{formatMoney(collectedTotal)}</strong> {t('of')}{' '}
            <strong>{formatMoney(grandTotal)}</strong>. {t('Balance due')}:{' '}
            <strong>{formatMoney(dueAmount)}</strong>.
          </Typography>
        </Alert>
      ) : null}

      <SectionCard title={t('BOOKING REFERENCE')}>
        <DetailRow
          label={t('Status')}
          value={
            partialPay ? (
              <Chip size="small" label={partialChipLabel} className="cp-res-card__status cp-res-card__status--partial-inline" />
            ) : (
              statusText
            )
          }
        />
        <DetailRow label={t('Order')} value={booking.orderId ? `#${booking.orderId}` : null} />
        <DetailRow label={t('Reservation ID')} value={booking.reservationId} />
        <DetailRow label={t('Sales channel')} value={channelLabel(booking, t)} />
        {planCardLabel ? (
          <DetailRow label={t('Plan')} value={planCardLabel} />
        ) : mealLabel ? (
          <DetailRow label={t('Meal summary')} value={mealLabel} />
        ) : null}
        {booking.hotels ? <DetailRow label={t('Hotel')} value={booking.hotels} /> : null}
        {booking.rooms ? <DetailRow label={t('Room')} value={booking.rooms} /> : null}
      </SectionCard>

      <SectionCard
        title={t('PAYMENT')}
        sx={
          partialPay
            ? {
                border: '1px solid',
                borderColor: 'warning.light',
              }
            : undefined
        }
      >
        <DetailRow
          label={t('Payment status')}
          value={
            partialPay ? (
              <Chip size="small" label={partialChipLabel} className="cp-res-card__status cp-res-card__status--partial-inline" />
            ) : (
              paymentStatusLine(booking, t)
            )
          }
        />
        <DetailRow label={t('Total payable (incl. GST)')} value={formatMoney(grandTotal)} />
        <DetailRow
          label={t('Amount paid')}
          value={formatMoney(collectedTotal)}
          valueSx={partialPay ? { color: 'success.main' } : undefined}
        />
        {(partialPay || dueAmount > 0.009) && (
          <DetailRow
            label={t('Balance due')}
            value={formatMoney(dueAmount)}
            valueSx={partialPay ? { color: 'warning.dark' } : undefined}
          />
        )}
        <DetailRow label={t('Pre-tax subtotal')} value={formatMoney(booking.totalCost)} />
        <DetailRow label={t('Total tax')} value={formatMoney(booking.totalTax)} />
        {booking.lastUpdatedOn ? (
          <DetailRow label={t('Last updated')} value={formatPaymentPaidAt(booking.lastUpdatedOn)} />
        ) : null}

        <PaymentLedgerRows ledger={booking.paymentLedger} t={t} />

        {booking.razorpayOrderId ? <DetailRow label={t('Razorpay order')} value={booking.razorpayOrderId} /> : null}
        {booking.razorpayPaymentId ? <DetailRow label={t('Razorpay payment')} value={booking.razorpayPaymentId} /> : null}

        {allowPaymentCollect ? (
          <CollectPaymentPanel reservationId={booking.reservationId} dueAmount={dueAmount} onCollected={onSaved} />
        ) : null}
      </SectionCard>

      <SectionCard title={t('GUEST')}>
        <DetailRow label={t('Name')} value={guestName(booking)} />
        <DetailRow label={t('Email')} value={guestEmail(booking)} />
        <DetailRow label={t('Phone')} value={guestPhone(booking)} />
      </SectionCard>
    </>
  );
}

function DrawerHeader({ showClose, onClose, titleId, closeBtnRef, t }) {
  return (
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
        {t('Booking')}
      </Typography>
      {showClose && onClose ? (
        <IconButton
          ref={closeBtnRef}
          onClick={onClose}
          size="small"
          sx={{ color: 'primary.contrastText' }}
          aria-label={t('Close')}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </Box>
  );
}
