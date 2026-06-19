/**
 * Money Carhire — script.js
 * 
 * This file contains all the JavaScript functionality for the Money Carhire website.
 * It handles:
 * - Booking form submission and validation
 * - Firebase integration for storing bookings
 * - EmailJS for sending confirmation emails
 * - Admin dashboard with real-time updates
 * - Fleet availability management
 * - Dark mode toggle
 * - And more...
 * 
 * @author Money Carhire Team
 * @version 2.0
 */

'use strict';

/* ============================================================
   SECTION 1: Firebase Configuration
   ============================================================ */

/**
 * Firebase configuration object
 * This connects our website to Google's Firebase cloud database
 * All bookings are stored here so they persist between sessions
 */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCrxaEnJ0R7mTJdiJ9vLgQFikoAncAuG7E",
  authDomain: "money-carhire.firebaseapp.com",
  projectId: "money-carhire",
  storageBucket: "money-carhire.firebasestorage.app",
  messagingSenderId: "269929325057",
  appId: "1:269929325057:web:3469a8281944d990cd1600",
  measurementId: "G-156QZDLS94"
};

/**
 * Check if we're on a page that needs Firebase
 * Only initialize Firebase if we're on booking or admin pages
 */
const needsFirebase = document.getElementById('bookingForm') || 
                      document.getElementById('bookingsBody') || 
                      document.getElementById('adminGrid');

if (needsFirebase) {
  // Only initialize Firebase if the library is loaded
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
    console.log('[OK] Firebase initialized');
  } else if (typeof firebase !== 'undefined') {
    console.log('[INFO] Firebase already initialized');
  } else {
    console.error('[ERROR] Firebase library not loaded on a page that needs it');
  }
  // Get Firestore database reference
  const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
  if (db) {
    console.log('[OK] Firestore available');
  } else {
    console.error('[ERROR] Firestore not available');
  }
} else {
  console.log('[INFO] Firebase not needed on this page');
}

/* ============================================================
   SECTION 2: EmailJS Configuration
   ============================================================ */

/**
 * EmailJS configuration for sending emails directly from the browser
 * No server needed - EmailJS handles the email delivery
 */
const EMAILJS_CONFIG = {
  publicKey: 'GrwmOU4hjzqu9yLEP',           // EmailJS API key
  serviceId: 'service_4sf99gj',             // Email service ID
  customerTemplate: 'template_ho9ezeu',     // Template for customer confirmation
  ownerTemplate: 'template_jtnrwul',        // Template for owner notification
  ownerEmail: 'moneycarhire@gmail.com'      // Owner's email address
};
console.log('[INFO] EmailJS Config:', EMAILJS_CONFIG);

// Initialize EmailJS with our public key
if (typeof emailjs !== 'undefined') {
  emailjs.init(EMAILJS_CONFIG.publicKey);
  console.log('[OK] EmailJS initialized');
}

/* ============================================================
   SECTION 3: Admin Configuration
   ============================================================ */

/**
 * Admin login credentials
 * The password is hardcoded for simplicity (no database needed)
 */
const ADMIN_CONFIG = {
  password: 'yktvwithkyle'  // Change this to your own password
};

/* ============================================================
   SECTION 4: Constants & Business Rules
   ============================================================ */

/**
 * Business constants that can be easily updated
 */
const DELIVERY_FEE = 1000;  // KSh 1,000 delivery fee

/* ============================================================
   SECTION 5: Helper Functions
   ============================================================ */

/**
 * Format a number as Kenyan Shillings
 * Example: formatKSh(50000) -> "KSh 50,000"
 */
function formatKSh(amount) {
  return 'KSh ' + Number(amount).toLocaleString('en-KE');
}

/**
 * Calculate the number of days between two dates
 * Returns 0 if end date is before start date
 */
function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diff = (d2 - d1) / (1000 * 60 * 60 * 24);
  return diff > 0 ? Math.round(diff) : 0;
}

/**
 * Validate email format
 * Returns true if email is valid, false otherwise
 */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate Kenyan phone numbers
 * Accepts: +254712345678 or 0712345678
 * Returns true if valid, false otherwise
 */
function validatePhone(phone) {
  return /^(\+254|0)[17]\d{8}$/.test(phone.replace(/\s/g, ''));
}

/**
 * Get URL query parameters
 * Example: ?car=BMW&price=25000 -> {car: "BMW", price: "25000"}
 */
function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

/**
 * Convert a Date object to YYYY-MM-DD string
 */
function toDateString(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Format a date for display
 * Example: "2026-06-20" -> "Jun 20, 2026"
 * Handles different date formats including Firestore timestamps
 */
function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';
  let d;
  if (typeof dateStr === 'object' && dateStr.toDate) {
    // Firestore timestamp
    d = dateStr.toDate();
  } else if (typeof dateStr === 'string') {
    // YYYY-MM-DD format or already formatted
    if (dateStr.includes('-')) {
      d = new Date(dateStr + 'T00:00:00');
    } else {
      d = new Date(dateStr);
    }
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Generate a random booking ID
 * 8 characters from A-Z and 0-9
 * Example: "ABC12345"
 */
function generateBookingId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Safely parse a number from various formats
 * Handles strings like "KSh 50,000" and plain numbers
 */
function safeParseNumber(value) {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) return num;
  }
  return 0;
}

/**
 * Format phone number for WhatsApp
 * Example: "0712345678" -> "254712345678"
 * Example: "+254 712 345 678" -> "254712345678"
 */
function formatPhoneForWhatsApp(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
}

/* ============================================================
   SECTION 6: Vehicle Data
   ============================================================ */

/**
 * Vehicle inventory data
 * Each vehicle has: id, name, price per day, and category
 */
