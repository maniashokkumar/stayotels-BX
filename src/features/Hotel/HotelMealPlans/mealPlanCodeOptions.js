/**
 * Commonly used hotel meal plan codes (one option per inclusion pattern).
 * EP, CP, MAP, AP are the industry-standard set used by most PMS and OTAs.
 */
export const MEAL_PLAN_CODE_OPTIONS = [
  {
    code: 'EP',
    labelKey: 'Room only',
    defaultName: 'Room only',
    includesBreakfast: false,
    includesLunch: false,
    includesDinner: false,
  },
  {
    code: 'CP',
    labelKey: 'Breakfast',
    defaultName: 'Breakfast',
    includesBreakfast: true,
    includesLunch: false,
    includesDinner: false,
  },
  {
    code: 'MAP',
    labelKey: 'Breakfast + Dinner',
    defaultName: 'Breakfast + Dinner',
    includesBreakfast: true,
    includesLunch: false,
    includesDinner: true,
  },
  {
    code: 'AP',
    labelKey: 'Breakfast + Lunch + Dinner',
    defaultName: 'All meals',
    includesBreakfast: true,
    includesLunch: true,
    includesDinner: true,
  },
];

export function mealPlanCodeOption(code) {
  return MEAL_PLAN_CODE_OPTIONS.find((o) => o.code === code);
}

export function dropdownLabel(option, t) {
  const meaning = t(option.labelKey);
  return `${option.code} (${meaning})`;
}
