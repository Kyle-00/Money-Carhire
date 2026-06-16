/**
 * Money Carhire — script.js
 * ══════════════════════════════════════════
 * Features:
 *  1. Dark Mode (localStorage persistence)
 *  2. Navbar scroll effect + hamburger menu
 *  3. Hero date default
 *  4. Fleet filter (only search, no category buttons)
 *  5. Scroll reveal animations (Intersection Observer)
 *  6. Animated counters (Intersection Observer)
 *  7. Testimonial auto-slider with dots
 *  8. Back-to-top button
 *  9. Toast notifications
 * 10. URL parameter parser → pre-fills booking form
 * 11. Live booking receipt calculator + availability check
 * 12. Booking form validation + submission
 * 13. Contact form validation + submission
 * 14. Lazy image loading (Intersection Observer)
 * 15. Dynamic footer copyright year
 * ══════════════════════════════════════════
 */

'use strict';

/* ───────────────────────────────────────────
   Helpers (exported for testing)
─────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

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

/* ───────────────────────────────────────────
   1. Dark Mode
─────────────────────────────────────────── */
function initDarkMode() {
  const btn  = $('#darkModeBtn');
  const icon = $('#darkModeIcon');
  if (!btn) return;

  const saved = localStorage.getItem('mcDarkMode');
  if (saved === 'true') {
    document.body.classList.add('dark');
    if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
  }

  btn.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('mcDarkMode', isDark);
    if (icon) {
      icon.classList.toggle('fa-moon', !isDark);
      icon.classList.toggle('fa-sun',  isDark);
    }
  });
}

/* ───────────────────────────────────────────
   2. Navbar: scroll shadow + hamburger
─────────────────────────────────────────── */
function initNavbar() {
  const navbar    = $('#navbar');
  const hamburger = $('#hamburger');
  const navLinks  = $('#navLinks');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      hamburger.classList.toggle('active', open);
      hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    $$('.nav-links a', navLinks).forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });
    document.addEventListener('click', e => {
      if (!navbar.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
      }
    });
  }
}

/* ───────────────────────────────────────────
   3. Hero date default
─────────────────────────────────────────── */
function initHeroDate() {
  const heroDate = $('#heroDate');
  if (!heroDate) return;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  heroDate.value = toDateString(tomorrow);
  heroDate.min   = toDateString(new Date());
}

/* ───────────────────────────────────────────
   4. Fleet filter: only search (no category buttons)
─────────────────────────────────────────── */
function initFleetFilter() {
  const searchInput = $('#fleetSearch');
  const cards       = $$('.car-card');
  const noResults   = $('#noResults');
  if (!searchInput) return;

  function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();
    let visible = 0;

    cards.forEach(card => {
      const title = (card.querySelector('.car-title')?.textContent || '').toLowerCase();
      const show  = !query || title.includes(query);
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (noResults) noResults.style.display = visible === 0 ? 'block' : 'none';
  }

  searchInput.addEventListener('input', applyFilters);
}

/* ───────────────────────────────────────────
   5. Scroll reveal
─────────────────────────────────────────── */
function initScrollReveal() {
  const elements = $$('.reveal');
  if (!elements.length || !('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const siblings = $$('.reveal', entry.target.parentElement);
        const idx = siblings.indexOf(entry.target);
        setTimeout(() => entry.target.classList.add('visible'), idx * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}

/* ───────────────────────────────────────────
   6. Animated counters
─────────────────────────────────────────── */
function initCounters() {
  const counters = $$('.stat-number');
  if (!counters.length || !('IntersectionObserver' in window)) return;

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const step = 16;
    const increment = target / (duration / step);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current);
    }, step);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/* ───────────────────────────────────────────
   7. Testimonial slider
─────────────────────────────────────────── */
function initTestimonialSlider() {
  const track     = $('#testimonialTrack');
  const dotsWrap  = $('#sliderDots');
  if (!track) return;

  const cards   = $$('.testimonial-card', track);
  const total   = cards.length;
  let current   = 0;
  let autoTimer = null;

  if (dotsWrap) {
    cards.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Testimonial ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
  }

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    $$('.slider-dot', dotsWrap).forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function startAuto() {
    autoTimer = setInterval(() => goTo(current + 1), 4500);
  }
  function stopAuto() { clearInterval(autoTimer); }

  startAuto();
  track.closest('.testimonial-slider-wrap')?.addEventListener('mouseenter', stopAuto);
  track.closest('.testimonial-slider-wrap')?.addEventListener('mouseleave', startAuto);

  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
  }, { passive: true });
}

