import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  formatMoney,
  reservationGrandTotal,
  reservationCollectedAmount,
  reservationPendingAmount,
  reservationAdvancePercent,
  isPartiallyPaidBooking,
} from './reservationDisplayUtils';

/** Card footer — payment summary on the right; optional hint on the left. */
export default function ReservationCardFooter({ booking, t, mealPreTax = 0, leftHint }) {
  const grandTotal = reservationGrandTotal(booking);
  const partial = isPartiallyPaidBooking(booking);
  const collected = reservationCollectedAmount(booking);
  const pending = reservationPendingAmount(booking);
  const pct = reservationAdvancePercent(booking);

  let footerLeft = null;
  if (partial) {
    footerLeft = (
      <Typography variant="caption" className="cp-res-card__payment-hint" component="div">
        <span className="cp-res-card__payment-dot" aria-hidden="true" />
        {pct}% {t('paid')} · {formatMoney(pending)} {t('due at check-in')}
      </Typography>
    );
  } else if (leftHint) {
    footerLeft = (
      <Typography variant="caption" className="cp-res-card__sub-line">
        {leftHint}
      </Typography>
    );
  } else if (mealPreTax > 0.01) {
    footerLeft = (
      <Typography variant="caption" className="cp-res-card__sub-line">
        {t('Meals')} {formatMoney(mealPreTax)}
      </Typography>
    );
  }

  return (
    <Box className="cp-res-card__footer">
      <Box className="cp-res-card__footer-left">{footerLeft}</Box>
      <Box className="cp-res-card__amount-col">
        <Typography variant="body2" fontWeight={700} className="cp-res-card__total">
          {formatMoney(grandTotal)}
        </Typography>
        {partial ? (
          <Typography variant="caption" className="cp-res-card__paid-line cp-res-card__paid-line--ok" component="span">
            {t('Paid')}: {formatMoney(collected)}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

export function partialPaymentStatusChipLabel(booking, t, statusText) {
  const pct = reservationAdvancePercent(booking);
  if (pct > 0 && pct < 100) {
    return `${t('Partial')} · ${pct}%`;
  }
  return statusText;
}
