export function bookingRowKey(row) {
  if (!row) return null;
  return row.reservationId ?? row.orderId ?? null;
}