const VEHICLES_DATA = [
  { id: 'g-wagon', name: 'Mercedes G-Wagon', price: 50000, category: 'suv' },
  { id: 'bmw-x6', name: 'BMW X6', price: 25000, category: 'suv' },
  { id: 'range-rover', name: 'Range Rover Sport', price: 35000, category: 'suv' },
  { id: 'e350', name: 'Mercedes Benz E350', price: 10500, category: 'sedan' },
  { id: 'audi-a5', name: 'Audi A5', price: 12500, category: 'sedan' },
  { id: 'mazda-cx5', name: 'Mazda CX-5', price: 7000, category: 'suv' },
  { id: 'mark-x', name: 'Toyota Mark X', price: 6500, category: 'sedan' },
  { id: 'fielder', name: 'Toyota Fielder', price: 4000, category: 'economy' },
  { id: 'axela', name: 'Mazda Axela', price: 4500, category: 'economy' },
  { id: 'demio', name: 'Mazda Demio', price: 3500, category: 'economy' }
];

/* ============================================================
   SECTION 7: Fleet Availability Management (localStorage)
   ============================================================ */

/**
 * Get availability status of a car
 * Returns: "available", "booked", or "maintenance"
 */
function getCarAvailability(carId) {
  const stored = localStorage.getItem('carAvailability');
  if (!stored) return 'available';
  const avail = JSON.parse(stored);
  return avail[carId] || 'available';
}

/**
 * Set availability status of a car
 * Saves to localStorage for persistence
 */
function setCarAvailability(carId, status) {
  const stored = localStorage.getItem('carAvailability');
  const avail = stored ? JSON.parse(stored) : {};
  avail[carId] = status;
  localStorage.setItem('carAvailability', JSON.stringify(avail));
}

/**
 * Get all vehicle availability data
 * Returns an object with all vehicle statuses
 */
function getAvailability() {
  const stored = localStorage.getItem('carAvailability');
  if (stored) return JSON.parse(stored);
  const defaultAvail = {};
  VEHICLES_DATA.forEach(v => defaultAvail[v.id] = 'available');
  return defaultAvail;
}

/**
 * Save all vehicle availability data
 */
function saveAvailability(data) {
  localStorage.setItem('carAvailability', JSON.stringify(data));
}

/**
 * Update availability badges on the fleet page
 * This reads the current status from localStorage and updates the UI
 */
function updateAvailabilityBadges() {
  const cards = document.querySelectorAll('.car-card');
  cards.forEach(card => {
    const id = card.dataset.carId;
    if (!id) return;
    const status = getCarAvailability(id);
    const badge = card.querySelector('.availability-badge');
    if (badge) {
      let label = 'Available';
      let cls = 'available';
      if (status === 'booked') {
        label = 'Currently Booked';
        cls = 'unavailable';
      } else if (status === 'maintenance') {
        label = 'In Maintenance';
        cls = 'maintenance';
      }
      badge.textContent = label;
      badge.className = 'availability-badge ' + cls;
    }
  });
}

/* ============================================================
   SECTION 8: DOM Helpers
   ============================================================ */

/**
 * Shortcut for document.querySelector
 */
const $ = (sel, ctx) => (ctx || document).querySelector(sel);

/**
 * Shortcut for document.querySelectorAll
 * Returns an array (not a NodeList)
 */
const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

/**
 * Show a toast notification to the user
 * Used for success/error messages on the customer side
 */
function showToast(message, type) {
  type = type || 'success';
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast show ' + type;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function() {
    toast.classList.remove('show');
  }, 5000);
}

/**
 * Show a toast notification for the admin dashboard
 * Separate function for admin-specific messages
 */
function showAdminToast(message, type) {
  type = type || 'success';
  const toast = document.getElementById('adminToast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast show ' + type;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function() {
    toast.classList.remove('show');
  }, 3000);
}

/* ============================================================
   SECTION 9: Dark Mode
   ============================================================ */

/**
 * Initialize dark mode toggle
 * Saves preference in localStorage so it persists across sessions
 */
function initDarkMode() {
  const btn = document.getElementById('darkModeBtn');
  const icon = document.getElementById('darkModeIcon');
  if (!btn) return;

  // Load saved preference
  const saved = localStorage.getItem('mcDarkMode');
  if (saved === 'true') {
    document.body.classList.add('dark');
    if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
  }

  // Toggle on button click
  btn.addEventListener('click', function() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('mcDarkMode', isDark);
    if (icon) {
      icon.classList.toggle('fa-moon', !isDark);
      icon.classList.toggle('fa-sun', isDark);
    }
  });
}

/* ============================================================
   SECTION 10: Navbar
   ============================================================ */

/**
 * Initialize navigation bar
 * - Adds scroll shadow effect
 * - Handles mobile hamburger menu
 */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (!navbar) return;

  // Add shadow on scroll
  window.addEventListener('scroll', function() {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Mobile hamburger menu toggle
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
      const open = navLinks.classList.toggle('open');
      hamburger.classList.toggle('active', open);
      hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!navbar.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
      }
    });
  }
}

/* ============================================================
   SECTION 11: Hero Date
   ============================================================ */

/**
 * Set hero section date picker to today's date
 */
function initHeroDate() {
  const heroDate = document.getElementById('heroDate');
  if (!heroDate) return;
  const today = new Date();
  heroDate.value = toDateString(today);
  heroDate.min = toDateString(today);
}

/* ============================================================
   SECTION 12: Fleet Search Filter
   ============================================================ */

/**
 * Initialize fleet search filter
 * Filters cars in real-time as the user types
 */
