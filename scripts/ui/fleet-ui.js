/**
 * Fleet UI – display vehicles, search, availability badges
 */

import { getFleetManager } from '../classes/FleetManager.js';
import { formatDateDisplay } from '../helpers/format-helpers.js';

export function renderVehicles(vehicles, bookings = []) {
  const grid = document.getElementById('carsGrid');
  if (!grid) return;
  if (!vehicles || vehicles.length === 0) {
    grid.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-secondary);">No vehicles available.</p>';
    return;
  }

  const fleetManager = getFleetManager();
  if (bookings && bookings.length > 0) {
    fleetManager.setBookings(bookings);
  }

  grid.innerHTML = vehicles.map(v => {
    const status = fleetManager.getVehicleAvailability(v.id);
    const futureBookings = fleetManager.getFutureBookingsForVehicle(v.id);

    // Determine availability label & class
    let availabilityLabel = 'Available';
    let availabilityClass = 'available';
    let bookingDetails = '';

    if (status === 'maintenance') {
      availabilityLabel = 'In Maintenance';
      availabilityClass = 'maintenance';
    } else if (futureBookings.length > 0) {
      availabilityLabel = 'Booked';
      availabilityClass = 'unavailable';
      const next = futureBookings[0];
      bookingDetails = `<div style="font-size:0.7rem;color:var(--text-secondary);margin-top:4px;">
        Booked: ${formatDateDisplay(next.pickup_date)} - ${formatDateDisplay(next.return_date)}
      </div>`;
    } else if (status === 'booked') {
      availabilityLabel = 'Currently Booked';
      availabilityClass = 'unavailable';
    }

    const badgeHTML = v.badge ? `<div class="car-badge">${v.badge}</div>` : '';

    // Determine engine type
    let engineType = 'Automatic';
    if (v.category === 'suv') engineType = 'V6';
    else if (v.category === 'sedan') engineType = 'V6';
    else if (v.category === 'economy') engineType = '1.5L';

    // Format price
    const formattedPrice = v.getFormattedPrice ? v.getFormattedPrice() : 'KSh ' + v.price.toLocaleString();

    // Full card HTML – now with all details
    return `<div class="car-card reveal" data-category="${v.category}" data-car-id="${v.id}">
      ${badgeHTML}
      <span class="availability-badge ${availabilityClass}">${availabilityLabel}</span>
      ${bookingDetails}
      <img class="car-img" src="assets/images/${v.image}" alt="${v.name}" loading="lazy">
      <div class="card-content">
        <div class="car-title">${v.name}</div>
        <div class="car-details">
          <span><i class="fas fa-cog"></i> ${engineType}</span>
          <span><i class="fas fa-tachometer-alt"></i> ${engineType}</span>
          <div class="rating">
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star-half-alt"></i>
            <span>4.8</span>
          </div>
        </div>
        <div class="price-day">${formattedPrice} <span>/ day</span></div>
        <a href="booking.html?car=${encodeURIComponent(v.name)}&price=${v.price}&category=${v.category}" class="view-btn">Book Now <i class="fas fa-arrow-right"></i></a>
      </div>
    </div>`;
  }).join('');
}

export function setupFleetFilter() {
  const searchInput = document.getElementById('fleetSearch');
  const cards = document.querySelectorAll('.car-card');
  const noResults = document.getElementById('noResults');
  if (!searchInput) return;
  function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();
    let visible = 0;
    cards.forEach(card => {
      const title = (card.querySelector('.car-title')?.textContent || '').toLowerCase();
      const show = !query || title.includes(query);
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    if (noResults) noResults.style.display = visible === 0 ? 'block' : 'none';
  }
  searchInput.addEventListener('input', applyFilters);
  applyFilters();
}

export function updateAvailabilityBadges() {
  const cards = document.querySelectorAll('.car-card');
  const fleetManager = getFleetManager();

  cards.forEach(card => {
    const id = card.dataset.carId;
    if (!id) return;

    const futureBookings = fleetManager.getFutureBookingsForVehicle(id);
    const status = fleetManager.getVehicleAvailability(id);
    const badge = card.querySelector('.availability-badge');

    if (badge) {
      let label = 'Available';
      let cls = 'available';

      if (status === 'maintenance') {
        label = 'In Maintenance';
        cls = 'maintenance';
      } else if (futureBookings.length > 0) {
        label = 'Booked';
        cls = 'unavailable';
        const next = futureBookings[0];
        badge.title = `Booked: ${formatDateDisplay(next.pickup_date)} - ${formatDateDisplay(next.return_date)}`;
      } else if (status === 'booked') {
        label = 'Currently Booked';
        cls = 'unavailable';
      }

      badge.textContent = label;
      badge.className = `availability-badge ${cls}`;
    }

    // Update booking details div if present
    const detailsDiv = card.querySelector('.car-card > div:not(.availability-badge):not(.car-badge)');
    if (detailsDiv && futureBookings.length > 0) {
      const next = futureBookings[0];
      detailsDiv.innerHTML = `Booked: ${formatDateDisplay(next.pickup_date)} - ${formatDateDisplay(next.return_date)}`;
    } else if (detailsDiv) {
      detailsDiv.innerHTML = '';
    }
  });
}

export function initFleetUI() {
  setupFleetFilter();
}