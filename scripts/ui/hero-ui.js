/**
 * Hero Section – date picker default
 */

import { toDateString } from '../helpers/format-helpers.js';

export function initHeroDate() {
  const heroDate = document.getElementById('heroDate');
  if (!heroDate) return;
  const today = new Date();
  heroDate.value = toDateString(today);
  heroDate.min = toDateString(today);
}