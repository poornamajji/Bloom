import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, HeartPulse, History, Settings } from 'lucide-react';
import appConfig from '../config/appConfig.js';

const ITEMS = [
  { to: '/', label: 'Home', Icon: Home, end: true },
  { to: '/calendar', label: 'Calendar', Icon: CalendarDays },
  { to: '/check-in', label: 'Check-in', Icon: HeartPulse },
  { to: '/history', label: 'History', Icon: History },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

export default function Navigation() {
  return (
    <nav className="nav" aria-label="Main">
      <div className="nav_brand">{appConfig.appName}</div>
      {ITEMS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="nav_link">
          <Icon size={22} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}