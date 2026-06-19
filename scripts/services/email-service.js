/**
 * Email Service – EmailJS wrapper with HTML email support
 */

import { formatPhoneForWhatsApp } from '../helpers/format-helpers.js';

let emailjsInstance = null;
let emailjsConfig = null;

export function initEmailJS(config) {
  emailjsConfig = config;
  if (typeof emailjs !== 'undefined' && config.publicKey) {
    emailjs.init(config.publicKey);
    emailjsInstance = emailjs;
    console.log('[EmailService] EmailJS initialized');
  } else {
    console.warn('[EmailService] EmailJS not available');
  }
}

export function sendCustomerEmail(bookingData) {
  if (!emailjsInstance || !emailjsConfig) {
    return Promise.reject(new Error('EmailJS not initialized'));
  }

  const htmlContent = buildCustomerEmailHTML(bookingData);

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
    requests: bookingData.requests,
    message: htmlContent,
    html: htmlContent,
    content: htmlContent
  };

  return emailjsInstance.send(
    emailjsConfig.serviceId,
    emailjsConfig.customerTemplate,
    params,
    emailjsConfig.publicKey
  );
}

export function sendOwnerEmail(bookingData) {
  if (!emailjsInstance || !emailjsConfig) {
    return Promise.reject(new Error('EmailJS not initialized'));
  }

  const htmlContent = buildOwnerEmailHTML(bookingData);

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
    requests: bookingData.requests,
    message: htmlContent,
    html: htmlContent,
    content: htmlContent
  };

  return emailjsInstance.send(
    emailjsConfig.serviceId,
    emailjsConfig.ownerTemplate,
    params,
    emailjsConfig.publicKey
  );
}

export function sendBookingEmails(bookingData) {
  if (!emailjsInstance || !emailjsConfig) {
    return Promise.reject(new Error('EmailJS not initialized'));
  }

  return Promise.all([
    sendCustomerEmail(bookingData),
    sendOwnerEmail(bookingData)
  ]);
}

