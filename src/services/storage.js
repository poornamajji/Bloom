// Storage service: the only place that touches localStorage for user data.
// Keeps settings, periods and check-ins in separate keys, validates on load,
// and never logs health data.

import appConfig from '../config/appConfig.js';
import { isValidISODate } from '../utils/dateUtils.js';
import {
  isValidCycleLength,
  isValidPeriodDuration,
  validatePeriod,
} from '../features/cycle/cycleLogic.js';

export const SCHEMA_VERSION = 1;

export const KEYS = {
  settings: 'eleven_settings',
  periods: 'eleven_periods',
  checkins: 'eleven_checkins',
  theme: 'eleven_theme',
};

export function defaultSettings() {
  const c = appConfig.cycle;
  return {
    setupComplete: false,
    cycleLength: c.defaultCycleLength,
    periodDuration: c.defaultPeriodDuration,
    lastPeriodStart: c.defaultLastPeriodStart,
    predictionMode: c.defaultPredictionMode,
    remindersEnabled: appConfig.reminders.inAppReminders,
    reminderDaysBefore: appConfig.reminders.daysBefore,
  };
}

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Return only valid fields from untrusted settings, filling gaps with defaults. */
export function sanitizeSettings(input) {
  const base = defaultSettings();
  if (!input || typeof input !== 'object') return base;

  const out = { ...base };
  // Older saved settings predate first-run setup; consider those users onboarded.
  out.setupComplete = typeof input.setupComplete === 'boolean' ? input.setupComplete : true;
  if (isValidCycleLength(input.cycleLength)) out.cycleLength = input.cycleLength;
  if (isValidPeriodDuration(input.periodDuration)) out.periodDuration = input.periodDuration;
  if (input.lastPeriodStart === null || isValidISODate(input.lastPeriodStart)) {
    out.lastPeriodStart = input.lastPeriodStart;
  }
  if (input.predictionMode === 'fixed' || input.predictionMode === 'adaptive') {
    out.predictionMode = input.predictionMode;
  }
  if (typeof input.remindersEnabled === 'boolean') out.remindersEnabled = input.remindersEnabled;
  if (
    Number.isInteger(input.reminderDaysBefore) &&
    input.reminderDaysBefore >= 0 &&
    input.reminderDaysBefore <= 14
  ) {
    out.reminderDaysBefore = input.reminderDaysBefore;
  }
  return out;
}

/** Keep only well-formed, non-conflicting period records. */
export function sanitizePeriods(input) {
  if (!Array.isArray(input)) return [];

  const kept = [];
  for (const item of input) {
    if (!item || typeof item.id !== 'string') continue;
    const rec = { id: item.id, start: item.start, ...(item.end ? { end: item.end } : {}) };
    if (validatePeriod(rec, kept).ok) kept.push(rec);
  }
  return kept;
}

const MOODS = ['happy', 'calm', 'okay', 'tired', 'low', 'irritable', 'anxious'];
export const CHECKIN_LIMITS = { scale: [0, 3], noteMax: 1000 };

export function sanitizeCheckins(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};

  const out = {};
  for (const [date, c] of Object.entries(input)) {
    if (!isValidISODate(date) || !c || typeof c !== 'object') continue;

    const entry = {};
    if (MOODS.includes(c.mood)) entry.mood = c.mood;
    for (const f of ['cramps', 'energy', 'flow']) {
      if (Number.isInteger(c[f]) && c[f] >= 0 && c[f] <= 3) entry[f] = c[f];
    }
    if (Array.isArray(c.symptoms)) {
      entry.symptoms = c.symptoms
        .filter((s) => typeof s === 'string' && s.length <= 40)
        .slice(0, 10);
    }
    if (typeof c.note === 'string') entry.note = c.note.slice(0, CHECKIN_LIMITS.noteMax);

    if (Object.keys(entry).length) out[date] = entry;
  }
  return out;
}

export function loadSettings() {
  const storedSettings = readJSON(KEYS.settings);
  const settings = sanitizeSettings(storedSettings);
  const hasExistingRecords =
    sanitizePeriods(readJSON(KEYS.periods)).length > 0 ||
    Object.keys(sanitizeCheckins(readJSON(KEYS.checkins))).length > 0;
  if (
    storedSettings === undefined &&
    hasExistingRecords
  ) {
    settings.setupComplete = true;
  }
  return settings;
}

export function saveSettings(settings) {
  return writeJSON(KEYS.settings, sanitizeSettings(settings));
}

export function loadPeriods() {
  return sanitizePeriods(readJSON(KEYS.periods));
}

export function savePeriods(periods) {
  return writeJSON(KEYS.periods, sanitizePeriods(periods));
}

export function loadCheckins() {
  return sanitizeCheckins(readJSON(KEYS.checkins));
}

export function saveCheckins(checkins) {
  return writeJSON(KEYS.checkins, sanitizeCheckins(checkins));
}

/** Remove all Bloom data from this browser. */
export function deleteAllData() {
  try {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    return true;
  } catch {
    return false;
  }
}

// ---- Export / import ----

export function buildExport({ settings, periods, checkins }) {
  return {
    app: 'bloom',
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings: sanitizeSettings(settings),
    periods: sanitizePeriods(periods),
    checkins: sanitizeCheckins(checkins),
  };
}

/**
 * Validate an imported JSON string WITHOUT changing any stored data.
 * Returns { ok: true, data } or { ok: false, error }.
 */
export function parseImport(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' };
  }

  if (!parsed || typeof parsed !== 'object' || !['bloom', 'eleven'].includes(parsed.app)) {
    return { ok: false, error: 'This does not look like a Bloom backup file.' };
  }
  if (!Number.isInteger(parsed.version) || parsed.version > SCHEMA_VERSION) {
    return { ok: false, error: 'This backup was made by a newer version of the app.' };
  }
  if (
    !Array.isArray(parsed.periods) ||
    typeof parsed.settings !== 'object' ||
    parsed.settings === null
  ) {
    return { ok: false, error: 'The backup is missing required sections.' };
  }
  if (
    parsed.checkins !== undefined &&
    (typeof parsed.checkins !== 'object' || Array.isArray(parsed.checkins))
  ) {
    return { ok: false, error: 'The check-ins section is not in the expected format.' };
  }

  return {
    ok: true,
    data: {
      settings: sanitizeSettings(parsed.settings),
      periods: sanitizePeriods(parsed.periods),
      checkins: sanitizeCheckins(parsed.checkins || {}),
    },
  };
}

/** Write validated import data. Call only after the user has confirmed. */
export function applyImport(data) {
  const a = saveSettings(data.settings);
  const b = savePeriods(data.periods);
  const c = saveCheckins(data.checkins);
  return a && b && c;
}