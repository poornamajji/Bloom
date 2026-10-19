import { HashRouter, Routes, Route } from 'react-router-dom';

import './styles/components.css';

import { CycleDataProvider } from './hooks/useCycleData.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Navigation from './components/Navigation.jsx';
import OfflineBanner from './components/OfflineBanner.jsx';
import PetalTransition from './components/PetalTransition.jsx';

import HomePage from './pages/HomePage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import CheckinPage from './pages/CheckInPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

function skipToMain(e) {
  e.preventDefault();
  document.getElementById('main')?.focus();
}

export default function App() {
  return (
    <CycleDataProvider>
      <ToastProvider>
        <HashRouter>
          <div className="app-shell">
            <a className="skip-link" href="#main" onClick={skipToMain}>
              Skip to main content
            </a>

            <Navigation />
            <PetalTransition />

            <main className="app-main" id="main" tabIndex={-1}>
              <OfflineBanner />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/check-in" element={<CheckinPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<HomePage />} />
              </Routes>
            </main>
          </div>
        </HashRouter>
      </ToastProvider>
    </CycleDataProvider>
  );
}