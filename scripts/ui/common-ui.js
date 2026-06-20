/**
 * Common UI: Back to top, lazy images, footer year, scroll reveal, counters, admin shortcut
 */

export function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

export function initLazyImages() {
  const images = document.querySelectorAll('img[data-src]');
  if (!images.length || !('IntersectionObserver' in window)) {
    images.forEach(img => img.src = img.dataset.src);
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

export function initFooterYear() {
  document.querySelectorAll('#footerYear').forEach(el => el.textContent = new Date().getFullYear());
}

export function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length || !('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const siblings = entry.target.parentElement.querySelectorAll('.reveal');
        const idx = Array.from(siblings).indexOf(entry.target);
        setTimeout(() => entry.target.classList.add('visible'), idx * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  elements.forEach(el => observer.observe(el));
}

export function initCounters() {
  const counters = document.querySelectorAll('.stat-number');
  if (!counters.length) return;
  if (!('IntersectionObserver' in window)) {
    counters.forEach(el => el.textContent = el.dataset.target || '0');
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const duration = 1800;
        const step = 16;
        const increment = target / (duration / step);
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) { current = target; clearInterval(timer); }
          el.textContent = Math.floor(current);
        }, step);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
}

export function initAdminShortcut() {
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.key === 'k')) {
      e.preventDefault();
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = ' Admin access granted...';
        toast.className = 'toast show success';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 1500);
      }
      window.location.href = 'admin-login.html';
    }
  });
}