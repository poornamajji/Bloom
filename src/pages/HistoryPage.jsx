import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import useCycleData from '../hooks/useCycleData.jsx';
import Card from '../components/Card.jsx';
import { PeriodDialog, ConfirmDialog } from '../components/Dialogs.jsx';
import useToast from '../components/Toast.jsx';
import { observedCycleLengths, averageCycleLength } from '../features/cycle/cycleLogic.js';
import { diffInDays, parseISODate } from '../utils/dateUtils.js';

const fmt = (iso) =>
  parseISODate(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export default function HistoryPage() {
  const { periods, prediction, settings, editPeriod, removePeriod } = useCycleData();
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const sorted = [...periods].sort((a, b) => (a.start < b.start ? 1 : -1));
  const lengths = observedCycleLengths(periods);
  const lengthFor = (start) => lengths.find((l) => l.to === start)?.days;

  const avg = averageCycleLength(periods);
  const max = Math.max(1, ...lengths.map((l) => l.days));

  return (
    <>
      <h1>History &amp; insights</h1>

      <Card title="Summary">
        <div className="stat-grid">
          <div className="stat">
            <span className="stat__value">{periods.length}</span>
            <span className="muted">Recorded periods</span>
          </div>

          <div className="stat">
            <span className="stat__value">{avg ? `${avg.toFixed(1)} days` : '-'}</span>
            <span className="muted">Average recorded cycle</span>
          </div>

          <div className="stat">
            <span className="stat__value">{prediction ? prediction.cycleLength : settings.cycleLength} days</span>
            <span className="muted">Length used for estimates</span>
          </div>
        </div>
        <p className="muted">An average describes the past. It is not a promise about your next cycle.</p>
      </Card>

      {lengths.length > 0 && (
        <Card title="Cycle lengths">
          <ul className="bars" aria-label="Cycle lengths in days">
            {lengths.map((l) => (
              <li key={l.to} className="bars_row">
                <span className="bars_label">{fmt(l.to)}</span>
                <span className="bars__track" aria-hidden="true">
                  <span className="bars__fill" style={{ width: `${(l.days / max) * 100}%` }} />
                </span>
                <span className="bars__value">{l.days}d</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Recorded periods">
        {sorted.length === 0 ? (
          <p className="muted">
            Nothing recorded yet. Add a period from the calendar and it will show up here.🌹
          </p>
        ) : (
          <ul className="list">
            {sorted.map((p) => {
              const dur = p.end ? diffInDays(p.start, p.end) + 1 : null;
              const len = lengthFor(p.start);

              return (
                <li key={p.id} className="list_item">
                  <div>
                    <strong>{fmt(p.start)}</strong>
                    <div className="muted">
                      {p.end ? `Ended ${fmt(p.end)} (${dur} ${dur === 1 ? 'day' : 'days'})` : 'No end date recorded'}
                      {len ? ` · ${len} days since the previous start` : ''}
                    </div>
                  </div>
                  <div className="list_actions">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setEditing(p)}
                      aria-label={`Edit period starting ${fmt(p.start)}`}
                    >
                      <Pencil size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setConfirm(p)}
                      aria-label={`Delete period starting ${fmt(p.start)}`}
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="How estimates work">
        <p>
          A cycle is counted from the first day of one period to the first day of the next. In{' '}
          <strong>fixed</strong> mode, Bloom adds your chosen cycle length ({settings.cycleLength} days) to your latest recorded start.
        </p>
        <p>
          In <strong>adaptive</strong> mode, once you have at least 3 recorded cycles, it uses the average of up to your last 6 cycles instead. With less data it falls back to fixed mode.
        </p>
        <p className="muted">
          Estimates are shown as a window because bodies are not clocks. Bloom can&apos;t diagnose anything or predict fertility, so please talk to a healthcare professional about any concerns.
        </p>
      </Card>

      {editing && (
        <PeriodDialog
          date={editing.start}
          period={editing}
          onSave={(rec) => editPeriod(editing.id, rec)}
          onDelete={(p) => {
            setEditing(null);
            setConfirm(p);
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title="Delete this period?"
          message="This removes the recorded period from your history."
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            removePeriod(confirm.id);
            setConfirm(null);
            toast('Period deleted');
          }}
        />
      )}
    </>
  );
}