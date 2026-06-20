// ContinuityGateVisual.jsx
// ========================
// The gate, staged as a real corridor: a SENDER station on the left and a
// RECEIVER station on the right, each a labelled node that pulses with life,
// and a pair of light doors between them. The baton (a glowing capsule) waits
// at the gate. On "open" the doors part, the connecting beam ignites, and the
// baton travels across to the receiver. On "needs_repair" the doors stay shut
// with broken dashed bands. On "blocked" the seam locks red and sparks. Reduced
// motion renders the final state statically.

import { motion } from 'framer-motion';
import { useMotionIntensity } from '../../hooks/useReducedMotion.js';
import styles from './ContinuityGateVisual.module.css';

const EASE = [0.16, 1, 0.3, 1];

// band: 'open' | 'needs_repair' | 'blocked' | null (not yet evaluated)
export function ContinuityGateVisual({ band, evaluating = false }) {
  const intensity = useMotionIntensity();
  const animate = intensity > 0;
  const open = band === 'open';
  const blocked = band === 'blocked';
  const repair = band === 'needs_repair';

  const doorShift = open ? 52 : repair ? 16 : 8;

  return (
    <div
      className={styles.gate}
      data-band={band || 'idle'}
      role="img"
      aria-label={`Continuity gate ${band || 'idle'}`}
    >
      <div className={styles.field} aria-hidden="true">
        {/* Rail the baton travels along */}
        <span className={styles.rail} />

        {/* Sender station (left) */}
        <div className={styles.station} data-side="left">
          <motion.span
            className={styles.node}
            data-side="left"
            animate={animate ? { scale: [1, 1.18, 1], opacity: [0.85, 1, 0.85] } : { scale: 1 }}
            transition={animate ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
          />
          <span className={styles.stationLabel}>Sender</span>
        </div>

        {/* Receiver station (right) */}
        <div className={styles.station} data-side="right">
          <motion.span
            className={styles.node}
            data-side="right"
            animate={
              animate
                ? open
                  ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }
                  : { scale: [1, 1.12, 1], opacity: [0.6, 0.85, 0.6] }
                : { scale: 1 }
            }
            transition={
              animate ? { duration: open ? 1.6 : 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 } : { duration: 0 }
            }
          />
          <span className={styles.stationLabel}>Receiver</span>
        </div>

        {/* The beam that ignites when the gate opens */}
        <motion.span
          className={styles.beam}
          initial={false}
          animate={
            animate
              ? open
                ? { opacity: [0.2, 0.95, 0.6], scaleX: [0.3, 1, 1] }
                : { opacity: 0.06, scaleX: 0.25 }
              : { opacity: open ? 0.7 : 0.08, scaleX: open ? 1 : 0.25 }
          }
          transition={{ duration: animate ? 1.2 : 0, ease: EASE, repeat: animate && open ? Infinity : 0, repeatType: 'reverse', repeatDelay: 0.4 }}
        />

        {/* Left door */}
        <motion.span
          className={styles.door}
          data-side="left"
          initial={false}
          animate={{ x: `-${doorShift}%` }}
          transition={{ duration: animate ? 0.95 : 0, ease: EASE }}
        />
        {/* Right door */}
        <motion.span
          className={styles.door}
          data-side="right"
          initial={false}
          animate={{ x: `${doorShift}%` }}
          transition={{ duration: animate ? 0.95 : 0, ease: EASE }}
        />

        {/* The baton: orbit ring plus a glowing core */}
        <motion.span
          className={styles.batonWrap}
          initial={false}
          animate={
            animate
              ? open
                ? { x: ['-30%', '-30%', '160%'], opacity: [1, 1, 0.25] }
                : evaluating
                  ? { y: ['-6%', '6%', '-6%'] }
                  : { x: '-30%' }
              : { x: open ? '120%' : '-30%' }
          }
          transition={
            animate
              ? open
                ? { duration: 1.8, ease: EASE, repeat: Infinity, repeatDelay: 0.8 }
                : evaluating
                  ? { duration: 1.3, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.4 }
              : { duration: 0 }
          }
        >
          <motion.span
            className={styles.batonRing}
            animate={animate ? { rotate: 360 } : { rotate: 0 }}
            transition={animate ? { duration: 3.2, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
          />
          <span className={styles.batonCore} />
        </motion.span>

        {/* Broken bands when repair is needed */}
        {repair
          ? [0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className={styles.brokenBand}
                style={{ top: `${32 + i * 14}%` }}
                animate={animate ? { opacity: [0.55, 0.12, 0.55] } : { opacity: 0.4 }}
                transition={animate ? { duration: 1.1, repeat: Infinity, delay: i * 0.2 } : { duration: 0 }}
              />
            ))
          : null}

        {/* Sparks when blocked */}
        {blocked && animate
          ? [0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                className={styles.spark}
                style={{ top: `${22 + i * 13}%` }}
                animate={{ opacity: [0, 1, 0], scale: [0.6, 1.4, 0.6] }}
                transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.16, ease: 'easeOut' }}
              />
            ))
          : null}
      </div>
    </div>
  );
}
