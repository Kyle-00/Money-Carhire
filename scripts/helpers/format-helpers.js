/**
 * Formatting Helpers (Pure)
 */

export function formatKSh(amount) {
  return 'KSh ' + Number(amount).toLocaleString('en-KE');
}

export function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';
  let d;
  if (typeof dateStr === 'object' && dateStr?.toDate) {
    d = dateStr.toDate();
  } else if (typeof dateStr === 'string') {
    if (dateStr.includes('-')) {
      d = new Date(dateStr + 'T00:00:00');
    } else {
      d = new Date(dateStr);
    }
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d?.getTime())) return '—';
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Convert Date object to YYYY-MM-DD string (local time)
 * @param {Date} date - Date object
 * @returns {string} YYYY-MM-DD string
 */
export function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatPhoneForWhatsApp(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('0')) cleaned = '254' + cleaned.substring(1);
  if (!cleaned.startsWith('254')) cleaned = '254' + cleaned;
  return cleaned;
}

/**
 * Get today's date as YYYY-MM-DD string (local time)
 * @returns {string} Today's date
 */
export function getTodayString() {
  const now = new Date();
  return toDateString(now);
}