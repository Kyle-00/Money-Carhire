/**
 * Contact Form
 */

import { $, showToast } from '../helpers/dom-helpers.js';
import { validateEmail, isValidString } from '../helpers/validation-helpers.js';

export function initContactForm() {
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
    if (setError('contactName', 'errContactName', !isValidString(name, 2))) hasError = true;
    if (setError('contactEmail', 'errContactEmail', !email || !validateEmail(email))) hasError = true;
    if (setError('contactMessage', 'errContactMsg', !isValidString(msg, 10))) hasError = true;
    if (hasError) { showToast('Please fill in the required fields.', 'error'); return; }

    const btn = document.getElementById('contactSubmitBtn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
      document.getElementById('contactFormWrap').style.display = 'none';
      document.getElementById('contactSuccess').style.display = 'block';
      showToast('Message sent! We\'ll get back to you soon.');
    }, 1500);
  });

  form.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('input', () => el.classList.remove('error'));
  });
}