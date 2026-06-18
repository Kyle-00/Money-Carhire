/**
 * Money Carhire — script.js
 * Features: Firebase, EmailJS, Booking, Admin Dashboard,
 * Pickup Type with Delivery Fee (KSh 1,000),
 * Real-time Chart & Quick Stats, Status Sync, and more.
 */

'use strict';

/* ───────────────────────────────────────────
   Firebase Configuration
─────────────────────────────────────────── */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCrxaEnJ0R7mTJdiJ9vLgQFikoAncAuG7E",
  authDomain: "money-carhire.firebaseapp.com",
  projectId: "money-carhire",
  storageBucket: "money-carhire.firebasestorage.app",
  messagingSenderId: "269929325057",
  appId: "1:269929325057:web:3469a8281944d990cd1600",
  measurementId: "G-156QZDLS94"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
  console.log('[OK] Firebase initialized');
} else if (typeof firebase !== 'undefined') {
  console.log('[INFO] Firebase already initialized');
} else {
  console.error('[ERROR] Firebase library not loaded');
}
const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
if (db) {
  console.log('[OK] Firestore available');
} else {
  console.error('[ERROR] Firestore not available');
}

/* ───────────────────────────────────────────
   EmailJS Configuration
─────────────────────────────────────────── */
const EMAILJS_CONFIG = {
  publicKey: 'GrwmOU4hjzqu9yLEP',
  serviceId: 'service_4sf99gj',
  customerTemplate: 'template_ho9ezeu',
  ownerTemplate: 'template_jtnrwul',
  ownerEmail: 'moneycarhire@gmail.com'
};
console.log('[INFO] EmailJS Config:', EMAILJS_CONFIG);

// Initialize EmailJS if available
if (typeof emailjs !== 'undefined') {
  emailjs.init(EMAILJS_CONFIG.publicKey);
  console.log('[OK] EmailJS initialized');
}

/* ───────────────────────────────────────────
   Admin Configuration
─────────────────────────────────────────── */
const ADMIN_CONFIG = {
  password: 'yktvwithkyle'
};

/* ───────────────────────────────────────────
   Constants
─────────────────────────────────────────── */
const DELIVERY_FEE = 1000;

/* ───────────────────────────────────────────
   Helpers
─────────────────────────────────────────── */
function formatKSh(amount) {
  return 'KSh ' + Number(amount).toLocaleString('en-KE');
}

function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diff = (d2 - d1) / (1000 * 60 * 60 * 24);
  return diff > 0 ? Math.round(diff) : 0;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^(\+254|0)[17]\d{8}$/.test(phone.replace(/\s/g, ''));
}

function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

function toDateString(date) {
  return date.toISOString().split('T')[0];
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';
  // Handle Date objects or strings
  let d;
  if (typeof dateStr === 'object' && dateStr.toDate) {
    // Firestore timestamp
    d = dateStr.toDate();
  } else if (typeof dateStr === 'string') {
    // Check if it's already formatted or raw YYYY-MM-DD
    if (dateStr.includes('-')) {
      // YYYY-MM-DD format
      d = new Date(dateStr + 'T00:00:00');
    } else {
      // Try parsing as is
      d = new Date(dateStr);
    }
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function generateBookingId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function safeParseNumber(value) {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) return num;
  }
  return 0;
}

/* ───────────────────────────────────────────
   Vehicle Data
─────────────────────────────────────────── */
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

/* ───────────────────────────────────────────
   Availability (localStorage)
─────────────────────────────────────────── */
function getCarAvailability(carId) {
  const stored = localStorage.getItem('carAvailability');
  if (!stored) return 'available';
  const avail = JSON.parse(stored);
  return avail[carId] || 'available';
}

function setCarAvailability(carId, status) {
  const stored = localStorage.getItem('carAvailability');
  const avail = stored ? JSON.parse(stored) : {};
  avail[carId] = status;
  localStorage.setItem('carAvailability', JSON.stringify(avail));
}

function getAvailability() {
  const stored = localStorage.getItem('carAvailability');
  if (stored) return JSON.parse(stored);
  const defaultAvail = {};
  VEHICLES_DATA.forEach(v => defaultAvail[v.id] = 'available');
  return defaultAvail;
}

function saveAvailability(data) {
  localStorage.setItem('carAvailability', JSON.stringify(data));
}

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

/* ───────────────────────────────────────────
   DOM Helpers
─────────────────────────────────────────── */
const $ = (sel, ctx) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

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

