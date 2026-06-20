/**
 * FleetManager Class (OOP – Singleton)
 */

import { Vehicle } from './Vehicle.js';
import { loadVehicles } from '../services/vehicle-service.js';
import { updateAvailabilityBadges } from '../ui/fleet-ui.js';

export class FleetManager {
  constructor() {
    this.vehicles = [];
    this.availability = this._loadAvailability();
    this.isLoaded = false;
    this.listeners = [];
    this.bookings = []; // Will hold all confirmed/completed bookings
  }

  async loadVehicles() {
    try {
      const data = await loadVehicles();
      this.vehicles = Vehicle.fromJSONArray(data);
    } catch {
      this.vehicles = this._getFallbackVehicles();
    }
    this.isLoaded = true;
    this._notifyListeners('loaded');
    return this.vehicles;
  }

  /**
   * Set bookings from Firebase (to be used for availability checks)
   */
  setBookings(bookings) {
    this.bookings = bookings || [];
    // Optionally auto-check for completed bookings after loading
    this.checkCompletedBookings();
  }

  _getFallbackVehicles() {
    const fallbackData = [
      { id: 'g-wagon', name: 'Mercedes G-Wagon', price: 50000, category: 'suv', image: 'G-wagon.jpg', badge: 'Most Popular' },
      { id: 'bmw-x6', name: 'BMW X6', price: 25000, category: 'suv', image: 'BMW X6.jpg' },
      { id: 'range-rover', name: 'Range Rover Sport', price: 35000, category: 'suv', image: 'range roverr sport.webp' },
      { id: 'e350', name: 'Mercedes Benz E350', price: 10500, category: 'sedan', image: 'benz E350.jpg' },
      { id: 'audi-a5', name: 'Audi A5', price: 12500, category: 'sedan', image: 'audi a5.jpg' },
      { id: 'mazda-cx5', name: 'Mazda CX-5', price: 7000, category: 'suv', image: 'mazda cx5.jpg' },
      { id: 'mark-x', name: 'Toyota Mark X', price: 6500, category: 'sedan', image: 'mark x.jpg' },
      { id: 'fielder', name: 'Toyota Fielder', price: 4000, category: 'economy', image: 'toyota fielder.jpg' },
      { id: 'axela', name: 'Mazda Axela', price: 4500, category: 'economy', image: 'mazda axela.jpg' },
      { id: 'demio', name: 'Mazda Demio', price: 3500, category: 'economy', image: 'mazda demio.jpg', badge: 'Best Value' }
    ];
    return Vehicle.fromJSONArray(fallbackData);
  }

  _loadAvailability() {
    try {
      const stored = localStorage.getItem('carAvailability');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {};
  }

  _saveAvailability() {
    localStorage.setItem('carAvailability', JSON.stringify(this.availability));
  }

  // Legacy simple availability (still used for maintenance and overall status)
  getVehicleAvailability(vehicleId) {
    return this.availability[vehicleId] || 'available';
  }

  setVehicleAvailability(vehicleId, status) {
    this.availability[vehicleId] = status;
    this._saveAvailability();
    this._notifyListeners('availabilityChanged', { vehicleId, status });
    this.refreshUI();
  }

  getVehicleById(vehicleId) {
    return this.vehicles.find(v => v.id === vehicleId) || null;
  }

  getVehicleByName(name) {
    return this.vehicles.find(v => v.name === name) || null;
  }

  getAvailableVehicles() {
    return this.vehicles.filter(v => this.getVehicleAvailability(v.id) === 'available');
  }

  getBookedVehicles() {
    return this.vehicles.filter(v => this.getVehicleAvailability(v.id) === 'booked');
  }

  /**
   * Check if a vehicle is available for a specific date range.
   * Only considers confirmed or completed bookings.
   * @param {string} vehicleId - Vehicle ID
   * @param {string} pickupDate - YYYY-MM-DD
   * @param {string} returnDate - YYYY-MM-DD
   * @returns {object} { available: boolean, conflicts: Array }
   */
  checkVehicleAvailabilityForDates(vehicleId, pickupDate, returnDate) {
    const vehicle = this.getVehicleById(vehicleId);
    if (!vehicle) {
      return { available: false, conflicts: ['Vehicle not found'] };
    }

    // If the vehicle is in maintenance, it's unavailable regardless of dates
    if (this.getVehicleAvailability(vehicleId) === 'maintenance') {
      return { available: false, conflicts: ['Vehicle is under maintenance'] };
    }

    // Filter confirmed bookings for this vehicle
    const confirmedBookings = this.bookings.filter(b =>
      b.car === vehicle.name &&
      (b.status === 'confirmed' || b.status === 'completed')
    );

    if (confirmedBookings.length === 0) {
      return { available: true, conflicts: [] };
    }

    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    const conflicts = [];

    confirmedBookings.forEach(b => {
      const bPickup = new Date(b.pickup_date);
      const bReturn = new Date(b.return_date);

      // Overlap check: (start1 <= end2) && (start2 <= end1)
      const overlap = (pickup <= bReturn) && (bPickup <= returnD);

      if (overlap) {
        conflicts.push({
          booking_id: b.booking_id || b.id,
          pickup_date: b.pickup_date,
          return_date: b.return_date,
          customer: b.name || 'Customer'
        });
      }
    });

    return {
      available: conflicts.length === 0,
      conflicts
    };
  }

  /**
   * Get future bookings (confirmed/completed) for a vehicle
   * @param {string} vehicleId
   * @returns {Array} Array of booking objects (sorted by pickup_date)
   */
  getFutureBookingsForVehicle(vehicleId) {
    const vehicle = this.getVehicleById(vehicleId);
    if (!vehicle) return [];

    const today = new Date();
    const future = this.bookings.filter(b =>
      b.car === vehicle.name &&
      (b.status === 'confirmed' || b.status === 'completed') &&
      new Date(b.return_date) >= today
    );

    future.sort((a, b) => new Date(a.pickup_date) - new Date(b.pickup_date));
    return future;
  }

  /**
   * Auto-check completed bookings: if return date is in the past,
   * set vehicle availability to 'available' and optionally update booking status.
   * This should be called after loading bookings.
   */
  checkCompletedBookings() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let updated = false;
    this.bookings.forEach(booking => {
      // Only check confirmed bookings (not already completed)
      if (booking.status === 'confirmed' || booking.status === 'completed') {
        const returnDate = new Date(booking.return_date);
        returnDate.setHours(0, 0, 0, 0);

        // If return date is in the past, set vehicle to available
        if (returnDate < today) {
          const vehicle = this.getVehicleByName(booking.car);
          if (vehicle && this.getVehicleAvailability(vehicle.id) === 'booked') {
            this.setVehicleAvailability(vehicle.id, 'available');
            console.log('[FleetManager] Auto-released vehicle:', vehicle.name, 'for booking', booking.booking_id);
            updated = true;
            // Optionally, we could update the booking status to 'completed' here,
            // but we'll leave that to the admin or automatic logic.
          }
        }
      }
    });

    if (updated) {
      this.refreshUI();
    }
    return updated;
  }

  addListener(callback) { this.listeners.push(callback); }
  _notifyListeners(event, data) {
    this.listeners.forEach(cb => { try { cb(event, data); } catch {} });
  }

  refreshUI() {
    updateAvailabilityBadges();
    if (document.getElementById('adminGrid') && typeof window.renderAdminFleet === 'function') {
      window.renderAdminFleet();
    }
  }
}

let fleetManagerInstance = null;

export function getFleetManager() {
  if (!fleetManagerInstance) {
    fleetManagerInstance = new FleetManager();
  }
  return fleetManagerInstance;
}