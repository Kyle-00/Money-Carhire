/**
 * Money Carhire — script.js
 * All JavaScript separated from HTML files
 * Features: Firebase, EmailJS, WhatsApp, Booking, Admin, Fleet Management
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

// Initialize Firebase (only if not already initialized)
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}
const db = typeof firebase !== 'undefined' && firebase.firestore ? firebase.firestore() : null;

/* ───────────────────────────────────────────
   EmailJS Configuration
─────────────────────────────────────────── */
const EMAILJS_CONFIG = {
  publicKey: 'GrwmOU4hjzqu9yLEP',
  serviceId: 'service_4sf99gj', // Replace with your actual Service ID
  customerTemplate: 'template_ho9ezeu',
  ownerTemplate: 'template_jtnrwul'
};

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
  const d = new Date(dateStr + 'T00:00:00');
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

function formatPhoneForWhatsApp(phone) {
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
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
   Dark Mode
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

/* ───────────────────────────────────────────
   Navbar
─────────────────────────────────────────── */
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

/* ───────────────────────────────────────────
   Hero Date
─────────────────────────────────────────── */
function initHeroDate() {
  const heroDate = document.getElementById('heroDate');
  if (!heroDate) return;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  heroDate.value = toDateString(tomorrow);
  heroDate.min = toDateString(new Date());
}

/* ───────────────────────────────────────────
   Fleet Filter
─────────────────────────────────────────── */
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
}

/* ───────────────────────────────────────────
   Scroll Reveal
─────────────────────────────────────────── */
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

/* ───────────────────────────────────────────
   Counters
─────────────────────────────────────────── */
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

/* ───────────────────────────────────────────
   Testimonial Slider
─────────────────────────────────────────── */
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

/* ───────────────────────────────────────────
   Back to Top
─────────────────────────────────────────── */
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

/* ───────────────────────────────────────────
   Lazy Images
─────────────────────────────────────────── */
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

/* ───────────────────────────────────────────
   Footer Year
─────────────────────────────────────────── */
function initFooterYear() {
  document.querySelectorAll('#footerYear').forEach(function(el) {
    el.textContent = new Date().getFullYear();
  });
}

