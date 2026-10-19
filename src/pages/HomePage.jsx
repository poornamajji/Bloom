import { Link } from 'react-router-dom';
import { CalendarDays, Plus, Sparkles as SparklesIcon, Leaf } from 'lucide-react';
import appConfig from '../config/appConfig.js';
import useCycleData from '../hooks/useCycleData.jsx';
import Card from '../components/Card.jsx';
import AlertBanner from '../components/AlertBanner.jsx';
import { Flower, Sparkle, Heart } from '../components/Decor.jsx';
import { pickForDate } from '../utils/messages.js';
import { diffInDays } from '../utils/dateUtils.js';
import { daysUntil } from '../features/cycle/cycleLogic.js';

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function Countdown({ prediction, today }) {
  if (!prediction) {
    return (
      <div className="notice">
        <p>
          I need a period start date to make an estimate. <Link to="/settings">Add one in Settings</Link> or log a period.
        </p>
      </div>
    );
  }

  const days = daysUntil(today, prediction);
  let headline;

  if (days > 1) headline = `About ${days} days to go`;
  else if (days === 1) headline = 'Around tomorrow';
  else if (days === 0) headline = 'Around today';
  else headline = 'A little past the estimate';

  return (
    <>
      <p className="countdown">{headline}</p>
      <p>
        Estimated start: <strong>{formatDate(prediction.date)}</strong>
      </p>
      <p className="muted">
        Likely window: {formatDate(prediction.windowStart)} to {formatDate(prediction.windowEnd)}. This is only an estimate, since cycles naturally vary.
      </p>
      {days < 0 && (
        <p className="notice">
          Cycle timing varies, so a later start is completely normal. If it has started, you can{' '}
          <Link to="/calendar">record the actual date</Link> whenever you know it.
        </p>
      )}
    </>
  );
}

export default function HomePage() {
  const { settings, periods, prediction, today } = useCycleData();

  const encouragement = pickForDate(appConfig.encouragements, today);
  const care = pickForDate(appConfig.selfCare, today, 3);

  const lastStart = periods.length ? periods[periods.length - 1].start : settings.lastPeriodStart;
  const cycleLen = prediction ? prediction.cycleLength : settings.cycleLength;
  const rawDay = lastStart ? diffInDays(lastStart, today) + 1 : null;

  // Only show a day number while it is inside the expected cycle; beyond that it is just "late".
  const dayOfCycle = rawDay && rawDay > 0 && rawDay <= cycleLen ? rawDay : null;
  const pastEstimate = rawDay !== null && rawDay > cycleLen;

  return (
    <>
      <section className="hero" aria-labelledby="welcome-heading">
        <div className="hero_decor" aria-hidden="true">
          <Sparkle />
          <Flower className="hero__flower" size={56} />
        </div>
        <h1 id="welcome-heading">{appConfig.welcomeHeading}</h1>
        <p className="hero_message">{appConfig.welcomeMessage}</p>
      </section>

      <AlertBanner />

      <Card title="Next period (estimate)" icon={<CalendarDays size={18} aria-hidden="true" />}>
        <Countdown prediction={prediction} today={today} />
        <div className="actions">
          <Link to="/calendar" state={{ openLog: true }} className="btn">
            <Plus size={18} aria-hidden="true" /> Log a period
          </Link>
          <Link to="/calendar" className="btn btn--ghost">
            <CalendarDays size={18} aria-hidden="true" /> Open calendar
          </Link>
        </div>
      </Card>

      <Card title="Cycle summary">
        <div className="stat-grid">
          <div className="stat">
            <span className="stat__value">{prediction ? prediction.cycleLength : settings.cycleLength} days</span>
            <span className="muted">Cycle length used</span>
          </div>
          <div className="stat">
            <span className="stat_value">{settings.periodDuration} days</span>
            <span className="muted">Usual period</span>
          </div>
          <div className="stat">
            <span className="stat__value">{dayOfCycle ? `Day ${dayOfCycle}` : pastEstimate ? 'Later than usual' : '-'}</span>
            <span className="muted">Of this cycle</span>
          </div>
        </div>
      </Card>

      {encouragement && (
        <Card title="Today's note" icon={<Heart />}>
          <p>{encouragement}</p>
        </Card>
      )}

      {care && (
        <Card title="A gentle idea (optional)" icon={<Leaf size={18} aria-hidden="true" />}>
          <p>
            <strong>{care.title}.</strong> {care.text}
          </p>
        </Card>
      )}

      <p className="sign-off">
        <SparklesIcon size={14} aria-hidden="true" /> {appConfig.signOff}
      </p>
    </>
  );
}