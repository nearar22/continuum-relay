// RelayRunwayTrack.jsx
// ====================
// The corridor a baton travels from sender to receiver. Lane checkpoints mark
// the lifecycle stages; the baton glides to the checkpoint that matches the
// current status, trailing its context layers. Missing layers flicker as the
// baton passes. An accepted baton lands cleanly at the receiver; a blocked one
// returns toward repair. Reduced motion renders the baton at its checkpoint.

import { motion } from 'framer-motion';
import { LAYER_META } from '../../data/layerMeta.js';
import { useMotionIntensity } from '../../hooks/useReducedMotion.js';
import styles from './RelayRunwayTrack.module.css';

const CHECKPOINTS = [
  { id: 'compose', label: 'Composed', pos: 0.04 },
  { id: 'gate', label: 'Gate', pos: 0.3 },
  { id: 'runway', label: 'In flight', pos: 0.56 },
  { id: 'mirror', label: 'Mirror', pos: 0.78 },
  { id: 'receiver', label: 'Receiver', pos: 0.96 },
];

const STATUS_TO_POS = {
  draft: 0.04,
  needs_repair: 0.18,
  blocked: 0.18,
  ready_to_accept: 0.56,
  receiver_clarification: 0.78,
  accepted: 0.96,
  completed: 0.96,
};

export function RelayRunwayTrack({ baton }) {
  const intensity = useMotionIntensity();
  const animate = intensity > 0;
  const pos = STATUS_TO_POS[baton.status] ?? 0.04;
  const accepted = ['accepted', 'completed'].includes(baton.status);
  const blocked = baton.status === 'blocked';
  const batonColor = accepted
    ? 'var(--success)'
    : blocked
      ? 'var(--soft-infrared)'
      : 'var(--relay-amber)';

  return (
    <div className={styles.runway} role="img" aria-label={`Relay runway, baton at ${baton.status}`}>
      <div className={styles.corridor} aria-hidden="true">
        <span className={styles.lane} />
        <span className={styles.laneGlow} style={{ width: `${pos * 100}%`, background: batonColor }} />

        {CHECKPOINTS.map((cp) => (
          <span
            key={cp.id}
            className={styles.checkpoint}
            style={{ left: `${cp.pos * 100}%` }}
            data-reached={pos >= cp.pos - 0.02 ? 'true' : 'false'}
          >
            <span className={styles.checkpointNode} />
            <span className={styles.checkpointLabel}>{cp.label}</span>
          </span>
        ))}

        <motion.span
          className={styles.travelBaton}
          style={{ background: batonColor, boxShadow: `0 0 20px ${batonColor}` }}
          initial={false}
          animate={
            animate
              ? { left: `${pos * 100}%`, scale: accepted ? [1, 1.3, 1] : 1 }
              : { left: `${pos * 100}%` }
          }
          transition={{ duration: animate ? 1.1 : 0, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* orbiting layer dots */}
          {animate
            ? LAYER_META.slice(0, 6).map((m, i) => {
                const filled = String(baton.layers[m.key] || '').trim().length > 0;
                return (
                  <motion.span
                    key={m.key}
                    className={styles.orbit}
                    style={{ background: filled ? m.accent : 'var(--dim-steel)' }}
                    animate={
                      filled
                        ? { rotate: 360, opacity: 0.9 }
                        : { opacity: [0.4, 0.1, 0.4] }
                    }
                    transition={
                      filled
                        ? { duration: 3 + i, repeat: Infinity, ease: 'linear' }
                        : { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }
                    }
                  />
                );
              })
            : null}
        </motion.span>
      </div>
    </div>
  );
}
