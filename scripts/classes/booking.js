/**
 * Booking Class (OOP)
 */

import { generateBookingId } from '../helpers/business-helpers.js';
import { formatKSh, formatDateDisplay } from '../helpers/format-helpers.js';

export class Booking {
  constructor(data = {}) {
    this.id = data.id || generateBookingId();
    this.booking_id = data.booking_id || this.id;
    this.name = data.name || '';
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.car = data.car || '';
    this.pickup_date = data.pickup_date || '';
    this.return_date = data.return_date || '';
    this.pickup_date_display = data.pickup_date_display || '';
    this.return_date_display = data.return_date_display || '';
    this.days = data.days || 0;
    this.rental_total = data.rental_total || '';
    this.delivery_fee = data.delivery_fee || '';
    this.total = data.total || '';
    this.location = data.location || '';
    this.pickup_type = data.pickup_type || 'Self Pickup';
    this.requests = data.requests || 'None';
    this.status = data.status || 'pending';
    this.created_at = data.created_at || null;
  }

  getDisplayData() {
    return {
      booking_id: this.booking_id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      car: this.car,
      pickup_date: formatDateDisplay(this.pickup_date || this.pickup_date_display),
      return_date: formatDateDisplay(this.return_date || this.return_date_display),
      days: this.days,
      rental_total: this.rental_total,
      delivery_fee: this.delivery_fee,
      total: this.total,
      location: this.location,
      pickup_type: this.pickup_type,
      status: this.status,
      requests: this.requests
    };
  }

  isConfirmed() { return this.status === 'confirmed' || this.status === 'completed'; }
  isCancelled() { return this.status === 'cancelled'; }
  isPending() { return this.status === 'pending'; }
  getStatusLabel() { return this.status.charAt(0).toUpperCase() + this.status.slice(1); }
  getStatusClass() { return this.status; }
  getVehicleName() { return this.car; }

  static fromFirebase(firebaseData) {
    const data = { ...firebaseData };
    data.id = firebaseData.id;
    return new Booking(data);
  }

  static fromForm(formData) {
    return new Booking({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      car: formData.car,
      pickup_date: formData.pickup_date,
      return_date: formData.return_date,
      pickup_date_display: formatDateDisplay(formData.pickup_date),
      return_date_display: formatDateDisplay(formData.return_date),
      days: formData.days,
      rental_total: formData.rental_total,
      delivery_fee: formData.delivery_fee,
      total: formData.total,
      location: formData.location,
      pickup_type: formData.pickup_type,
      requests: formData.requests || 'None'
    });
  }

  toFirebaseData() {
    return {
      booking_id: this.booking_id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      car: this.car,
      pickup_date: this.pickup_date,
      return_date: this.return_date,
      pickup_date_display: this.pickup_date_display,
      return_date_display: this.return_date_display,
      days: this.days,
      rental_total: this.rental_total,
      delivery_fee: this.delivery_fee,
      total: this.total,
      location: this.location,
      pickup_type: this.pickup_type,
      requests: this.requests,
      status: this.status
    };
  }
}