import dayjs from 'dayjs';
import { normalizeMealsBlock } from './mealsBlockUtils';
import { mealPlanCodeOption, MEAL_PLAN_CODE_OPTIONS } from '../Hotel/HotelMealPlans/mealPlanCodeOptions';

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

export function isTerminalBookingStatus(booking) {
  if (!booking) return true;
  const s = (booking?.status || '').toUpperCase();
  return s === 'CANCELLED' || s === 'COMPLETED' || booking?.isDeleted === true;
}

export function statusLabel(booking, t) {
  const s = (booking?.status || '').toUpperCase();
  if (s === 'CANCELLED') return t('Cancelled');
  if (s === 'COMPLETED') return t('Completed');
  if (s === 'HOTEL_BLOCKED') return t('Blocked');
  if (!isTerminalBookingStatus(booking)) {
    const paySt = (booking?.cpPaymentStatus || '').toUpperCase();
    if (paySt === 'PARTIALLY_PAID') return t('Partially paid');
  }
  if (s === 'CONFIRMED' || booking?.isPaid) return t('Confirmed');
  if (s === 'PENDING') return t('Pending');
  if (booking?.isDeleted === true) return t('Removed');
  return t('Pending');
}

export function channelLabel(booking, t) {
  const ch = (booking?.salesChannel || '').toUpperCase();
  if (ch === 'WEBSITE') return t('Website');
  if (ch === 'CONTROL_PANEL' || ch === 'CP') return t('Control panel');
  if (ch === 'WALK_IN') return t('Walk-in');
  if (ch === 'PHONE') return t('Phone');
  return booking?.salesChannel || '—';
}

export function cpSourceLabel(booking, t) {
  const src = booking?.sourceReference || booking?.cpSource;
  if (!src) return null;
  return src;
}

/** Total billable guests (room lines, meals block, or header fallback). */
export function billableGuestCount(booking) {
  const persisted = Array.isArray(booking?.roomLines) ? booking.roomLines : [];
  if (persisted.length > 0) {
    const sum = persisted.reduce((s, l) => {
      const q = Math.max(1, Number(l?.noOfRooms) || 1);
      const g = Number(l?.noOfPersons) || 0;
      return s + (g > 0 ? g * q : 0);
    }, 0);
    if (sum > 0) return sum;
  }
  const fromMeals = Number(booking?.meals?.guestCount);
  if (fromMeals > 0) return fromMeals;
  const adults = Number(booking?.noOfAdults);
  if (adults > 0) return adults;
  return Number(booking?.noOfPersons) || 0;
}

/** Extra persons beyond the original search guest count (or explicit room-line field). */
export function extraPersonCount(booking) {
  const persisted = Array.isArray(booking?.roomLines) ? booking.roomLines : [];
  const explicit = persisted.reduce((s, l) => s + (Number(l?.extraPersons) || 0), 0);
  if (explicit > 0) return explicit;
  const billable = billableGuestCount(booking);
  const search = Number(booking?.noOfPersons) || 0;
  if (billable > search && search > 0) return billable - search;
  return 0;
}

export function extraPersonsForLine(line, booking, lineGuests) {
  const explicit = Number(line?.extraPersons ?? line?.extraGuests);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const total = lineGuests ?? Number(line?.noOfPersons) ?? 0;
  const search = Number(booking?.noOfPersons) || 0;
  if (total > search && search > 0) return total - search;
  return 0;
}

export function displayAdultGuestCount(booking) {
  return billableGuestCount(booking);
}

/** e.g. "3 guests (2 + 1 extra)" for booking drawer header. */
export function displayGuestSummary(booking, t) {
  const total = billableGuestCount(booking);
  if (!total) return `0 ${t('guests')}`;
  const extra = extraPersonCount(booking);
  if (extra > 0) {
    const base = total - extra;
    return `${total} ${t('guests')} (${base} + ${extra} ${t('extra')})`;
  }
  return `${total} ${t('guests')}`;
}