function initFleetFilter() {
  const searchInput = document.getElementById('fleetSearch');
  const cards = document.querySelectorAll('.car-card');
  const noResults = document.getElementById('noResults');
  if (!searchInput) return;

  function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();
    let visible = 0;

    cards.forEach(function(card) {
      const title = (card.querySelector('.car-title')?.textContent || '').toLowerCase();
      const show = !query || title.includes(query);
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (noResults) {
      noResults.style.display = visible === 0 ? 'block' : 'none';
    }
  }

  searchInput.addEventListener('input', applyFilters);
  applyFilters(); // Initialize on page load
}

/* ============================================================
   SECTION 13: Scroll Reveal Animations
   ============================================================ */

/**
 * Animate elements when they scroll into view
 * Uses Intersection Observer API for performance
 */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length || !('IntersectionObserver' in window)) {
    elements.forEach(function(el) { el.classList.add('visible'); });
    return;
  }
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry, i) {
      if (entry.isIntersecting) {
        const siblings = entry.target.parentElement.querySelectorAll('.reveal');
        const idx = Array.from(siblings).indexOf(entry.target);
        setTimeout(function() {
          entry.target.classList.add('visible');
        }, idx * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(function(el) { observer.observe(el); });
}

/* ============================================================
   SECTION 14: Animated Counters
   ============================================================ */

/**
 * Animate stats counters when they scroll into view
 */
function initCounters() {
  const counters = document.querySelectorAll('.stat-number');
  if (!counters.length || !('IntersectionObserver' in window)) return;

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const step = 16;
    const increment = target / (duration / step);
    let current = 0;

    const timer = setInterval(function() {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current);
    }, step);
  }

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(function(c) { observer.observe(c); });
}

/* ============================================================
   SECTION 15: Testimonial Slider
   ============================================================ */

/**
 * Auto-sliding testimonial carousel
 * Also supports touch/swipe on mobile
 */
function initTestimonialSlider() {
  const track = document.getElementById('testimonialTrack');
  const dotsWrap = document.getElementById('sliderDots');
  if (!track) return;

  const cards = track.querySelectorAll('.testimonial-card');
  const total = cards.length;
  let current = 0;
  let autoTimer = null;

  // Create dots
  if (dotsWrap) {
    cards.forEach(function(_, i) {
      const dot = document.createElement('button');
      dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Testimonial ' + (i + 1));
      dot.addEventListener('click', function() { goTo(i); });
      dotsWrap.appendChild(dot);
    });
  }

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    if (dotsWrap) {
      dotsWrap.querySelectorAll('.slider-dot').forEach(function(d, i) {
        d.classList.toggle('active', i === current);
      });
    }
  }

  // Auto-play
  function startAuto() {
    autoTimer = setInterval(function() { goTo(current + 1); }, 4500);
  }
  function stopAuto() { clearInterval(autoTimer); }

  startAuto();
  // Pause on hover
  const wrap = track.closest('.testimonial-slider-wrap');
  if (wrap) {
    wrap.addEventListener('mouseenter', stopAuto);
    wrap.addEventListener('mouseleave', startAuto);
  }

  // Touch/Swipe support
  let touchStartX = 0;
  track.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', function(e) {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      goTo(diff > 0 ? current + 1 : current - 1);
    }
  }, { passive: true });
}

/* ============================================================
   SECTION 16: Back to Top
   ============================================================ */

/**
 * Show/hide back-to-top button based on scroll position
 */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', function() {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================
   SECTION 17: Lazy Image Loading
   ============================================================ */

/**
 * Lazy load images using Intersection Observer
 * Images load only when they're about to enter the viewport
 */
function initLazyImages() {
  const images = document.querySelectorAll('img[data-src]');
  if (!images.length || !('IntersectionObserver' in window)) {
    images.forEach(function(img) { img.src = img.dataset.src; });
    return;
  }
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  images.forEach(function(img) { observer.observe(img); });
}

/* ============================================================
   SECTION 18: Footer Year
   ============================================================ */

/**
 * Update footer copyright year dynamically
 */
function initFooterYear() {
  document.querySelectorAll('#footerYear').forEach(function(el) {
    el.textContent = new Date().getFullYear();
  });
}

/* ============================================================
   SECTION 19: Admin Login
   ============================================================ */

/**
 * Simple password-protected admin login
 * Redirects to admin dashboard on success
 */
function initAdminLogin() {
  const loginBtn = document.getElementById('loginBtn');
  const passwordInput = document.getElementById('adminLoginPassword');
  const errorEl = document.getElementById('loginError');

  if (!loginBtn || !passwordInput) return;

  function handleLogin() {
    const input = passwordInput.value;
    if (input === ADMIN_CONFIG.password) {
      window.location.href = 'admin.html';
    } else {
      if (errorEl) errorEl.style.display = 'block';
      passwordInput.value = '';
      passwordInput.focus();
    }
  }

  loginBtn.addEventListener('click', handleLogin);
  passwordInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') handleLogin();
  });
}

/* ============================================================
   SECTION 20: Admin Fleet Management
   ============================================================ */

/**
 * Fleet management panel for admin
 * Allows toggling vehicle availability
 */
function initAdminFleet() {
  const grid = document.getElementById('adminGrid');
  const saveBtn = document.getElementById('saveChanges');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!grid) return;

  function renderAdminFleet() {
    const avail = getAvailability();

    grid.innerHTML = VEHICLES_DATA.map(function(v) {
      const status = avail[v.id] || 'available';
      let statusLabel = 'Available';
      let statusClass = 'available';
      if (status === 'booked') {
        statusLabel = 'Booked';
        statusClass = 'booked';
      } else if (status === 'maintenance') {
        statusLabel = 'In Maintenance';
        statusClass = 'maintenance';
      }

      return '<div class="admin-card" data-id="' + v.id + '">' +
        '<div class="name">' + v.name + '</div>' +
        '<div class="price">KSh ' + v.price.toLocaleString() + ' / day</div>' +
        '<span class="status-badge ' + statusClass + '">' + statusLabel + '</span>' +
        '<div class="btn-group">' +
        '<button class="btn-available" data-status="available" data-id="' + v.id + '">Set Available</button>' +
        '<button class="btn-booked" data-status="booked" data-id="' + v.id + '">Set Booked</button>' +
        '<button class="btn-maintenance" data-status="maintenance" data-id="' + v.id + '">Set Maintenance</button>' +
        '</div>' +
        '</div>';
    }).join('');

    // Add click handlers to status buttons
    grid.querySelectorAll('.admin-card .btn-group button').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        const newStatus = this.dataset.status;
        const avail = getAvailability();
        avail[id] = newStatus;
        saveAvailability(avail);
        renderAdminFleet();
        showAdminToast('Status updated for ' + id, 'success');
      });
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      showAdminToast('All changes saved locally', 'success');
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      window.location.href = 'admin-login.html';
    });
  }

  renderAdminFleet();
}

