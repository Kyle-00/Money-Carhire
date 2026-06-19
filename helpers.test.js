/**
 * Money Carhire — unit tests for helper functions
 * Now importing from the modular helper files.
 */

import { formatKSh } from './scripts/helpers/format-helpers.js';
import { daysBetween } from './scripts/helpers/business-helpers.js';
import { validateEmail, validatePhone } from './scripts/helpers/validation-helpers.js';

describe('formatKSh', () => {
  test('formats numbers with Kenyan Shilling prefix and commas', () => {
    expect(formatKSh(50000)).toBe('KSh 50,000');
    expect(formatKSh(0)).toBe('KSh 0');
    expect(formatKSh(1234567)).toBe('KSh 1,234,567');
  });
});

describe('daysBetween', () => {
  test('calculates positive difference in days', () => {
    expect(daysBetween('2026-06-20', '2026-06-25')).toBe(5);
    expect(daysBetween('2026-06-01', '2026-06-30')).toBe(29);
  });

  test('returns 0 when end date is before or same as start', () => {
    expect(daysBetween('2026-06-25', '2026-06-20')).toBe(0);
    expect(daysBetween('2026-06-20', '2026-06-20')).toBe(0);
  });
});

describe('validateEmail', () => {
  test('returns true for valid email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name+tag@co.ke')).toBe(true);
    expect(validateEmail('hello@moneycarhire.co.ke')).toBe(true);
  });

  test('returns false for invalid emails', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('missing@tld')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('user@.com')).toBe(false);
  });
});

describe('validatePhone', () => {
  test('returns true for valid Kenyan numbers', () => {
    expect(validatePhone('+254712345678')).toBe(true);
    expect(validatePhone('+254723456789')).toBe(true);
    expect(validatePhone('0712345678')).toBe(true);
    expect(validatePhone('0723456789')).toBe(true);
  });

  test('returns false for invalid phone numbers', () => {
    expect(validatePhone('123456789')).toBe(false);
    expect(validatePhone('+25412345678')).toBe(false);
    expect(validatePhone('071234567')).toBe(false);
    expect(validatePhone('+25471234567')).toBe(false);
    expect(validatePhone('07123456789')).toBe(false);
  });
});