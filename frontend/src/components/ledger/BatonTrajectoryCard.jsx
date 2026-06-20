// BatonTrajectoryCard.jsx
// =======================
// A passed baton in the ledger, rendered as a compressed trajectory: a small arc
// from sender to receiver with the continuity score, gate result, receiver
// match, repair count, proof hash, and date. Not a table row: a card you can
// open, duplicate, or export. Animates in on view.

import { motion } from 'framer-motion';
import { ArrowUpRight, Copy, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  statusLabel,
  statusTone,
  gateBandLabel,
  mirrorBandLabel,
  formatDateShort,
  clampScore,
  scoreTone,
} from '../../utils/formatters.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import styles from './BatonTrajectoryCard.module.css';

const TONE_COLOR = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  error: 'var(--error)',
  teal: 'var(--signal-teal)',
  voltage: 'var(--voltage-blue)',
  muted: 'var(--muted-steel)',
};

export function BatonTrajectoryCard({ baton, onDuplicate, onExport }) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const score = clampScore(baton.continuityScore);
  const scoreColor = TONE_COLOR[scoreTone(score)];
  const statusColor = TONE_COLOR[statusTone(baton.status)] || 'var(--muted-steel)';

  return (
    <motion.article
      className={styles.card}
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduced ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.head}>
        <button type="button" className={styles.title} onClick={() => navigate(`/baton/${baton.id}`)}>
          {baton.title}
          <ArrowUpRight size={15} aria-hidden="true" />
        </button>
        <span className={styles.status} style={{ color: statusColor, borderColor: statusColor }}>
          {statusLabel(baton.status)}
        </span>
      </div>

      {/* Trajectory arc */}
      <div className={styles.trajectory} aria-hidden="true">
        <span className={styles.endpoint}>
          <span className={styles.node} data-role="sender" />
          <span className={styles.who}>{baton.sender}</span>
        </span>
        <svg className={styles.arc} viewBox="0 0 200 40" preserveAspectRatio="none">
          <path
            d="M 6 34 Q 100 -8 194 34"
            fill="none"
            stroke={scoreColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={baton.repairCount > 0 ? '6 5' : '0'}
          />
        </svg>
        <span className={styles.endpoint}>
          <span className={styles.node} data-role="receiver" />
          <span className={styles.who}>{baton.receiver || baton.receiverRole || 'unassigned'}</span>
        </span>
      </div>

      <dl className={styles.meta}>
        <div>
          <dt>Continuity</dt>
          <dd style={{ color: scoreColor }}>{baton.gateBand ? score : '--'}</dd>
        </div>
        <div>
          <dt>Gate</dt>
          <dd>{baton.gateBand ? gateBandLabel(baton.gateBand) : 'not run'}</dd>
        </div>
        <div>
          <dt>Receiver</dt>
          <dd>{baton.mirrorBand ? mirrorBandLabel(baton.mirrorBand) : 'no mirror'}</dd>
        </div>
        <div>
          <dt>Repairs</dt>
          <dd>{baton.repairCount || 0}</dd>
        </div>
      </dl>

      <div className={styles.footer}>
        <div className={styles.footerMeta}>
          {baton.proofHash ? <code className={styles.hash}>{baton.proofHash}</code> : <span className={styles.noHash}>no proof yet</span>}
          <span className={styles.date}>{formatDateShort(baton.updatedAt || baton.createdAt)}</span>
        </div>
        <div className={styles.cardActions}>
          <button type="button" className={styles.action} onClick={() => onDuplicate(baton)} aria-label="Duplicate baton">
            <Copy size={14} aria-hidden="true" />
          </button>
          <button type="button" className={styles.action} onClick={() => onExport(baton)} aria-label="Export baton as JSON">
            <Download size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
