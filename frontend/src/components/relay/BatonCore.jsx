// BatonCore.jsx
// =============
// The glowing baton of light at the heart of the interface. A vertical capsule
// of light wrapped by orbiting context layers: one ring per filled layer, with
// gaps where required layers are missing. Missing layers flicker; present
// layers hold a steady glow. Reduced motion renders everything static.

import { motion } from 'framer-motion';
import { LAYER_META } from '../../data/layerMeta.js';
import { useMotionIntensity } from '../../hooks/useReducedMotion.js';
import styles from './BatonCore.module.css';

// layers: object of layerKey -> string. size scales the whole assembly.
export function BatonCore({ layers = {}, size = 220, brightness = 1, showLabels = false }) {
  const intensity = useMotionIntensity();
  const animate = intensity > 0;
  const center = size / 2;

  return (
    <div className={styles.wrap} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <radialGradient id="batonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--relay-amber)" stopOpacity={0.9 * brightness} />
            <stop offset="55%" stopColor="var(--relay-amber)" stopOpacity={0.12 * brightness} />
            <stop offset="100%" stopColor="var(--relay-amber)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="batonCore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--relay-white)" />
            <stop offset="50%" stopColor="var(--relay-amber)" />
            <stop offset="100%" stopColor="var(--soft-infrared)" />
          </linearGradient>
        </defs>

        {/* Ambient glow, gently breathing so the core always feels alive */}
        <motion.circle
          cx={center}
          cy={center}
          r={size * 0.42}
          fill="url(#batonGlow)"
          initial={{ opacity: 0.9, scale: 1 }}
          animate={animate ? { opacity: [0.7, 1, 0.7], scale: [0.96, 1.04, 0.96] } : { opacity: 0.9 }}
          transition={animate ? { duration: 4 / intensity, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
          style={{ transformOrigin: `${center}px ${center}px` }}
        />

        {/* Orbiting context layer rings */}
        {LAYER_META.map((meta, i) => {
          const filled = String(layers[meta.key] || '').trim().length > 0;
          const radius = size * 0.16 + i * (size * 0.028);
          // Present layers are near-complete arcs; missing ones are broken gaps.
          const dash = filled
            ? `${radius * 5.6} ${radius * 0.7}`
            : `${radius * 0.5} ${radius * 0.9}`;
          const ringColor = filled ? meta.accent : 'var(--dim-steel)';
          const baseOpacity = filled ? 0.85 : 0.32;
          // Every ring orbits; filled rings spin one way, missing rings drift
          // slowly the other way and also flicker, so the whole assembly is
          // always in motion even before any layer is filled.
          const direction = i % 2 === 0 ? 1 : -1;
          const spinDuration = (filled ? 16 + i * 2 : 30 + i * 3) / Math.max(intensity, 0.001);

          return (
            <motion.circle
              key={meta.key}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth={filled ? 2 : 1.4}
              strokeDasharray={dash}
              strokeLinecap="round"
              style={{ transformOrigin: `${center}px ${center}px` }}
              initial={{ opacity: baseOpacity, rotate: i * 24 }}
              animate={
                animate
                  ? filled
                    ? { opacity: baseOpacity, rotate: 360 * direction + i * 24 }
                    : { opacity: [0.32, 0.14, 0.32], rotate: 360 * direction + i * 24 }
                  : { opacity: baseOpacity }
              }
              transition={
                animate
                  ? {
                      rotate: { duration: spinDuration, ease: 'linear', repeat: Infinity },
                      opacity: filled
                        ? { duration: 0 }
                        : { duration: 1.6 / intensity, ease: 'easeInOut', repeat: Infinity },
                    }
                  : { duration: 0 }
              }
            />
          );
        })}

        {/* A bright particle orbiting the core, always moving */}
        {animate ? (
          <motion.g
            style={{ transformOrigin: `${center}px ${center}px` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6 / intensity, ease: 'linear', repeat: Infinity }}
          >
            <circle
              cx={center}
              cy={center - size * 0.3}
              r={size * 0.018}
              fill="var(--signal-teal)"
              style={{ filter: 'drop-shadow(0 0 6px var(--signal-teal))' }}
            />
          </motion.g>
        ) : null}

        {/* The baton core capsule */}
        <motion.rect
          x={center - size * 0.035}
          y={center - size * 0.16}
          width={size * 0.07}
          height={size * 0.32}
          rx={size * 0.035}
          fill="url(#batonCore)"
          initial={{ opacity: 0.9 }}
          animate={animate ? { opacity: [0.78, 1, 0.78] } : { opacity: 1 }}
          transition={animate ? { duration: 2.4 / intensity, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
          style={{ filter: 'drop-shadow(0 0 10px var(--relay-amber))' }}
        />
      </svg>
      {showLabels ? (
        <span className={styles.caption}>
          {LAYER_META.filter((m) => String(layers[m.key] || '').trim()).length} / {LAYER_META.length}{' '}
          layers carried
        </span>
      ) : null}
    </div>
  );
}
