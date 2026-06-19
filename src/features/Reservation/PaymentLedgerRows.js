import React from 'react';
import { Box, Typography } from '@mui/material';
import { DetailRow } from './ReservationDrawerShared';
import { formatMoney, formatPaymentPaidAt } from './reservationDisplayUtils';

function methodLabel(method) {
  if (!method) return '—';
  return String(method).replace(/_/g, ' ');
}

/** Payment history rows with amount, reference, paid-at timestamp, and collector id when present. */
export default function PaymentLedgerRows({ ledger, t }) {
  if (!Array.isArray(ledger) || ledger.length === 0) return null;

  return (
    <Box sx={{ mt: 1, pt: 0.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
        {t('Payment history')}
      </Typography>
      {ledger.map((row, i) => {
        const paidAtLabel = formatPaymentPaidAt(row.paidAt);
        return (
          <DetailRow
            key={`${row.reference || row.paidAt || i}-${i}`}
            label={methodLabel(row.method)}
            value={
              <>
                {formatMoney(row.amount)}
                {row.reference ? (
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', fontWeight: 400, mt: 0.25 }}
                  >
                    {t('Ref')}: {row.reference}
                  </Typography>
                ) : null}
                {paidAtLabel ? (
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', fontWeight: 400, mt: 0.25 }}
                  >
                    {t('Paid at')}: {paidAtLabel}
                  </Typography>
                ) : null}
                {row.collectedBy ? (
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', fontWeight: 400, mt: 0.25 }}
                  >
                    {t('Recorded by')}: {row.collectedBy}
                  </Typography>
                ) : null}
              </>
            }
          />
        );
      })}
    </Box>
  );
}