/* ───────────────────────────────────────────
   Admin Login
─────────────────────────────────────────── */
function initAdminLogin() {
  const ADMIN_PASSWORD = 'yktvwithkyle'; // Change this to your desired password

  const loginBtn = document.getElementById('loginBtn');
  const passwordInput = document.getElementById('adminLoginPassword');
  const errorEl = document.getElementById('loginError');

  if (!loginBtn || !passwordInput) return;

  function handleLogin() {
    const input = passwordInput.value;
    if (input === ADMIN_PASSWORD) {
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
   Booking Page
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

  const LOCATION_LABELS = {
    kiambu: 'Nairobi - Kiambu Rd',
    westlands: 'Nairobi - Westlands',
    cbd: 'Nairobi - CBD',
    jkia: 'JKIA Airport',
    karen: 'Karen',
    mombasa: 'Mombasa - Bamburi'
  };

  function updateReceipt() {
    const placeholder = document.getElementById('receiptPlaceholder');
    const details = document.getElementById('receiptDetails');
    const rcCarName = document.getElementById('rcCarName');
    const rcCarCategory = document.getElementById('rcCarCategory');
    const rcDailyRate = document.getElementById('rcDailyRate');
    const rcPickupDate = document.getElementById('rcPickupDate');
    const rcReturnDate = document.getElementById('rcReturnDate');
    const rcDays = document.getElementById('rcDays');
    const rcLocation = document.getElementById('rcLocation');
    const rcCalcLabel = document.getElementById('rcCalcLabel');
    const rcCalcValue = document.getElementById('rcCalcValue');
    const rcTotal = document.getElementById('rcTotal');
    const rcAvailability = document.getElementById('rcAvailability');

    if (!rcTotal) return;

    const selVal = vehicleSelect.value;
    if (!selVal) {
      if (placeholder) placeholder.style.display = '';
      if (details) details.style.display = 'none';
      return;
    }

    const parts = selVal.split('|');
    const name = parts[0];
    const dailyRate = parseInt(parts[1], 10) || 0;
    const category = parts[2] || '';
    const available = parts[3] === 'true';

    const pickupVal = pickupDateInput ? pickupDateInput.value : null;
    const returnVal = returnDateInput ? returnDateInput.value : null;
    const days = daysBetween(pickupVal, returnVal);
    const total = dailyRate * days;
    const locVal = locationSelect ? locationSelect.value : '';
    const locLabel = LOCATION_LABELS[locVal] || '—';

    if (placeholder) placeholder.style.display = 'none';
    if (details) details.style.display = '';

    if (rcCarName) rcCarName.textContent = name || '—';
    if (rcCarCategory) rcCarCategory.textContent = category ? category.charAt(0).toUpperCase() + category.slice(1) + ' vehicle' : '—';
    if (rcDailyRate) rcDailyRate.textContent = dailyRate > 0 ? formatKSh(dailyRate) + ' / day' : '—';
    if (rcPickupDate) rcPickupDate.textContent = formatDateDisplay(pickupVal);
    if (rcReturnDate) rcReturnDate.textContent = formatDateDisplay(returnVal);
    if (rcDays) rcDays.textContent = days > 0 ? days + (days === 1 ? ' day' : ' days') : '—';
    if (rcLocation) rcLocation.textContent = locLabel;

    if (rcAvailability) {
      if (days > 0 && available) {
        rcAvailability.innerHTML = '<span class="availability-status available">Available</span>';
      } else if (days > 0 && !available) {
        rcAvailability.innerHTML = '<span class="availability-status unavailable">Not Available for these dates</span>';
        showToast('This vehicle is currently booked for the selected dates.', 'error');
      } else {
        rcAvailability.textContent = '—';
      }
    }

    if (rcCalcLabel) {
      rcCalcLabel.textContent = days > 0 ? formatKSh(dailyRate) + ' × ' + days + (days === 1 ? ' day' : ' days') : 'Select dates above';
    }
    if (rcCalcValue) {
      rcCalcValue.textContent = days > 0 ? '= ' + formatKSh(total) : '—';
    }

    if (rcTotal) {
      rcTotal.textContent = days > 0 ? formatKSh(total) : 'KSh 0';
      rcTotal.classList.remove('pulse');
      void rcTotal.offsetWidth;
      rcTotal.classList.add('pulse');
      setTimeout(function() {
        rcTotal.classList.remove('pulse');
      }, 350);
    }
  }

  if (pickupDateInput) {
    pickupDateInput.addEventListener('change', function() {
      if (returnDateInput && returnDateInput.value <= this.value) {
        const next = new Date(this.value + 'T00:00:00');
        next.setDate(next.getDate() + 1);
        returnDateInput.value = toDateString(next);
      }
      if (returnDateInput) returnDateInput.min = this.value;
      updateReceipt();
    });
  }

  if (returnDateInput) {
    returnDateInput.addEventListener('change', function() {
      if (pickupDateInput && this.value <= pickupDateInput.value) {
        showToast('Return date must be after pickup date.', 'error');
        const next = new Date(pickupDateInput.value + 'T00:00:00');
        next.setDate(next.getDate() + 1);
        this.value = toDateString(next);
      }
      updateReceipt();
    });
  }

  vehicleSelect.addEventListener('change', updateReceipt);
  if (locationSelect) locationSelect.addEventListener('change', updateReceipt);

  updateReceipt();
}

/* ───────────────────────────────────────────
   Booking Form (with EmailJS, Firebase, WhatsApp)
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

  function sendEmails(bookingData) {
    if (typeof emailjs === 'undefined') {
      console.warn('EmailJS not available. Emails will not be sent.');
      return Promise.reject(new Error('EmailJS not available'));
    }

    const customerParams = {
      name: bookingData.name,
      email: bookingData.email,
      booking_id: bookingData.booking_id,
      car: bookingData.car,
      pickup_date: bookingData.pickup_date,
      return_date: bookingData.return_date,
      days: bookingData.days,
      total: bookingData.total,
      location: bookingData.location,
      phone: bookingData.phone,
      requests: bookingData.requests
    };

    const ownerParams = {
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone,
      booking_id: bookingData.booking_id,
      car: bookingData.car,
      pickup_date: bookingData.pickup_date,
      return_date: bookingData.return_date,
      days: bookingData.days,
      total: bookingData.total,
      location: bookingData.location,
      requests: bookingData.requests
    };

    return Promise.all([
      emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.customerTemplate, customerParams, EMAILJS_CONFIG.publicKey),
      emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.ownerTemplate, ownerParams, EMAILJS_CONFIG.publicKey)
    ]);
  }

  function saveToFirebase(bookingData) {
    if (!db) {
      console.warn('Firebase not available. Booking not saved.');
      return Promise.reject(new Error('Firebase not available'));
    }

    return db.collection('bookings').add({
      booking_id: bookingData.booking_id,
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone,
      car: bookingData.car,
      pickup_date: bookingData.pickup_date,
      return_date: bookingData.return_date,
      days: bookingData.days,
      total: bookingData.total,
      location: bookingData.location,
      requests: bookingData.requests,
      status: 'pending',
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  function sendWhatsAppNotification(bookingData) {
    const phone = formatPhoneForWhatsApp(bookingData.phone);
    const ownerPhone = '254745424341';

    const customerMessage = 'Hello ' + bookingData.name + '!%0A' +
      'Thank you for booking with Money Carhire.%0A' +
      'Booking Reference: ' + bookingData.booking_id + '%0A' +
      'Vehicle: ' + bookingData.car + '%0A' +
      'Pickup: ' + bookingData.pickup_date + '%0A' +
      'Return: ' + bookingData.return_date + '%0A' +
      'Total: ' + bookingData.total + '%0A' +
      '%0A' +
      'Our team will confirm your booking within 2 hours.%0A' +
      'Contact us: +254 745 424 341';

    const ownerMessage = 'New Booking Request!%0A' +
      'Reference: ' + bookingData.booking_id + '%0A' +
      'Name: ' + bookingData.name + '%0A' +
      'Email: ' + bookingData.email + '%0A' +
      'Phone: ' + bookingData.phone + '%0A' +
      'Car: ' + bookingData.car + '%0A' +
      'Pickup: ' + bookingData.pickup_date + '%0A' +
      'Return: ' + bookingData.return_date + '%0A' +
      'Days: ' + bookingData.days + '%0A' +
      'Total: ' + bookingData.total + '%0A' +
      'Location: ' + bookingData.location + '%0A' +
      'Requests: ' + bookingData.requests;

    const customerUrl = 'https://wa.me/' + phone + '?text=' + customerMessage;
    const ownerUrl = 'https://wa.me/' + ownerPhone + '?text=' + ownerMessage;

    window.open(customerUrl, '_blank');
    window.open(ownerUrl, '_blank');
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
    const total = dailyRate * days;

    const LOCATION_LABELS = {
      kiambu: 'Nairobi - Kiambu Rd',
      westlands: 'Nairobi - Westlands',
      cbd: 'Nairobi - CBD',
      jkia: 'JKIA Airport',
      karen: 'Karen',
      mombasa: 'Mombasa - Bamburi'
    };
    const locationLabel = LOCATION_LABELS[loc] || loc || 'Not specified';

    const bookingId = generateBookingId();

    const bookingData = {
      booking_id: bookingId,
      name: name,
      email: email,
      phone: phone,
      car: carName,
      pickup_date: formatDateDisplay(pickup),
      return_date: formatDateDisplay(ret),
      days: days,
      total: formatKSh(total),
      location: locationLabel,
      requests: document.getElementById('fieldRequests')?.value.trim() || 'None'
    };

    let emailSent = false;
    let firebaseSaved = false;

    // Send emails
    sendEmails(bookingData)
      .then(function() {
        emailSent = true;
        console.log('Emails sent successfully');
      })
      .catch(function(error) {
        console.error('Email sending failed:', error);
      });

    // Save to Firebase
    saveToFirebase(bookingData)
      .then(function() {
        firebaseSaved = true;
        console.log('Booking saved to Firebase');
      })
      .catch(function(error) {
        console.error('Firebase save failed:', error);
      });

    // Send WhatsApp notification
    sendWhatsAppNotification(bookingData);

    setTimeout(function() {
      btn.innerHTML = originalHTML;
      btn.disabled = false;

      const formWrap = document.getElementById('bookingFormWrap');
      const success = document.getElementById('bookingSuccess');
      if (formWrap) formWrap.style.display = 'none';
      if (success) success.style.display = 'block';

      let toastMessage = 'Booking request sent! We\'ll confirm within 2 hours.';
      if (emailSent) toastMessage += ' A confirmation email has been sent to you.';
      if (firebaseSaved) toastMessage += ' Your booking has been saved securely.';
      toastMessage += ' A WhatsApp message has also been sent to you.';
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
   Admin Dashboard (with Firebase)
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

  if (!bookingsBody) return;

  let allBookings = [];
  let unsubscribe = null;

  function formatDate(date) {
    if (!date) return '—';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function updateStats(bookings) {
    const total = bookings.length;
    const pending = bookings.filter(function(b) { return b.status === 'pending'; }).length;
    const confirmed = bookings.filter(function(b) { return b.status === 'confirmed'; }).length;
    const revenue = bookings.reduce(function(sum, b) {
      const totalStr = b.total || '0';
      const num = parseInt(totalStr.replace(/[^0-9]/g, '')) || 0;
      return sum + num;
    }, 0);

    document.getElementById('totalBookings').textContent = total;
    document.getElementById('pendingBookings').textContent = pending;
    document.getElementById('confirmedBookings').textContent = confirmed;
    document.getElementById('totalRevenue').textContent = formatKSh(revenue);
  }

  function populateCarFilter() {
    const cars = new Set();
    allBookings.forEach(function(b) {
      if (b.car) cars.add(b.car);
    });
    carFilter.innerHTML = '<option value="">All Vehicles</option>';
    cars.forEach(function(car) {
      const opt = document.createElement('option');
      opt.value = car;
      opt.textContent = car;
      carFilter.appendChild(opt);
    });
  }

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

      return '<tr>' +
        '<td><strong>' + (b.booking_id || '—') + '</strong></td>' +
        '<td>' +
        '<div><strong>' + (b.name || '—') + '</strong></div>' +
        '<div style="font-size:0.75rem; color:var(--text-secondary);">' + (b.email || '') + '</div>' +
        '</td>' +
        '<td>' + (b.car || '—') + '</td>' +
        '<td>' + formatDate(b.pickup_date) + '</td>' +
        '<td>' + formatDate(b.return_date) + '</td>' +
        '<td>' + (b.days || '—') + '</td>' +
        '<td><strong style="color:var(--accent-gold);">' + (b.total || '—') + '</strong></td>' +
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

    // Status change handlers
    bookingsBody.querySelectorAll('.status-select').forEach(function(sel) {
      sel.addEventListener('change', function() {
        const id = this.dataset.id;
        const newStatus = this.value;
        if (db) {
          db.collection('bookings').doc(id).update({ status: newStatus })
            .then(function() {
              showAdminToast('Booking status updated to ' + newStatus, 'success');
            })
            .catch(function(error) {
              console.error('Error updating status:', error);
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
              })
              .catch(function(error) {
                console.error('Error deleting booking:', error);
                showAdminToast('Failed to delete booking', 'error');
              });
          }
        }
      });
    });
  }

  function applyFilters() {
    const search = searchInput.value.toLowerCase().trim();
    const status = statusFilter.value;
    const car = carFilter.value;

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
    updateStats(filtered);
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

    unsubscribe = db.collection('bookings')
      .orderBy('created_at', 'desc')
      .onSnapshot(function(snapshot) {
        allBookings = [];
        snapshot.forEach(function(doc) {
          const data = doc.data();
          data.id = doc.id;
          allBookings.push(data);
        });

        populateCarFilter();
        applyFilters();
        console.log('Loaded ' + allBookings.length + ' bookings from Firebase');
      }, function(error) {
        console.error('Error loading bookings:', error);
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.innerHTML = '<i class="fas fa-exclamation-triangle"></i><p>Error loading bookings. Please refresh or check your Firebase configuration.</p>';
        showAdminToast('Error loading bookings: ' + error.message, 'error');
      });
  }

  function exportCSV() {
    if (allBookings.length === 0) {
      showAdminToast('No bookings to export', 'error');
      return;
    }

    const headers = ['Booking ID', 'Name', 'Email', 'Phone', 'Car', 'Pickup Date', 'Return Date', 'Days', 'Total', 'Status', 'Location', 'Requests'];
    const rows = allBookings.map(function(b) {
      return [
        b.booking_id || '',
        b.name || '',
        b.email || '',
        b.phone || '',
        b.car || '',
        formatDate(b.pickup_date),
        formatDate(b.return_date),
        b.days || '',
        b.total || '',
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

/* ───────────────────────────────────────────
   Bootstrap – Initialize Everything
─────────────────────────────────────────── */

// ONLY run DOM-related code if we are in a browser environment
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    // Core features
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

/* ───────────────────────────────────────────
   Export for Jest (Node.js)
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
    VEHICLES_DATA: VEHICLES_DATA
  };
}