// LightBand.jsx
// =============
// A single horizontal band of light representing one context layer on a lane or
// in the repair workbench. Present bands glow solid in the layer accent; broken
// bands render as a dashed, dim, flickering gap that reconnects when repaired.

import { motion } from 'framer-motion';
import { useMotionIntensity } from '../../hooks/useReducedMotion.js';
import styles from './LightBand.module.css';

export function LightBand({ accent = 'var(--relay-amber)', broken = false, label, delay = 0 }) {
  const intensity = useMotionIntensity();
  const animate = intensity > 0;

  return (
    <div className={styles.band} data-broken={broken ? 'true' : 'false'}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <span className={styles.track}>
        <motion.span
          className={styles.fill}
          style={{
            background: broken ? 'transparent' : accent,
            borderColor: accent,
          }}
          data-broken={broken ? 'true' : 'false'}
          initial={{ opacity: broken ? 0.3 : 0.9, scaleX: broken ? 0.4 : 1 }}
          animate={
            animate && broken
              ? { opacity: [0.3, 0.08, 0.3], scaleX: [0.4, 0.34, 0.4] }
              : { opacity: broken ? 0.3 : 0.9, scaleX: broken ? 0.4 : 1 }
          }
          transition={
            animate && broken
              ? { duration: 1.3 / intensity, repeat: Infinity, ease: 'easeInOut', delay }
              : { duration: animate ? 0.5 : 0, ease: [0.16, 1, 0.3, 1] }
          }
        />
      </span>
    </div>
  );
}
