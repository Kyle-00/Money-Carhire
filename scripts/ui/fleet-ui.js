/**
 * Fleet UI – display vehicles, search, availability badges
 */

import { getFleetManager } from '../classes/FleetManager.js';
import { formatDateDisplay } from '../helpers/format-helpers.js';

export function renderVehicles(vehicles, bookings = []) {
  const grid = document.getElementById('carsGrid');
  if (!grid) {
    console.warn('[fleet-ui] carsGrid not found');
    return;
  }
  if (!vehicles || vehicles.length === 0) {
    grid.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-secondary);">No vehicles available.</p>';
    return;
  }

  console.log('[fleet-ui] Rendering vehicles:', vehicles);

  const fleetManager = getFleetManager();
  if (bookings && bookings.length > 0) {
    fleetManager.setBookings(bookings);
  }

  let html = '';

  vehicles.forEach((v, index) => {
    console.log('[fleet-ui] Vehicle data:', {
      id: v.id,
      name: v.name,
      price: v.price,
      category: v.category,
      image: v.image,
      badge: v.badge
    });

    const id = v.id || '';
    const name = v.name || 'Unknown Vehicle';
    const price = v.price || 0;
    const category = v.category || '';
    const image = v.image || 'placeholder.jpg';
    const badge = v.badge || '';

    const status = fleetManager.getVehicleAvailability(id);
    const futureBookings = fleetManager.getFutureBookingsForVehicle(id);

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
      bookingDetails = '<div style="font-size:0.7rem;color:var(--text-secondary);margin-top:4px;">' +
        'Booked: ' + formatDateDisplay(next.pickup_date) + ' - ' + formatDateDisplay(next.return_date) +
      '</div>';
    } else if (status === 'booked') {
      availabilityLabel = 'Currently Booked';
      availabilityClass = 'unavailable';
    }

    let engineType = 'Automatic';
    if (category === 'suv') engineType = 'V6';
    else if (category === 'sedan') engineType = 'V6';
    else if (category === 'economy') engineType = '1.5L';

    const formattedPrice = 'KSh ' + price.toLocaleString('en-KE');
    const badgeHTML = badge ? '<div class="car-badge">' + badge + '</div>' : '';

    // Build the card step by step
    html += '<div class="car-card reveal" data-category="' + category + '" data-car-id="' + id + '">';
    html += badgeHTML;
    html += '<span class="availability-badge ' + availabilityClass + '">' + availabilityLabel + '</span>';
    html += bookingDetails;
    html += '<img class="car-img" src="assets/images/' + image + '" alt="' + name + '" loading="lazy">';
    html += '<div class="card-content">';
    html += '<div class="car-title">' + name + '</div>';
    html += '<div class="car-details">';
    html += '<span><i class="fas fa-cog"></i> ' + engineType + '</span>';
    html += '<span><i class="fas fa-tachometer-alt"></i> ' + engineType + '</span>';
    html += '<div class="rating">';
    html += '<i class="fas fa-star"></i>';
    html += '<i class="fas fa-star"></i>';
    html += '<i class="fas fa-star"></i>';
    html += '<i class="fas fa-star"></i>';
    html += '<i class="fas fa-star-half-alt"></i>';
    html += '<span>4.8</span>';
    html += '</div>';
    html += '</div>';
    html += '<div class="price-day">' + formattedPrice + ' <span>/ day</span></div>';
    html += '<a href="booking.html?car=' + encodeURIComponent(name) + '&price=' + price + '&category=' + category + '" class="view-btn">Book Now <i class="fas fa-arrow-right"></i></a>';
    html += '</div>';
    html += '</div>';
  });

  grid.innerHTML = html;

  // Debug: log the first 200 chars of the generated HTML
  console.log('[fleet-ui] Generated HTML length:', html.length);
  console.log('[fleet-ui] First 200 chars:', html.substring(0, 200));

  setupFleetFilter();
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
        badge.title = 'Booked: ' + formatDateDisplay(next.pickup_date) + ' - ' + formatDateDisplay(next.return_date);
      } else if (status === 'booked') {
        label = 'Currently Booked';
        cls = 'unavailable';
      }

      badge.textContent = label;
      badge.className = 'availability-badge ' + cls;
    }
  });
}

export function initFleetUI() {
  setupFleetFilter();
}