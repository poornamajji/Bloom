// Deterministic message rotation: the same date always gives the same message,
// and consecutive days give different ones (so it is testable and not repetitive).

import { parseISODate } from './dateUtils.js';

export function dayNumber(iso) {
  const d = parseISODate(iso);
  if (!d) return 0;
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

export function pickForDate(list, iso, offset = 0) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const n = dayNumber(iso) + offset;
  return list[((n % list.length) + list.length) % list.length];
}