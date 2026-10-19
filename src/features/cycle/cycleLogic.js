// Cycle logic: pure functions only (no storage, no React).
// Actual period records and predictions are kept separate: predictions are
// always computed on the fly and are never saved as records.

import { addDays, diffInDays, compareISO, isValidISODate } from '../../utils/dateUtils.js';

export const MIN_CYCLE_LENGTH = 15;
export const MAX_CYCLE_LENGTH = 60;
export const MIN_PERIOD_DURATION = 1;
export const MAX_PERIOD_DURATION = 14;
export const ADAPTIVE_MIN_CYCLES = 3;
export const ADAPTIVE_MAX_CYCLES = 6;

export function isValidCycleLength(n) {
  return Number.isInteger(n) && n >= MIN_CYCLE_LENGTH && n <= MAX_CYCLE_LENGTH;
}

export function isValidPeriodDuration(n) {
  return Number.isInteger(n) && n >= MIN_PERIOD_DURATION && n <= MAX_PERIOD_DURATION;
}

/**
 * A record is { id, start: 'YYYY-MM-DD', end?: 'YYYY-MM-DD' }.
 * Returns a copy sorted by start.
 */
export function sortPeriods(periods) {
  return [...periods].sort((a, b) => compareISO(a.start, b.start));
}

/** Validate a period record against existing ones. Returns { ok, error }. */
export function validatePeriod(candidate, existing = [], ignoreId = null) {
  if (!candidate || !isValidISODate(candidate.start)) {
    return { ok: false, error: 'Please enter a valid start date.' };
  }

  if (candidate.end != null && candidate.end !== '') {
    if (!isValidISODate(candidate.end)) {
      return { ok: false, error: 'Please enter a valid end date.' };
    }
    if (compareISO(candidate.end, candidate.start) < 0) {
      return { ok: false, error: 'The end date cannot be before the start date.' };
    }
    if (diffInDays(candidate.start, candidate.end) + 1 > MAX_PERIOD_DURATION) {
      return {
        ok: false,
        error: `A period can be at most ${MAX_PERIOD_DURATION} days long here.`,
      };
    }
  }

  const others = existing.filter((p) => p.id !== ignoreId);

  if (others.some((p) => p.start === candidate.start)) {
    return { ok: false, error: 'A period starting on this date is already recorded.' };
  }

  const candEnd = candidate.end || candidate.start;
  for (const p of others) {
    const pEnd = p.end || p.start;
    const overlaps =
      compareISO(candidate.start, pEnd) <= 0 && compareISO(p.start, candEnd) <= 0;
    if (overlaps) {
      return { ok: false, error: 'This overlaps with a period that is already recorded.' };
    }
  }

  return { ok: true, error: null };
}

/** Observed cycle lengths: days between consecutive recorded starts. */
export function observedCycleLengths(periods) {
  const sorted = sortPeriods(periods);
  const lengths = [];
  for (let i = 1; i < sorted.length; i++) {
    lengths.push({
      from: sorted[i - 1].start,
      to: sorted[i].start,
      days: diffInDays(sorted[i - 1].start, sorted[i].start),
    });
  }
  return lengths;
}

export function averageCycleLength(periods) {
  const lengths = observedCycleLengths(periods).map((l) => l.days);
  if (lengths.length === 0) return null;
  return lengths.reduce((a, b) => a + b, 0) / lengths.length;
}

/**
 * Choose the cycle length used for prediction.
 * - adaptive: mean of the most recent (up to 6) plausible observed cycles,
 *   rounded, only when at least 3 exist; otherwise falls back to fixed.
 * - fixed: the configured length, always.
 */
export function effectiveCycleLength({ mode, configuredLength, periods }) {
  if (mode !== 'adaptive') {
    return { length: configuredLength, source: 'fixed', variation: 0 };
  }

  const recent = observedCycleLengths(periods)
    .map((l) => l.days)
    .filter(isValidCycleLength)
    .slice(-ADAPTIVE_MAX_CYCLES);

  if (recent.length < ADAPTIVE_MIN_CYCLES) {
    return { length: configuredLength, source: 'fixed-fallback', variation: 0 };
  }

  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const variation = Math.max(...recent) - Math.min(...recent);
  return { length: Math.round(mean), source: 'adaptive', variation };
}

/**
 * Predict the next period start from the latest recorded start.
 * Returns null when there is no valid start (the app must ask the user).
 * The result is an estimate: { date, windowStart, windowEnd, cycleLength, source, lastStart }.
 */
export function predictNextPeriod({ periods, mode, configuredLength, fallbackLastStart = null }) {
  const sorted = sortPeriods(periods.filter((p) => isValidISODate(p.start)));
  const lastStart = sorted.length ? sorted[sorted.length - 1].start : fallbackLastStart;
  if (!isValidISODate(lastStart)) return null;

  const { length, source, variation } = effectiveCycleLength({
    mode,
    configuredLength,
    periods: sorted,
  });
  const date = addDays(lastStart, length);

  // Window: at least 2 days either side, widened by observed variation in adaptive mode.
  const spread = Math.max(2, Math.ceil(variation / 2));

  return {
    date,
    windowStart: addDays(date, -spread),
    windowEnd: addDays(date, spread),
    cycleLength: length,
    source,
    lastStart,
  };
}

/** Days from today until the estimate (negative once the date has passed). */
export function daysUntil(today, prediction) {
  if (!prediction) return null;
  return diffInDays(today, prediction.date);
}

/**
 * Predicted period days for the calendar (never recorded data).
 * Returns an array of ISO dates covering `duration` days starting at the estimate.
 */
export function predictedPeriodDays(prediction, duration) {
  if (!prediction || !isValidPeriodDuration(duration)) return [];
  return Array.from({ length: duration }, (_, i) => addDays(prediction.date, i));
}