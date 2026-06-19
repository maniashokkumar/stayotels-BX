import React from 'react';
import { Box, Typography } from '@mui/material';
import { formatMoney } from '../Reservation/reservationDisplayUtils';

/** Currency for booking drawer (shows ₹0.00 instead of em dash). */
export function money(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return '—';
  if (v === 0) {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR' }).format(0);
    } catch {
      return '₹0.00';
    }
  }
  const formatted = formatMoney(v);
  return formatted === '—' ? '₹0.00' : formatted;
}

function LabeledRow({ label, value, bold, highlight }) {
  if (value == null || value === '') return null;
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
        py: 0.35,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
        {label}
      </Typography>
      <Typography
        variant={bold ? 'body2' : 'caption'}
        fontWeight={bold ? 700 : 600}
        color={highlight ? 'primary.main' : 'text.primary'}
        sx={{ flexShrink: 0, textAlign: 'right', whiteSpace: 'nowrap' }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function formatPersonCount(count, t) {
  const n = Number(count);
  if (!Number.isFinite(n) || n < 1) return null;
  return `${n} ${t('person')}`;
}

export function RoomLineCard({ line, roomIndex, t }) {
  const mealLabel = line.mealLabel || t('Room only');
  const isPaidMeal = line.hasPaidMeal || (line.mealPreTax ?? 0) > 0.01;
  const guests = line.noOfPersons;
  const extra = Number(line.extraPersons) || 0;

  const guestValue = (() => {
    if (!Number.isFinite(Number(guests)) || Number(guests) < 1) return null;
    if (extra > 0) {
      const base = Math.max(1, Number(guests) - Number(extra));
      const baseLabel = formatPersonCount(base, t);
      const extraLabel = formatPersonCount(extra, t) || `${extra}`;
      return `${baseLabel} (+${extraLabel} ${t('extra')})`;
    }
    return formatPersonCount(guests, t);
  })();

  const mealsTotal = (line.mealPreTax ?? 0) + (line.mealTax ?? 0);

  return (
    <Box
      sx={{
        px: 1.5,
        py: 1.25,
        bgcolor: roomIndex % 2 === 0 ? 'grey.50' : 'background.paper',
        borderTop: roomIndex > 0 ? '1px solid' : 'none',
        borderColor: 'divider',
      }}
    >
      <Typography variant="caption" color="primary.main" fontWeight={700}>
        {t('Room')} {line.lineNumber ?? roomIndex + 1}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ mt: 0.25 }}>
        {line.roomName}
      </Typography>
      <Box sx={{ mt: 0.75 }}>
        <LabeledRow label={t('Guest')} value={guestValue} />
        <LabeledRow label={t('Meal type')} value={mealLabel} />
      </Box>

      <Box
        sx={{
          mt: 1,
          pt: 1,
          borderTop: '1px dashed',
          borderColor: 'divider',
        }}
      >
        <LabeledRow label={t('Room (excl. GST)')} value={money(line.roomPreTax ?? 0)} bold />
        {isPaidMeal ? (
          <>
            <LabeledRow
              label={t('Meals (excl. GST)')}
              value={money(line.mealPreTax ?? 0)}
              highlight
            />
            {(line.mealTax ?? 0) > 0.01 ? (
              <LabeledRow label={t('Meal GST')} value={money(line.mealTax)} />
            ) : null}
            <LabeledRow label={t('Meals total')} value={money(mealsTotal)} bold />
          </>
        ) : null}
      </Box>
    </Box>
  );
}
