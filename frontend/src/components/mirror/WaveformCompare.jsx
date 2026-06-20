// WaveformCompare.jsx
// ===================
// Two waveforms: the baton's understanding (top) and the receiver's restatement
// (bottom). The closer the alignment score, the more the two waves converge in
// phase and amplitude; a low alignment makes them diverge. A constraint
// violation tints the receiver wave infrared. Reduced motion renders static
// waves. Pure SVG, deterministic from the alignment value.

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { clampScore } from '../../utils/formatters.js';
import styles from './WaveformCompare.module.css';

function buildPath(width, height, points, amplitude, phase, jitter) {
  const mid = height / 2;
  let d = `M 0 ${mid}`;
  for (let i = 0; i <= points; i += 1) {
    const x = (i / points) * width;
    const wobble = Math.sin(i * 0.7 + phase) * amplitude + Math.sin(i * 1.9 + phase) * jitter;
    const y = mid + wobble;
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

export function WaveformCompare({ alignment = 0, constraintViolated = false }) {
  const reduced = useReducedMotion();
  const a = clampScore(alignment);
  const divergence = (100 - a) / 100; // 0 aligned, 1 fully diverged

  const width = 520;
  const height = 70;
  const points = 48;

  const batonPath = useMemo(
    () => buildPath(width, height, points, 14, 0, 3),
    [],
  );
  const receiverPath = useMemo(
    () => buildPath(width, height, points, 14, divergence * 3.2, 3 + divergence * 9),
    [divergence],
  );

  const receiverColor = constraintViolated
    ? 'var(--soft-infrared)'
    : a >= 75
      ? 'var(--signal-teal)'
      : a >= 45
        ? 'var(--warning)'
        : 'var(--soft-infrared)';

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <span className={styles.tag}>Baton understanding</span>
        <svg viewBox={`0 0 ${width} ${height}`} className={styles.wave} preserveAspectRatio="none" aria-hidden="true">
          <motion.path
            d={batonPath}
            fill="none"
            stroke="var(--relay-amber)"
            strokeWidth="2"
            initial={false}
            animate={reduced ? { pathLength: 1 } : { pathLength: [0.9, 1, 0.9] }}
            transition={reduced ? { duration: 0 } : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </div>

      <div className={styles.alignmentMark} data-violated={constraintViolated ? 'true' : 'false'}>
        <span className={styles.alignmentValue} style={{ color: receiverColor }}>
          {a}
        </span>
        <span className={styles.alignmentLabel}>alignment</span>
      </div>

      <div className={styles.row}>
        <span className={styles.tag}>Receiver restatement</span>
        <svg viewBox={`0 0 ${width} ${height}`} className={styles.wave} preserveAspectRatio="none" aria-hidden="true">
          <motion.path
            d={receiverPath}
            fill="none"
            stroke={receiverColor}
            strokeWidth="2"
            initial={false}
            animate={reduced ? { pathLength: 1 } : { pathLength: [0.9, 1, 0.9] }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 4 - divergence * 1.5, repeat: Infinity, ease: 'easeInOut' }
            }
          />
        </svg>
      </div>
    </div>
  );
}
