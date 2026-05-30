import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Chip, Stack, Typography } from '@mui/material';
import RestaurantMenuOutlinedIcon from '@mui/icons-material/RestaurantMenuOutlined';
import { DetailRow } from './ReservationDrawerShared';
import {
  formatMoney,
  mealPlanDisplayLabel,
  reservationMeals,
  reservationMealPreTax,
  reservationMealGst,
  reservationRoomPreTax,
  hasMealReservation,
  roomLineMealLabel,
} from './reservationDisplayUtils';

/**
 * Meal plan summary for reservation / booking detail drawers.
 */
export default function MealReservationSection({ booking, showPriceSplit = true }) {
  const { t } = useTranslation();
  if (!booking || !hasMealReservation(booking)) {
    return null;
  }

  const mealLabel = mealPlanDisplayLabel(booking, t);
  const mealsBlock = reservationMeals(booking);
  const mealLines = mealsBlock.lines;
  const mixed = mealsBlock.mixedPlans;
  const mealPreTax = reservationMealPreTax(booking);
  const mealGst = reservationMealGst(booking);
  const roomPreTax = reservationRoomPreTax(booking);
  const showSplit = showPriceSplit && mealPreTax > 0.01 && roomPreTax > 0.01;

  const roomLinesWithMeals = (booking.roomLines || []).filter(
    (line) => line?.mealPlanId || line?.mealPlanName
  );

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        p: 1.5,
        mb: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <RestaurantMenuOutlinedIcon color="primary" fontSize="small" />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {t('Meal plan')}
        </Typography>
        {mixed ? (
          <Chip size="small" label={t('Mixed rates')} color="primary" variant="outlined" />
        ) : null}
      </Stack>

      {!mixed && mealLabel ? <DetailRow label={t('Plan')} value={mealLabel} /> : null}

      {roomLinesWithMeals.length > 0 ? (
        <Box sx={{ mt: 0.5, mb: 1 }}>
          {roomLinesWithMeals.map((line, idx) => {
            const mpLabel = roomLineMealLabel(line);
            if (!mpLabel) return null;
            return (
              <Stack
                key={`${line.roomId}-${line.mealPlanId}-${idx}`}
                direction="row"
                justifyContent="space-between"
                alignItems="baseline"
                sx={{ py: 0.35 }}
              >
                <Typography variant="body2" color="text.secondary">
                  {line.roomName || line.roomId}
                  {line.noOfRooms > 1 ? ` ×${line.noOfRooms}` : ''}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {mpLabel}
                </Typography>
              </Stack>
            );
          })}
        </Box>
      ) : null}

      {mixed && mealLines.length > 0 ? (
        <Box sx={{ mb: 1 }}>
          {mealLines.map((line, idx) => (
            <Stack
              key={`${line.roomName}-${line.planId ?? line.mealPlanId}-${idx}`}
              direction="row"
              justifyContent="space-between"
              alignItems="baseline"
              sx={{ py: 0.35 }}
            >
              <Typography variant="body2" color="text.secondary">
                {line.roomName}
                {(line.planName ?? line.mealPlanName) ? ` · ${line.planName ?? line.mealPlanName}` : ''}
                {line.quantity > 1 ? ` ×${line.quantity}` : ''}
              </Typography>
              {Number(line.totalPreTax ?? line.mealPreTax) > 0 ? (
                <Typography variant="body2" fontWeight={600}>
                  {formatMoney(line.totalPreTax ?? line.mealPreTax)}
                </Typography>
              ) : null}
            </Stack>
          ))}
        </Box>
      ) : null}

      {mealsBlock.guestCount > 0 && mealsBlock.nights > 0 && !mixed ? (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          {mealsBlock.guestCount} {t('guests')} × {mealsBlock.nights} {t('nights')}
        </Typography>
      ) : null}

      {showSplit ? (
        <>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {t('Room (excl. GST)')}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatMoney(roomPreTax)}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mt: 0.25 }}>
            <Typography variant="caption" color="text.secondary">
              {t('Meals (excl. GST)')}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatMoney(mealPreTax)}
            </Typography>
          </Stack>
        </>
      ) : mealPreTax > 0.01 ? (
        <DetailRow label={t('Meals (excl. GST)')} value={formatMoney(mealPreTax)} />
      ) : null}

      {mealGst > 0.01 ? (
        <DetailRow
          label={
            mealsBlock.gstRatePercent != null
              ? `${t('Meal GST')} (${mealsBlock.gstRatePercent}%)`
              : t('Meal GST')
          }
          value={formatMoney(mealGst)}
        />
      ) : null}
    </Box>
  );
}
