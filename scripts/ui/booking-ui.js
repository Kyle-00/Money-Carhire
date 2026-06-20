/**
 * Booking UI – form handling, vehicle options, submission
 */

import { getFleetManager } from '../classes/FleetManager.js';
import { Booking } from '../classes/Booking.js';
import { $, showToast } from '../helpers/dom-helpers.js';
import { formatDateDisplay, toDateString } from '../helpers/format-helpers.js';
import { daysBetween, generateBookingId, getQueryParams, calculateBookingTotals } from '../helpers/business-helpers.js';
import { validateEmail, validatePhone, isValidString } from '../helpers/validation-helpers.js';
import { saveBooking } from '../services/firebase-service.js';
import { sendBookingEmails, isEmailJSAvailable, sendEmailFallback } from '../services/email-service.js';

const DELIVERY_FEE = window.CONFIG?.deliveryFee || 1000;

export function initBookingPage() {
  const vehicleSelect = document.getElementById('vehicleSelect');
  const pickupDateInput = document.getElementById('pickupDate');
  const returnDateInput = document.getElementById('returnDate');
  if (!vehicleSelect) return;

  populateVehicleOptions();

  const today = new Date();
  const pickup = new Date(today); pickup.setDate(today.getDate() + 1);
  const ret = new Date(today); ret.setDate(today.getDate() + 4);
  const todayStr = toDateString(today);
  if (pickupDateInput) { pickupDateInput.min = todayStr; pickupDateInput.value = toDateString(pickup); }
  if (returnDateInput) { returnDateInput.min = toDateString(pickup); returnDateInput.value = toDateString(ret); }

  const params = getQueryParams();
  if (params.car) {
    const options = vehicleSelect.options;
    for (let i = 0; i < options.length; i++) {
      if (options[i].value.startsWith(params.car)) { vehicleSelect.selectedIndex = i; break; }
    }
  }

  // Add availability check listeners
  setupAvailabilityCheck();

  initBookingForm();
}

export function populateVehicleOptions() {
  const vehicleSelect = document.getElementById('vehicleSelect');
  if (!vehicleSelect) return;
  const fleetManager = getFleetManager();
  if (fleetManager.vehicles.length === 0) {
    vehicleSelect.innerHTML = '<option value="">-- Loading vehicles... --</option>';
    return;
  }
  const currentVal = vehicleSelect.value;
  vehicleSelect.innerHTML = '<option value="">-- Choose your vehicle --</option>';
  fleetManager.vehicles.forEach(v => {
    const status = fleetManager.getVehicleAvailability(v.id);
    const opt = document.createElement('option');
    // Only disable if maintenance (date-based will be handled separately)
    const disabled = status === 'maintenance';
    opt.value = `${v.name}|${v.price}|${v.category}|${!disabled}`;
    opt.textContent = `${v.name} — KSh ${v.price.toLocaleString()}/day${disabled ? ' (In Maintenance)' : ''}`;
    opt.disabled = disabled;
    vehicleSelect.appendChild(opt);
  });
  if (currentVal) {
    const options = vehicleSelect.options;
    for (let i = 0; i < options.length; i++) {
      if (options[i].value === currentVal || options[i].value.startsWith(currentVal.split('|')[0])) {
        vehicleSelect.selectedIndex = i; break;
      }
    }
  }
}

function getSelectedPickupType() {
  const radios = document.querySelectorAll('input[name="pickupType"]');
  let type = 'self', label = 'Self Pickup';
  radios.forEach(r => { if (r.checked) { type = r.value; label = r.value === 'delivery' ? 'Car Delivery' : 'Self Pickup'; } });
  return { type, label };
}

