/**
 * AdminDashboard Class (OOP)
 * Manages the admin dashboard UI and data
 */

import { formatKSh, formatDateDisplay, getTodayString } from '../helpers/format-helpers.js';
import { safeParseNumber } from '../helpers/validation-helpers.js';
import { showAdminToast } from '../helpers/dom-helpers.js';
import { getFleetManager } from './FleetManager.js';

export class AdminDashboard {
  constructor() {
    this.bookings = [];
    this.filteredBookings = [];
    this.unsubscribe = null;
    this.fleetManager = getFleetManager();
    this.db = null;

    // DOM references
    this.bookingsBody = document.getElementById('bookingsBody');
    this.loadingState = document.getElementById('loadingState');
    this.tableContent = document.getElementById('tableContent');
    this.emptyState = document.getElementById('emptyState');
    this.searchInput = document.getElementById('searchInput');
    this.statusFilter = document.getElementById('statusFilter');
    this.carFilter = document.getElementById('carFilter');
    this.exportBtn = document.getElementById('exportBtn');
    this.refreshBtn = document.getElementById('refreshBtn');
    this.logoutBtn = document.getElementById('logoutBtn');
    this.chartContainer = document.getElementById('weeklyChart');

    // Stats elements
    this.totalBookingsEl = document.getElementById('totalBookings');
    this.pendingBookingsEl = document.getElementById('pendingBookings');
    this.confirmedBookingsEl = document.getElementById('confirmedBookings');
    this.totalRevenueEl = document.getElementById('totalRevenue');
    this.uniqueCustomersEl = document.getElementById('uniqueCustomers');
    this.deliveryBookingsEl = document.getElementById('deliveryBookings');
    this.mostPopularCarEl = document.getElementById('mostPopularCar');
    this.todayBookingsEl = document.getElementById('todayBookings');
    this.avgDaysEl = document.getElementById('avgDays');
  }

  init(db) {
    this.db = db;
    this._attachEventListeners();
    this.loadBookings();
  }

