import { useCallback, useEffect, useState } from 'react';
import appConfig from '../config/appConfig.js';
import { KEYS } from '../services/storage.js';

const VALID = ['system', 'light', 'dark'];

export function readStoredTheme() {
  try {
    const value = localStorage.getItem(KEYS.theme);
    return VALID.includes(value) ? value : appConfig.defaultTheme;
  } catch {
    return appConfig.defaultTheme;
  }
}

/** Apply the theme to <html>. 'system' removes the override so CSS follows the OS. */
export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') {
    root.setAttribute('data-theme', theme);
  } else {
    root.removeAttribute('data-theme');
  }
}

export default function useTheme() {
  const [theme, setThemeState] = useState(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (!VALID.includes(next)) return;
    setThemeState(next);
    try {
      localStorage.setItem(KEYS.theme, next);
    } catch {
      // Storage may be unavailable; the theme still applies for this session.
    }
  }, []);

  return { theme, setTheme };
}