/* ───────────────────────────────────────────
   Core UI Functions
─────────────────────────────────────────── */
function initDarkMode() {
  const btn = document.getElementById('darkModeBtn');
  const icon = document.getElementById('darkModeIcon');
  if (!btn) return;

  const saved = localStorage.getItem('mcDarkMode');
  if (saved === 'true') {
    document.body.classList.add('dark');
    if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
  }

  btn.addEventListener('click', function() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('mcDarkMode', isDark);
    if (icon) {
      icon.classList.toggle('fa-moon', !isDark);
      icon.classList.toggle('fa-sun', isDark);
    }
  });
}

function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (!navbar) return;

  window.addEventListener('scroll', function() {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
      const open = navLinks.classList.toggle('open');
      hamburger.classList.toggle('active', open);
      hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    navLinks.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });
    document.addEventListener('click', function(e) {
      if (!navbar.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
      }
    });
  }
}

function initHeroDate() {
  const heroDate = document.getElementById('heroDate');
  if (!heroDate) return;
  const today = new Date();
  heroDate.value = toDateString(today);
  heroDate.min = toDateString(today);
}

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
  applyFilters();
}

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

function initTestimonialSlider() {
  const track = document.getElementById('testimonialTrack');
  const dotsWrap = document.getElementById('sliderDots');
  if (!track) return;

  const cards = track.querySelectorAll('.testimonial-card');
  const total = cards.length;
  let current = 0;
  let autoTimer = null;

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

  function startAuto() {
    autoTimer = setInterval(function() { goTo(current + 1); }, 4500);
  }
  function stopAuto() { clearInterval(autoTimer); }

  startAuto();
  const wrap = track.closest('.testimonial-slider-wrap');
  if (wrap) {
    wrap.addEventListener('mouseenter', stopAuto);
    wrap.addEventListener('mouseleave', startAuto);
  }

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

function initFooterYear() {
  document.querySelectorAll('#footerYear').forEach(function(el) {
    el.textContent = new Date().getFullYear();
  });
}

/* ───────────────────────────────────────────
   Admin Login
─────────────────────────────────────────── */
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

/* ───────────────────────────────────────────
   Admin Fleet Panel
─────────────────────────────────────────── */
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

/* ───────────────────────────────────────────
   Booking Page – with Pickup Type & Delivery Fee (No Receipt)
─────────────────────────────────────────── */
function initBookingPage() {
  const vehicleSelect = document.getElementById('vehicleSelect');
  const pickupDateInput = document.getElementById('pickupDate');
  const returnDateInput = document.getElementById('returnDate');
  const locationSelect = document.getElementById('pickupLocation');

  if (!vehicleSelect) return;

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

/* ───────────────────────────────────────────
   Booking Form – No Deposit, Only Delivery Fee
─────────────────────────────────────────── */
function initBookingForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  function setError(inputId, errId, show) {
    const input = document.getElementById(inputId);
    const err = document.getElementById(errId);
    if (input) input.classList.toggle('error', show);
    if (err) err.style.display = show ? 'block' : 'none';
    return show;
  }

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

  // ── Send emails via EmailJS ──
  function sendEmails(bookingData) {
    return new Promise(function(resolve, reject) {
      if (typeof emailjs === 'undefined') {
        console.warn('[WARN] EmailJS library not loaded.');
        reject(new Error('EmailJS not loaded'));
        return;
      }

      // Customer email – goes to the customer
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

      // Owner email – goes to moneycarhire@gmail.com
      const ownerParams = {
        to_email: EMAILJS_CONFIG.ownerEmail,
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

      console.log('[INFO] Sending customer email to:', customerParams.to_email);
      console.log('[INFO] Sending owner email to:', ownerParams.to_email);
      console.log('[INFO] Customer params:', customerParams);
      console.log('[INFO] Owner params:', ownerParams);

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
        pickup_date: bookingData.pickup_date,           // Raw YYYY-MM-DD
        return_date: bookingData.return_date,           // Raw YYYY-MM-DD
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

  form.addEventListener('submit', function(e) {
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

    if (setError('fieldName', 'errName', !name || name.length < 2)) hasError = true;
    if (setError('fieldEmail', 'errEmail', !email || !validateEmail(email))) hasError = true;
    if (phone && setError('fieldPhone', 'errPhone', !validatePhone(phone))) hasError = true;
    if (setError('pickupDate', 'errPickup', !pickup)) hasError = true;
    if (setError('returnDate', 'errReturn', !ret || ret <= pickup)) hasError = true;
    if (setError('pickupLocation', 'errLocation', !loc)) hasError = true;
    if (setError('vehicleSelect', 'errVehicle', !vehicle)) hasError = true;

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

    const btn = document.getElementById('submitBtn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;

    const vehicleParts = vehicle.split('|');
    const carName = vehicleParts[0];
    const dailyRate = parseInt(vehicleParts[1], 10) || 0;
    const days = daysBetween(pickup, ret);
    const rentalTotal = dailyRate * days;
    const deliveryFee = pickupType.type === 'delivery' ? DELIVERY_FEE : 0;
    const total = rentalTotal + deliveryFee;

    const LOCATION_LABELS = {
      westlands: 'Nairobi - Westlands',
      jkia: 'JKIA Airport'
    };
    const locationLabel = LOCATION_LABELS[loc] || loc || 'Not specified';

    const bookingId = generateBookingId();

    const bookingData = {
      booking_id: bookingId,
      name: name,
      email: email,
      phone: phone,
      car: carName,
      pickup_date: pickup,                                    // Raw YYYY-MM-DD
      return_date: ret,                                       // Raw YYYY-MM-DD
      pickup_date_display: formatDateDisplay(pickup),         // Formatted for emails
      return_date_display: formatDateDisplay(ret),            // Formatted for emails
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

    saveToFirebase(bookingData)
      .then(function() {
        firebaseSaved = true;
        console.log('[OK] Booking saved to Firebase');
      })
      .catch(function(error) {
        console.error('[ERROR] Firebase save failed:', error);
        showToast('Could not save booking to database. Please contact support.', 'error');
      });

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

  form.querySelectorAll('input, select, textarea').forEach(function(el) {
    el.addEventListener('input', function() { el.classList.remove('error'); });
    el.addEventListener('change', function() { el.classList.remove('error'); });
  });
}

/* ───────────────────────────────────────────
   Contact Form
─────────────────────────────────────────── */
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

/* ───────────────────────────────────────────
   Admin Dashboard – No Stats Cards, Keep Chart, Quick Stats, Table
─────────────────────────────────────────── */
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

  // ── Update Quick Stats ──
  function updateQuickStats(bookings) {
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

    const todayStr = getTodayString();
    const todayBookings = bookings.filter(function(b) {
      if (b.pickup_date) {
        const pickupDate = new Date(b.pickup_date);
        const pickupStr = pickupDate.toISOString ? pickupDate.toISOString().split('T')[0] : '';
        return pickupStr === todayStr;
      }
      return false;
    }).length;

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

  // ── Update Weekly Chart ──
  function updateWeeklyChart(bookings) {
    const chartContainer = document.getElementById('weeklyChart');
    if (!chartContainer) return;

    const days = [];
    for (var i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-KE', { weekday: 'short' });
      days.push({ date: dateStr, label: label, count: 0 });
    }

    bookings.forEach(function(b) {
      if (b.created_at) {
        const createdDate = b.created_at.toDate ? b.created_at.toDate() : new Date(b.created_at);
        const dateStr = createdDate.toISOString().split('T')[0];
        days.forEach(function(day) {
          if (day.date === dateStr) {
            day.count++;
          }
        });
      }
    });

    const maxCount = Math.max(1, Math.max.apply(null, days.map(function(d) { return d.count; })));
    chartContainer.innerHTML = days.map(function(day) {
      const heightPercent = (day.count / maxCount) * 100;
      const barHeight = Math.max(4, heightPercent);
      return '<div class="bar" style="height:' + barHeight + '%; min-height:4px;">' +
        '<span class="bar-tooltip">' + day.label + ': ' + day.count + '</span>' +
        '</div>';
    }).join('');
  }

  // ── Populate Car Filter ──
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

  // ── Render Table ──
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

      // Use the raw date fields and format them
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

    // ── Status change handlers – SYNC WITH FLEET ──
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
            })
            .catch(function(error) {
              console.error('[ERROR] Error updating status:', error);
              showAdminToast('Failed to update status', 'error');
            });
        }
      });
    });

    bookingsBody.querySelectorAll('.delete-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const id = this.dataset.id;
        if (confirm('Are you sure you want to delete this booking?')) {
          if (db) {
            db.collection('bookings').doc(id).delete()
              .then(function() {
                showAdminToast('Booking deleted successfully', 'success');
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

/* ───────────────────────────────────────────
   Bootstrap – Initialize Everything
─────────────────────────────────────────── */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('[INFO] DOM ready - initializing Money Carhire');
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

    initBookingPage();
    initBookingForm();
    initContactForm();

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

/* ───────────────────────────────────────────
   Export for Jest
─────────────────────────────────────────── */
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
    safeParseNumber: safeParseNumber
  };
}