  _attachEventListeners() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => this._applyFilters());
    }
    if (this.statusFilter) {
      this.statusFilter.addEventListener('change', () => this._applyFilters());
    }
    if (this.carFilter) {
      this.carFilter.addEventListener('change', () => this._applyFilters());
    }
    if (this.refreshBtn) {
      this.refreshBtn.addEventListener('click', () => {
        this.loadBookings();
        showAdminToast('Refreshing bookings...', 'success');
      });
    }
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this._exportCSV());
    }
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('adminLoggedIn');
        window.location.href = 'admin-login.html';
      });
    }
  }

  loadBookings() {
    if (!this.db) {
      this._showError('Firebase not initialized.');
      return;
    }
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this._showLoading();

    console.log('[AdminDashboard] Listening to bookings...');
    this.unsubscribe = this.db.collection('bookings')
      .orderBy('created_at', 'desc')
      .onSnapshot(
        (snapshot) => {
          this.bookings = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id;
            this.bookings.push(data);
          });
          console.log('[AdminDashboard] Loaded ' + this.bookings.length + ' bookings.');
          this._populateCarFilter();
          this._applyFilters();
        },
        (error) => {
          console.error('[AdminDashboard] Error loading bookings:', error);
          this._showError('Error loading bookings: ' + error.message);
        }
      );
  }

  _populateCarFilter() {
    if (!this.carFilter) return;
    const cars = new Set();
    this.bookings.forEach((b) => {
      if (b.car) cars.add(b.car);
    });
    const currentValue = this.carFilter.value;
    this.carFilter.innerHTML = '<option value="">All Vehicles</option>';
    cars.forEach((car) => {
      const opt = document.createElement('option');
      opt.value = car;
      opt.textContent = car;
      this.carFilter.appendChild(opt);
    });
    if (currentValue && cars.has(currentValue)) {
      this.carFilter.value = currentValue;
    }
  }

  _applyFilters() {
    const search = (this.searchInput?.value || '').toLowerCase().trim();
    const status = this.statusFilter?.value || '';
    const car = this.carFilter?.value || '';

    this.filteredBookings = this.bookings.filter((b) => {
      const matchSearch = !search ||
        (b.name && b.name.toLowerCase().includes(search)) ||
        (b.email && b.email.toLowerCase().includes(search)) ||
        (b.booking_id && b.booking_id.toLowerCase().includes(search));
      const matchStatus = !status || b.status === status;
      const matchCar = !car || b.car === car;
      return matchSearch && matchStatus && matchCar;
    });

    console.log('[AdminDashboard] Filtered to ' + this.filteredBookings.length +
      ' bookings (search: "' + search + '", status: "' + status + '", car: "' + car + '")');

    this._renderTable();
    this._updateStats();
    this._updateQuickStats();
    this._updateChart();
  }

  _renderTable() {
    if (!this.bookingsBody) {
      console.error('[AdminDashboard] bookingsBody element not found!');
      return;
    }

    if (!this.filteredBookings || this.filteredBookings.length === 0) {
      this._showEmpty();
      return;
    }

    // Hide empty state and loading, then show the table container
    this._hideEmpty();
    this._hideLoading();
    if (this.tableContent) {
      this.tableContent.style.display = 'block';
    }

    this.bookingsBody.innerHTML = this.filteredBookings.map((b) => {
      const statusClass = b.status || 'pending';
      const statusLabel = statusClass.charAt(0).toUpperCase() + statusClass.slice(1);
      return `<tr>
        <td><strong>${b.booking_id || '—'}</strong></td>
        <td>
          <div><strong>${b.name || '—'}</strong></div>
          <div style="font-size:0.7rem;color:var(--text-secondary);">${b.email || ''}</div>
        </td>
        <td>${b.car || '—'}</td>
        <td>${formatDateDisplay(b.pickup_date || b.pickup_date_display)}</td>
        <td>${formatDateDisplay(b.return_date || b.return_date_display)}</td>
        <td>${b.days || '—'}</td>
        <td><strong style="color:var(--accent-gold);">${b.total || b.rental_total || 'KSh 0'}</strong></td>
        <td>${b.pickup_type || 'Self Pickup'}</td>
        <td>Pay on Pickup/Delivery</td>
        <td>
          <select class="status-select" data-id="${b.id}" data-current="${statusClass}">
            <option value="pending" ${statusClass === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${statusClass === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="completed" ${statusClass === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${statusClass === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td><button class="delete-btn" data-id="${b.id}"><i class="fas fa-trash"></i></button></td>
      </tr>`;
    }).join('');

    // Attach status change listeners
    this.bookingsBody.querySelectorAll('.status-select').forEach((sel) => {
      sel.addEventListener('change', (e) => this._updateStatus(e.target.dataset.id, e.target.value));
    });

    // Attach delete listeners
    this.bookingsBody.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => this._deleteBooking(e.target.closest('.delete-btn').dataset.id));
    });
  }

  _updateStatus(id, newStatus) {
    if (!this.db) return;
    this.db.collection('bookings').doc(id).update({ status: newStatus })
      .then(() => {
        showAdminToast('Booking status updated to ' + newStatus, 'success');
        this._syncFleetAvailability(id, newStatus);
      })
      .catch((err) => showAdminToast('Failed to update status', 'error'));
  }

  _syncFleetAvailability(bookingId, newStatus) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking || !booking.car) return;
    const vehicle = this.fleetManager.getVehicleByName(booking.car);
    if (!vehicle) return;
    if (newStatus === 'confirmed' || newStatus === 'completed') {
      this.fleetManager.setVehicleAvailability(vehicle.id, 'booked');
    } else if (newStatus === 'cancelled') {
      this.fleetManager.setVehicleAvailability(vehicle.id, 'available');
    }
    this.fleetManager.refreshUI();
  }

  _deleteBooking(id) {
    if (!this.db || !confirm('Delete this booking?')) return;
    this.db.collection('bookings').doc(id).delete()
      .then(() => showAdminToast('Booking deleted', 'success'))
      .catch((err) => showAdminToast('Failed to delete', 'error'));
  }

  _updateStats() {
    const total = this.filteredBookings.length;
    const pending = this.filteredBookings.filter((b) => b.status === 'pending').length;
    const confirmed = this.filteredBookings.filter((b) => b.status === 'confirmed').length;
    let revenue = 0;
    this.filteredBookings.forEach((b) => {
      revenue += safeParseNumber(b.total) || safeParseNumber(b.rental_total);
    });
    const uniqueEmails = new Set(this.filteredBookings.map((b) => b.email).filter(Boolean));
    const deliveryBookings = this.filteredBookings.filter((b) => b.pickup_type === 'Car Delivery').length;

    if (this.totalBookingsEl) this.totalBookingsEl.textContent = total;
    if (this.pendingBookingsEl) this.pendingBookingsEl.textContent = pending;
    if (this.confirmedBookingsEl) this.confirmedBookingsEl.textContent = confirmed;
    if (this.totalRevenueEl) this.totalRevenueEl.textContent = formatKSh(revenue);
    if (this.uniqueCustomersEl) this.uniqueCustomersEl.textContent = uniqueEmails.size;
    if (this.deliveryBookingsEl) this.deliveryBookingsEl.textContent = deliveryBookings;
  }

  _updateQuickStats() {
    const carCounts = {};
    this.filteredBookings.forEach((b) => {
      if (b.car) carCounts[b.car] = (carCounts[b.car] || 0) + 1;
    });
    let mostPopular = '—';
    let max = 0;
    for (const car in carCounts) {
      if (carCounts[car] > max) {
        max = carCounts[car];
        mostPopular = car;
      }
    }

    const todayStr = getTodayString();
    const todayBookings = this.filteredBookings.filter((b) => {
      const pickup = b.pickup_date;
      if (!pickup) return false;
      const d = new Date(pickup);
      return d.toISOString().split('T')[0] === todayStr;
    }).length;

    let totalDays = 0;
    let count = 0;
    this.filteredBookings.forEach((b) => {
      const days = safeParseNumber(b.days);
      if (days > 0) {
        totalDays += days;
        count++;
      }
    });
    const avg = count > 0 ? (totalDays / count).toFixed(1) : '—';

    if (this.mostPopularCarEl) this.mostPopularCarEl.textContent = mostPopular;
    if (this.todayBookingsEl) this.todayBookingsEl.textContent = todayBookings;
    if (this.avgDaysEl) this.avgDaysEl.textContent = avg === '—' ? '—' : avg + ' days';
  }

 _updateChart() {
  if (!this.chartContainer) return;

  // Build last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-KE', { weekday: 'short' });
    days.push({ date: dateStr, label: label, count: 0, confirmed: 0 });
  }

  // Aggregate bookings
  this.filteredBookings.forEach((b) => {
    if (b.created_at) {
      const createdDate = b.created_at.toDate ? b.created_at.toDate() : new Date(b.created_at);
      const dateStr = createdDate.toISOString().split('T')[0];
      const day = days.find((d) => d.date === dateStr);
      if (day) {
        day.count++;
        if (b.status === 'confirmed' || b.status === 'completed') {
          day.confirmed++;
        }
      }
    }
  });

  const maxCount = Math.max(1, ...days.map((d) => d.count));

  // Build the chart HTML
  let barsHTML = '';
  let labelsHTML = '';

  days.forEach((day) => {
    const percent = (day.count / maxCount) * 100;
    const height = day.count > 0 ? Math.max(4, percent) : 0;
    const barColor = day.confirmed > 0 ? '#2ecc71' : 'var(--accent-gold)';

    barsHTML += `<div class="bar-wrapper" style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;">
      <div class="bar" style="height:${height}%;min-height:${day.count > 0 ? '4px' : '0'};background-color:${barColor};border-radius:4px 4px 0 0;width:70%;position:relative;">
        <span class="bar-tooltip">${day.label}: ${day.count} bookings (${day.confirmed} confirmed)</span>
      </div>
    </div>`;

    labelsHTML += `<div class="day-label">${day.label}</div>`;
  });

  // Combine into full chart
  this.chartContainer.innerHTML = `
    <div class="chart-bars" style="display:flex;align-items:flex-end;height:100%;border-bottom:2px solid var(--text-secondary);padding-bottom:4px;">
      ${barsHTML}
    </div>
    <div class="chart-labels" style="display:flex;margin-top:4px;">
      ${labelsHTML}
    </div>
  `;

  // Tooltip hover events
  this.chartContainer.querySelectorAll('.bar').forEach((bar) => {
    bar.addEventListener('mouseenter', function() {
      const tip = this.querySelector('.bar-tooltip');
      if (tip) tip.style.display = 'block';
    });
    bar.addEventListener('mouseleave', function() {
      const tip = this.querySelector('.bar-tooltip');
      if (tip) tip.style.display = 'none';
    });
  });
}

  _exportCSV() {
    if (this.bookings.length === 0) {
      showAdminToast('No bookings to export', 'error');
      return;
    }
    const headers = ['Booking ID', 'Name', 'Email', 'Phone', 'Car', 'Pickup Date', 'Return Date', 'Days', 'Rental Total', 'Delivery Fee', 'Total', 'Pickup Type', 'Status', 'Location', 'Requests'];
    const rows = this.bookings.map((b) => [
      b.booking_id || '',
      b.name || '',
      b.email || '',
      b.phone || '',
      b.car || '',
      formatDateDisplay(b.pickup_date || b.pickup_date_display),
      formatDateDisplay(b.return_date || b.return_date_display),
      b.days || '',
      b.rental_total || '',
      b.delivery_fee || 'KSh 0',
      b.total || '',
      b.pickup_type || 'Self Pickup',
      b.status || '',
      b.location || '',
      b.requests || ''
    ]);

    let csv = headers.join(',') + '\n' + rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings_export_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showAdminToast('Exported successfully!', 'success');
  }

  _showLoading() {
    if (this.loadingState) this.loadingState.style.display = 'block';
    if (this.tableContent) this.tableContent.style.display = 'none';
    if (this.emptyState) this.emptyState.style.display = 'none';
  }

  _hideLoading() {
    if (this.loadingState) this.loadingState.style.display = 'none';
  }

  _showEmpty() {
    if (this.tableContent) this.tableContent.style.display = 'none';
    if (this.emptyState) this.emptyState.style.display = 'block';
    if (this.loadingState) this.loadingState.style.display = 'none';
  }

  _hideEmpty() {
    if (this.emptyState) this.emptyState.style.display = 'none';
  }

  _showError(message) {
    if (this.loadingState) this.loadingState.style.display = 'none';
    if (this.tableContent) this.tableContent.style.display = 'none';
    if (this.emptyState) {
      this.emptyState.style.display = 'block';
      this.emptyState.innerHTML = '<i class="fas fa-exclamation-triangle"></i><p>' + message + '</p>';
    }
  }

  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}