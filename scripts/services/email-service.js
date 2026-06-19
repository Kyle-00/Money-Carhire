/**
 * Email Service – EmailJS wrapper
 */

import { formatPhoneForWhatsApp } from '../helpers/format-helpers.js';

let emailjsInstance = null;
let emailjsConfig = null;

export function initEmailJS(config) {
  emailjsConfig = config;
  if (typeof emailjs !== 'undefined' && config.publicKey) {
    emailjs.init(config.publicKey);
    emailjsInstance = emailjs;
  }
}

export function sendCustomerEmail(bookingData) {
  if (!emailjsInstance) return Promise.reject(new Error('EmailJS not initialized'));
  const params = {
    to_email: bookingData.email,
    name: bookingData.name,
    email: bookingData.email,
    phone: bookingData.phone,
    booking_id: bookingData.booking_id,
    car: bookingData.car,
    pickup_date: bookingData.pickup_date_display,
    return_date: bookingData.return_date_display,
    days: bookingData.days,
    rental_total: bookingData.rental_total,
    delivery_fee: bookingData.delivery_fee,
    total: bookingData.total,
    location: bookingData.location,
    pickup_type: bookingData.pickup_type,
    requests: bookingData.requests
  };
  return emailjsInstance.send(
    emailjsConfig.serviceId,
    emailjsConfig.customerTemplate,
    params,
    emailjsConfig.publicKey
  );
}

export function sendOwnerEmail(bookingData) {
  if (!emailjsInstance) return Promise.reject(new Error('EmailJS not initialized'));
  const params = {
    to_email: emailjsConfig.ownerEmail,
    name: bookingData.name,
    email: bookingData.email,
    phone: bookingData.phone,
    whatsapp_phone: formatPhoneForWhatsApp(bookingData.phone),
    booking_id: bookingData.booking_id,
    car: bookingData.car,
    pickup_date: bookingData.pickup_date_display,
    return_date: bookingData.return_date_display,
    days: bookingData.days,
    rental_total: bookingData.rental_total,
    delivery_fee: bookingData.delivery_fee,
    total: bookingData.total,
    location: bookingData.location,
    pickup_type: bookingData.pickup_type,
    requests: bookingData.requests
  };
  return emailjsInstance.send(
    emailjsConfig.serviceId,
    emailjsConfig.ownerTemplate,
    params,
    emailjsConfig.publicKey
  );
}

export function sendBookingEmails(bookingData) {
  return Promise.all([
    sendCustomerEmail(bookingData),
    sendOwnerEmail(bookingData)
  ]);
}

export function sendEmailFallback(bookingData) {
  const subject = `Booking Request - ${bookingData.booking_id}`;
  const body = `Name: ${bookingData.name}%0AEmail: ${bookingData.email}%0APhone: ${bookingData.phone}%0ACar: ${bookingData.car}%0APickup: ${bookingData.pickup_date_display}%0AReturn: ${bookingData.return_date_display}%0ADays: ${bookingData.days}%0ARental Total: ${bookingData.rental_total}%0ADelivery Fee: ${bookingData.delivery_fee}%0ATotal: ${bookingData.total}%0ALocation: ${bookingData.location}%0APickup Method: ${bookingData.pickup_type}%0ARequests: ${bookingData.requests}`;
  window.open(`mailto:${bookingData.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  window.open(`mailto:${emailjsConfig?.ownerEmail || ''}?subject=${encodeURIComponent(`New Booking - ${bookingData.booking_id}`)}&body=${encodeURIComponent(body)}`, '_blank');
}

export function isEmailJSAvailable() {
  return emailjsInstance !== null && emailjsConfig !== null;
}