import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const formatInr = (n) =>
  `₹${(Number(n) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function CpQuoteSummary({ summary, loading, error }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          {t('Calculating tax…')}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Typography variant="body2" color="error" sx={{ py: 1 }}>
        {error}
      </Typography>
    );
  }

  if (!summary?.valid) {
    return null;
  }

  const meals = summary.meals;
  const mealLines = meals?.lines || [];

  return (
    <Box
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: '#fafafa',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        {t('Price breakdown')}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
        <Typography variant="body2">{t('Room stay (excl. GST)')}</Typography>
        <Typography variant="body2">{formatInr(summary.roomPreTax)}</Typography>
      </Box>

      {summary.mealPreTax > 0.01 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">{t('Meals (excl. GST)')}</Typography>
            <Typography variant="body2">{formatInr(summary.mealPreTax)}</Typography>
          </Box>
          {mealLines.map((line, idx) => (
            <Typography
              key={`${line.roomName}-${line.planCode}-${idx}`}
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', pl: 1, mb: 0.25 }}
            >
              {line.roomName} — {line.planName || line.planCode}: {formatInr(line.totalPreTax)}
            </Typography>
          ))}
        </>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, mt: 1 }}>
        <Typography variant="body2">
          {t('GST')}
          {summary.ratePercent != null && !summary.mixedRates
            ? ` (${summary.ratePercent}%)`
            : ''}
        </Typography>
        <Typography variant="body2">{formatInr(summary.gst)}</Typography>
      </Box>

      {(summary.cgst > 0 || summary.sgst > 0) && (
        <Box sx={{ pl: 1, mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            CGST: {formatInr(summary.cgst)}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            SGST: {formatInr(summary.sgst)}
          </Typography>
          {summary.mealTax > 0.01 && (
            <Typography variant="caption" color="text.secondary" display="block">
              {t('Meal GST')}: {formatInr(summary.mealTax)}
            </Typography>
          )}
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mt: 1.5,
          pt: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {t('Total (incl. GST)')}
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {formatInr(summary.total)}
        </Typography>
      </Box>
    </Box>
  );
}
