import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

export default function GstSummary({
  preTax,
  gst,
  cgst,
  sgst,
  total,
  ratePercent,
  mixedRates,
  couponDiscount = 0,
  loading = false,
  error = null,
  ready = true,
  compact = false,
  sx = {},
}) {
  const labelVariant = compact ? 'caption' : 'body2';
  const valueVariant = compact ? 'body2' : 'body1';

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
    mb: compact ? 0.25 : 0.75,
  };

  return (
    <Box sx={sx}>
      {couponDiscount > 0 && (
        <Box sx={{ ...rowSx, color: 'success.main' }}>
          <Typography variant={labelVariant}>Coupon discount</Typography>
          <Typography variant={valueVariant} fontWeight={600}>
            − {Number(couponDiscount).toFixed(2)}
          </Typography>
        </Box>
      )}
      <Box sx={rowSx}>
        <Typography variant={labelVariant} fontWeight={compact ? 400 : 600}>
          Subtotal (excl. GST)
        </Typography>
        <Typography variant={valueVariant} fontWeight={600}>
          {Number(preTax).toFixed(2)}
        </Typography>
      </Box>
      <Box sx={rowSx}>
        <Typography variant={labelVariant}>{gstLabel}</Typography>
        <Typography variant={valueVariant} fontWeight={600}>
          {Number(gst).toFixed(2)}
        </Typography>
      </Box>
      {gst > 0 && (
        <>
          <Box sx={{ ...rowSx, pl: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {mixedRates || ratePercent == null ? 'CGST' : `CGST (${ratePercent / 2}%)`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {Number(cgst).toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ ...rowSx, pl: 1, mb: compact ? 0.5 : 1 }}>
            <Typography variant="caption" color="text.secondary">
              {mixedRates || ratePercent == null ? 'SGST' : `SGST (${ratePercent / 2}%)`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {Number(sgst).toFixed(2)}
            </Typography>
          </Box>
        </>
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
        <Typography variant={compact ? 'body1' : 'h6'} fontWeight={700} color="primary">
          {Number(total).toFixed(2)}
        </Typography>
      </Box>
    </Box>
  );
}
