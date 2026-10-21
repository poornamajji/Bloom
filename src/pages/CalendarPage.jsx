import { useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarCheck, Plus, Pencil } from 'lucide-react';
import useCycleData from '../hooks/useCycleData.jsx';
import { buildMonthGrid, shiftMonth, recordedDaySet } from '../features/calendar/calendarGrid.js';
import { predictedPeriodDays } from '../features/cycle/cycleLogic.js';
import { addDays, parseISODate } from '../utils/dateUtils.js';
import { PeriodDialog, ConfirmDialog } from '../components/Dialogs.jsx';
import useToast from '../components/Toast.jsx';
import Card from '../components/Card.jsx';
import SparkleBurst from '../components/SparkleBurst.jsx';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function longDate(iso) {
  return parseISODate(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function CalendarPage() {
  const { periods, prediction, settings, today, checkins, addPeriod, editPeriod, removePeriod } = useCycleData();
  const toast = useToast();
  const [ty, tm] = today.split('-').map(Number);
  const [view, setView] = useState({ year: ty, month: tm });
  const [selected, setSelected] = useState(today);
  const location = useLocation();

  // Opened from Home's "Log a period" button: show the form straight away (for today).
  const [dialog, setDialog] = useState(location.state?.openLog ? { period: null } : null);
  const [confirm, setConfirm] = useState(null);
  const [direction, setDirection] = useState('');
  const gridRef = useRef(null);

  const cells = useMemo(() => buildMonthGrid(view.year, view.month), [view]);
  const recorded = useMemo(() => recordedDaySet(periods, addDays), [periods]);
  const settingsStart = !periods.length ? settings.lastPeriodStart : null;
  const predicted = useMemo(() => new Set(predictedPeriodDays(prediction, settings.periodDuration)), [prediction, settings.periodDuration]);

  const monthLabel = new Date(view.year, view.month - 1, 1, 12).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
  const selectedPeriod = periods.find((p) => selected >= p.start && selected <= (p.end || p.start)) || null;

  function go(delta) {
    setDirection(delta > 0 ? 'next' : 'prev');
    setView((v) => shiftMonth(v.year, v.month, delta));
  }

  function goToday() {
    setDirection('');
    setView({ year: ty, month: tm });
    setSelected(today);
  }

  // Arrow-key navigation across the grid.
  function onKeyDown(e) {
    const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (!(e.key in steps)) return;
    e.preventDefault();
    const next = addDays(selected, steps[e.key]);
    setSelected(next);
    const [y, m] = next.split('-').map(Number);
    if (y !== view.year || m !== view.month) setView({ year: y, month: m });
    requestAnimationFrame(() => gridRef.current?.querySelector(`[data-date="${next}"]`)?.focus());
  }

  function dayStatus(iso) {
    if (recorded.has(iso)) return 'Recorded period day';
    if (iso === settingsStart) return 'Start date for estimates from Settings (not recorded)';
    if (predicted.has(iso)) return 'Estimated period day';
    return '';
  }

  return (
    <div className="calendar-page">
      <h1>Calendar</h1>
      <Card>
        <div className="cal_head">
          <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label="Previous month">
            <ChevronLeft aria-hidden="true" />
          </button>
          <h2 className="cal_title" aria-live="polite">
            {monthLabel}
          </h2>
          <button type="button" className="icon-btn" onClick={() => go(1)} aria-label="Next month">
            <ChevronRight aria-hidden="true" />
          </button>
          <div className="actions cal_tools">
            <button type="button" className="btn btn--ghost" onClick={goToday}>
              <CalendarCheck size={18} aria-hidden="true" /> Today
            </button>
          </div>
        </div>

        <div
          role="grid"
          aria-label={monthLabel}
          className={`cal_grid cal_grid--${direction}`}
          key={`${view.year}-${view.month}`}
          ref={gridRef}
          onKeyDown={onKeyDown}
        >
          <div role="row" className="cal_row">
            {WEEKDAYS.map((d) => (
              <div key={d} role="columnheader" className="cal_dow">
                {d}
              </div>
            ))}
          </div>
          {Array.from({ length: 6 }, (_, r) => (
            <div role="row" className="cal_row" key={r}>
              {cells.slice(r * 7, r * 7 + 7).map((c) => {
                const isRecorded = recorded.has(c.iso);
                const isConfigured = !isRecorded && c.iso === settingsStart;
                const isPredicted = !isRecorded && !isConfigured && predicted.has(c.iso);
                const isToday = c.iso === today;
                const isSelected = c.iso === selected;
                const status = dayStatus(c.iso);

                const label = `${longDate(c.iso)}${isToday ? ', today' : ''}${status ? `, ${status}` : ''}${checkins[c.iso] ? ', has check-in' : ''}`;
                const cls = [
                  'cal_day',
                  !c.inMonth && 'cal_day--out',
                  isRecorded && 'cal_day--recorded',
                  isConfigured && 'cal_day--configured',
                  isPredicted && 'cal_day--predicted',
                  isToday && 'cal_day--today',
                  isSelected && 'cal_day--selected',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <div role="gridcell" key={c.iso} aria-selected={isSelected}>
                    <button
                      type="button"
                      className={cls}
                      data-date={c.iso}
                      aria-label={label}
                      aria-pressed={isSelected}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => setSelected(c.iso)}
                    >
                      <span>{c.day}</span>
                      {isSelected && <SparkleBurst key={selected} />}
                      {isRecorded && <span className="cal__mark" aria-hidden="true">●</span>}
                      {isPredicted && <span className="cal__mark" aria-hidden="true">◌</span>}
                      {checkins[c.iso] && <span className="cal_dot" aria-hidden="true" />}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <ul className="legend" aria-label="Legend">
          <li>
            <span className="legend_swatch legend_swatch--recorded" aria-hidden="true">●</span> Recorded period
          </li>
          {settingsStart && (
            <li>
              <span className="legend_swatch legend_swatch--configured" aria-hidden="true" />
              Start date from Settings (not recorded)
            </li>
          )}
          <li>
            <span className="legend_swatch legend_swatch--predicted" aria-hidden="true">◌</span> Estimated (not certain)
          </li>
          <li>
            <span className="legend_swatch legend_swatch--today" aria-hidden="true" /> Today
          </li>
        </ul>
      </Card>

      <Card title={longDate(selected)}>
        <p>{dayStatus(selected) || 'No period marked on this day.'}</p>
        {checkins[selected] && <p className="muted">You have a check-in saved for this day.</p>}
        <div className="actions">
          {!selectedPeriod && (
            <button type="button" className="btn" onClick={() => setDialog({ period: null })}>
              <Plus size={18} aria-hidden="true" />
              {selected === settingsStart ? 'Record this start as a period' : 'Record period start here'}
            </button>
          )}
          {selectedPeriod && (
            <button type="button" className="btn btn--ghost" onClick={() => setDialog({ period: selectedPeriod })}>
              <Pencil size={18} aria-hidden="true" /> Edit recorded period
            </button>
          )}
        </div>
        <p className="muted">
          A date entered in Settings is only used for estimates, not saved as a recorded period. When logging a period, you can save just its start date now and edit it later to add the end date.
        </p>
      </Card>

      {dialog && (
        <PeriodDialog
          date={selected}
          period={dialog.period}
          onSave={(rec) => {
            const res = dialog.period ? editPeriod(dialog.period.id, rec) : addPeriod(rec);
            if (res && !res.ok) return res;
            toast(dialog.period ? 'Period updated' : 'Period saved');
          }}
          onDelete={(p) => {
            setDialog(null);
            setConfirm(p);
          }}
          onClose={() => setDialog(null)}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title="Delete this period?"
          message="This removes the recorded period. Your other data is not affected."
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            removePeriod(confirm.id);
            setConfirm(null);
            toast('Period deleted');
          }}
        />
      )}
    </div>
  );
}