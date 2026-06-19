import { normalizeMealsBlock } from '../Reservation/mealsBlockUtils';
import {
  reservationRoomPreTax,
  nightsBetween,
  billableGuestCount,
  extraPersonsForLine,
} from '../Reservation/reservationDisplayUtils';

function mealLabelFrom(line) {
  return line?.mealPlanName ?? line?.planName ?? line?.mealPlanCode ?? line?.planCode ?? null;
}

function mealCodeFrom(line) {
  return line?.mealPlanCode ?? line?.planCode ?? null;
}

function sumPersistedRooms(persisted) {
  return persisted.reduce((s, rl) => s + Math.max(1, Number(rl.noOfRooms) || 1), 0);
}

/** Split booking guest total across N room cards (e.g. 3 guests, 2 rooms → 2 + 1). */
function distributeTotalGuests(totalGuests, roomCount, slotIndex) {
  const total = Math.max(1, Number(totalGuests) || 1);
  const n = Math.max(1, Number(roomCount) || 1);
  const base = Math.floor(total / n);
  const remainder = total % n;
  return base + (slotIndex < remainder ? 1 : 0);
}

function resolveGuestsForSlot(rl, booking, lineCount, slotIndex) {
  const qty = Math.max(1, Number(rl?.noOfRooms) || 1);
  const lineGuests = Number(rl?.noOfPersons);

  if (lineGuests > 0 && qty === 1) {
    return lineGuests;
  }

  const headerTotal = billableGuestCount(booking);
  if (headerTotal > 0 && lineCount > 0) {
    return distributeTotalGuests(headerTotal, lineCount, slotIndex);
  }

  if (lineGuests > 0 && lineCount > 0) {
    return Math.max(1, Math.round(lineGuests / lineCount));
  }
  return null;
}

function roomPreTaxForIndex(booking, index, lineCount) {
  const total = reservationRoomPreTax(booking);
  const breakdown = Array.isArray(booking?.taxBreakdown) ? booking.taxBreakdown : [];
  if (breakdown.length === lineCount && breakdown[index]) {
    const row = breakdown[index];
    return (
      (Number(row.lineRevenuePreTax) || 0) + (Number(row.extraSlicePreTax) || 0)
    ) * (Number(row.couponRatio) ?? 1);
  }
  return Math.round((total / Math.max(1, lineCount)) * 100) / 100;
}

function matchMealLine(meals, rl, idx) {
  const label = mealLabelFrom(rl);
  return (
    meals.lines.find(
      (m) =>
        (m.planId && rl?.mealPlanId && m.planId === rl.mealPlanId) ||
        (m.planName && label && m.planName === label) ||
        (m.planCode && rl?.mealPlanCode && m.planCode === rl.mealPlanCode)
    ) ?? meals.lines[idx]
  );
}

function buildRow(booking, meals, rl, ml, idx, lineCount, nights) {
  const guests = resolveGuestsForSlot(rl, booking, lineCount, idx);
  const mealLabel = ml?.planName ?? mealLabelFrom(rl) ?? 'Room only';
  const mealPreTax = ml ? Number(ml.totalPreTax) || 0 : 0;
  const mealTax = ml ? Number(ml.totalTax) || 0 : 0;
  const extraPersons = extraPersonsForLine(rl, booking, guests);

  return {
    lineNumber: idx + 1,
    roomName: ml?.roomName ?? rl?.roomName ?? rl?.roomId ?? booking?.rooms ?? 'Room',
    roomId: rl?.roomId,
    noOfRooms: 1,
    noOfPersons: guests,
    extraPersons,
    mealLabel,
    mealCode: ml?.planCode ?? mealCodeFrom(rl),
    mealPlanId: ml?.planId ?? rl?.mealPlanId,
    roomPreTax: roomPreTaxForIndex(booking, idx, lineCount),
    mealPreTax,
    mealTax,
    nights,
    hasPaidMeal: mealPreTax > 0.01,
  };
}

/** One card per physical room — uses meals.lines when roomLines is collapsed. */
export function perRoomBookingRows(booking) {
  const meals = normalizeMealsBlock(booking);
  const persisted = Array.isArray(booking?.roomLines) ? booking.roomLines : [];
  const nightsFromStay = nightsBetween(booking?.checkIn, booking?.checkOut);
  const nights =
    meals.nights ||
    (nightsFromStay !== '—' ? Number(nightsFromStay) : 1);
  const totalRooms = Number(booking?.noOfRooms) || sumPersistedRooms(persisted) || 0;

  // Split rates: meals.lines is the spine (e.g. Room only + Breakfast on 2 rooms)
  if (meals.lines.length >= 2) {
    const lineCount = meals.lines.length;
    return meals.lines.map((ml, idx) => {
      const rl = persisted[idx] ?? persisted.find((p) => mealLabelFrom(p) === ml.planName) ?? persisted[0] ?? {};
      return buildRow(booking, meals, rl, ml, idx, lineCount, nights);
    });
  }

  // Multiple persisted lines — one card each
  if (persisted.length >= 2) {
    return persisted.map((rl, idx) => {
      const ml = matchMealLine(meals, rl, idx);
      const qty = Math.max(1, Number(rl.noOfRooms) || 1);
      if (qty === 1) {
        return buildRow(booking, meals, rl, ml, idx, persisted.length, nights);
      }
      const guestsEach = resolveGuestsForSlot(rl, booking, qty, idx);
      const rows = [];
      for (let u = 0; u < qty; u++) {
        rows.push(
          buildRow(
            booking,
            meals,
            { ...rl, noOfRooms: 1, noOfPersons: guestsEach },
            ml,
            rows.length,
            persisted.length * qty,
            nights
          )
        );
      }
      return rows;
    }).flat();
  }

  // Single persisted line but multiple rooms booked
  if (persisted.length === 1) {
    const rl = persisted[0];
    const qty = Math.max(1, Number(rl.noOfRooms) || totalRooms || 1);
    if (qty > 1) {
      const ml = meals.lines[0] ?? matchMealLine(meals, rl, 0);
      const guestsEach = resolveGuestsForSlot(rl, booking, qty, 0);
      return Array.from({ length: qty }, (_, i) =>
        buildRow(
          booking,
          meals,
          { ...rl, noOfRooms: 1, noOfPersons: guestsEach },
          meals.lines[i] ?? ml,
          i,
          qty,
          nights
        )
      );
    }
    const ml = meals.lines[0] ?? matchMealLine(meals, rl, 0);
    return [buildRow(booking, meals, rl, ml, 0, 1, nights)];
  }

  if (meals.lines.length === 1) {
    const ml = meals.lines[0];
    return [buildRow(booking, meals, {}, ml, 0, 1, nights)];
  }

  if (totalRooms > 1) {
    const guestsEach = resolveGuestsForSlot({}, booking, totalRooms, 0);
    return Array.from({ length: totalRooms }, (_, i) =>
      buildRow(booking, meals, {}, null, i, totalRooms, nights)
    ).map((r) => ({ ...r, noOfPersons: guestsEach }));
  }

  return [];
}

