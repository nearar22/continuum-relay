// EventPulseLog.jsx
// =================
// A baton's event history rendered as a column of small motion pulses rather
// than a dense table. Each event is a colored pulse with a kind and a detail.
// Newest first. Animates entries in when motion is allowed.

import { motion } from 'framer-motion';
import { MotionTrail } from './MotionTrail.jsx';
import { relativeTime } from '../../utils/formatters.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import styles from './EventPulseLog.module.css';

const KIND_COLOR = {
  created: 'var(--voltage-blue)',
  gate_open: 'var(--signal-teal)',
  gate_needs_repair: 'var(--warning)',
  gate_blocked: 'var(--soft-infrared)',
  passed: 'var(--relay-amber)',
  repaired: 'var(--signal-teal)',
  accepted: 'var(--success)',
};

function colorFor(kind) {
  if (KIND_COLOR[kind]) return KIND_COLOR[kind];
  if (kind.startsWith('gate_')) return 'var(--warning)';
  if (kind.startsWith('mirror_')) return 'var(--voltage-blue)';
  return 'var(--muted-steel)';
}

export function EventPulseLog({ events = [] }) {
  const reduced = useReducedMotion();
  const ordered = [...events].reverse();

  if (ordered.length === 0) {
    return <p className={styles.empty}>No events yet. Relay activity will pulse here as it happens.</p>;
  }

  return (
    <ol className={styles.log}>
      {ordered.map((e, i) => (
        <motion.li
          key={`${e.at}-${i}`}
          className={styles.entry}
          initial={reduced ? { opacity: 1 } : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduced ? 0 : 0.32, delay: reduced ? 0 : Math.min(i * 0.04, 0.4) }}
        >
          <MotionTrail color={colorFor(e.kind)} />
          <span className={styles.kind}>{e.kind.replace(/_/g, ' ')}</span>
          {e.detail ? <span className={styles.detail}>{e.detail}</span> : null}
          <span className={styles.time}>{relativeTime(e.at)}</span>
        </motion.li>
      ))}
    </ol>
  );
}
