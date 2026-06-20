// RelayRoom.jsx
// =============
// The operational hub. Active batons ride glowing lanes between contributor
// stations; filtering by status reshapes the room. Live relay pulses from the
// socket (or the mock bus) light up the matching lane. Not a table: every baton
// is a moving lane. Data failures fall back to the local mock via the engine.

import { useMemo, useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import { useRelay } from '../context/RelayContext.jsx';
import { SceneHeader } from '../components/shell/SceneHeader.jsx';
import { Button } from '../components/common/Button.jsx';
import { RelayLane } from '../components/relay/RelayLane.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { SkeletonCard } from '../components/common/Skeleton.jsx';
import { Stagger, StaggerItem } from '../components/common/Motion.jsx';
import { statusLabel } from '../utils/formatters.js';
import styles from './RelayRoom.module.css';

const FILTERS = [
  { id: 'all', label: 'All lanes' },
  { id: 'active', label: 'In flight' },
  { id: 'needs_repair', label: 'Needs repair' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'ready_to_accept', label: 'Ready' },
  { id: 'accepted', label: 'Settled' },
];

export function RelayRoom() {
  const { batons, loading, pulses } = useRelay();
  const [filter, setFilter] = useState('all');

  // Map of batonId -> recent pulse, so the matching lane animates.
  const pulsingIds = useMemo(() => {
    const ids = new Set();
    for (const p of pulses) {
      if (p.payload && p.payload.batonId) ids.add(p.payload.batonId);
    }
    return ids;
  }, [pulses]);

  const filtered = useMemo(() => {
    if (filter === 'all') return batons;
    if (filter === 'active') {
      return batons.filter((b) => !['accepted', 'completed'].includes(b.status));
    }
    if (filter === 'accepted') {
      return batons.filter((b) => ['accepted', 'completed'].includes(b.status));
    }
    return batons.filter((b) => b.status === filter);
  }, [batons, filter]);

  const counts = useMemo(() => {
    return {
      total: batons.length,
      inFlight: batons.filter((b) => !['accepted', 'completed'].includes(b.status)).length,
      settled: batons.filter((b) => ['accepted', 'completed'].includes(b.status)).length,
    };
  }, [batons]);

  return (
    <div>
      <SceneHeader
        eyebrow="Operational hub"
        title="Relay room"
        lead="Every active handoff rides its own lane between a sender and a receiver station. Watch them move as the relay evaluates, repairs, and accepts."
        actions={
          <Button to="/compose" variant="primary" icon={Plus}>
            Compose a baton
          </Button>
        }
      />

      <Stagger className={styles.statRow}>
        <StaggerItem className={styles.stat}>
          <span className={styles.statValue}>{counts.total}</span>
          <span className={styles.statLabel}>Batons in the relay</span>
        </StaggerItem>
        <StaggerItem className={styles.stat}>
          <span className={styles.statValue} style={{ color: 'var(--relay-amber)' }}>
            {counts.inFlight}
          </span>
          <span className={styles.statLabel}>In flight</span>
        </StaggerItem>
        <StaggerItem className={styles.stat}>
          <span className={styles.statValue} style={{ color: 'var(--success)' }}>
            {counts.settled}
          </span>
          <span className={styles.statLabel}>Settled</span>
        </StaggerItem>
      </Stagger>

      <div className={styles.filters} role="tablist" aria-label="Filter batons by status">
        <Filter size={15} aria-hidden="true" className={styles.filterIcon} />
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={styles.filterChip}
            data-active={filter === f.id ? 'true' : 'false'}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.lanes}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Filter}
          title={filter === 'all' ? 'The relay is quiet' : `No batons are ${statusLabel(filter).toLowerCase()}`}
          action={
            <Button to="/compose" variant="ghost" icon={Plus}>
              Compose the first baton
            </Button>
          }
        >
          {filter === 'all'
            ? 'No batons are in the relay yet. Compose one to send the first context through the lanes.'
            : 'Try a different filter, or compose a new baton.'}
        </EmptyState>
      ) : (
        <Stagger className={styles.lanes}>
          {filtered.map((b) => (
            <StaggerItem key={b.id}>
              <RelayLane baton={b} pulsing={pulsingIds.has(b.id)} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
