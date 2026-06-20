// SettingsContext.jsx
// ===================
// User preferences: theme (dark/light), animation intensity, and reduced motion.
// Persisted to localStorage and applied to the document root so tokens and
// motion respond immediately.

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const SettingsContext = createContext(null);

const PREF_KEY = 'continuum-relay:settings';

function loadSettings() {
  const defaults = { theme: 'dark', intensity: 'full', reducedMotion: false };
  if (typeof localStorage === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);

  // System reduced-motion preference, observed live.
  const [systemReduced, setSystemReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setSystemReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-intensity', settings.intensity);
    root.setAttribute('data-reduced', String(settings.reducedMotion));
  }, [settings]);

  const setTheme = useCallback((theme) => setSettings((s) => ({ ...s, theme })), []);
  const toggleTheme = useCallback(
    () => setSettings((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' })),
    [],
  );
  const setIntensity = useCallback((intensity) => setSettings((s) => ({ ...s, intensity })), []);
  const setReducedMotion = useCallback(
    (reducedMotion) => setSettings((s) => ({ ...s, reducedMotion })),
    [],
  );

  // Effective reduced motion: user toggle OR system preference.
  const reducedMotion = settings.reducedMotion || systemReduced;

  const value = useMemo(
    () => ({
      ...settings,
      reducedMotion,
      userReducedMotion: settings.reducedMotion,
      systemReduced,
      setTheme,
      toggleTheme,
      setIntensity,
      setReducedMotion,
    }),
    [settings, reducedMotion, systemReduced, setTheme, toggleTheme, setIntensity, setReducedMotion],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
