import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import appConfig from '../config/appConfig.js';
import Card from '../components/Card.jsx';
import useCycleData from '../hooks/useCycleData.jsx';
import {
  isValidCycleLength,
  isValidPeriodDuration,
  MIN_CYCLE_LENGTH,
  MAX_CYCLE_LENGTH,
  MAX_PERIOD_DURATION,
} from '../features/cycle/cycleLogic.js';
import { compareISO, isValidISODate, todayISO } from '../utils/dateUtils.js';

export default function FirstRunSetup() {
  const { settings, updateSettings } = useCycleData();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState(String(settings.cycleLength));
  const [duration, setDuration] = useState(String(settings.periodDuration));
  const [lastStart, setLastStart] = useState(settings.lastPeriodStart || '');
  const [errors, setErrors] = useState({});

  function completeSetup(patch = {}) {
    updateSettings({ ...patch, setupComplete: true });
    navigate('/', { replace: true });
  }

  function saveSetup(event) {
    event.preventDefault();
    const nextErrors = {};
    const cycleLength = Number(cycle);
    const periodDuration = Number(duration);

    if (!isValidCycleLength(cycleLength)) {
      nextErrors.cycle = `Enter a whole number from ${MIN_CYCLE_LENGTH} to ${MAX_CYCLE_LENGTH}.`;
    }
    if (!isValidPeriodDuration(periodDuration)) {
      nextErrors.duration = `Enter a whole number from 1 to ${MAX_PERIOD_DURATION}.`;
    }
    if (lastStart && !isValidISODate(lastStart)) {
      nextErrors.lastStart = 'Please enter a valid date.';
    } else if (lastStart && compareISO(lastStart, todayISO()) > 0) {
      nextErrors.lastStart = 'The start date cannot be in the future.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    completeSetup({
      cycleLength,
      periodDuration,
      lastPeriodStart: lastStart || null,
    });
  }

  return (
    <section className="first-run" aria-labelledby="setup-heading">
      <header className="hero">
        <h1 id="setup-heading">Welcome to {appConfig.appName} 🌸</h1>
        <p className="hero_message">
          Add what you know to personalize your estimates. These details are optional and stay on this device.
        </p>
      </header>

      <Card title="A few cycle details">
        <form onSubmit={saveSetup} noValidate>
          <div className="field">
            <label htmlFor="setup-cycle">Typical cycle length (days)</label>
            <input
              id="setup-cycle"
              type="number"
              inputMode="numeric"
              min={MIN_CYCLE_LENGTH}
              max={MAX_CYCLE_LENGTH}
              value={cycle}
              onChange={(event) => setCycle(event.target.value)}
              aria-invalid={!!errors.cycle}
              aria-describedby={errors.cycle ? 'setup-cycle-error' : undefined}
            />
            {errors.cycle && (
              <span id="setup-cycle-error" className="error" role="alert">
                {errors.cycle}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="setup-duration">Typical period length (days)</label>
            <input
              id="setup-duration"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_PERIOD_DURATION}
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              aria-invalid={!!errors.duration}
              aria-describedby={errors.duration ? 'setup-duration-error' : undefined}
            />
            {errors.duration && (
              <span id="setup-duration-error" className="error" role="alert">
                {errors.duration}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="setup-last-start">First day of your most recent period (optional)</label>
            <input
              id="setup-last-start"
              type="date"
              max={todayISO()}
              value={lastStart}
              onChange={(event) => setLastStart(event.target.value)}
              aria-invalid={!!errors.lastStart}
              aria-describedby={errors.lastStart ? 'setup-last-start-error' : 'setup-date-help'}
            />
            {errors.lastStart ? (
              <span id="setup-last-start-error" className="error" role="alert">
                {errors.lastStart}
              </span>
            ) : (
              <span id="setup-date-help" className="muted">
                Without a date, Bloom won&apos;t show a next-period estimate. You can add one later.
              </span>
            )}
          </div>

          <div className="actions">
            <button type="submit" className="btn">
              Save and continue
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => completeSetup()}>
              Skip for now
            </button>
          </div>
        </form>
      </Card>
      <p className="muted">
        The suggested lengths are only starting points. You can change them any time in Settings.
      </p>
    </section>
  );
}
