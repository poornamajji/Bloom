import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/tokens.css';
import './styles/base.css';

import App from './App.jsx';
import { applyTheme, readStoredTheme } from './hooks/useTheme.js';

// Apply the saved theme before first paint to avoid a flash of the wrong theme.
applyTheme(readStoredTheme());

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);