export function sendEmailFallback(bookingData) {
  const subject = `Booking Request - ${bookingData.booking_id}`;
  const body = `Name: ${bookingData.name}%0A` +
    `Email: ${bookingData.email}%0A` +
    `Phone: ${bookingData.phone}%0A` +
    `Car: ${bookingData.car}%0A` +
    `Pickup: ${bookingData.pickup_date_display}%0A` +
    `Return: ${bookingData.return_date_display}%0A` +
    `Days: ${bookingData.days}%0A` +
    `Rental Total: ${bookingData.rental_total}%0A` +
    `Delivery Fee: ${bookingData.delivery_fee}%0A` +
    `Total: ${bookingData.total}%0A` +
    `Location: ${bookingData.location}%0A` +
    `Pickup Method: ${bookingData.pickup_type}%0A` +
    `Requests: ${bookingData.requests}`;

  window.open(`mailto:${bookingData.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  window.open(`mailto:${emailjsConfig?.ownerEmail || ''}?subject=${encodeURIComponent(`New Booking - ${bookingData.booking_id}`)}&body=${encodeURIComponent(body)}`, '_blank');
}

export function isEmailJSAvailable() {
  return emailjsInstance !== null && emailjsConfig !== null;
}

function buildCustomerEmailHTML(bookingData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e0e0e0; }
    .header { background: linear-gradient(135deg, #000, #1a1a2e); padding: 30px 20px; text-align: center; border-bottom: 4px solid #c9a03d; }
    .header h1 { color: #c9a03d; margin: 0; font-size: 24px; }
    .header p { color: #e0e0e0; margin: 6px 0 0; font-size: 14px; }
    .body { padding: 30px 25px; }
    .body h2 { color: #c9a03d; font-size: 18px; border-bottom: 2px solid #c9a03d; padding-bottom: 8px; margin-top: 0; }
    .info-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 8px 16px; margin: 15px 0; background: #f9f9f9; padding: 15px; border-radius: 8px; }
    .info-grid .label { color: #666; font-weight: 600; font-size: 13px; }
    .info-grid .value { color: #222; font-size: 13px; }
    .info-grid .value.gold { color: #c9a03d; font-weight: 700; }
    .divider { border: none; border-top: 2px dashed #e0e0e0; margin: 20px 0; }
    .footer { background: #1a1a2e; padding: 20px; text-align: center; color: #888; font-size: 12px; }
    .footer a { color: #c9a03d; text-decoration: none; }
    @media (max-width: 480px) { .info-grid { grid-template-columns: 1fr; gap: 4px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Money Carhire</h1>
      <p>Booking Confirmation</p>
    </div>
    <div class="body">
      <h2>Thank You, ${bookingData.name}!</h2>
      <p>Your booking request has been received. We will confirm within <strong>15 mins</strong>.</p>

      <h2>Booking Details</h2>
      <div class="info-grid">
        <span class="label">Booking Reference</span>
        <span class="value"><strong>#${bookingData.booking_id}</strong></span>
        <span class="label">Vehicle</span>
        <span class="value"><strong>${bookingData.car}</strong></span>
        <span class="label">Pickup Date</span>
        <span class="value">${bookingData.pickup_date_display}</span>
        <span class="label">Return Date</span>
        <span class="value">${bookingData.return_date_display}</span>
        <span class="label">Days</span>
        <span class="value">${bookingData.days} days</span>
        <span class="label">Pickup Location</span>
        <span class="value">${bookingData.location}</span>
        <span class="label">Pickup Method</span>
        <span class="value">${bookingData.pickup_type}</span>
        <span class="label">Total</span>
        <span class="value gold" style="font-size:18px;font-weight:700;">${bookingData.total}</span>
      </div>

      <hr class="divider">

      <p style="text-align:center;color:#666;font-size:13px;">
        Need help? Call us at <strong>+254 745 424 341</strong> or
        <a href="https://wa.me/254745424341" style="color:#c9a03d;">Chat on WhatsApp</a>
      </p>
    </div>
    <div class="footer">
      <p>Money Carhire &bull; Nairobi, Kenya</p>
      <p><a href="#">Visit our website</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

function buildOwnerEmailHTML(bookingData) {
  const whatsappLink = `https://wa.me/${formatPhoneForWhatsApp(bookingData.phone)}?text=Hello%20${encodeURIComponent(bookingData.name)}%2C%20I%27m%20following%20up%20on%20your%20booking%20%23${bookingData.booking_id}`;
  const emailLink = `mailto:${bookingData.email}?subject=Booking%20Confirmation%20-%20${bookingData.booking_id}`;
  const callLink = `tel:${bookingData.phone}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e0e0e0; }
    .header { background: linear-gradient(135deg, #000, #1a1a2e); padding: 30px 20px; text-align: center; border-bottom: 4px solid #c9a03d; }
    .header h1 { color: #c9a03d; margin: 0; font-size: 24px; }
    .header .subtitle { color: #e0e0e0; font-size: 14px; margin-top: 6px; }
    .body { padding: 30px 25px; }
    .body h2 { color: #c9a03d; font-size: 18px; border-bottom: 2px solid #c9a03d; padding-bottom: 8px; margin-top: 0; }
    .badge { display: inline-block; background: #f39c12; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .info-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 8px 16px; margin: 15px 0; background: #f9f9f9; padding: 15px; border-radius: 8px; }
    .info-grid .label { color: #666; font-weight: 600; font-size: 13px; }
    .info-grid .value { color: #222; font-size: 13px; }
    .info-grid .value.gold { color: #c9a03d; font-weight: 700; }
    .divider { border: none; border-top: 2px dashed #e0e0e0; margin: 20px 0; }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0; }
    .action-btn { display: inline-block; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; text-align: center; flex: 1; min-width: 120px; }
    .action-btn.email { background: #3498db; color: #fff; }
    .action-btn.call { background: #2ecc71; color: #fff; }
    .action-btn.whatsapp { background: #25d366; color: #fff; }
    .action-btn:hover { opacity: 0.85; }
    .note { background: #f8f4ea; padding: 15px; border-radius: 8px; border-left: 4px solid #c9a03d; margin-top: 20px; font-size: 13px; color: #555; }
    .note strong { color: #c9a03d; }
    .footer { background: #1a1a2e; padding: 20px; text-align: center; color: #888; font-size: 12px; }
    .footer a { color: #c9a03d; text-decoration: none; }
    @media (max-width: 480px) { .info-grid { grid-template-columns: 1fr; gap: 4px; } .action-btn { min-width: 100%; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Money Carhire</h1>
      <div class="subtitle">New Booking Request</div>
    </div>
    <div class="body">
      <h2>Booking Reference: #${bookingData.booking_id}</h2>
      <p><span class="badge">Pending Review</span> <span style="margin-left:10px;color:#666;font-size:13px;">Submitted ${new Date().toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' })}</span></p>

      <hr class="divider">

      <h2>Customer Details</h2>
      <div class="info-grid">
        <span class="label">Name</span><span class="value">${bookingData.name}</span>
        <span class="label">Email</span><span class="value"><a href="mailto:${bookingData.email}">${bookingData.email}</a></span>
        <span class="label">Phone</span><span class="value"><a href="tel:${bookingData.phone}">${bookingData.phone}</a></span>
      </div>

      <hr class="divider">

      <h2>Booking Details</h2>
      <div class="info-grid">
        <span class="label">Vehicle</span><span class="value"><strong>${bookingData.car}</strong></span>
        <span class="label">Pickup Date</span><span class="value">${bookingData.pickup_date_display}</span>
        <span class="label">Return Date</span><span class="value">${bookingData.return_date_display}</span>
        <span class="label">Days</span><span class="value">${bookingData.days} days</span>
        <span class="label">Location</span><span class="value">${bookingData.location}</span>
        <span class="label">Method</span><span class="value">${bookingData.pickup_type}</span>
        <span class="label">Requests</span><span class="value">${bookingData.requests || 'None'}</span>
      </div>

      <h2>Payment</h2>
      <div class="info-grid">
        <span class="label">Rental (${bookingData.days} days)</span><span class="value gold">${bookingData.rental_total}</span>
        <span class="label">Delivery Fee</span><span class="value gold">${bookingData.delivery_fee}</span>
        <span class="label" style="font-size:15px;font-weight:700;">TOTAL</span><span class="value gold" style="font-size:18px;font-weight:700;">${bookingData.total}</span>
      </div>

      <hr class="divider">

      <h2>Quick Actions</h2>
      <div class="actions">
        <a href="${emailLink}" class="action-btn email"><span style="display:block;font-size:18px;">✉</span>Email Customer</a>
        <a href="${callLink}" class="action-btn call"><span style="display:block;font-size:18px;">☎</span>Call Customer</a>
        <a href="${whatsappLink}" class="action-btn whatsapp" target="_blank"><span style="display:block;font-size:18px;">💬</span>WhatsApp</a>
      </div>

      <div class="note">
        <strong>Confirm within 15 minutes</strong><br>
        Vehicle will be blocked for the requested dates upon confirmation.
      </div>
    </div>
    <div class="footer">
      <p>Money Carhire Admin - Fleet Manager</p>
      <p style="margin:0;font-size:11px;">You received this notification because a customer submitted a booking request.</p>
    </div>
  </div>
</body>
</html>
  `;
}