// GenLayerProofBadge.jsx
// ======================
// Renders the continuity proof hash as a sealed badge. When `sealing` is set it
// animates the seal appearing (a ring snaps closed and the hash resolves).
// Used in the runway after acceptance, the ledger, and baton detail.

import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import styles from './GenLayerProofBadge.module.css';

export function GenLayerProofBadge({ proofHash, sealing = false, compact = false }) {
  const reduced = useReducedMotion();
  if (!proofHash) return null;

  return (
    <motion.div
      className={styles.badge}
      data-compact={compact ? 'true' : 'false'}
      initial={reduced || !sealing ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduced ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className={styles.seal} aria-hidden="true">
        <ShieldCheck size={compact ? 15 : 18} />
      </span>
      <div className={styles.meta}>
        <span className={styles.label}>Continuity proof</span>
        <code className={styles.hash}>{proofHash}</code>
      </div>
    </motion.div>
  );
}
