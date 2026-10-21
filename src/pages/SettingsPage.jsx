import { useRef, useState } from 'react';
import { Download, Upload, Trash2, Monitor, Sun, Moon, Bell } from 'lucide-react';
import useCycleData from '../hooks/useCycleData.jsx';
import useTheme from '../hooks/useTheme.js';
import useToast from '../components/Toast.jsx';
import Card from '../components/Card.jsx';
import InstallHelp from '../components/InstallHelp.jsx';
import { ConfirmDialog } from '../components/Dialogs.jsx';
import {
  isValidCycleLength,
  isValidPeriodDuration,
  MIN_CYCLE_LENGTH,
  MAX_CYCLE_LENGTH,
  MAX_PERIOD_DURATION,
} from '../features/cycle/cycleLogic.js';
import { isValidISODate, todayISO } from '../utils/dateUtils.js';
import { parseImport } from '../services/storage.js';

const THEMES = [
  { id: 'system', label: 'System', Icon: Monitor },
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark', Icon: Moon },
];

export default function SettingsPage() {
  const { settings, updateSettings, exportData, importData, resetAll, periods } = useCycleData();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const fileRef = useRef(null);

  const [cycle, setCycle] = useState(String(settings.cycleLength));
  const [duration, setDuration] = useState(String(settings.periodDuration));
  const [lastStart, setLastStart] = useState(settings.lastPeriodStart || '');
  const [errors, setErrors] = useState({});
  const [pendingImport, setPendingImport] = useState(null);
  const [importError, setImportError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  function saveCycle(e) {
    e.preventDefault();
    const next = {};
    const c = Number(cycle);
    const d = Number(duration);

    if (!isValidCycleLength(c)) {
      next.cycle = `Enter a whole number from ${MIN_CYCLE_LENGTH} to ${MAX_CYCLE_LENGTH}.`;
    }
    if (!isValidPeriodDuration(d)) {
      next.duration = `Enter a whole number from 1 to ${MAX_PERIOD_DURATION}.`;
    }
    if (lastStart && !isValidISODate(lastStart)) {
      next.lastStart = 'Please enter a valid date.';
    } else if (lastStart && lastStart > todayISO()) {
      next.lastStart = 'The start date cannot be in the future.';
    }

    setErrors(next);
    if (Object.keys(next).length) return;

    updateSettings({
      cycleLength: c,
      periodDuration: d,
      lastPeriodStart: lastStart || null,
    });
    toast('Settings saved');
  }

  function doExport() {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bloom-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup downloaded');
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImportError('');
    const result = parseImport(await file.text());
    if (!result.ok) {
      setImportError(result.error);
      return;
    }
    setPendingImport(result.data); // nothing is changed until the user confirms
  }

  return (
    <>
      <h1>Settings</h1>

      <Card title="Appearance">
        <div className="chips" role="radiogroup" aria-label="Theme">
          {THEMES.map(({ id, label, Icon }) => (
            <label key={id} className={`chip ${theme === id ? 'chip--on' : ''}`}>
              <input
                type="radio"
                name="theme"
                className="visually-hidden"
                checked={theme === id}
                onChange={() => setTheme(id)}
              />
              <Icon size={16} aria-hidden="true" /> {label}
            </label>
          ))}
        </div>
        <p className="muted">System follows your device&apos;s light or dark setting automatically.</p>
      </Card>

      <Card title="Cycle">
        <form onSubmit={saveCycle} noValidate>
          <div className="field">
            <label htmlFor="s-cycle">Cycle length (days)</label>
            <input
              id="s-cycle"
              inputMode="numeric"
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
              aria-invalid={!!errors.cycle}
              aria-describedby={errors.cycle ? 's-cycle-err' : undefined}
            />
            {errors.cycle && (
              <span id="s-cycle-err" className="error" role="alert">
                {errors.cycle}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="s-duration">Usual period length (days)</label>
            <input
              id="s-duration"
              inputMode="numeric"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              aria-invalid={!!errors.duration}
              aria-describedby={errors.duration ? 's-duration-err' : undefined}
            />
            {errors.duration && (
              <span id="s-duration-err" className="error" role="alert">
                {errors.duration}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="s-last">Most recent period start (for estimates)</label>
            <input
              id="s-last"
              type="date"
              max={todayISO()}
              value={lastStart}
              disabled={periods.length > 0}
              onChange={(e) => setLastStart(e.target.value)}
              aria-invalid={!!errors.lastStart}
              aria-describedby={errors.lastStart ? 's-last-err' : undefined}
            />
            {errors.lastStart && (
              <span id="s-last-err" className="error" role="alert">
                {errors.lastStart}
              </span>
            )}
            {periods.length > 0 && (
              <span className="muted">
                Locked because you have logged periods. Estimates use the latest logged start; manage those records in History.
              </span>
            )}
            {!periods.length && (
              <span className="muted">
                This date is only used to calculate estimates. It does not record a period; log a start in Calendar and add its end date later if you want.
              </span>
            )}
          </div>

          <fieldset className="choice">
            <legend>Prediction mode</legend>
            <div className="chips">
              {[
                ['fixed', 'Fixed length'],
                ['adaptive', 'Adaptive'],
              ].map(([id, label]) => (
                <label key={id} className={`chip ${settings.predictionMode === id ? 'chip--on' : ''}`}>
                  <input
                    type="radio"
                    name="mode"
                    className="visually-hidden"
                    checked={settings.predictionMode === id}
                    onChange={() => updateSettings({ predictionMode: id })}
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="muted">
              Adaptive averages your last few recorded cycles (needs at least 3). Fixed always uses the length above.
            </p>
          </fieldset>

          <button type="submit" className="btn">
            Save cycle settings
          </button>
        </form>
      </Card>

      <Card title="Reminders" icon={<Bell size={18} aria-hidden="true" />}>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.remindersEnabled}
            onChange={(e) => updateSettings({ remindersEnabled: e.target.checked })}
          />
          Show a gentle in-app heads-up before the estimated date
        </label>

        <div className="field">
          <label htmlFor="s-days-before">Show the heads-up this many days before</label>
          <select
            id="s-days-before"
            value={settings.reminderDaysBefore}
            disabled={!settings.remindersEnabled}
            onChange={(e) => updateSettings({ reminderDaysBefore: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5, 7].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'day' : 'days'}
              </option>
            ))}
          </select>
        </div>
        <p className="muted">Reminders only appear inside the app, on the Home screen.</p>
      </Card>

      <Card title="Your data">
        <div className="actions">
          <button type="button" className="btn btn--ghost" onClick={doExport}>
            <Download size={18} aria-hidden="true" /> Export backup
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
            <Upload size={18} aria-hidden="true" /> Restore from file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json, .json"
            className="visually-hidden"
            onChange={onFile}
            aria-label="Choose a backup file"
            tabIndex={-1}
          />
        </div>

        {importError && (
          <p className="error" role="alert">
            {importError}
          </p>
        )}

        <div className="actions">
          <button type="button" className="btn btn--danger" onClick={() => setConfirmReset(true)}>
            <Trash2 size={18} aria-hidden="true" /> Delete all my data
          </button>
        </div>
      </Card>

      <InstallHelp />

      <Card title="Privacy">
        <p>
          Everything stays on this device. Bloom has no account, no server, and no analytics, and your records are never sent anywhere.
        </p>
        <p className="muted">
          Browser storage isn&apos;t encrypted, and it can be cleared by you, your browser or your device. Export a backup now and then.
        </p>
      </Card>

      {pendingImport && (
        <ConfirmDialog
          title="Replace your data?"
          message={`This backup has ${pendingImport.periods.length} recorded period(s). Restoring replaces what is currently saved on this device.`}
          confirmLabel="Replace my data"
          onCancel={() => setPendingImport(null)}
          onConfirm={() => {
            const ok = importData(pendingImport);
            setPendingImport(null);
            toast(ok ? 'Backup restored' : 'Could not save the backup');
          }}
        />
      )}

      {confirmReset && (
        <ConfirmDialog
          title="Delete everything?"
          message="This permanently deletes your periods, check-ins and settings from this device. Consider exporting a backup first."
          confirmLabel="Delete all"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            resetAll();
            setTheme('system');
            setConfirmReset(false);
            toast('All data deleted');
          }}
        />
      )}
    </>
  );
}