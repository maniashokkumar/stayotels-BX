import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardActionArea,
  Stack,
} from '@mui/material';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import {
  guestName,
  formatMoney,
  statusLabel,
  channelLabel,
  cpSourceLabel,
  bookingCardMealTags,
  bookingStatusTone,
  reservationGrandTotal,
  reservationMealPreTax,
} from '../Reservation/reservationDisplayUtils';

function phoneDisplay(row) {
  const p = row?.customer?.phoneNumber || row?.guestPhone || row?.phoneNumber;
  return p && String(p).trim() ? String(p).trim() : '';
}

function MealPlanTags({ tags, t }) {
  if (!tags?.length) return null;
  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      useFlexGap
      spacing={0.5}
      className="booking-history-card-item__meals"
      aria-label={t('Meal plans')}
    >
      {tags.map((tag) => (
        <Chip
          key={tag.key}
          size="small"
          icon={tag.paid ? <RestaurantOutlinedIcon /> : undefined}
          label={tag.label}
          className={`booking-history-card-item__meal-chip${
            tag.paid ? ' booking-history-card-item__meal-chip--paid' : ''
          }`}
        />
      ))}
    </Stack>
  );
}

export default function BookingHistoryCard({ row, isActive, onOpen, t }) {
  const statusText = statusLabel(row, t);
  const tone = bookingStatusTone(row);
  const oid = row.orderId || row.reservationId || '—';
  const mealTags = bookingCardMealTags(row);
  const mealPreTax = reservationMealPreTax(row);
  const grandTotal = reservationGrandTotal(row);
  const channel = channelLabel(row, t);
  const cpSource = cpSourceLabel(row, t);
  const metaParts = [channel, cpSource].filter(Boolean);

  return (
    <Card
      elevation={0}
      className={`booking-history-card-item booking-history-card-item--${tone}${
        isActive ? ' booking-history-card-item--active' : ''
      }`}
      sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <CardActionArea
        onClick={() => onOpen(row)}
        className="booking-history-card-item__action"
        aria-label={`${t('Booking')} ${oid}, ${guestName(row)}`}
        aria-current={isActive ? 'true' : undefined}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Box className="booking-history-card-item__top">
          <Typography className="booking-history-card-item__id" variant="body2" fontWeight={700}>
            #{oid}
          </Typography>
          <Chip
            size="small"
            label={statusText}
            className={`booking-history-card-item__status booking-history-card-item__status--${tone}`}
          />
        </Box>

        <Box className="booking-history-card-item__name-row">
          <Typography
            className="booking-history-card-item__name"
            variant="subtitle1"
            fontWeight={600}
            noWrap
            title={guestName(row)}
          >
            {guestName(row)}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            className="booking-history-card-item__phone"
            noWrap
            title={phoneDisplay(row) || undefined}
          >
            {phoneDisplay(row) || '—'}
          </Typography>
        </Box>

        {metaParts.length > 0 ? (
          <Typography variant="caption" color="text.secondary" className="booking-history-card-item__meta">
            {metaParts.join(' · ')}
          </Typography>
        ) : null}

        <MealPlanTags tags={mealTags} t={t} />

        <Box className="booking-history-card-item__dates">
          <Box className="booking-history-card-item__date-block">
            <Typography variant="caption" color="text.secondary" component="span" display="block">
              {t('Check-in')}
            </Typography>
            <Typography variant="caption" className="booking-history-card-item__date-value">
              {row.checkIn || '—'}
            </Typography>
          </Box>
          <Box className="booking-history-card-item__date-block booking-history-card-item__date-block--end">
            <Typography variant="caption" color="text.secondary" component="span" display="block">
              {t('Checkout')}
            </Typography>
            <Typography variant="caption" className="booking-history-card-item__date-value">
              {row.checkOut || '—'}
            </Typography>
          </Box>
        </Box>

        <Box className="booking-history-card-item__bottom">
          <Box className="booking-history-card-item__pricing">
            {mealPreTax > 0.01 ? (
              <Typography variant="caption" color="text.secondary" className="booking-history-card-item__meals-amt">
                {t('Meals')} {formatMoney(mealPreTax)}
              </Typography>
            ) : null}
            <Typography variant="body1" fontWeight={700} className="booking-history-card-item__amount">
              {formatMoney(grandTotal)}
            </Typography>
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
}
