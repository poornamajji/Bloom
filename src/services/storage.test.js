import { describe, expect, it } from 'vitest';
import {
  buildExport,
  defaultSettings,
  KEYS,
  loadSettings,
  parseImport,
  sanitizeSettings,
} from './storage.js';

describe('Bloom settings and backups', () => {
  it('starts without assuming a last-period date', () => {
    expect(defaultSettings()).toMatchObject({
      setupComplete: false,
      cycleLength: 29,
      periodDuration: 5,
      lastPeriodStart: null,
    });
  });

  it('treats saved settings without setup state as an existing user', () => {
    expect(sanitizeSettings({ cycleLength: 31 }).setupComplete).toBe(true);
  });

  it('does not show first-run setup to users who already have cycle data', () => {
    localStorage.setItem(KEYS.periods, JSON.stringify([{ id: 'p1', start: '2020-02-03' }]));

    expect(loadSettings().setupComplete).toBe(true);
  });

  it('exports Bloom backups and accepts existing Eleven backups', () => {
    expect(buildExport({ settings: defaultSettings(), periods: [], checkins: {} }).app).toBe('bloom');

    const imported = parseImport(
      JSON.stringify({
        app: 'eleven',
        version: 1,
        settings: { cycleLength: 31 },
        periods: [],
        checkins: {},
      }),
    );

    expect(imported.ok).toBe(true);
    if (imported.ok) {
      expect(imported.data.settings.cycleLength).toBe(31);
      expect(imported.data.settings.setupComplete).toBe(true);
    }
  });
});