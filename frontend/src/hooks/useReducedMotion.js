// useReducedMotion.js
// ===================
// Convenience hook that returns the effective reduced-motion flag from settings.
// Centralizing it keeps every animated component honest about the preference.

import { useSettings } from '../context/SettingsContext.jsx';

export function useReducedMotion() {
  const { reducedMotion } = useSettings();
  return reducedMotion;
}

// Intensity multiplier: 'calm' -> 0.5, 'full' -> 1, used to scale animation
// counts and speeds. Reduced motion forces 0 (callers collapse to static).
export function useMotionIntensity() {
  const { intensity, reducedMotion } = useSettings();
  if (reducedMotion) return 0;
  if (intensity === 'calm') return 0.5;
  return 1;
}
