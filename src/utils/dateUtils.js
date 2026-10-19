// Local-calendar date helpers.
// Dates are stored as 'YYYY-MM-DD' strings and never parsed with `new Date(string)`,
// which would interpret them as UTC and can shift the day.

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year, month) {
  // month is 1-12
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

/** Returns true only for real calendar dates in YYYY-MM-DD form. */
export function isValidISODate(value) {
  if (typeof value !== 'string') return false;
  const m = ISO_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(y, mo);
}

/** Parse 'YYYY-MM-DD' into a local Date at noon (noon avoids DST edge cases). */
export function parseISODate(value) {
  if (!isValidISODate(value)) return null;
  const [y, mo, d] = value.split('-').map(Number);
  return new Date(y, mo - 1, d, 12, 0, 0, 0);
}

export function toISODate(date) {
  const y = String(date.getFullYear()).padStart(4, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Add (or subtract) whole days. Returns an ISO string, or null if input is invalid. */
export function addDays(iso, days) {
  const date = parseISODate(iso);
  if (!date || !Number.isInteger(days)) return null;
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Whole days from a to b (b - a). Returns null if either is invalid. */
export function diffInDays(a, b) {
  const da = parseISODate(a);
  const db = parseISODate(b);
  if (!da || !db) return null;
  const utcA = Date.UTC(da.getFullYear(), da.getMonth(), da.getDate());
  const utcB = Date.UTC(db.getFullYear(), db.getMonth(), db.getDate());
  return Math.round((utcB - utcA) / 86400000);
}

export function todayISO() {
  return toISODate(new Date());
}

export function compareISO(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}