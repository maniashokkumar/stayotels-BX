/**
 * `meals` on quote/reservation is the single source of truth.
 * Legacy flat fields are read only for old MongoDB documents.
 */

export const EMPTY_MEALS_BLOCK = {
  planId: null,
  planCode: null,
  displayName: null,
  category: null,
  pricePerPersonPerNight: null,
  guestCount: 0,
  nights: 0,
  totalPreTax: 0,
  totalTax: 0,
  gstRatePercent: null,
  mixedPlans: false,
  lines: [],
};

export const normalizeMealLine = (line) => {
  if (!line) return null;
  return {
    roomName: line.roomName ?? '',
    quantity: Number(line.quantity) || 1,
    planId: line.planId ?? line.mealPlanId ?? null,
    planName: line.planName ?? line.mealPlanName ?? null,
    planCode: line.planCode ?? line.mealPlanCode ?? null,
    totalPreTax: Number(line.totalPreTax ?? line.mealPreTax) || 0,
    totalTax: Number(line.totalTax ?? line.mealTax) || 0,
  };
};

const mealsFromLegacyFlatFields = (source) => {
  const legacyLines = Array.isArray(source.mealPlanLines) ? source.mealPlanLines : [];
  const lines = legacyLines.map(normalizeMealLine).filter(Boolean);
  let totalPreTax = Number(source.mealPreTaxAmountRupee ?? source.mealPreTax) || 0;
  if (totalPreTax <= 0) {
    totalPreTax = Number(source.mealPlanTotal) || 0;
  }
  if (totalPreTax <= 0 && lines.length > 0) {
    totalPreTax = lines.reduce((s, l) => s + l.totalPreTax, 0);
  }
  let totalTax = Number(source.mealTaxAmountRupee ?? source.mealTax) || 0;
  if (totalTax <= 0) {
    totalTax = Number(source.mealPlanTax) || 0;
  }
  if (totalTax <= 0 && lines.length > 0) {
    totalTax = lines.reduce((s, l) => s + l.totalTax, 0);
  }
  if (totalPreTax <= 0 && totalTax <= 0 && !source.mealPlanName && lines.length === 0) {
    return null;
  }
  return {
    planId: source.mealPlanId ?? null,
    planCode: source.mealPlanCode ?? null,
    displayName: source.mealPlanName ?? null,
    category: source.mealPlanCategory ?? null,
    pricePerPersonPerNight:
      source.mealPlanPricePerPersonPerNight != null
        ? Number(source.mealPlanPricePerPersonPerNight)
        : null,
    guestCount: Number(source.mealPlanGuestCount) || 0,
    nights: Number(source.mealPlanNights) || 0,
    totalPreTax,
    totalTax,
    gstRatePercent: source.mealPlanGstRatePercent ?? null,
    mixedPlans: source.mixedMealPlans === true || source.mixedPlans === true,
    lines,
  };
};

export const normalizeMealsBlock = (source) => {
  if (!source) {
    return { ...EMPTY_MEALS_BLOCK, lines: [] };
  }

  const nested = source.meals;
  if (nested && (Array.isArray(nested.lines) || nested.totalPreTax != null || nested.totalTax != null)) {
    return {
      planId: nested.planId ?? null,
      planCode: nested.planCode ?? null,
      displayName: nested.displayName ?? null,
      category: nested.category ?? null,
      pricePerPersonPerNight:
        nested.pricePerPersonPerNight != null ? Number(nested.pricePerPersonPerNight) : null,
      guestCount: Number(nested.guestCount) || 0,
      nights: Number(nested.nights) || 0,
      totalPreTax: Number(nested.totalPreTax) || 0,
      totalTax: Number(nested.totalTax) || 0,
      gstRatePercent: nested.gstRatePercent ?? null,
      mixedPlans: nested.mixedPlans === true,
      lines: (nested.lines || []).map(normalizeMealLine).filter(Boolean),
    };
  }

  const legacy = mealsFromLegacyFlatFields(source);
  if (legacy) {
    return legacy;
  }

  return { ...EMPTY_MEALS_BLOCK, lines: [] };
};

export const mealsFromQuote = (quoteOrSummary) => {
  if (!quoteOrSummary) return { ...EMPTY_MEALS_BLOCK, lines: [] };
  return normalizeMealsBlock(quoteOrSummary);
};

/** Props for GstSummary — pass normalized `meals` only. */
export const gstSummaryMealProps = (meals) => ({
  meals: meals && typeof meals === 'object' ? meals : normalizeMealsBlock(null),
});
