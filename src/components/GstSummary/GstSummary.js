import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { normalizeMealsBlock } from '../../features/Reservation/mealsBlockUtils';
import { formatMoney } from '../../features/Reservation/reservationDisplayUtils';

/**
 * GST breakdown for quotes and reservations. Pass `meals` from normalizeMealsBlock / gstSummaryMealProps.
 */
export default function GstSummary({
  preTax,
  gst,
  cgst,
  sgst,
  total,
  ratePercent,
  mixedRates,
  mealGst = 0,
  mealGstRatePercent = null,
  couponDiscount = 0,
  meals: mealsProp = null,
  roomPreTax = null,
  loading = false,
  error = null,
  ready = true,
  compact = false,
  sx = {},
}) {
  const labelVariant = compact ? 'caption' : 'body2';
  const valueVariant = compact ? 'body2' : 'body1';

  const mealBlock = normalizeMealsBlock(mealsProp != null ? { meals: mealsProp } : {});
  const mealsPreTax = mealBlock.totalPreTax;
  const mealLabel = mealBlock.displayName;
  const mixedPlans = mealBlock.mixedPlans;
  const mealLines = mealBlock.lines;
  const mealGstRate = mealGstRatePercent ?? mealBlock.gstRatePercent;
  const mealGstAmount = Number(mealGst) > 0 ? Number(mealGst) : mealBlock.totalTax;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, ...sx }}>
        <CircularProgress size={18} />
        <Typography variant={labelVariant} color="text.secondary">
          Calculating GST…
        </Typography>
      </Box>
    );
  }

  if (error || !ready) {
    return (
      <Typography variant={labelVariant} color="error" sx={{ py: 0.5, ...sx }}>
        {error || 'Unable to load price. Please refresh or try again.'}
      </Typography>
    );
  }

  const gstLabel =
    mixedRates || ratePercent == null ? 'GST' : `GST (${ratePercent}%)`;

  const rowSx = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 2,
    mb: compact ? 0.25 : 0.75,
  };

  const valueSx = { fontWeight: 600, textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' };

  const roomStayPreTax =
    roomPreTax != null && Number(roomPreTax) > 0 ? Number(roomPreTax) : Number(preTax);
  const showMealSplit = mealsPreTax > 0.009;

  return (
    <Box sx={sx}>
      {couponDiscount > 0 && (
        <Box sx={{ ...rowSx, color: 'success.main' }}>
          <Typography variant={labelVariant}>Coupon discount</Typography>
          <Typography variant={valueVariant} sx={valueSx}>
            − {formatMoney(couponDiscount)}
          </Typography>
        </Box>
      )}
      {showMealSplit ? (
        <>
          <Box sx={rowSx}>
            <Typography variant={labelVariant} fontWeight={compact ? 400 : 600}>
              Room stay (excl. GST)
            </Typography>
            <Typography variant={valueVariant} sx={valueSx}>
              {formatMoney(roomStayPreTax)}
            </Typography>
          </Box>
          <Box sx={rowSx}>
            <Typography variant={labelVariant} fontWeight={compact ? 400 : 600}>
              Meals (excl. GST)
            </Typography>
            <Typography variant={valueVariant} sx={valueSx}>
              {formatMoney(mealsPreTax)}
            </Typography>
          </Box>
          {mixedPlans && mealLines.length > 0 && (
            <Box sx={{ pl: 1, mb: compact ? 0.5 : 0.75 }}>
              {mealLines.map((line, idx) => (
                <Box
                  key={`${line.roomName}-${line.planId}-${idx}`}
                  sx={{ ...rowSx, mb: 0.25 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {line.roomName}
                    {line.planName ? ` · ${line.planName}` : ''}
                    {line.quantity > 1 ? ` ×${line.quantity}` : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={valueSx}>
                    {formatMoney(line.totalPreTax)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
          {!mixedPlans && mealLabel && (
            <Typography
              variant="caption"
              sx={{ color: 'primary.main', fontWeight: 600, display: 'block', mb: 0.5 }}
            >
              {mealLabel}
            </Typography>
          )}
        </>
      ) : (
        <Box sx={rowSx}>
          <Typography variant={labelVariant} fontWeight={compact ? 400 : 600}>
            Subtotal (excl. GST)
          </Typography>
          <Typography variant={valueVariant} sx={valueSx}>
            {formatMoney(preTax)}
          </Typography>
        </Box>
      )}
      <Box sx={rowSx}>
        <Typography variant={labelVariant}>{gstLabel}</Typography>
        <Typography variant={valueVariant} sx={valueSx}>
          {formatMoney(gst)}
        </Typography>
      </Box>
      {gst > 0 && (
        <>
          <Box sx={{ ...rowSx, pl: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {mixedRates || ratePercent == null ? 'CGST' : `CGST (${ratePercent / 2}%)`}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={valueSx}>
              {formatMoney(cgst)}
            </Typography>
          </Box>
          <Box sx={{ ...rowSx, pl: 1, mb: mealGstAmount > 0 ? 0.25 : compact ? 0.5 : 1 }}>
            <Typography variant="caption" color="text.secondary">
              {mixedRates || ratePercent == null ? 'SGST' : `SGST (${ratePercent / 2}%)`}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={valueSx}>
              {formatMoney(sgst)}
            </Typography>
          </Box>
        </>
      )}
      {mealGstAmount > 0.009 && (
        <Box sx={{ ...rowSx, pl: 1, mb: compact ? 0.5 : 1 }}>
          <Typography variant="caption" color="text.secondary">
            {mealGstRate != null && Number.isFinite(Number(mealGstRate))
              ? `Meal GST (${Number(mealGstRate)}%)`
              : 'Meal GST'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={valueSx}>
            {formatMoney(mealGstAmount)}
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          ...rowSx,
          mt: compact ? 0.5 : 1,
          pt: compact ? 0.5 : 1,
          mb: 0,
          fontWeight: 'bold',
        }}
      >
        <Typography variant={compact ? 'body2' : 'subtitle1'} fontWeight={700}>
          Total (incl. GST)
        </Typography>
        <Typography variant={compact ? 'body1' : 'h6'} fontWeight={700} color="primary" sx={valueSx}>
          {formatMoney(total)}
        </Typography>
      </Box>
    </Box>
  );
}
