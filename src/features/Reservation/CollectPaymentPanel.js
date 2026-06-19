import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { collectReservationPayment } from './CreateReservation/CreateReservationApi';
import { showSnackbar } from '../../redux/reducer/appSlice';

function formatMoneyLocal(amount, currency = 'INR') {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  const n = Number(amount);
  if (n === 0) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${n}`;
  }
}

export const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER'];

function formatMethodLabel(method) {
  return String(method || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Record balance payment on a reservation (same API as Manage Reservation / Create Reservation).
 */
export default function CollectPaymentPanel({
  reservationId,
  dueAmount,
  disabled = false,
  onCollected,
}) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [collectMode, setCollectMode] = useState(false);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState('CASH');
  const [collectRef, setCollectRef] = useState('');
  const [collectSaving, setCollectSaving] = useState(false);

  const canCollect = !disabled && dueAmount > 0.009;

  useEffect(() => {
    setCollectMode(false);
    setCollectAmount('');
    setCollectMethod('CASH');
    setCollectRef('');
  }, [reservationId, dueAmount]);

  const handleCollectPayment = async () => {
    if (!reservationId || !canCollect) return;
    const amt = Number(String(collectAmount).replace(',', '.'));
    if (!Number.isFinite(amt) || amt <= 0) {
      dispatch(showSnackbar({ type: 'error', message: t('Enter a valid amount') }));
      return;
    }
    if (amt > dueAmount + 0.0001) {
      dispatch(showSnackbar({ type: 'error', message: t('Amount cannot exceed amount due') }));
      return;
    }
    setCollectSaving(true);
    const ok = await collectReservationPayment({
      body: {
        reservationId,
        amount: amt,
        method: collectMethod,
        reference: collectRef || undefined,
      },
      dispatch,
    });
    setCollectSaving(false);
    if (ok?.success) {
      setCollectAmount('');
      setCollectRef('');
      setCollectMode(false);
      if (onCollected) await onCollected();
    }
  };

  if (!reservationId) return null;

  return (
    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
      {!collectMode ? (
        <Stack direction="row" justifyContent="flex-end">
          <Button
            variant="contained"
            size="small"
            onClick={() => setCollectMode(true)}
            disabled={!canCollect}
          >
            {t('Collect payment')}
          </Button>
        </Stack>
      ) : (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
            {t('Record payment')}
          </Typography>
          <Stack spacing={1.25}>
            <TextField
              select
              variant="outlined"
              fullWidth
              label={t('Payment method')}
              size="small"
              value={collectMethod}
              onChange={(e) => setCollectMethod(e.target.value)}
              disabled={!canCollect || collectSaving}
            >
              {PAYMENT_METHODS.map((m) => (
                <MenuItem key={m} value={m}>
                  {formatMethodLabel(m)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              variant="outlined"
              fullWidth
              label={t('Amount collected')}
              size="small"
              type="number"
              inputProps={{ min: 0, step: '0.01', max: dueAmount > 0 ? dueAmount : undefined }}
              value={collectAmount}
              onChange={(e) => setCollectAmount(e.target.value)}
              disabled={!canCollect || collectSaving}
              placeholder={t('0.00')}
              helperText={canCollect ? `${t('Balance due')}: ${formatMoneyLocal(dueAmount)}` : t('Nothing due')}
              FormHelperTextProps={{ sx: { mx: 0 } }}
            />
            <TextField
              variant="outlined"
              fullWidth
              label={t('Reference (optional)')}
              size="small"
              value={collectRef}
              onChange={(e) => setCollectRef(e.target.value)}
              disabled={!canCollect || collectSaving}
              placeholder={t('Txn id, receipt no., cheque no., etc.')}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="text" size="small" onClick={() => setCollectMode(false)} disabled={collectSaving}>
                {t('Discard')}
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleCollectPayment}
                disabled={!canCollect || collectSaving}
              >
                {collectSaving ? t('Saving...') : t('Update payment')}
              </Button>
            </Stack>
          </Stack>
        </>
      )}
      {!canCollect && !collectMode ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'right' }}>
          {disabled ? t('Payment collection is not available for this booking') : t('No balance due')}
        </Typography>
      ) : null}
    </Box>
  );
}
