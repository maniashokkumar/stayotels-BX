import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, IconButton, Typography, Divider, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
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
} from '../Reservation/reservationDisplayUtils';
import { DetailRow, SectionCard } from '../Reservation/ReservationDrawerShared';

/**
 * @param {object} props
 * @param {object|null} props.booking
 * @param {boolean} props.showClose — show header close (drawer)
 * @param {function} [props.onClose]
 * @param {string} [props.titleId] — aria-labelledby for drawer
 * @param {import('react').RefObject} [props.closeBtnRef]
 */
export default function BookingDetailContent({ booking, showClose, onClose, titleId, closeBtnRef }) {
  const { t } = useTranslation();

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

      <Box sx={{ overflow: 'auto', flex: 1, p: 2, bgcolor: 'grey.50', minHeight: 0 }}>
        {!booking ? (
          <Typography color="text.secondary">{t('No booking selected')}</Typography>
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
                    {booking.checkIn ? dayjs(booking.checkIn).format('D MMM YYYY') : '—'}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', alignSelf: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {(() => {
                      const n = nightsBetween(booking.checkIn, booking.checkOut);
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
                    {booking.checkOut ? dayjs(booking.checkOut).format('D MMM YYYY') : '—'}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <SectionCard title={t('BOOKING DETAILS')}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                {booking.noOfRooms || 0} {t('Room(s)')} | {displayAdultGuestCount(booking)}{' '}
                {t('Adults')}
                {booking.noOfChildren != null ? ` + ${booking.noOfChildren} ${t('Children')}` : ''}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {booking.rooms || booking.roomName || '—'}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Typography variant="caption" color="text.secondary">
                  {t('Amount')}
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {formatMoney(booking.totalCost)}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {t('Status')}: {statusLabel(booking, t)}
              </Typography>
              {booking.orderId && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {t('Order')}: #{booking.orderId}
                </Typography>
              )}
              {booking.couponCode ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {t('Coupon')}: {booking.couponCode}
                  {booking.couponDiscount != null && Number(booking.couponDiscount) > 0
                    ? ` (${formatMoney(booking.couponDiscount)})`
                    : ''}
                </Typography>
              ) : null}
              <DetailRow label={t('Sales channel')} value={channelLabel(booking, t)} />
              <DetailRow label={t('Booking source')} value={cpSourceLabel(booking, t)} />
              <DetailRow label={t('Source reference')} value={booking.sourceReference} />
            </SectionCard>

            <SectionCard title={t('PAYMENT')}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <Box component="span" color="text.secondary">
                  {t('Payment status')}:{' '}
                </Box>
                <Box component="span" fontWeight={700}>
                  {paymentStatusLine(booking, t)}
                </Box>
              </Typography>
              {(booking?.status || '').toUpperCase() === 'CANCELLED' ? (
                <>
                  <DetailRow label={t('Refund status')} value={booking.refundStatus} />
                  {booking.refundAmount != null && Number(booking.refundAmount) > 0 ? (
                    <DetailRow label={t('Refund amount')} value={formatMoney(booking.refundAmount)} />
                  ) : null}
                  <DetailRow label={t('Razorpay payment ID')} value={booking.razorpayPaymentId} />
                </>
              ) : null}
            </SectionCard>

            <SectionCard title={t('GUEST')}>
              <Typography variant="body1" fontWeight={600}>
                {guestName(booking)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, wordBreak: 'break-all' }}>
                {guestEmail(booking)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {guestPhone(booking)}
              </Typography>
            </SectionCard>

            {booking.hotels && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 0.5 }}>
                {t('Hotel')}: {booking.hotels}
              </Typography>
            )}
          </>
        )}
      </Box>
    </>
  );
}