export function paymentStatusLine(booking, t) {
  if (booking?.isPaid) return t('Paid');
  const st = (booking?.cpPaymentStatus || '').toUpperCase();
  if (st === 'FULLY_PAID') return t('Fully paid');
  if (st === 'PARTIALLY_PAID') return t('Partially paid');
  if (st === 'NOT_PAID') return t('Not paid');
  return t('Pending');
}

export function nightsBetween(checkIn, checkOut) {
  const a = dayjs(checkIn);
  const b = dayjs(checkOut);
  if (!a.isValid() || !b.isValid()) return '—';
  const n = b.diff(a, 'day');
  return n > 0 ? n : '—';
}

export function reservationPreTax(booking) {
  return Number(booking?.totalCost) || 0;
}

export function reservationGst(booking) {
  const tax = booking?.totalTax;
  return tax != null && Number.isFinite(Number(tax)) ? Number(tax) : 0;
}

/** Normalized `meals` block — single source of truth. */
export function reservationMeals(booking) {
  return normalizeMealsBlock(booking);
}

export function reservationMealPreTax(booking) {
  return reservationMeals(booking).totalPreTax;
}

export function reservationMealGst(booking) {
  return reservationMeals(booking).totalTax;
}

export function reservationRoomGst(booking) {
  const total = reservationGst(booking);
  const mealTax = reservationMealGst(booking);
  return Math.round(Math.max(0, total - mealTax) * 100) / 100;
}

export function reservationRoomPreTax(booking) {
  const total = Number(booking?.totalCost) || 0;
  const meal = reservationMealPreTax(booking);
  const sup = Number(booking?.supplementTotal) || 0;
  return Math.round(Math.max(0, total - meal - sup) * 100) / 100;
}

export function mealPlanDisplayLabel(booking, _t) {
  if (!booking) return null;
  const meals = reservationMeals(booking);
  return meals.displayName || null;
}

/** Short formatted date for list cards (e.g. 30 May 2026). */
export function reservationDateShort(ymd) {
  if (!ymd) return '—';
  const d = dayjs(ymd);
  return d.isValid() ? d.format('D MMM YYYY') : ymd;
}

/** Payment ledger timestamp for drawers (e.g. 31 May 2026, 3:59 PM). */
export function formatPaymentPaidAt(paidAt) {
  if (!paidAt) return null;
  const d = dayjs(paidAt);
  return d.isValid() ? d.format('D MMM YYYY, h:mm A') : null;
}

function inferMealPlanCode(label) {
  if (!label) return null;
  const normalized = String(label).trim().toLowerCase();
  const match = MEAL_PLAN_CODE_OPTIONS.find(
    (opt) =>
      opt.code.toLowerCase() === normalized ||
      opt.defaultName.toLowerCase() === normalized ||
      String(opt.labelKey).toLowerCase() === normalized
  );
  return match?.code ?? null;
}

/**
 * Meal plan line for cards: "EP · Room only" (code + human label).
 * EP = European Plan (room only) — industry-standard hotel abbreviation.
 */
export function mealPlanCardLabel(booking, t) {
  const tags = bookingCardMealTags(booking);
  if (!tags.length) return null;
  return tags
    .map((tag) => {
      const code = tag.code || inferMealPlanCode(tag.label);
      if (code) {
        const opt = mealPlanCodeOption(code);
        if (opt) return `${code} · ${t(opt.labelKey)}`;
        return `${code} · ${tag.label}`;
      }
      return tag.label;
    })
    .join(', ');
}

/** Compact meal tags for booking list cards (deduped from meals.lines). */
export function bookingCardMealTags(booking) {
  if (!booking) return [];
  const meals = reservationMeals(booking);
  const tags = [];
  const seen = new Set();

  for (const line of meals.lines) {
    const label = line.planName ?? line.planCode ?? null;
    if (!label) continue;
    const key = line.planId ?? label;
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push({
      key,
      label,
      code: line.planCode ?? null,
      paid: (Number(line.totalPreTax) || 0) > 0.01,
    });
  }

  if (tags.length > 0) return tags;

  const fallback = meals.displayName;
  if (!fallback) return [];
  return [
    {
      key: meals.planId ?? fallback,
      label: fallback,
      code: meals.planCode ?? null,
      paid: meals.totalPreTax > 0.01,
    },
  ];
}

