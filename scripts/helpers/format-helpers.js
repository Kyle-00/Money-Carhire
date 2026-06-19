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

export function toDateString(date) {
  return date.toISOString().split('T')[0];
}

export function formatPhoneForWhatsApp(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('0')) cleaned = '254' + cleaned.substring(1);
  if (!cleaned.startsWith('254')) cleaned = '254' + cleaned;
  return cleaned;
}

export function getTodayString() {
  return new Date().toISOString().split('T')[0];
}