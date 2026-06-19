/**
 * app.js – Main Orchestrator
 * Imports and initialises all modules
 */

// ── Configuration ──
import { initFirebase, getBookings } from './services/firebase-service.js';
import { initEmailJS } from './services/email-service.js';

// ── Classes ──
import { getFleetManager } from './classes/FleetManager.js';
import { AdminDashboard } from './classes/AdminDashboard.js';

// ── UI ──
import { initDarkMode } from './ui/dark-mode.js';
import { initNavbar } from './ui/navbar.js';
import { initHeroDate } from './ui/hero-ui.js';
import { initTestimonialSlider } from './ui/testimonials.js';
import {
  initBackToTop, initLazyImages, initFooterYear,
  initScrollReveal, initCounters, initAdminShortcut
} from './ui/common-ui.js';
import { initAdminLogin, initAdminFleet } from './ui/admin-ui.js';
import { initBookingPage, initBookingForm } from './ui/booking-ui.js';
import { initContactForm } from './ui/contact.js';
import { renderVehicles, initFleetUI, updateAvailabilityBadges } from './ui/fleet-ui.js';

// ── Helpers ──
import { showToast } from './helpers/dom-helpers.js';

const CONFIG = window.CONFIG || {};

class App {
  constructor() {
    this.fleetManager = null;
    this.adminDashboard = null;
    this.db = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    console.log('[App] Initialising Money Carhire...');

    // Init Firebase if needed
    const needsFirebase = document.getElementById('bookingForm') || document.getElementById('bookingsBody');
    this.db = initFirebase(CONFIG.firebase, needsFirebase);

    // Init EmailJS
    initEmailJS(CONFIG.emailjs);

    // Init UI components that don't need data
    this._initUI();

    // Load vehicles
    this.fleetManager = getFleetManager();
    await this.fleetManager.loadVehicles();

    // Fetch bookings from Firebase if available
    let bookings = [];
    if (this.db) {
      try {
        bookings = await getBookings();
        console.log('[App] Loaded', bookings.length, 'bookings from Firebase');
        // Store bookings in FleetManager for availability checks
        this.fleetManager.setBookings(bookings);
      } catch (err) {
        console.warn('[App] Could not load bookings:', err);
      }
    }

    // Render vehicles on fleet page, passing bookings for date display
    if (this.fleetManager.vehicles.length > 0) {
      renderVehicles(this.fleetManager.vehicles, bookings);
    }
    initFleetUI();
    updateAvailabilityBadges();

    // Vehicle‑dependent features
    if (document.getElementById('vehicleSelect')) {
      // booking-ui will use fleetManager's bookings for availability check
      initBookingPage();
    }

    // Admin fleet panel
    if (document.getElementById('adminGrid')) {
      initAdminFleet();
    }

    // Admin dashboard (needs Firebase)
    if (document.getElementById('bookingsBody') && this.db) {
      this.adminDashboard = new AdminDashboard();
      this.adminDashboard.init(this.db);
    }

    this.initialized = true;
    console.log('[App] Initialisation complete.');
  }

  _initUI() {
    initDarkMode();
    initNavbar();
    initHeroDate();
    initScrollReveal();
    initCounters();
    initTestimonialSlider();
    initBackToTop();
    initLazyImages();
    initFooterYear();
    initAdminShortcut();
    initBookingForm();
    initContactForm();
    if (document.getElementById('adminLoginPassword')) {
      initAdminLogin();
    }
  }
}

// ── Bootstrap ──
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init().catch(err => {
    console.error('[App] Fatal error:', err);
    showToast('Failed to initialise application. Please refresh.', 'error');
  });
  window.__app = app; // for debugging
});

export default App;