export function bookingStatusTone(booking) {
  const s = (booking?.status || '').toUpperCase();
  if (s === 'CANCELLED' || booking?.isDeleted === true) return 'cancelled';
  if (s === 'COMPLETED') return 'completed';
  if (s === 'HOTEL_BLOCKED') return 'blocked';
  if (isPartiallyPaidBooking(booking)) return 'partial';
  if (s === 'CONFIRMED' || booking?.isPaid) return 'confirmed';
  return 'pending';
}

export function hasMealReservation(booking) {
  if (!booking) return false;
  const meals = reservationMeals(booking);
  if (meals.lines.length > 0 || meals.displayName) return true;
  if (meals.totalPreTax > 0.01 || meals.totalTax > 0.01) return true;
  const lines = booking.roomLines;
  if (Array.isArray(lines) && lines.some((l) => l?.mealPlanId || l?.mealPlanName)) return true;
  return false;
}

export function reservationMealPlanLines(booking) {
  return reservationMeals(booking).lines;
}

export function reservationMixedMealPlans(booking) {
  const meals = reservationMeals(booking);
  if (meals.mixedPlans) return true;
  const names = new Set(meals.lines.map((l) => l?.planName).filter(Boolean));
  return names.size > 1;
}

export function roomLineMealLabel(line) {
  if (!line) return null;
  return line.planName ?? line.mealPlanName ?? line.planCode ?? line.mealPlanCode ?? null;
}

export function reservationGrandTotal(booking) {
  const gst = reservationGst(booking);
  const preTax = reservationPreTax(booking);
  return Math.round((preTax + gst) * 100) / 100;
}

export function reservationCollectedAmount(booking) {
  if (booking?.amountPaid != null && Number.isFinite(Number(booking.amountPaid))) {
    return Number(booking.amountPaid);
  }
  if (booking?.totalCollectedAmount != null && Number.isFinite(Number(booking.totalCollectedAmount))) {
    return Number(booking.totalCollectedAmount);
  }
  if (Array.isArray(booking?.paymentLedger) && booking.paymentLedger.length > 0) {
    return booking.paymentLedger.reduce((acc, p) => acc + (Number(p?.amount) || 0), 0);
  }
  if (booking?.isPaid) {
    return reservationGrandTotal(booking);
  }
  return 0;
}

/** Amount paid for cancelled-booking lists (falls back to refund when API omits ledger fields). */
export function cancellationAmountPaid(booking) {
  const collected = reservationCollectedAmount(booking);
  if (collected > 0.009) {
    return collected;
  }
  const refund = Number(booking?.refundAmount);
  if (Number.isFinite(refund) && refund > 0.009) {
    return refund;
  }
  return 0;
}

export function reservationPendingAmount(booking) {
  if (booking?.paymentPendingAmount != null && Number.isFinite(Number(booking.paymentPendingAmount))) {
    return Math.max(0, Number(booking.paymentPendingAmount));
  }
  return Math.max(0, reservationGrandTotal(booking) - reservationCollectedAmount(booking));
}

/** Bookings that should not show active partial-payment UI (collect at check-in). */
export function isPartiallyPaidBooking(booking) {
  if (!booking || isTerminalBookingStatus(booking)) return false;
  const st = (booking?.cpPaymentStatus || '').toUpperCase();
  if (st === 'PARTIALLY_PAID') return true;
  const pending = reservationPendingAmount(booking);
  const collected = reservationCollectedAmount(booking);
  return pending > 0.009 && collected > 0.009;
}

export function canCollectReservationPayment(booking) {
  if (!booking?.reservationId) return false;
  if (isTerminalBookingStatus(booking)) return false;
  const st = (booking?.status || '').toUpperCase();
  return st === 'HOTEL_BLOCKED' || st === 'CONFIRMED';
}

/** Rounded % of grand total collected (e.g. 50 for half paid). */
export function reservationAdvancePercent(booking) {
  const grand = reservationGrandTotal(booking);
  if (grand <= 0.005) return 0;
  return Math.round((reservationCollectedAmount(booking) / grand) * 100);
}
