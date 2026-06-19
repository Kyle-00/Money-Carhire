/**
 * Admin UI – login and fleet management panel
 */

import { getFleetManager } from '../classes/FleetManager.js';
import { $, showAdminToast } from '../helpers/dom-helpers.js';
import { formatKSh } from '../helpers/format-helpers.js';

// Get credentials from config
const ADMIN_USERNAME = window.CONFIG?.admin?.username || 'owner';
const ADMIN_PASSWORD = window.CONFIG?.admin?.password || 'admin123';

export function initAdminLogin() {
  const loginBtn = document.getElementById('loginBtn');
  const usernameInput = document.getElementById('adminLoginUsername');
  const passwordInput = document.getElementById('adminLoginPassword');
  const errorEl = document.getElementById('loginError');

  if (!loginBtn || !passwordInput) return;

  function handleLogin() {
    const username = usernameInput?.value.trim() || '';
    const password = passwordInput.value.trim();

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Set session flag
      sessionStorage.setItem('adminLoggedIn', 'true');
      window.location.href = 'admin.html';
    } else {
      if (errorEl) errorEl.style.display = 'block';
      passwordInput.value = '';
      usernameInput?.focus();
    }
  }

  loginBtn.addEventListener('click', handleLogin);
  passwordInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
  if (usernameInput) {
    usernameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleLogin();
    });
  }
}

export function initAdminFleet() {
  const grid = document.getElementById('adminGrid');
  const saveBtn = document.getElementById('saveChanges');
  const logoutBtn = document.getElementById('logoutBtn');
  if (!grid) return;

  const fleetManager = getFleetManager();

  function renderAdminFleet() {
    if (fleetManager.vehicles.length === 0) {
      grid.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-secondary);">Loading vehicles...</p>';
      return;
    }
    grid.innerHTML = fleetManager.vehicles.map(v => {
      const status = fleetManager.getVehicleAvailability(v.id);
      let label = 'Available', cls = 'available';
      if (status === 'booked') { label = 'Booked'; cls = 'booked'; }
      else if (status === 'maintenance') { label = 'In Maintenance'; cls = 'maintenance'; }
      return `<div class="admin-card" data-id="${v.id}">
        <div class="name">${v.name}</div>
        <div class="price">${formatKSh(v.price)} / day</div>
        <span class="status-badge ${cls}">${label}</span>
        <div class="btn-group">
          <button class="btn-available" data-status="available" data-id="${v.id}">Set Available</button>
          <button class="btn-booked" data-status="booked" data-id="${v.id}">Set Booked</button>
          <button class="btn-maintenance" data-status="maintenance" data-id="${v.id}">Set Maintenance</button>
        </div>
      </div>`;
    }).join('');

    grid.querySelectorAll('.admin-card .btn-group button').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        const newStatus = this.dataset.status;
        fleetManager.setVehicleAvailability(id, newStatus);
        renderAdminFleet();
        fleetManager.refreshUI();
        showAdminToast(`Status updated for ${id}`, 'success');
      });
    });
  }

  window.renderAdminFleet = renderAdminFleet;

  if (saveBtn) {
    saveBtn.addEventListener('click', () => showAdminToast('All changes saved locally', 'success'));
  }
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      // Clear session and redirect to login
      sessionStorage.removeItem('adminLoggedIn');
      window.location.href = 'admin-login.html';
    });
  }

  if (fleetManager.isLoaded) {
    renderAdminFleet();
  } else {
    grid.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-secondary);">Loading vehicles...</p>';
    fleetManager.addListener(event => { if (event === 'loaded') renderAdminFleet(); });
  }
}