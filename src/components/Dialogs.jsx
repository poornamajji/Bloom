import { useEffect, useRef, useState } from 'react';
import { Trash2, Save, X } from 'lucide-react';
import useToast from './Toast.jsx';
import { todayISO } from '../utils/dateUtils.js';

// Accessible modal dialog built on the native <dialog> element.
export function Dialog({ title, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
    // No cleanup that calls close(): in dev, React runs effects twice, and close()
    // would fire onClose and instantly dismiss the dialog. Unmounting removes it anyway.
  }, []);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="dialog_body">
        <div className="dialog_head">
          <h2 id="dialog-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <Dialog title={title} onClose={onCancel}>
      <p>{message}</p>
      <div className="actions">
        <button type="button" className="btn btn-danger" onClick={onConfirm}>
          <Trash2 size={18} aria-hidden="true" /> {confirmLabel}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </Dialog>
  );
}

/** Add/edit a period record. 'period' is null for a new record. */
export function PeriodDialog({ date, period, onSave, onDelete, onClose }) {
  const toast = useToast();
  const [start, setStart] = useState(period?.start || date);
  const [end, setEnd] = useState(period?.end || '');
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    const today = todayISO();
    if (start > today) {
      setError('That date is in the future. Record a period once it has actually started.');
      return;
    }
    if (end && end > today) {
      setError('The last day cannot be in the future. Leave it blank if the period is ongoing.');
      return;
    }
    const result = onSave({ start, end: end || undefined });

    if (result && !result.ok) {
      setError(result.error);
      return;
    }

    toast(period ? 'Period updated' : 'Period saved');
    onClose();
  }

  return (
    <Dialog title={period ? 'Edit recorded period' : 'Record a period'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="p-start">First day of period</label>
          <input
            id="p-start"
            type="date"
            value={start}
            max={todayISO()}
            onChange={(e) => setStart(e.target.value)}
            required
            aria-describedby={error ? 'p-error' : undefined}
          />
        </div>
        <div className="field">
          <label htmlFor="p-end">Last day (optional, leave empty if ongoing)</label>
          <input
            id="p-end"
            type="date"
            value={end}
            min={start}
            max={todayISO()}
            onChange={(e) => setEnd(e.target.value)}
          />
          <span className="muted">
            You can save the start date now and edit this period later when you know the end date.
          </span>
        </div>
        {error && (
          <p id="p-error" className="error" role="alert">
            {error}
          </p>
        )}
        <div className="actions">
          <button type="submit" className="btn">
            <Save size={18} aria-hidden="true" /> Save
          </button>
          {period && (
            <button type="button" className="btn btn--danger" onClick={() => onDelete(period)}>
              <Trash2 size={18} aria-hidden="true" /> Delete
            </button>
          )}
        </div>
      </form>
    </Dialog>
  );
}