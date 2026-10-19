// Alert logic (pure). Decides which gentle message, if any, to show today.
// Everything is an estimate; nothing here is saved.

import { diffInDays } from '../../utils/dateUtils.js';
import { daysUntil } from './cycleLogic.js';

/** If today falls inside a recorded period, returns { day, length }. Otherwise null. */
export function currentPeriodDay({ today, periods, periodDuration }) {
  let found = null;
  for (const p of periods) {
    const day = diffInDays(p.start, today) + 1;
    if (day < 1) continue;
    const length = p.end ? diffInDays(p.start, p.end) + 1 : periodDuration;
    if (day <= length) found = { day, length };
  }
  return found;
}

function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
}

/**
 * Returns { kind, text } or null.
 * kinds: 'during' | 'ending' | 'today' | 'soon'
 */
export function getAlert({ today, prediction, periods, settings, templates }) {
  if (!settings.remindersEnabled) return null;

  const current = currentPeriodDay({
    today,
    periods,
    periodDuration: settings.periodDuration,
  });
  if (current) {
    const kind = current.day === current.length && current.length > 1 ? 'ending' : 'during';
    return { kind, text: fill(templates[kind], { day: current.day }) };
  }

  if (!prediction) return null;

  const days = daysUntil(today, prediction);
  if (days === 0) {
    return { kind: 'today', text: fill(templates.today, {}) };
  }
  if (days > 0 && days <= settings.reminderDaysBefore) {
    const when = days === 1 ? 'tomorrow' : `in about ${days} days`;
    return { kind: 'soon', text: fill(templates.soon, { when }) };
  }

  return null;
}