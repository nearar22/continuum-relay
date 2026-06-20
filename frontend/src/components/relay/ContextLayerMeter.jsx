// ContextLayerMeter.jsx
// =====================
// A labelled horizontal meter for a single continuity sub-reading (intent
// preservation, context completeness, risk clarity, etc.). The fill animates
// from zero and colors by band. Used as the gate's sub-readings.

import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { clampScore, scoreTone } from '../../utils/formatters.js';
import styles from './ContextLayerMeter.module.css';

const TONE_COLOR = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  error: 'var(--error)',
};

export function ContextLayerMeter({ label, value, hint }) {
  const reduced = useReducedMotion();
  const v = clampScore(value);
  const color = TONE_COLOR[scoreTone(v)];

  return (
    <div className={styles.meter}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value} style={{ color }}>
          {v}
        </span>
      </div>
      <div className={styles.track}>
        <motion.span
          className={styles.fill}
          style={{ background: color }}
          initial={{ width: reduced ? `${v}%` : 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: reduced ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}
