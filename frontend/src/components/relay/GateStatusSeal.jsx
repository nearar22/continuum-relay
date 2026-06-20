// GateStatusSeal.jsx
// ==================
// The visual verdict of the continuity gate: Gate Opens (teal), Needs Repair
// (amber), or Blocked (infrared). A stamped seal with an icon, animated in on
// result. Used by the gate scene and reused compactly elsewhere.

import { motion } from 'framer-motion';
import { Unlock, Wrench, Lock } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { gateBandLabel } from '../../utils/formatters.js';
import styles from './GateStatusSeal.module.css';

const CONFIG = {
  open: { icon: Unlock, tone: 'open', note: 'Continuity preserved. The baton can pass.' },
  needs_repair: { icon: Wrench, tone: 'repair', note: 'Context is incomplete. Repair before passing.' },
  blocked: { icon: Lock, tone: 'blocked', note: 'A contradiction or unsafe handoff. Passing is blocked.' },
};

export function GateStatusSeal({ band, compact = false }) {
  const reduced = useReducedMotion();
  const cfg = CONFIG[band] || CONFIG.needs_repair;
  const Icon = cfg.icon;

  return (
    <motion.div
      className={styles.seal}
      data-tone={cfg.tone}
      data-compact={compact ? 'true' : 'false'}
      initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.9, rotate: -2 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: reduced ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className={styles.ring} aria-hidden="true">
        <Icon size={compact ? 18 : 26} />
      </span>
      <div className={styles.text}>
        <span className={styles.label}>{gateBandLabel(band)}</span>
        {!compact ? <span className={styles.note}>{cfg.note}</span> : null}
      </div>
    </motion.div>
  );
}
