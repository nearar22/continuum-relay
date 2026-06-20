// MotionTrail.jsx
// ===============
// A small comet of light used to mark a relay event as a moving pulse rather
// than a log line. Renders a short streak that travels and fades. Reduced
// motion shows a static dot.

import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import styles from './MotionTrail.module.css';

export function MotionTrail({ color = 'var(--relay-amber)', label }) {
  const reduced = useReducedMotion();
  return (
    <span className={styles.trail} title={label}>
      <motion.span
        className={styles.dot}
        style={{ background: color, boxShadow: `0 0 10px ${color}` }}
        initial={reduced ? { opacity: 1 } : { opacity: 0, x: -10 }}
        animate={reduced ? { opacity: 1 } : { opacity: [0, 1, 0.6], x: [-10, 0, 6] }}
        transition={{ duration: reduced ? 0 : 1.4, ease: [0.16, 1, 0.3, 1] }}
      />
      {label ? <span className={styles.label}>{label}</span> : null}
    </span>
  );
}
