export const REPORT_TYPES = [
  {
    value: 'MONTHLY_REVENUE',
    labelKey: 'Monthly revenue summary',
    descriptionKey: 'Month-wise revenue, GST, supplements, and refunds per hotel.',
  },
  {
    value: 'DAILY_SALES',
    labelKey: 'Daily sales register',
    descriptionKey: 'Day book with guest, stay dates, pre-tax, CGST/SGST, and gross total.',
  },
  {
    value: 'GST_DAY_SUMMARY',
    labelKey: 'Day-wise GST summary',
    descriptionKey: 'GST by stay night (supply date). Date basis filters which bookings are included.',
    gstReport: true,
  },
  {
    value: 'GST_SLAB_SUMMARY',
    labelKey: 'GST slab summary',
    descriptionKey: 'GST totals by rate slab for stay nights in the period.',
    gstReport: true,
  },
  {
    value: 'GST_DETAIL',
    labelKey: 'GST detail (line-level)',
    descriptionKey: 'Per-night GST lines. Amounts use stay dates; Excel has the full export.',
    gstReport: true,
  },
];

export const DATE_BASIS_OPTIONS = [
  { value: 'CHECK_IN', labelKey: 'Check-in date' },
  { value: 'BOOKING_CREATED', labelKey: 'Booking created date' },
  { value: 'PAYMENT_DATE', labelKey: 'Payment date' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', labelKey: 'All payment statuses' },
  { value: 'NOT_PAID', labelKey: 'Not paid' },
  { value: 'PARTIALLY_PAID', labelKey: 'Partially paid' },
  { value: 'FULLY_PAID', labelKey: 'Fully paid' },
];
