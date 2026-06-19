/**
 * Business Logic Helpers (Pure)
 */

export function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diff = (d2 - d1) / (1000 * 60 * 60 * 24);
  return diff > 0 ? Math.round(diff) : 0;
}

export function generateBookingId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function calculateBookingTotals(dailyRate, days, isDelivery = false, deliveryFee = 1000) {
  const rentalTotal = dailyRate * days;
  const deliveryFeeAmount = isDelivery ? deliveryFee : 0;
  const total = rentalTotal + deliveryFeeAmount;
  return { rentalTotal, deliveryFee: deliveryFeeAmount, total };
}

export function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}