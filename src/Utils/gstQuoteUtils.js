import { normalizeMealsBlock } from '../features/Reservation/mealsBlockUtils';

export const roundToTwo = (value) => Math.round((Number(value) || 0) * 100) / 100;

export const buildBookingQuotePayload = ({
  hotelId,
  checkInDate,
  checkOutDate,
  cdnintnoOfPersons,
  selectedRooms,
  couponCode,
}) => ({
  hotelId,
  checkInDate,
  checkOutDate,
  cdnintnoOfPersons: Number(cdnintnoOfPersons) || 0,
  selectedRooms: (selectedRooms || []).map((room) => {
    const instances = (room.instances || []).map((inst) => {
      const mapped = { extraPersons: Number(inst?.extraPersons) || 0 };
      if (inst?.guests != null) {
        mapped.guests = Number(inst.guests) || 0;
      }
      return mapped;
    });
    return {
      id: room.id,
      quantity: Number(room.quantity) || 1,
      mealPlanId: room.mealPlanId || null,
      instances,
    };
  }),
  couponCode: couponCode || null,
});

/** Website-style cart lines for control-panel create / quote. */
export const buildCpSelectedRoomsFromCart = (cartLines) =>
  (cartLines || [])
    .filter((line) => (Number(line.quantity) || 0) > 0)
    .map((line) => {
      const instances = (line.instances || []).map((inst) => {
        const mapped = { extraPersons: Number(inst?.extraPersons) || 0 };
        if (inst?.guests != null) {
          mapped.guests = Number(inst.guests) || 0;
        }
        return mapped;
      });
      return {
        id: line.id,
        quantity: Number(line.quantity) || 1,
        mealPlanId: line.mealPlanId || null,
        instances,
      };
    });

export const summarizeQuoteGst = (quote) => {
  if (!quote || quote.valid !== true) {
    return {
      valid: false,
      error: quote?.error || null,
      preTax: 0,
      gst: 0,
      cgst: 0,
      sgst: 0,
      total: 0,
      couponDiscount: 0,
      roomPreTax: 0,
      mealPreTax: 0,
      mealTax: 0,
      roomTax: 0,
      meals: normalizeMealsBlock(null),
      ratePercent: null,
      mixedRates: false,
    };
  }

  const preTax = roundToTwo(quote.preTaxAmountRupee);
  const gst = roundToTwo(quote.taxAmountRupee);
  const total = roundToTwo(quote.orderAmountRupee);
  const couponDiscount = roundToTwo(quote.couponDiscountAmount || 0);
  const roomPreTax = roundToTwo(quote.roomPreTaxAmountRupee ?? quote.preTaxAmountRupee);
  const mealPreTax = roundToTwo(quote.mealPreTaxAmountRupee || 0);
  const mealTax = roundToTwo(quote.mealTaxAmountRupee || 0);
  const roomTax = roundToTwo(quote.roomTaxAmountRupee ?? Math.max(0, gst - mealTax));
  const rows = Array.isArray(quote.taxBreakdown) ? quote.taxBreakdown : [];

  let cgst = 0;
  let sgst = 0;
  const rates = new Set();
  for (const row of rows) {
    cgst += Number(row.cgst) || 0;
    sgst += Number(row.sgst) || 0;
    if (row.gstRate != null) rates.add(Number(row.gstRate));
  }

  cgst = roundToTwo(cgst);
  sgst = roundToTwo(sgst);
  const rateList = [...rates].sort((a, b) => a - b);
  const mixedRates = rateList.length > 1;
  const ratePercent = rateList.length === 1 ? rateList[0] : rateList.length === 0 ? 0 : null;

  const meals = normalizeMealsBlock(quote);
  if (meals.totalPreTax <= 0 && mealPreTax > 0) {
    meals.totalPreTax = mealPreTax;
  }
  if (meals.totalTax <= 0 && mealTax > 0) {
    meals.totalTax = mealTax;
  }

  return {
    valid: true,
    error: null,
    preTax,
    gst,
    cgst,
    sgst,
    total,
    couponDiscount,
    roomPreTax,
    mealPreTax: meals.totalPreTax,
    mealTax: meals.totalTax,
    roomTax,
    meals,
    ratePercent,
    mixedRates,
    taxBreakdown: rows,
    totalCalculatedPrice: roundToTwo(quote.totalCalculatedPrice),
    couponApplied: quote.couponApplied === true,
  };
};

export const isQuoteReady = (summary, loading, error) =>
  Boolean(summary?.valid && !loading && !error);

export const reservationGrandTotal = (booking) => {
  const preTax = Number(booking?.totalCost) || 0;
  const tax = Number(booking?.totalTax) || 0;
  const sup = Number(booking?.supplementTotal) || 0;
  return roundToTwo(preTax + tax + sup);
};

const roomDocumentId = (opt) => opt?.id || opt?._id || null;

/** Build quote room lines from control-panel edit form + room catalog. */
export const buildCpQuoteRoomsFromForm = ({
  isMultiRoom,
  roomLineEdits,
  form,
  roomOptions,
  defaultMealPlanId = null,
}) => {
  const opts = roomOptions || [];
  const findOpt = (roomId) => opts.find((r) => r?.roomId === roomId);

  const buildInstances = (opt, qty, persons) => {
    const base = (Number(opt.noOfPersons) || 0) * qty;
    let extra = Math.max(0, persons - base);
    const maxExtra = opt.allowExtraPerson
      ? (Number(opt.maxExtraPersons) || 0) * qty
      : 0;
    extra = Math.min(extra, maxExtra);
    return Array.from({ length: qty }, () => {
      const slice = Math.min(
        extra,
        opt.allowExtraPerson ? Number(opt.maxExtraPersons) || 0 : 0
      );
      extra -= slice;
      return { extraPersons: slice };
    });
  };

  const mapLine = (opt, qty, persons, mealPlanId) => {
    const docId = roomDocumentId(opt);
    if (!docId) return null;
    return {
      id: docId,
      quantity: qty,
      mealPlanId: mealPlanId || defaultMealPlanId || null,
      instances: buildInstances(opt, qty, persons),
    };
  };

  if (isMultiRoom && roomLineEdits?.length > 1) {
    return roomLineEdits
      .map((line) => {
        const opt = findOpt(line.roomId);
        const qty = Math.max(1, Number(line.noOfRooms) || 1);
        const persons = Math.max(1, Number(line.noOfPersons) || 1);
        return mapLine(opt, qty, persons, line.mealPlanId);
      })
      .filter(Boolean);
  }

  const opt = findOpt(form?.roomId);
  const qty = Math.max(1, Number(form?.noofRooms) || 1);
  const persons = Math.max(1, Number(form?.cdnintnoOfPersons) || 1);
  const single = mapLine(opt, qty, persons, defaultMealPlanId);
  return single ? [single] : null;
};