/* ============================================================
   SECTION 21: Booking Page
   ============================================================ */

/**
 * Initialize booking page
 * - Populates vehicle dropdown with availability status
 * - Sets default dates
 * - Handles URL parameters for pre-selection
 */
function initBookingPage() {
  const vehicleSelect = document.getElementById('vehicleSelect');
  const pickupDateInput = document.getElementById('pickupDate');
  const returnDateInput = document.getElementById('returnDate');
  const locationSelect = document.getElementById('pickupLocation');

  if (!vehicleSelect) return;

  /**
   * Populate vehicle dropdown with options
   * Disables cars that are booked or in maintenance
   */
  function populateVehicleOptions() {
    const currentVal = vehicleSelect.value;
    vehicleSelect.innerHTML = '<option value="">-- Choose your vehicle --</option>';
    VEHICLES_DATA.forEach(function(v) {
      const status = getCarAvailability(v.id);
      const opt = document.createElement('option');
      if (status === 'booked') {
        opt.value = v.name + '|' + v.price + '|' + v.category + '|false';
        opt.textContent = v.name + ' — KSh ' + v.price.toLocaleString() + '/day (Currently Booked)';
        opt.disabled = true;
      } else if (status === 'maintenance') {
        opt.value = v.name + '|' + v.price + '|' + v.category + '|false';
        opt.textContent = v.name + ' — KSh ' + v.price.toLocaleString() + '/day (In Maintenance)';
        opt.disabled = true;
      } else {
        opt.value = v.name + '|' + v.price + '|' + v.category + '|true';
        opt.textContent = v.name + ' — KSh ' + v.price.toLocaleString() + '/day';
      }
      vehicleSelect.appendChild(opt);
    });
    // Restore previous selection if it exists
    if (currentVal) {
      const options = vehicleSelect.options;
      for (let i = 0; i < options.length; i++) {
        if (options[i].value === currentVal || options[i].value.startsWith(currentVal.split('|')[0])) {
          vehicleSelect.selectedIndex = i;
          break;
        }
      }
    }
  }

  populateVehicleOptions();

  // Set default dates: tomorrow for pickup, 4 days later for return
  const today = new Date();
  const pickup = new Date(today);
  pickup.setDate(today.getDate() + 1);
  const ret = new Date(today);
  ret.setDate(today.getDate() + 4);
  const todayStr = toDateString(today);

  if (pickupDateInput) {
    pickupDateInput.min = todayStr;
    pickupDateInput.value = toDateString(pickup);
  }
  if (returnDateInput) {
    returnDateInput.min = toDateString(pickup);
    returnDateInput.value = toDateString(ret);
  }

  // Pre-fill vehicle from URL parameters (e.g., from "Book Now" button)
  const params = getQueryParams();
  if (params.car) {
    const options = vehicleSelect.options;
    for (let i = 0; i < options.length; i++) {
      if (options[i].value.startsWith(params.car)) {
        vehicleSelect.selectedIndex = i;
        break;
      }
    }
  }
}

/* ============================================================
   SECTION 22: Booking Form (Main Logic)
   ============================================================ */

/**
 * Handle booking form submission
 * - Validates form fields
 * - Calculates total cost (rental + delivery fee)
 * - Sends confirmation emails
 * - Saves booking to Firebase
 */
function initBookingForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  /**
   * Show/hide error messages for form fields
   */
  function setError(inputId, errId, show) {
    const input = document.getElementById(inputId);
    const err = document.getElementById(errId);
    if (input) input.classList.toggle('error', show);
    if (err) err.style.display = show ? 'block' : 'none';
    return show;
  }

  /**
   * Get selected pickup type (Self Pickup or Car Delivery)
   */
  function getSelectedPickupType() {
    const radios = document.querySelectorAll('input[name="pickupType"]');
    let type = 'self';
    let label = 'Self Pickup';
    radios.forEach(function(radio) {
      if (radio.checked) {
        type = radio.value;
        label = radio.value === 'delivery' ? 'Car Delivery' : 'Self Pickup';
      }
    });
    return { type: type, label: label };
  }

  /**
   * Fallback method: open mailto links if EmailJS fails
   */
  function sendEmailFallback(bookingData) {
    const subject = 'Booking Request - ' + bookingData.booking_id;
    const body = 'Name: ' + bookingData.name + '%0A' +
                 'Email: ' + bookingData.email + '%0A' +
                 'Phone: ' + bookingData.phone + '%0A' +
                 'Car: ' + bookingData.car + '%0A' +
                 'Pickup: ' + bookingData.pickup_date_display + '%0A' +
                 'Return: ' + bookingData.return_date_display + '%0A' +
                 'Days: ' + bookingData.days + '%0A' +
                 'Rental Total: ' + bookingData.rental_total + '%0A' +
                 'Delivery Fee: ' + bookingData.delivery_fee + '%0A' +
                 'Total: ' + bookingData.total + '%0A' +
                 'Location: ' + bookingData.location + '%0A' +
                 'Pickup Method: ' + bookingData.pickup_type + '%0A' +
                 'Requests: ' + bookingData.requests;

    window.open('mailto:' + bookingData.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body), '_blank');
    window.open('mailto:' + EMAILJS_CONFIG.ownerEmail + '?subject=' + encodeURIComponent('New Booking - ' + bookingData.booking_id) + '&body=' + encodeURIComponent(body), '_blank');
  }

  /**
   * Send emails via EmailJS
   * Customer receives confirmation, owner receives notification
   */
  function sendEmails(bookingData) {
    return new Promise(function(resolve, reject) {
      if (typeof emailjs === 'undefined') {
        console.warn('[WARN] EmailJS library not loaded.');
        reject(new Error('EmailJS not loaded'));
        return;
      }

      // Customer email parameters
      const customerParams = {
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

      // Owner email parameters
      const ownerParams = {
        to_email: EMAILJS_CONFIG.ownerEmail,
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

      console.log('[INFO] Sending customer email to:', customerParams.to_email);
      console.log('[INFO] Sending owner email to:', ownerParams.to_email);

      // Send both emails simultaneously
      Promise.all([
        emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.customerTemplate, customerParams, EMAILJS_CONFIG.publicKey),
        emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.ownerTemplate, ownerParams, EMAILJS_CONFIG.publicKey)
      ])
      .then(function(results) {
        console.log('[OK] Emails sent successfully:', results);
        resolve(results);
      })
      .catch(function(error) {
        console.error('[ERROR] EmailJS error:', error);
        if (error.status === 403) {
          reject(new Error('EmailJS authentication failed. Check your Public Key.'));
        } else if (error.status === 404) {
          reject(new Error('EmailJS template or service not found. Check your Service ID and Template IDs.'));
        } else if (error.status === 412) {
          reject(new Error('EmailJS missing required parameters. Check template variables.'));
        } else {
          reject(error);
        }
      });
    });
  }

  /**
   * Save booking to Firebase Firestore
   */
  function saveToFirebase(bookingData) {
    return new Promise(function(resolve, reject) {
      if (!db) {
        console.warn('[WARN] Firestore not available.');
        reject(new Error('Firestore not available'));
        return;
      }

      console.log('[INFO] Saving to Firebase:', bookingData);
      db.collection('bookings').add({
        booking_id: bookingData.booking_id,
        name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phone,
        car: bookingData.car,
        pickup_date: bookingData.pickup_date,
        return_date: bookingData.return_date,
        pickup_date_display: bookingData.pickup_date_display,
        return_date_display: bookingData.return_date_display,
        days: bookingData.days,
        rental_total: bookingData.rental_total,
        delivery_fee: bookingData.delivery_fee,
        total: bookingData.total,
        location: bookingData.location,
        pickup_type: bookingData.pickup_type,
        requests: bookingData.requests,
        status: 'pending',
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(function(docRef) {
        console.log('[OK] Firebase saved, doc ID:', docRef.id);
        resolve(docRef);
      })
      .catch(function(error) {
        console.error('[ERROR] Firebase save error:', error);
        reject(error);
      });
    });
  }

  /**
   * Main form submission handler
   */
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    let hasError = false;

    // Get form values
    const name = document.getElementById('fieldName')?.value.trim() || '';
    const email = document.getElementById('fieldEmail')?.value.trim() || '';
    const phone = document.getElementById('fieldPhone')?.value.trim() || '';
    const pickup = document.getElementById('pickupDate')?.value || '';
    const ret = document.getElementById('returnDate')?.value || '';
    const loc = document.getElementById('pickupLocation')?.value || '';
    const vehicle = document.getElementById('vehicleSelect')?.value || '';

    const pickupType = getSelectedPickupType();

    // Validate each field
    if (setError('fieldName', 'errName', !name || name.length < 2)) hasError = true;
    if (setError('fieldEmail', 'errEmail', !email || !validateEmail(email))) hasError = true;
    if (phone && setError('fieldPhone', 'errPhone', !validatePhone(phone))) hasError = true;
    if (setError('pickupDate', 'errPickup', !pickup)) hasError = true;
    if (setError('returnDate', 'errReturn', !ret || ret <= pickup)) hasError = true;
    if (setError('pickupLocation', 'errLocation', !loc)) hasError = true;
    if (setError('vehicleSelect', 'errVehicle', !vehicle)) hasError = true;

    // Check vehicle availability
    if (!hasError && vehicle) {
      const parts = vehicle.split('|');
      const available = parts[3] === 'true';
      if (!available) {
        showToast('This vehicle is not available for the selected dates. Please choose another.', 'error');
        setError('vehicleSelect', 'errVehicle', true);
        hasError = true;
      }
    }

    if (hasError) {
      showToast('Please fix the highlighted fields.', 'error');
      const firstErr = form.querySelector('.error');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Show loading state
    const btn = document.getElementById('submitBtn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;

    // Calculate costs
    const vehicleParts = vehicle.split('|');
    const carName = vehicleParts[0];
    const dailyRate = parseInt(vehicleParts[1], 10) || 0;
    const days = daysBetween(pickup, ret);
    const rentalTotal = dailyRate * days;
    const deliveryFee = pickupType.type === 'delivery' ? DELIVERY_FEE : 0;
    const total = rentalTotal + deliveryFee;

    // Get location label
    const LOCATION_LABELS = {
      westlands: 'Nairobi - Westlands',
      jkia: 'JKIA Airport'
    };
    const locationLabel = LOCATION_LABELS[loc] || loc || 'Not specified';

    // Generate booking ID
    const bookingId = generateBookingId();

    // Build booking data object
    const bookingData = {
      booking_id: bookingId,
      name: name,
      email: email,
      phone: phone,
      car: carName,
      pickup_date: pickup,
      return_date: ret,
      pickup_date_display: formatDateDisplay(pickup),
      return_date_display: formatDateDisplay(ret),
      days: days,
      rental_total: formatKSh(rentalTotal),
      delivery_fee: formatKSh(deliveryFee),
      total: formatKSh(total),
      location: locationLabel,
      pickup_type: pickupType.label,
      requests: document.getElementById('fieldRequests')?.value.trim() || 'None'
    };

    let emailSent = false;
    let firebaseSaved = false;
    let emailError = null;

    // Send emails
    sendEmails(bookingData)
      .then(function() {
        emailSent = true;
        console.log('[OK] Emails sent via EmailJS.');
      })
      .catch(function(err) {
        emailError = err;
        console.warn('[WARN] EmailJS failed, using fallback...');
        sendEmailFallback(bookingData);
        emailSent = true;
      });

    // Save to Firebase
    saveToFirebase(bookingData)
      .then(function() {
        firebaseSaved = true;
        console.log('[OK] Booking saved to Firebase');
      })
      .catch(function(error) {
        console.error('[ERROR] Firebase save failed:', error);
        showToast('Could not save booking to database. Please contact support.', 'error');
      });

    // Show success message after processing
    setTimeout(function() {
      btn.innerHTML = originalHTML;
      btn.disabled = false;

      const formWrap = document.getElementById('bookingFormWrap');
      const success = document.getElementById('bookingSuccess');
      if (formWrap) formWrap.style.display = 'none';
      if (success) success.style.display = 'block';

      let toastMessage = 'Booking request sent! We\'ll confirm within 2 hours.';
      if (emailSent) {
        if (emailError) {
          toastMessage += ' A confirmation email will open in your email client. Please send it.';
        } else {
          toastMessage += ' A confirmation email has been sent to you.';
        }
      } else {
        toastMessage += ' (Email could not be sent, but we received your request.)';
      }
      if (firebaseSaved) {
        toastMessage += ' Your booking has been saved securely.';
      }
      if (deliveryFee > 0) {
        toastMessage += ' A delivery fee of ' + formatKSh(deliveryFee) + ' has been added.';
      }
      showToast(toastMessage);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 2000);
  });

  // Clear errors on input
  form.querySelectorAll('input, select, textarea').forEach(function(el) {
    el.addEventListener('input', function() { el.classList.remove('error'); });
    el.addEventListener('change', function() { el.classList.remove('error'); });
  });
}

/* ============================================================
   SECTION 23: Contact Form
   ============================================================ */

/**
 * Initialize contact form with validation
 */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  function setError(inputId, errId, show) {
    const input = document.getElementById(inputId);
    const err = document.getElementById(errId);
    if (input) input.classList.toggle('error', show);
    if (err) err.style.display = show ? 'block' : 'none';
    return show;
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    let hasError = false;

    const name = document.getElementById('contactName')?.value.trim() || '';
    const email = document.getElementById('contactEmail')?.value.trim() || '';
    const msg = document.getElementById('contactMessage')?.value.trim() || '';

    if (setError('contactName', 'errContactName', !name || name.length < 2)) hasError = true;
    if (setError('contactEmail', 'errContactEmail', !email || !validateEmail(email))) hasError = true;
    if (setError('contactMessage', 'errContactMsg', !msg || msg.length < 10)) hasError = true;

    if (hasError) {
      showToast('Please fill in the required fields.', 'error');
      return;
    }

    const btn = document.getElementById('contactSubmitBtn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
    btn.disabled = true;

    setTimeout(function() {
      btn.innerHTML = originalHTML;
      btn.disabled = false;

      const formWrap = document.getElementById('contactFormWrap');
      const success = document.getElementById('contactSuccess');
      if (formWrap) formWrap.style.display = 'none';
      if (success) success.style.display = 'block';
      showToast('Message sent! We\'ll get back to you soon.');
    }, 1500);
  });

  form.querySelectorAll('input, textarea').forEach(function(el) {
    el.addEventListener('input', function() { el.classList.remove('error'); });
  });
}

/* ============================================================
   SECTION 24: Admin Dashboard
   ============================================================ */

/**
 * Admin dashboard with real-time booking management
 * - Displays all bookings with filter and search
 * - Shows quick stats and booking activity chart
 * - Allows status updates (Pending, Confirmed, Completed, Cancelled)
 * - Syncs status changes with fleet availability
 * - Exports data to CSV
 */
function initAdminDashboard() {
  const bookingsBody = document.getElementById('bookingsBody');
  const loadingState = document.getElementById('loadingState');
  const tableContent = document.getElementById('tableContent');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const carFilter = document.getElementById('carFilter');
  const exportBtn = document.getElementById('exportBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!bookingsBody) {
    console.warn('[WARN] Admin dashboard element not found.');
    return;
  }

  let allBookings = [];
  let unsubscribe = null;

  function getTodayString() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Update quick stats in the dashboard
   */
  function updateQuickStats(bookings) {
    // Most popular car
    const carCounts = {};
    bookings.forEach(function(b) {
      if (b.car) {
        carCounts[b.car] = (carCounts[b.car] || 0) + 1;
      }
    });
    let mostPopularCar = '—';
    let maxCount = 0;
    for (var car in carCounts) {
      if (carCounts[car] > maxCount) {
        maxCount = carCounts[car];
        mostPopularCar = car;
      }
    }

    // Today's bookings
    const todayStr = getTodayString();
    const todayBookings = bookings.filter(function(b) {
      if (b.pickup_date) {
        const pickupDate = new Date(b.pickup_date);
        const pickupStr = pickupDate.toISOString ? pickupDate.toISOString().split('T')[0] : '';
        return pickupStr === todayStr;
      }
      return false;
    }).length;

    // Average rental days
    let totalDays = 0;
    let countDays = 0;
    bookings.forEach(function(b) {
      const days = safeParseNumber(b.days);
      if (days > 0) {
        totalDays += days;
        countDays++;
      }
    });
    const avgDays = countDays > 0 ? (totalDays / countDays).toFixed(1) : '—';

    document.getElementById('mostPopularCar').textContent = mostPopularCar;
    document.getElementById('todayBookings').textContent = todayBookings;
    document.getElementById('avgDays').textContent = avgDays === '—' ? '—' : avgDays + ' days';
  }

  /**
   * Update the 7-day booking activity chart
   */
  function updateWeeklyChart(bookings) {
    const chartContainer = document.getElementById('weeklyChart');
    if (!chartContainer) return;

    const days = [];
    for (var i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-KE', { weekday: 'short' });
      days.push({ date: dateStr, label: label, count: 0, confirmed: 0 });
    }

    // Count bookings per day
    bookings.forEach(function(b) {
      if (b.created_at) {
        const createdDate = b.created_at.toDate ? b.created_at.toDate() : new Date(b.created_at);
        const dateStr = createdDate.toISOString().split('T')[0];
        days.forEach(function(day) {
          if (day.date === dateStr) {
            day.count++;
            if (b.status === 'confirmed' || b.status === 'completed') {
              day.confirmed++;
            }
          }
        });
      }
    });

    const maxCount = Math.max(1, Math.max.apply(null, days.map(function(d) { return d.count; })));

    // Render bars with tooltips
    chartContainer.innerHTML = days.map(function(day) {
      const heightPercent = (day.count / maxCount) * 100;
      const barHeight = Math.max(4, heightPercent);
      return '<div class="bar" style="height:' + barHeight + '%; min-height:4px; position:relative;">' +
        '<span class="bar-tooltip">' + day.label + ': ' + day.count + ' bookings (' + day.confirmed + ' confirmed)</span>' +
        '</div>';
    }).join('');
  }

  /**
   * Populate car filter dropdown with unique car names
   */
  function populateCarFilter(bookings) {
    const cars = new Set();
    bookings.forEach(function(b) {
      if (b.car) cars.add(b.car);
    });
    const carFilterEl = document.getElementById('carFilter');
    if (!carFilterEl) return;
    carFilterEl.innerHTML = '<option value="">All Vehicles</option>';
    cars.forEach(function(car) {
      const opt = document.createElement('option');
      opt.value = car;
      opt.textContent = car;
      carFilterEl.appendChild(opt);
    });
  }

  /**
   * Render bookings table
   */
  function renderTable(bookings) {
    if (!bookings || bookings.length === 0) {
      tableContent.style.display = 'none';
      emptyState.style.display = 'block';
      loadingState.style.display = 'none';
      return;
    }

    tableContent.style.display = 'block';
    emptyState.style.display = 'none';
    loadingState.style.display = 'none';

    bookingsBody.innerHTML = bookings.map(function(b) {
      const statusClass = b.status || 'pending';
      const statusLabel = statusClass.charAt(0).toUpperCase() + statusClass.slice(1);
      const pickupType = b.pickup_type || 'Self Pickup';
      const totalAmount = b.total || b.rental_total || 'KSh 0';

      const pickupDate = b.pickup_date || b.pickup_date_display || '—';
      const returnDate = b.return_date || b.return_date_display || '—';

      return '<tr>' +
        '<td><strong>' + (b.booking_id || '—') + '</strong></td>' +
        '<td>' +
        '<div><strong>' + (b.name || '—') + '</strong></div>' +
        '<div style="font-size:0.7rem; color:var(--text-secondary);">' + (b.email || '') + '</div>' +
        '</td>' +
        '<td>' + (b.car || '—') + '</td>' +
        '<td>' + formatDateDisplay(pickupDate) + '</td>' +
        '<td>' + formatDateDisplay(returnDate) + '</td>' +
        '<td>' + (b.days || '—') + '</td>' +
        '<td><strong style="color:var(--accent-gold);">' + totalAmount + '</strong></td>' +
        '<td>' + pickupType + '</td>' +
        '<td>Pay on Pickup/Delivery</td>' +
        '<td>' +
        '<select class="status-select" data-id="' + b.id + '" data-current="' + statusClass + '">' +
        '<option value="pending"' + (statusClass === 'pending' ? ' selected' : '') + '>Pending</option>' +
        '<option value="confirmed"' + (statusClass === 'confirmed' ? ' selected' : '') + '>Confirmed</option>' +
        '<option value="completed"' + (statusClass === 'completed' ? ' selected' : '') + '>Completed</option>' +
        '<option value="cancelled"' + (statusClass === 'cancelled' ? ' selected' : '') + '>Cancelled</option>' +
        '</select>' +
        '</td>' +
        '<td><button class="delete-btn" data-id="' + b.id + '"><i class="fas fa-trash"></i></button></td>' +
        '</tr>';
    }).join('');

    /**
     * Status change handlers – updates Firebase, syncs fleet availability, refreshes chart
     */
    bookingsBody.querySelectorAll('.status-select').forEach(function(sel) {
      sel.addEventListener('change', function() {
        const id = this.dataset.id;
        const newStatus = this.value;
        if (db) {
          db.collection('bookings').doc(id).update({ status: newStatus })
            .then(function() {
              showAdminToast('Booking status updated to ' + newStatus, 'success');
              const booking = allBookings.find(function(b) { return b.id === id; });
              if (booking && booking.car) {
                const vehicle = VEHICLES_DATA.find(function(v) { return v.name === booking.car; });
                if (vehicle) {
                  // Confirmed or Completed → mark as Booked
                  if (newStatus === 'confirmed' || newStatus === 'completed') {
                    setCarAvailability(vehicle.id, 'booked');
                    showAdminToast('Car ' + vehicle.name + ' marked as Booked', 'success');
                  } else if (newStatus === 'cancelled') {
                    setCarAvailability(vehicle.id, 'available');
                    showAdminToast('Car ' + vehicle.name + ' marked as Available', 'success');
                  }
                  updateAvailabilityBadges();
                }
              }
              // Refresh chart and stats after status change
              applyFilters();
            })
            .catch(function(error) {
              console.error('[ERROR] Error updating status:', error);
              showAdminToast('Failed to update status', 'error');
            });
        }
      });
    });

    // Delete handlers
    bookingsBody.querySelectorAll('.delete-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        if (confirm('Are you sure you want to delete this booking?')) {
          if (db) {
            db.collection('bookings').doc(id).delete()
              .then(function() {
                showAdminToast('Booking deleted successfully', 'success');
                applyFilters();
              })
              .catch(function(error) {
                console.error('[ERROR] Error deleting booking:', error);
                showAdminToast('Failed to delete booking', 'error');
              });
          }
        }
      });
    });
  }

  /**
   * Apply filters to bookings table and stats
   */
  function applyFilters() {
    const search = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const status = (statusFilter ? statusFilter.value : '');
    const car = (carFilter ? carFilter.value : '');

    const filtered = allBookings.filter(function(b) {
      const matchSearch = !search ||
        (b.name && b.name.toLowerCase().includes(search)) ||
        (b.email && b.email.toLowerCase().includes(search)) ||
        (b.booking_id && b.booking_id.toLowerCase().includes(search));
      const matchStatus = !status || b.status === status;
      const matchCar = !car || b.car === car;
      return matchSearch && matchStatus && matchCar;
    });

    renderTable(filtered);
    updateQuickStats(filtered);
    updateWeeklyChart(filtered);
  }

  /**
   * Load bookings from Firebase in real-time
   */
  function loadBookings() {
    if (!db) {
      loadingState.style.display = 'none';
      emptyState.style.display = 'block';
      emptyState.innerHTML = '<i class="fas fa-exclamation-triangle"></i><p>Firebase not initialized. Please check your configuration.</p>';
      return;
    }

    loadingState.style.display = 'block';
    tableContent.style.display = 'none';
    emptyState.style.display = 'none';

    if (unsubscribe) {
      unsubscribe();
    }

    console.log('[INFO] Loading bookings from Firebase...');
    unsubscribe = db.collection('bookings')
      .orderBy('created_at', 'desc')
      .onSnapshot(function(snapshot) {
        allBookings = [];
        snapshot.forEach(function(doc) {
          const data = doc.data();
          data.id = doc.id;
          allBookings.push(data);
        });

        populateCarFilter(allBookings);
        applyFilters();
        console.log('[OK] Loaded ' + allBookings.length + ' bookings from Firebase');
      }, function(error) {
        console.error('[ERROR] Error loading bookings:', error);
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.innerHTML = '<i class="fas fa-exclamation-triangle"></i><p>Error loading bookings: ' + error.message + '</p>';
        showAdminToast('Error loading bookings: ' + error.message, 'error');
      });
  }

  /**
   * Export all bookings to CSV file
   */
  function exportCSV() {
    if (allBookings.length === 0) {
      showAdminToast('No bookings to export', 'error');
      return;
    }

    const headers = ['Booking ID', 'Name', 'Email', 'Phone', 'Car', 'Pickup Date', 'Return Date', 'Days', 'Rental Total', 'Delivery Fee', 'Total', 'Pickup Type', 'Status', 'Location', 'Requests'];
    const rows = allBookings.map(function(b) {
      return [
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
      ];
    });

    let csvContent = headers.join(',') + '\n' +
      rows.map(function(row) {
        return row.join(',');
      }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings_export_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showAdminToast('Bookings exported successfully!', 'success');
  }

  // Event listeners
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
  if (carFilter) carFilter.addEventListener('change', applyFilters);
  if (refreshBtn) refreshBtn.addEventListener('click', function() {
    loadBookings();
    showAdminToast('Refreshing bookings...', 'success');
  });
  if (exportBtn) exportBtn.addEventListener('click', exportCSV);
  if (logoutBtn) logoutBtn.addEventListener('click', function() {
    window.location.href = 'admin-login.html';
  });

  loadBookings();
}

