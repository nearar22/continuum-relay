// ContinuityScoreRing.jsx
// =======================
// An SVG ring that fills to a continuity score, animated with framer-motion.
// The ring color follows the score band (success/warning/error). Reduced motion
// renders the final ring statically. Used in the gate, room cards, and detail.

import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { clampScore, scoreTone } from '../../utils/formatters.js';
import styles from './ContinuityScoreRing.module.css';

const TONE_COLOR = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  error: 'var(--error)',
};

export function ContinuityScoreRing({ score, size = 132, stroke = 9, label = 'Continuity' }) {
  const reduced = useReducedMotion();
  const value = clampScore(score);
  const tone = scoreTone(value);
  const color = TONE_COLOR[tone];
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className={styles.wrap} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${label} score ${value} of 100`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-hairline)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reduced ? offset : circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reduced ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className={styles.center}>
        <span className={styles.value} style={{ color }}>
          {value}
        </span>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}
