// ContinuityLedger.jsx
// ====================
// A motion history of batons read live from the chain, each a compressed
// trajectory card. Not an admin table: it is a record of meaning passed from
// one contributor to another. The user can filter by status and score, open a
// baton, and export a single baton or the whole ledger as JSON for their records.

import { useMemo, useState } from 'react';
import { ScrollText, Download, Filter, RotateCw } from 'lucide-react';
import { useRelay } from '../context/RelayContext.jsx';
import { SceneHeader } from '../components/shell/SceneHeader.jsx';
import { Button } from '../components/common/Button.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { BatonTrajectoryCard } from '../components/ledger/BatonTrajectoryCard.jsx';
import { Stagger, StaggerItem } from '../components/common/Motion.jsx';
import {
  exportBatonsToFile,
  exportSingleBaton,
} from '../utils/exportImport.js';
import { clampScore } from '../utils/formatters.js';
import styles from './ContinuityLedger.module.css';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'needs_repair', label: 'Needs repair' },
  { id: 'blocked', label: 'Blocked' },
];

const SCORE_FILTERS = [
  { id: 'any', label: 'Any score', test: () => true },
  { id: 'high', label: 'Score 75+', test: (s) => s >= 75 },
  { id: 'mid', label: 'Score 50-74', test: (s) => s >= 50 && s < 75 },
  { id: 'low', label: 'Below 50', test: (s) => s < 50 },
];

export function ContinuityLedger() {
  const { batons, refresh, pushToast } = useRelay();
  const [statusFilter, setStatusFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('any');

  const filtered = useMemo(() => {
    const scoreTest = SCORE_FILTERS.find((f) => f.id === scoreFilter)?.test || (() => true);
    return batons.filter((b) => {
      if (statusFilter === 'accepted' && !['accepted', 'completed'].includes(b.status)) return false;
      if (statusFilter === 'in_progress' && ['accepted', 'completed', 'blocked', 'needs_repair'].includes(b.status))
        return false;
      if (statusFilter === 'needs_repair' && b.status !== 'needs_repair') return false;
      if (statusFilter === 'blocked' && b.status !== 'blocked') return false;
      return scoreTest(clampScore(b.continuityScore));
    });
  }, [batons, statusFilter, scoreFilter]);

  const exportOne = (baton) => {
    exportSingleBaton(baton);
    pushToast({ tone: 'info', title: 'Baton exported', message: `${baton.title} downloaded as JSON.` });
  };

  const exportAll = () => {
    if (batons.length === 0) {
      pushToast({ tone: 'warning', title: 'Nothing to export', message: 'The ledger is empty.' });
      return;
    }
    exportBatonsToFile(batons);
    pushToast({ tone: 'info', title: 'Ledger exported', message: `${batons.length} batons downloaded.` });
  };

  return (
    <div>
      <SceneHeader
        eyebrow="The continuity ledger"
        title="Continuity ledger"
        lead="Every baton that moved through the relay, as a compressed trajectory: who passed to whom, how strong the continuity was, and the proof that sealed it."
        actions={
          <div className={styles.headerActions}>
            <Button variant="ghost" size="sm" icon={RotateCw} onClick={() => refresh(false)}>
              Refresh
            </Button>
            <Button variant="ghost" size="sm" icon={Download} onClick={exportAll}>
              Export all
            </Button>
          </div>
        }
      />

      <div className={styles.controls}>
        <div className={styles.filterGroup} role="group" aria-label="Filter by status">
          <Filter size={15} aria-hidden="true" className={styles.filterIcon} />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={styles.chip}
              data-active={statusFilter === f.id ? 'true' : 'false'}
              onClick={() => setStatusFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className={styles.filterGroup} role="group" aria-label="Filter by score">
          {SCORE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={styles.chip}
              data-active={scoreFilter === f.id ? 'true' : 'false'}
              onClick={() => setScoreFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={batons.length === 0 ? 'The ledger is empty' : 'No batons match these filters'}
          action={
            <Button
              variant="quiet"
              onClick={() => {
                setStatusFilter('all');
                setScoreFilter('any');
              }}
            >
              Clear filters
            </Button>
          }
        >
          {batons.length === 0
            ? 'No batons have moved through the relay yet. Connect your wallet and compose the first one.'
            : 'Try a broader status or score filter.'}
        </EmptyState>
      ) : (
        <Stagger className={styles.grid}>
          {filtered.map((b) => (
            <StaggerItem key={b.id}>
              <BatonTrajectoryCard baton={b} onExport={exportOne} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
