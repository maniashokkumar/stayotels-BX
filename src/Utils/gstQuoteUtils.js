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
  selectedRooms: (selectedRooms || []).map((room) => ({
    id: room.id,
    quantity: Number(room.quantity) || 1,
    instances: (room.instances || []).map((inst) => ({
      extraPersons: Number(inst?.extraPersons) || 0,
    })),
  })),
  couponCode: couponCode || null,
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
      ratePercent: null,
      mixedRates: false,
    };
  }

  const preTax = roundToTwo(quote.preTaxAmountRupee);
  const gst = roundToTwo(quote.taxAmountRupee);
  const total = roundToTwo(quote.orderAmountRupee);
  const couponDiscount = roundToTwo(quote.couponDiscountAmount || 0);
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

  return {
    valid: true,
    error: null,
    preTax,
    gst,
    cgst,
    sgst,
    total,
    couponDiscount,
    ratePercent: rateList.length === 1 ? rateList[0] : rateList.length === 0 ? 0 : null,
    mixedRates: rateList.length > 1,
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

  if (isMultiRoom && roomLineEdits?.length > 1) {
    return roomLineEdits
      .map((line) => {
        const opt = findOpt(line.roomId);
        const docId = roomDocumentId(opt);
        if (!docId) return null;
        const qty = Math.max(1, Number(line.noOfRooms) || 1);
        const persons = Math.max(1, Number(line.noOfPersons) || 1);
        return {
          id: docId,
          quantity: qty,
          instances: buildInstances(opt, qty, persons),
        };
      })
      .filter(Boolean);
  }

  const opt = findOpt(form?.roomId);
  const docId = roomDocumentId(opt);
  if (!docId) return null;
  const qty = Math.max(1, Number(form?.noofRooms) || 1);
  const persons = Math.max(1, Number(form?.cdnintnoOfPersons) || 1);
  return [
    {
      id: docId,
      quantity: qty,
      instances: buildInstances(opt, qty, persons),
    },
  ];
};
