import { useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import useCycleData from '../hooks/useCycleData.jsx';
import useToast from '../components/Toast.jsx';
import Card from '../components/Card.jsx';
import { ConfirmDialog } from '../components/Dialogs.jsx';
import { parseISODate } from '../utils/dateUtils.js';

const MOODS = [
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'calm', label: 'Calm', emoji: '😌' },
  { id: 'okay', label: 'Okay', emoji: '🙂' },
  { id: 'tired', label: 'Tired', emoji: '😴' },
  { id: 'low', label: 'Low', emoji: '😔' },
  { id: 'irritable', label: 'Irritable', emoji: '😤' },
  { id: 'anxious', label: 'Anxious', emoji: '😟' },
];

const CRAMPS = ['None', 'Mild', 'Moderate', 'Strong'];

const ENERGY = ['Very low', 'Low', 'Okay', 'High'];

const FLOW = ['None', 'Light', 'Medium', 'Heavy'];

const SYMPTOMS = ['Headache', 'Bloating', 'Back ache', 'Tender breasts', 'Nausea', 'Cravings', 'Acne', 'Trouble sleeping'];

function Choice({ legend, options, value, onChange }) {
  return (
    <fieldset className="choice">
      <legend>{legend}</legend>
      <div className="chips">
        {options.map((label, i) => (
          <label key={label} className={`chip ${value === i ? 'chip--on' : ''}`}>
            <input
              type="radio"
              name={legend}
              className="visually-hidden"
              checked={value === i}
              onChange={() => onChange(value === i ? undefined : i)}
              onClick={() => value === i && onChange(undefined)}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CheckinForm({ existing, onSave, onDelete }) {
  const [mood, setMood] = useState(existing?.mood);
  const [cramps, setCramps] = useState(existing?.cramps);
  const [energy, setEnergy] = useState(existing?.energy);
  const [flow, setFlow] = useState(existing?.flow);
  const [symptoms, setSymptoms] = useState(existing?.symptoms || []);
  const [note, setNote] = useState(existing?.note || '');

  function toggleSymptom(s) {
    setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  }

  function submit(e) {
    e.preventDefault();
    const entry = {};
    if (mood) entry.mood = mood;
    if (cramps !== undefined) entry.cramps = cramps;
    if (energy !== undefined) entry.energy = energy;
    if (flow !== undefined) entry.flow = flow;
    if (symptoms.length) entry.symptoms = symptoms;
    if (note.trim()) entry.note = note.trim().slice(0, 1000);

    onSave(entry);
  }

  return (
    <form onSubmit={submit}>
      <fieldset className="choice">
        <legend>Mood</legend>
        <div className="chips">
          {MOODS.map((m) => (
            <label key={m.id} className={`chip ${mood === m.id ? 'chip--on' : ''}`}>
              <input
                type="radio"
                name="mood"
                className="visually-hidden"
                checked={mood === m.id}
                onChange={() => setMood(m.id)}
                onClick={() => mood === m.id && setMood(undefined)}
              />
              <span aria-hidden="true">{m.emoji}</span> {m.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Choice legend="Cramps or discomfort" options={CRAMPS} value={cramps} onChange={setCramps} />
      <Choice legend="Energy" options={ENERGY} value={energy} onChange={setEnergy} />
      <Choice legend="Flow" options={FLOW} value={flow} onChange={setFlow} />

      <fieldset className="choice">
        <legend>Anything else? (optional)</legend>
        <div className="chips">
          {SYMPTOMS.map((s) => (
            <label key={s} className={`chip ${symptoms.includes(s) ? 'chip--on' : ''}`}>
              <input
                type="checkbox"
                className="visually-hidden"
                checked={symptoms.includes(s)}
                onChange={() => toggleSymptom(s)}
              />
              {s}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="note">Personal note</label>
        <textarea id="note" value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
      </div>

      <p className="muted">Everything here is optional, and it stays on this device. Nothing is interpreted or diagnosed.</p>

      <div className="actions">
        <button type="submit" className="btn">
          <Save size={18} aria-hidden="true" /> Save check-in
        </button>
        {existing && (
          <button type="button" className="btn btn--danger" onClick={onDelete}>
            <Trash2 size={18} aria-hidden="true" /> Delete
          </button>
        )}
      </div>
    </form>
  );
}

export default function CheckInPage() {
  const { today, checkins, saveCheckin, removeCheckin } = useCycleData();
  const toast = useToast();
  const [date, setDate] = useState(today);
  const [confirm, setConfirm] = useState(false);

  const existing = checkins[date];
  const heading = parseISODate(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <h1>Daily check-in</h1>
      <Card>
        <div className="field">
          <label htmlFor="ci-date">Day</label>
          <input id="ci-date" type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
      </Card>

      <Card title={heading}>
        {/* key resets the form when the date changes */}
        <CheckinForm
          key={date + JSON.stringify(existing || {})}
          existing={existing}
          onSave={(entry) => {
            if (Object.keys(entry).length === 0) {
              if (existing) removeCheckin(date);
              toast('Nothing to save for this day');
              return;
            }
            saveCheckin(date, entry);
            toast('Check-in saved');
          }}
          onDelete={() => setConfirm(true)}
        />
      </Card>

      {confirm && (
        <ConfirmDialog
          title="Delete this check-in?"
          message="This removes your check-in for this day."
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            removeCheckin(date);
            setConfirm(false);
            toast('Check-in deleted');
          }}
        />
      )}
    </>
  );
}