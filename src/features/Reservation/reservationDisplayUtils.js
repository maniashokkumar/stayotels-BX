import dayjs from 'dayjs';

/**
 * Shared display helpers for reservation / booking cards and detail drawers.
 */

export function guestName(row) {
  const c = row?.customer;
  if (c) {
    const fn = c.firstName || '';
    const ln = c.lastName || '';
    const full = `${fn} ${ln}`.trim();
    if (full) return full;
  }
  return row?.customerName || '—';
}

export function guestEmail(row) {
  return row?.customer?.email || row?.guestEmail || '—';
}

export function guestPhone(row) {
  return row?.customer?.phoneNumber || row?.guestPhone || row?.phoneNumber || '—';
}

export function formatMoney(amount, currency = 'INR') {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  const n = Number(amount);
  if (n === 0) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${n}`;
  }
}

export function statusLabel(booking, t) {
  const s = (booking?.status || '').toUpperCase();
  /** Business status first: DB can have `isDeleted: true` on active rows (bad backfill / save bug). */
  if (s === 'CANCELLED') return t('Cancelled');
  if (s === 'COMPLETED') return t('Completed');
  if (s === 'HOTEL_BLOCKED') return t('Blocked');
  if (s === 'CONFIRMED' || booking?.isPaid) return t('Confirmed');
  if (s === 'PENDING') return t('Pending');
  if (booking?.isDeleted === true) return t('Removed');
  return t('Pending');
}

export function channelLabel(booking, t) {
  const ch = (booking?.salesChannel || '').toUpperCase();
  if (ch === 'CONTROL_PANEL') return t('Control panel');
  if (ch === 'WEBSITE') return t('Website');
  if (!ch) return null;
  return booking.salesChannel;
}

export function cpSourceLabel(booking, t) {
  const map = {
    WALK_IN: t('Walk-in'),
    DIRECT_ENQUIRY: t('Direct enquiry'),
    PHONE: t('Phone'),
    EMAIL: t('Email'),
    OTHER: t('Other'),
  };
  const k = (booking?.cpSourceType || '').toUpperCase();
  if (!k) return null;
  return map[k] || booking.cpSourceType;
}

/** Backend often leaves noOfAdults at 0 and only sets noOfPersons; `noOfAdults ?? noOfPersons` wrongly shows 0. */
export function displayAdultGuestCount(booking) {
  const adults = Number(booking?.noOfAdults);
  const children = Number(booking?.noOfChildren);
  const persons = Number(booking?.noOfPersons);

  if (Number.isFinite(adults) && adults > 0) return adults;
  if (Number.isFinite(children) && children > 0 && Number.isFinite(persons)) {
    const derived = persons - children;
    return derived > 0 ? derived : 0;
  }
  if (Number.isFinite(persons)) return persons;
  return 0;
}

export function paymentStatusLine(booking, t) {
  const cp = (booking?.cpPaymentStatus || '').toUpperCase();
  if (cp === 'NOT_PAID') return t('Not paid');
  if (cp === 'PARTIALLY_PAID') return t('Partially paid');
  if (cp === 'FULLY_PAID') return t('Fully paid');
  const s = (booking?.status || '').toUpperCase();
  if (s === 'HOTEL_BLOCKED') {
    return t('No online payment');
  }
  if (booking?.isPaid === true) {
    return t('Paid');
  }
  if (booking?.isPaid === false) {
    return t('Not paid');
  }
  return '—';
}

export function nightsBetween(checkIn, checkOut) {
  const a = dayjs(checkIn);
  const b = dayjs(checkOut);
  if (!a.isValid() || !b.isValid()) return '—';
  const n = b.diff(a, 'day');
  return n > 0 ? n : '—';
}
