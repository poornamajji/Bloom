import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  loadSettings,
  saveSettings,
  loadPeriods,
  savePeriods,
  loadCheckins,
  saveCheckins,
  deleteAllData,
  applyImport,
  buildExport,
} from '../services/storage.js';
import { predictNextPeriod, validatePeriod, sortPeriods } from '../features/cycle/cycleLogic.js';
import { todayISO } from '../utils/dateUtils.js';

const CycleDataContext = createContext(null);

function newId() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function CycleDataProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);
  const [periods, setPeriods] = useState(loadPeriods);
  const [checkins, setCheckins] = useState(loadCheckins);
  const [today, setToday] = useState(todayISO);

  // Keep "today" fresh if the app stays open past midnight.
  useEffect(() => {
    const id = setInterval(() => setToday(todayISO()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const addPeriod = useCallback(
    (record) => {
      const rec = { id: newId(), start: record.start, ...(record.end ? { end: record.end } : {}) };
      const check = validatePeriod(rec, periods);
      if (!check.ok) return check;

      const next = sortPeriods([...periods, rec]);
      setPeriods(next);
      savePeriods(next);
      return { ok: true, error: null, id: rec.id };
    },
    [periods]
  );

  const editPeriod = useCallback(
    (id, record) => {
      const rec = { id, start: record.start, ...(record.end ? { end: record.end } : {}) };
      const check = validatePeriod(rec, periods, id);
      if (!check.ok) return check;

      const next = sortPeriods(periods.map((p) => (p.id === id ? rec : p)));
      setPeriods(next);
      savePeriods(next);
      return { ok: true, error: null };
    },
    [periods]
  );

  const removePeriod = useCallback(
    (id) => {
      const next = periods.filter((p) => p.id !== id);
      setPeriods(next);
      savePeriods(next);
    },
    [periods]
  );

  const saveCheckin = useCallback((date, entry) => {
    setCheckins((prev) => {
      const next = { ...prev, [date]: entry };
      saveCheckins(next);
      return next;
    });
  }, []);

  const removeCheckin = useCallback((date) => {
    setCheckins((prev) => {
      const next = { ...prev };
      delete next[date];
      saveCheckins(next);
      return next;
    });
  }, []);

  const importData = useCallback((data) => {
    const ok = applyImport(data);
    setSettings(loadSettings());
    setPeriods(loadPeriods());
    setCheckins(loadCheckins());
    return ok;
  }, []);

  const exportData = useCallback(() => buildExport({ settings, periods, checkins }), [settings, periods, checkins]);

  const resetAll = useCallback(() => {
    deleteAllData();
    setSettings(loadSettings());
    setPeriods([]);
    setCheckins({});
  }, []);

  // Predictions are derived, never stored.
  const prediction = useMemo(
    () =>
      predictNextPeriod({
        periods,
        mode: settings.predictionMode,
        configuredLength: settings.cycleLength,
        fallbackLastStart: settings.lastPeriodStart,
      }),
    [periods, settings.predictionMode, settings.cycleLength, settings.lastPeriodStart]
  );

  const value = useMemo(
    () => ({
      settings,
      periods,
      checkins,
      today,
      prediction,
      updateSettings,
      addPeriod,
      editPeriod,
      removePeriod,
      saveCheckin,
      removeCheckin,
      importData,
      exportData,
      resetAll,
    }),
    [
      settings,
      periods,
      checkins,
      today,
      prediction,
      updateSettings,
      addPeriod,
      editPeriod,
      removePeriod,
      saveCheckin,
      removeCheckin,
      importData,
      exportData,
      resetAll,
    ]
  );

  return <CycleDataContext.Provider value={value}>{children}</CycleDataContext.Provider>;
}

export default function useCycleData() {
  const ctx = useContext(CycleDataContext);
  if (!ctx) throw new Error('useCycleData must be used inside CycleDataProvider');
  return ctx;
}