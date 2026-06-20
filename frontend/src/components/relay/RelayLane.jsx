// RelayLane.jsx
// =============
// A contributor's lane in the relay room. The sender station sits at the left,
// the receiver station at the right, and the baton rides the lane at a position
// that reflects its status (draft near the sender, accepted at the receiver).
// A recent relay pulse animates the lane. Clicking opens the baton.

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMotionIntensity } from '../../hooks/useReducedMotion.js';
import {
  statusLabel,
  statusTone,
  shortAddr,
  clampScore,
  scoreTone,
} from '../../utils/formatters.js';
import { filledLayerCount } from '../../utils/batonBuilder.js';
import styles from './RelayLane.module.css';

// Map status to a 0..1 position along the lane.
const STATUS_POSITION = {
  draft: 0.08,
  needs_repair: 0.2,
  blocked: 0.2,
  ready_to_accept: 0.5,
  receiver_clarification: 0.74,
  accepted: 0.96,
  completed: 0.96,
};

const TONE_COLOR = {
  muted: 'var(--muted-steel)',
  warning: 'var(--warning)',
  error: 'var(--error)',
  teal: 'var(--signal-teal)',
  voltage: 'var(--voltage-blue)',
  success: 'var(--success)',
};

export function RelayLane({ baton, pulsing = false }) {
  const navigate = useNavigate();
  const intensity = useMotionIntensity();
  const animate = intensity > 0;
  const pos = STATUS_POSITION[baton.status] ?? 0.08;
  const tone = statusTone(baton.status);
  const batonColor = TONE_COLOR[tone] || 'var(--relay-amber)';
  const score = clampScore(baton.continuityScore);
  const layers = filledLayerCount(baton.layers);

  const open = () => navigate(`/baton/${baton.id}`);

  return (
    <article className={styles.lane} data-pulsing={pulsing ? 'true' : 'false'}>
      <div className={styles.meta}>
        <div className={styles.metaText}>
          <button type="button" className={styles.title} onClick={open}>
            {baton.title}
            <ArrowUpRight size={15} aria-hidden="true" />
          </button>
          <p className={styles.sub}>
            {baton.sender}
            {baton.senderAddr ? ` · ${shortAddr(baton.senderAddr)}` : ''} to{' '}
            {baton.receiver || baton.receiverRole || 'unassigned receiver'}
          </p>
        </div>
        <span className={styles.status} data-tone={tone}>
          {statusLabel(baton.status)}
        </span>
      </div>

      <div className={styles.track}>
        <span className={styles.station} data-side="sender" aria-hidden="true" />
        <span className={styles.rail} aria-hidden="true">
          <span
            className={styles.railFill}
            style={{ width: `${pos * 100}%`, background: batonColor }}
          />
        </span>
        <span className={styles.station} data-side="receiver" aria-hidden="true" />

        <motion.span
          className={styles.baton}
          style={{ background: batonColor, boxShadow: `0 0 14px ${batonColor}` }}
          aria-hidden="true"
          initial={false}
          animate={
            animate
              ? { left: `${pos * 100}%`, scale: pulsing ? [1, 1.5, 1] : 1 }
              : { left: `${pos * 100}%` }
          }
          transition={{ duration: animate ? 0.9 : 0, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <div className={styles.readouts}>
        <span className={styles.readout}>
          <span className={styles.readoutLabel}>Continuity</span>
          <span className={styles.readoutValue} style={{ color: TONE_COLOR[scoreTone(score)] }}>
            {baton.gateBand ? score : '--'}
          </span>
        </span>
        <span className={styles.readout}>
          <span className={styles.readoutLabel}>Layers</span>
          <span className={styles.readoutValue}>{layers} / 10</span>
        </span>
        <span className={styles.readout}>
          <span className={styles.readoutLabel}>Receiver</span>
          <span className={styles.readoutValue}>
            {baton.mirrorBand ? statusLabel(baton.status) === 'Accepted' ? 'accepted' : baton.mirrorBand.replace('_', ' ') : 'awaiting'}
          </span>
        </span>
        <span className={styles.readout}>
          <span className={styles.readoutLabel}>Repairs</span>
          <span className={styles.readoutValue}>{baton.repairCount || 0}</span>
        </span>
      </div>
    </article>
  );
}
