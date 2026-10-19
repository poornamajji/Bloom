import { Heart, Sparkle } from './Decor.jsx';
import appConfig from '../config/appConfig.js';
import useCycleData from '../hooks/useCycleData.jsx';
import { getAlert } from '../features/cycle/alerts.js';

export default function AlertBanner() {
  const { today, prediction, periods, settings } = useCycleData();

  const alert = getAlert({ today, prediction, periods, settings, templates: appConfig.alerts });

  if (!alert) return null;

  return (
    <aside className={`alert alert--${alert.kind}`} aria-label="A gentle reminder">
      <Heart size={22} />
      <p>{alert.text}</p>
      <Sparkle size={18} className="alert_sparkle" />
    </aside>
  );
}