export function initBookingForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  function setError(inputId, errId, show) {
    const input = document.getElementById(inputId);
    const err = document.getElementById(errId);
    if (input) input.classList.toggle('error', show);
    if (err) err.style.display = show ? 'block' : 'none';
    return show;
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    let hasError = false;
    const name = document.getElementById('fieldName')?.value.trim() || '';
    const email = document.getElementById('fieldEmail')?.value.trim() || '';
    const phone = document.getElementById('fieldPhone')?.value.trim() || '';
    const pickup = document.getElementById('pickupDate')?.value || '';
    const ret = document.getElementById('returnDate')?.value || '';
    const loc = document.getElementById('pickupLocation')?.value || '';
    const vehicle = document.getElementById('vehicleSelect')?.value || '';
    const pickupType = getSelectedPickupType();

    if (setError('fieldName', 'errName', !isValidString(name, 2))) hasError = true;
    if (setError('fieldEmail', 'errEmail', !email || !validateEmail(email))) hasError = true;
    if (phone && setError('fieldPhone', 'errPhone', !validatePhone(phone))) hasError = true;
    if (setError('pickupDate', 'errPickup', !pickup)) hasError = true;
    if (setError('returnDate', 'errReturn', !ret || ret <= pickup)) hasError = true;
    if (setError('pickupLocation', 'errLocation', !loc)) hasError = true;
    if (setError('vehicleSelect', 'errVehicle', !vehicle)) hasError = true;

    // Date availability check
    if (!hasError && vehicle && pickup && ret) {
      const parts = vehicle.split('|');
      const carName = parts[0];
      const fleetManager = getFleetManager();
      const vehicleObj = fleetManager.getVehicleByName(carName);
      if (vehicleObj) {
        const result = fleetManager.checkVehicleAvailabilityForDates(vehicleObj.id, pickup, ret);
        if (!result.available) {
          showToast('This vehicle is not available for the selected dates.', 'error');
          setError('vehicleSelect', 'errVehicle', true);
          hasError = true;
        }
      }
    }

    if (hasError) {
      showToast('Please fix the highlighted fields.', 'error');
      const firstErr = form.querySelector('.error');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const btn = document.getElementById('submitBtn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;

    try {
      const vehicleParts = vehicle.split('|');
      const carName = vehicleParts[0];
      const dailyRate = parseInt(vehicleParts[1], 10) || 0;
      const days = daysBetween(pickup, ret);
      const totals = calculateBookingTotals(dailyRate, days, pickupType.type === 'delivery', DELIVERY_FEE);

      const LOCATION_LABELS = { westlands: 'Nairobi - Westlands', jkia: 'JKIA Airport' };
      const locationLabel = LOCATION_LABELS[loc] || loc || 'Not specified';

      const bookingData = {
        booking_id: generateBookingId(),
        name, email, phone,
        car: carName,
        pickup_date: pickup,
        return_date: ret,
        pickup_date_display: formatDateDisplay(pickup),
        return_date_display: formatDateDisplay(ret),
        days,
        rental_total: totals.rentalTotal,
        delivery_fee: totals.deliveryFee,
        total: totals.total,
        location: locationLabel,
        pickup_type: pickupType.label,
        requests: document.getElementById('fieldRequests')?.value.trim() || 'None'
      };

      await saveBooking(bookingData);

      let emailSent = false, emailError = null;
      if (isEmailJSAvailable()) {
        try { await sendBookingEmails(bookingData); emailSent = true; }
        catch (err) { emailError = err; sendEmailFallback(bookingData); emailSent = true; }
      } else {
        sendEmailFallback(bookingData);
        emailSent = true;
      }

      document.getElementById('bookingFormWrap').style.display = 'none';
      document.getElementById('bookingSuccess').style.display = 'block';

      let msg = 'Booking request sent! We\'ll confirm within 2 hours.';
      if (emailSent) msg += emailError ? ' A confirmation email will open; please send it.' : ' A confirmation email has been sent to you.';
      if (totals.deliveryFee > 0) msg += ` A delivery fee of ${formatKSh(totals.deliveryFee)} has been added.`;
      showToast(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('[Booking] Error:', error);
      showToast('Could not complete booking. Please try again.', 'error');
    } finally {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  });

  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', () => el.classList.remove('error'));
    el.addEventListener('change', () => el.classList.remove('error'));
  });
}

/**
 * Setup real‑time availability check on date/vehicle change
 */
function setupAvailabilityCheck() {
  const vehicleSelect = document.getElementById('vehicleSelect');
  const pickupDateInput = document.getElementById('pickupDate');
  const returnDateInput = document.getElementById('returnDate');
  const submitBtn = document.getElementById('submitBtn');

  // Create a message element if not exists
  let msgEl = document.getElementById('availabilityMessage');
  if (!msgEl) {
    msgEl = document.createElement('div');
    msgEl.id = 'availabilityMessage';
    msgEl.style.padding = '10px 14px';
    msgEl.style.margin = '10px 0';
    msgEl.style.borderRadius = '8px';
    msgEl.style.fontWeight = '600';
    msgEl.style.display = 'none';
    const form = document.getElementById('bookingForm');
    if (form) form.insertBefore(msgEl, form.querySelector('button'));
  }

  function checkAvailability() {
    const vehicle = vehicleSelect?.value;
    const pickup = pickupDateInput?.value;
    const ret = returnDateInput?.value;

    if (!vehicle || !pickup || !ret) {
      msgEl.style.display = 'none';
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    const parts = vehicle.split('|');
    const carName = parts[0];
    const fleetManager = getFleetManager();
    const vehicleObj = fleetManager.getVehicleByName(carName);
    if (!vehicleObj) {
      msgEl.style.display = 'none';
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    const result = fleetManager.checkVehicleAvailabilityForDates(vehicleObj.id, pickup, ret);

    msgEl.style.display = 'block';
    if (result.available) {
      msgEl.style.backgroundColor = 'rgba(39,174,96,0.15)';
      msgEl.style.color = '#27ae60';
      msgEl.style.border = '1px solid #27ae60';
      msgEl.innerHTML = '<i class="fas fa-check-circle"></i> This vehicle is available for your selected dates.';
      if (submitBtn) submitBtn.disabled = false;
    } else {
      msgEl.style.backgroundColor = 'rgba(231,76,60,0.15)';
      msgEl.style.color = '#e74c3c';
      msgEl.style.border = '1px solid #e74c3c';
      let conflictMsg = '<i class="fas fa-times-circle"></i> Not available. ';
      result.conflicts.forEach((c, i) => {
        if (i > 0) conflictMsg += '<br>';
        conflictMsg += `Booked by ${c.customer} from ${formatDateDisplay(c.pickup_date)} to ${formatDateDisplay(c.return_date)}`;
      });
      msgEl.innerHTML = conflictMsg;
      if (submitBtn) submitBtn.disabled = true;
    }
  }

  // Listen to changes
  vehicleSelect?.addEventListener('change', checkAvailability);
  pickupDateInput?.addEventListener('change', checkAvailability);
  returnDateInput?.addEventListener('change', checkAvailability);
  // Also on input for immediate feedback
  pickupDateInput?.addEventListener('input', checkAvailability);
  returnDateInput?.addEventListener('input', checkAvailability);
}