// Calendar grid helpers (pure functions). Weeks start on Sunday.

import { daysInMonth, toISODate } from '../../utils/dateUtils.js';

/** Returns a 6-row x 7-column grid of cells for the month (month is 1-12). */
export function buildMonthGrid(year, month) {
  const firstWeekday = new Date(year, month - 1, 1, 12).getDay();
  const total = daysInMonth(year, month);
  const cells = [];

  // Leading days from the previous month
  for (let i = firstWeekday; i > 0; i--) {
    const d = new Date(year, month - 1, 1 - i, 12);
    cells.push({ iso: toISODate(d), day: d.getDate(), inMonth: false });
  }

  // Days of the month itself
  for (let day = 1; day <= total; day++) {
    cells.push({ iso: toISODate(new Date(year, month - 1, day, 12)), day, inMonth: true });
  }

  // Trailing days to complete 6 rows (stable height, no layout shift)
  let next = 1;
  while (cells.length < 42) {
    const d = new Date(year, month, next++, 12);
    cells.push({ iso: toISODate(d), day: d.getDate(), inMonth: false });
  }

  return cells;
}

export function shiftMonth(year, month, delta) {
  const d = new Date(year, month - 1 + delta, 1, 12);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/** Expand recorded periods into a Set of ISO dates (end defaults to start). */
export function recordedDaySet(periods, addDaysFn) {
  const set = new Set();
  for (const p of periods) {
    let cur = p.start;
    const end = p.end || p.start;
    let guard = 0;
    while (cur && cur <= end && guard++ < 31) {
      set.add(cur);
      cur = addDaysFn(cur, 1);
    }
  }
  return set;
}