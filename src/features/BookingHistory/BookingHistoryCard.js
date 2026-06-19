import React from 'react';
import { Box, Typography, Chip, Card, CardActionArea } from '@mui/material';
import {
  guestName,
  statusLabel,
  channelLabel,
  cpSourceLabel,
  bookingStatusTone,
  reservationMealPreTax,
  isPartiallyPaidBooking,
  reservationDateShort,
  mealPlanCardLabel,
  nightsBetween,
} from '../Reservation/reservationDisplayUtils';
import ReservationCardFooter, {
  partialPaymentStatusChipLabel,
} from '../Reservation/PartialPaymentCardFooter';

function phoneDisplay(row) {
  const p = row?.customer?.phoneNumber || row?.guestPhone || row?.phoneNumber;
  return p && String(p).trim() ? String(p).trim() : '';
}

export default function BookingHistoryCard({ row, isActive, onOpen, t }) {
  const statusText = statusLabel(row, t);
  const tone = bookingStatusTone(row);
  const oid = row.orderId || row.reservationId || '—';
  const mealPreTax = reservationMealPreTax(row);
  const partialPay = isPartiallyPaidBooking(row);
  const chipLabel = partialPay ? partialPaymentStatusChipLabel(row, t, statusText) : statusText;
  const cpSource = cpSourceLabel(row, t);
  const channel = channelLabel(row, t);
  const metaParts = [channel, cpSource].filter(Boolean);
  const planLabel = mealPlanCardLabel(row, t);
  const statusClass = partialPay ? 'partial' : tone;
  const nights = nightsBetween(row.checkIn, row.checkOut);
  const nightsLabel = nights === '—' ? null : `${nights} ${t('N')}`;

  return (
    <Card
      elevation={0}
      className={`cp-res-card cp-res-card--${tone}${isActive ? ' cp-res-card--active' : ''}`}
      sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <CardActionArea
        onClick={() => onOpen(row)}
        className="cp-res-card__action"
        aria-label={`${t('Booking')} ${oid}, ${guestName(row)}`}
        aria-current={isActive ? 'true' : undefined}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Box className="cp-res-card__header">
          <Typography className="cp-res-card__id" variant="body2" fontWeight={700}>
            #{oid}
          </Typography>
          <Chip
            size="small"
            label={chipLabel}
            className={`cp-res-card__status cp-res-card__status--${statusClass}`}
          />
        </Box>

        <Box className="cp-res-card__body">
          <Box className="cp-res-card__guest-row">
            <Typography className="cp-res-card__name" variant="body2" fontWeight={600} title={guestName(row)}>
              {guestName(row)}
            </Typography>
            <Typography className="cp-res-card__phone" variant="caption" title={phoneDisplay(row) || undefined}>
              {phoneDisplay(row) || '—'}
            </Typography>
          </Box>

          {metaParts.length > 0 ? (
            <Typography variant="caption" className="cp-res-card__meta">
              {metaParts.join(' · ')}
            </Typography>
          ) : null}

          <Box className="cp-res-card__stay">
            <Box className="cp-res-card__stay-col">
              <span className="cp-res-card__lbl">{t('Check-in')}</span>
              <span className="cp-res-card__val">{reservationDateShort(row.checkIn)}</span>
            </Box>
            {nightsLabel ? (
              <span className="cp-res-card__nights" aria-label={`${nights} ${t('Nights')}`}>
                {nightsLabel}
              </span>
            ) : (
              <span className="cp-res-card__nights" aria-hidden="true">
                ·
              </span>
            )}
            <Box className="cp-res-card__stay-col cp-res-card__stay-col--end">
              <span className="cp-res-card__lbl">{t('Check-out')}</span>
              <span className="cp-res-card__val">{reservationDateShort(row.checkOut)}</span>
            </Box>
          </Box>

          {planLabel ? (
            <Box className="cp-res-card__details">
              <span className="cp-res-card__detail">
                <span className="cp-res-card__lbl">{t('Plan')}</span>
                <span className="cp-res-card__val" title={planLabel}>
                  {planLabel}
                </span>
              </span>
            </Box>
          ) : null}
        </Box>

        <ReservationCardFooter booking={row} t={t} mealPreTax={mealPreTax} />
      </CardActionArea>
    </Card>
  );
}
