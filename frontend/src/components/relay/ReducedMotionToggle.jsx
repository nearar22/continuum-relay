// ReducedMotionToggle.jsx
// =======================
// A switch that lets the user force reduced motion regardless of the system
// setting. When the system already requests reduced motion, the control says so
// and stays on. Used in settings and the app shell.

import { useSettings } from '../../context/SettingsContext.jsx';
import styles from './ReducedMotionToggle.module.css';

export function ReducedMotionToggle() {
  const { userReducedMotion, systemReduced, setReducedMotion } = useSettings();
  const checked = userReducedMotion || systemReduced;
  const locked = systemReduced;

  return (
    <label className={styles.row}>
      <span className={styles.text}>
        <span className={styles.label}>Reduce motion</span>
        <span className={styles.hint}>
          {locked
            ? 'Your system already requests reduced motion.'
            : 'Collapse animations to calm, static states.'}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="Reduce motion"
        className={styles.switch}
        data-on={checked ? 'true' : 'false'}
        disabled={locked}
        onClick={() => setReducedMotion(!userReducedMotion)}
      >
        <span className={styles.knob} aria-hidden="true" />
      </button>
    </label>
  );
}