/* ============================================================
   SECTION 25: Bootstrap – Initialize Everything
   ============================================================ */

/**
 * Initialize all functions when the DOM is ready
 */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('[INFO] DOM ready - initializing Money Carhire');
    
    // Core UI features
    initDarkMode();
    initNavbar();
    initHeroDate();
    initFleetFilter();
    initScrollReveal();
    initCounters();
    initTestimonialSlider();
    initBackToTop();
    updateAvailabilityBadges();
    initLazyImages();
    initFooterYear();

    // Booking features
    initBookingPage();
    initBookingForm();
    initContactForm();

    // Admin features (detect which admin page we're on)
    if (document.getElementById('adminLoginPassword')) {
      initAdminLogin();
    }
    if (document.getElementById('adminGrid')) {
      initAdminFleet();
    }
    if (document.getElementById('bookingsBody')) {
      initAdminDashboard();
    }
  });
}

/* ============================================================
   SECTION 26: Export for Jest Testing
   ============================================================ */

/**
 * Export helper functions for unit testing with Jest
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatKSh: formatKSh,
    daysBetween: daysBetween,
    validateEmail: validateEmail,
    validatePhone: validatePhone,
    getQueryParams: getQueryParams,
    toDateString: toDateString,
    formatDateDisplay: formatDateDisplay,
    getCarAvailability: getCarAvailability,
    setCarAvailability: setCarAvailability,
    getAvailability: getAvailability,
    saveAvailability: saveAvailability,
    updateAvailabilityBadges: updateAvailabilityBadges,
    VEHICLES_DATA: VEHICLES_DATA,
    DELIVERY_FEE: DELIVERY_FEE,
    safeParseNumber: safeParseNumber,
    formatPhoneForWhatsApp: formatPhoneForWhatsApp
  };
}