/* ───────────────────────────────────────────
   8. Back to top
─────────────────────────────────────────── */
function initBackToTop() {
  const btn = $('#backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ───────────────────────────────────────────
   9. Toast notifications
─────────────────────────────────────────── */
function showToast(message, type = 'success') {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className   = 'toast show' + (type === 'error' ? ' error' : '');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ───────────────────────────────────────────
   10 + 11. Booking: URL params + live receipt + availability
─────────────────────────────────────────── */
function initBookingPage() {
  const vehicleSelect   = $('#vehicleSelect');
  const pickupDateInput = $('#pickupDate');
  const returnDateInput = $('#returnDate');
  const locationSelect  = $('#pickupLocation');
  if (!vehicleSelect) return;  // Not on booking page

  // ── Set default dates ──
  const today    = new Date();
  const pickup   = new Date(today); pickup.setDate(today.getDate() + 1);
  const ret      = new Date(today); ret.setDate(today.getDate() + 4);
  const todayStr = toDateString(today);
  if (pickupDateInput) {
    pickupDateInput.min   = todayStr;
    pickupDateInput.value = toDateString(pickup);
  }
  if (returnDateInput) {
    returnDateInput.min   = toDateString(pickup);
    returnDateInput.value = toDateString(ret);
  }

  // ── Pre-fill from URL params ──
  const params = getQueryParams();
  if (params.car) {
    $$('#vehicleSelect option').forEach(opt => {
      if (opt.value.startsWith(params.car)) {
        opt.selected = true;
      }
    });
  }

  // ── Date enforcement ──
  pickupDateInput?.addEventListener('change', () => {
    if (returnDateInput) {
      const minReturn = new Date(pickupDateInput.value + 'T00:00:00');
      minReturn.setDate(minReturn.getDate() + 1);
      if (returnDateInput.value <= pickupDateInput.value) {
        returnDateInput.value = toDateString(minReturn);
      }
      returnDateInput.min = toDateString(minReturn);
    }
    updateReceipt();
  });
  returnDateInput?.addEventListener('change', () => {
    if (pickupDateInput && returnDateInput.value <= pickupDateInput.value) {
      showToast('Return date must be after pickup date.', 'error');
      const next = new Date(pickupDateInput.value + 'T00:00:00');
      next.setDate(next.getDate() + 1);
      returnDateInput.value = toDateString(next);
      returnDateInput.min = toDateString(next);
    }
    updateReceipt();
  });
  vehicleSelect?.addEventListener('change', updateReceipt);
  locationSelect?.addEventListener('change', updateReceipt);

  // ── Live Receipt ──
  const LOCATION_LABELS = {
    kiambu:   'Nairobi - Kiambu Rd',
    westlands:'Nairobi - Westlands',
    cbd:      'Nairobi - CBD',
    jkia:     'JKIA Airport',
    karen:    'Karen',
    mombasa:  'Mombasa - Bamburi',
  };

  function updateReceipt() {
    const placeholder   = $('#receiptPlaceholder');
    const details       = $('#receiptDetails');
    const rcCarName     = $('#rcCarName');
    const rcCarCategory = $('#rcCarCategory');
    const rcDailyRate   = $('#rcDailyRate');
    const rcPickupDate  = $('#rcPickupDate');
    const rcReturnDate  = $('#rcReturnDate');
    const rcDays        = $('#rcDays');
    const rcLocation    = $('#rcLocation');
    const rcCalcLabel   = $('#rcCalcLabel');
    const rcCalcValue   = $('#rcCalcValue');
    const rcTotal       = $('#rcTotal');
    const rcAvailability = $('#rcAvailability');

    if (!rcTotal) return;

    const selVal = vehicleSelect.value;
    if (!selVal) {
      if (placeholder) placeholder.style.display = '';
      if (details)     details.style.display     = 'none';
      return;
    }

    // Parse: "Name|price|category|available"
    const parts = selVal.split('|');
    const name = parts[0];
    const dailyRate = parseInt(parts[1], 10) || 0;
    const category = parts[2] || '';
    const available = parts[3] === 'true'; // boolean

    const pickup    = pickupDateInput?.value;
    const ret       = returnDateInput?.value;
    const days      = daysBetween(pickup, ret);
    const total     = dailyRate * days;
    const locVal    = locationSelect?.value || '';
    const locLabel  = LOCATION_LABELS[locVal] || '—';

    if (placeholder) placeholder.style.display = 'none';
    if (details)     details.style.display      = '';

    if (rcCarName)     rcCarName.textContent     = name;
    if (rcCarCategory) rcCarCategory.textContent = category ? category.charAt(0).toUpperCase() + category.slice(1) + ' vehicle' : '';
    if (rcDailyRate)   rcDailyRate.textContent   = formatKSh(dailyRate) + ' / day';
    if (rcPickupDate)  rcPickupDate.textContent  = formatDateDisplay(pickup);
    if (rcReturnDate)  rcReturnDate.textContent  = formatDateDisplay(ret);
    if (rcDays)        rcDays.textContent        = days > 0 ? days + (days === 1 ? ' day' : ' days') : '—';
    if (rcLocation)    rcLocation.textContent    = locLabel;

    // Availability
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

    // Calculation line
    if (rcCalcLabel) rcCalcLabel.textContent = days > 0
      ? formatKSh(dailyRate) + ' × ' + days + (days === 1 ? ' day' : ' days')
      : 'Select dates above';
    if (rcCalcValue) rcCalcValue.textContent = days > 0 ? '= ' + formatKSh(total) : '—';

    if (rcTotal) {
      rcTotal.textContent = days > 0 ? formatKSh(total) : '—';
      rcTotal.classList.remove('pulse');
      void rcTotal.offsetWidth;
      rcTotal.classList.add('pulse');
      setTimeout(() => rcTotal.classList.remove('pulse'), 350);
    }
  }

  updateReceipt(); // initial
}

/* ───────────────────────────────────────────
   12. Booking form validation + submission
─────────────────────────────────────────── */
function initBookingForm() {
  const form = $('#bookingForm');
  if (!form) return;

  function setError(inputId, errId, show) {
    const input = $('#' + inputId);
    const err   = $('#' + errId);
    if (input) input.classList.toggle('error', show);
    if (err)   err.style.display = show ? 'block' : 'none';
    return show;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    let hasError = false;

    const name    = $('#fieldName')?.value.trim();
    const email   = $('#fieldEmail')?.value.trim();
    const phone   = $('#fieldPhone')?.value.trim();
    const pickup  = $('#pickupDate')?.value;
    const ret     = $('#returnDate')?.value;
    const loc     = $('#pickupLocation')?.value;
    const vehicle = $('#vehicleSelect')?.value;

    if (setError('fieldName',     'errName',     !name || name.length < 2)) hasError = true;
    if (setError('fieldEmail',    'errEmail',    !email || !validateEmail(email))) hasError = true;
    if (phone && setError('fieldPhone', 'errPhone', !validatePhone(phone))) hasError = true;
    if (setError('pickupDate',    'errPickup',   !pickup)) hasError = true;
    if (setError('returnDate',    'errReturn',   !ret || ret <= pickup)) hasError = true;
    if (setError('pickupLocation','errLocation', !loc)) hasError = true;
    if (setError('vehicleSelect', 'errVehicle',  !vehicle)) hasError = true;

    // Additional check: vehicle availability for the dates
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

    const btn = $('#submitBtn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
    btn.disabled  = true;

    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.disabled  = false;

      const formWrap = $('#bookingFormWrap');
      const success  = $('#bookingSuccess');
      if (formWrap) formWrap.style.display = 'none';
      if (success)  success.style.display  = 'block';
      showToast('Booking request sent! We\'ll confirm within 2 hours.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1800);
  });

  $$('input, select, textarea', form).forEach(el => {
    el.addEventListener('input', () => el.classList.remove('error'));
    el.addEventListener('change', () => el.classList.remove('error'));
  });
}

/* ───────────────────────────────────────────
   13. Contact form validation + submission
─────────────────────────────────────────── */
function initContactForm() {
  const form = $('#contactForm');
  if (!form) return;

  function setError(inputId, errId, show) {
    const input = $('#' + inputId);
    const err   = $('#' + errId);
    if (input) input.classList.toggle('error', show);
    if (err)   err.style.display = show ? 'block' : 'none';
    return show;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    let hasError = false;

    const name  = $('#contactName')?.value.trim();
    const email = $('#contactEmail')?.value.trim();
    const msg   = $('#contactMessage')?.value.trim();

    if (setError('contactName',    'errContactName',  !name || name.length < 2)) hasError = true;
    if (setError('contactEmail',   'errContactEmail', !email || !validateEmail(email))) hasError = true;
    if (setError('contactMessage', 'errContactMsg',   !msg || msg.length < 10)) hasError = true;

    if (hasError) { showToast('Please fill in the required fields.', 'error'); return; }

    const btn = $('#contactSubmitBtn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
    btn.disabled  = true;

    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.disabled  = false;

      const formWrap = $('#contactFormWrap');
      const success  = $('#contactSuccess');
      if (formWrap) formWrap.style.display = 'none';
      if (success)  success.style.display  = 'block';
      showToast('Message sent! We\'ll get back to you soon.');
    }, 1500);
  });

  $$('input, textarea', form).forEach(el => {
    el.addEventListener('input', () => el.classList.remove('error'));
  });
}

/* ───────────────────────────────────────────
   14. Lazy image loading
─────────────────────────────────────────── */
function initLazyImages() {
  const images = $$('img[data-src]');
  if (!images.length || !('IntersectionObserver' in window)) {
    images.forEach(img => { img.src = img.dataset.src; });
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  images.forEach(img => observer.observe(img));
}

/* ───────────────────────────────────────────
   15. Dynamic footer year
─────────────────────────────────────────── */
function initFooterYear() {
  $$('#footerYear').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
}

/* ───────────────────────────────────────────
   Bootstrap — run everything on DOM ready
─────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initNavbar();
  initHeroDate();
  initFleetFilter();
  initScrollReveal();
  initCounters();
  initTestimonialSlider();
  initBackToTop();
  initBookingPage();
  initBookingForm();
  initContactForm();
  initLazyImages();
  initFooterYear();
});

// Make helpers available globally for testing (in browser)
// In Node.js/Jest, you'd export them instead.
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initNavbar();
    initHeroDate();
    initFleetFilter();
    initScrollReveal();
    initCounters();
    initTestimonialSlider();
    initBackToTop();
    initBookingPage();
    initBookingForm();
    initContactForm();
    initLazyImages();
    initFooterYear();
  });
}