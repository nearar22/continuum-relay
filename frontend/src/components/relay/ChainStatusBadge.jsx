// ChainStatusBadge.jsx
// ====================
// Live connection indicator. Shows whether the site is reading the GenLayer
// Bradbury contract cleanly, and surfaces the real on-chain status name while a
// write transaction is being decided by validators.

import { RadioTower, Loader, WifiOff } from 'lucide-react';
import { useRelay } from '../../context/RelayContext.jsx';
import { NETWORK_NAME } from '../../genlayer/chain.js';
import styles from './WebSocketStatusBadge.module.css';

export function ChainStatusBadge({ compact = false }) {
  const { loadError, txStatus, lastUpdated } = useRelay();
  const writing = !!txStatus;
  const ok = !loadError && (lastUpdated || writing);

  const Icon = writing ? Loader : ok ? RadioTower : WifiOff;
  const tone = writing ? 'backend' : ok ? 'live' : 'local';
  const label = writing ? txStatus : ok ? `Live on ${NETWORK_NAME}` : 'Reconnecting';

  return (
    <span
      className={styles.badge}
      data-tone={tone}
      data-compact={compact ? 'true' : 'false'}
      role="status"
      aria-label={`Chain status: ${label}`}
    >
      <span className={styles.pulse} data-live={ok && !writing ? 'true' : 'false'} aria-hidden="true" />
      <Icon size={14} aria-hidden="true" />
      {!compact ? (
        <span className={styles.text}>
          {label}
          <span className={styles.mode}>GenLayer</span>
        </span>
      ) : null}
    </span>
  );
}
