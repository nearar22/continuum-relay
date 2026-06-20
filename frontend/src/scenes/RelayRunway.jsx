// RelayRunway.jsx
// ===============
// The baton traveling sender to receiver through a corridor with lane
// checkpoints. The user can pass a ready baton onto the runway, request a
// repair, send it to the receiver mirror, or simulate receiver acceptance. All
// state changes flow through the relay engine (backend or mock) and pulse the
// event log. An accepted baton lands cleanly and mints a continuity proof.

import { useState, useEffect } from 'react';
import {
  Route,
  Send,
  Wrench,
  Waves,
  CheckCheck,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useRelay } from '../context/RelayContext.jsx';
import { useActiveBaton } from '../hooks/useActiveBaton.js';
import { SceneHeader } from '../components/shell/SceneHeader.jsx';
import { Button } from '../components/common/Button.jsx';
import { BatonPicker } from '../components/relay/BatonPicker.jsx';
import { RelayRunwayTrack } from '../components/relay/RelayRunwayTrack.jsx';
import { EventPulseLog } from '../components/relay/EventPulseLog.jsx';
import { GenLayerProofBadge } from '../components/relay/GenLayerProofBadge.jsx';
import { GateStatusSeal } from '../components/relay/GateStatusSeal.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { statusLabel } from '../utils/formatters.js';
import styles from './RelayRunway.module.css';

export function RelayRunway() {
  const { passBaton, acceptBaton, pushToast, getProof } = useRelay();
  const { baton, activeId, setActiveId, batons } = useActiveBaton();
  const [busy, setBusy] = useState(false);
  const [proof, setProof] = useState(null);

  useEffect(() => {
    if (!activeId && batons.length > 0) {
      const eligible = batons.find((b) =>
        ['ready_to_accept', 'receiver_clarification', 'accepted'].includes(b.status),
      );
      if (eligible) setActiveId(eligible.id);
    }
  }, [activeId, batons, setActiveId]);

  // Load the proof when an accepted baton is selected.
  useEffect(() => {
    let alive = true;
    if (baton && baton.status === 'accepted') {
      getProof(baton.id)
        .then((p) => alive && setProof(p))
        .catch(() => alive && setProof(null));
    } else {
      setProof(null);
    }
    return () => {
      alive = false;
    };
  }, [baton, getProof]);

  const run = async (fn, okMessage, okTone = 'success') => {
    if (!baton) return;
    setBusy(true);
    try {
      await fn(baton.id);
      pushToast({ tone: okTone, title: okMessage });
    } catch (err) {
      pushToast({ tone: 'error', title: 'Relay action failed', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const canPass = baton && baton.status === 'ready_to_accept';
  const canMirror = baton && ['ready_to_accept', 'receiver_clarification'].includes(baton.status);
  const canAccept =
    baton &&
    baton.status === 'receiver_clarification' &&
    baton.mirror &&
    ['match', 'partial'].includes(baton.mirror.band);

  return (
    <div>
      <SceneHeader
        eyebrow="The relay runway"
        title="Relay runway"
        lead="Watch the baton travel the corridor from sender to receiver. Pass it once the gate opens, send it to the mirror, and accept it to land the handoff and mint a proof."
        actions={
          <BatonPicker
            batons={batons}
            activeId={activeId}
            onChange={setActiveId}
            emptyHint="No batons in the relay yet."
          />
        }
      />

      {!baton ? (
        <EmptyState
          icon={Route}
          title="No baton on the runway"
          action={
            <Button to="/room" variant="ghost">
              Open the relay room
            </Button>
          }
        >
          Select a baton, or take one through the continuity gate first so it is ready to pass.
        </EmptyState>
      ) : (
        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.batonHead}>
              <div>
                <h2 className={styles.title}>{baton.title}</h2>
                <p className={styles.sub}>
                  {baton.sender} to {baton.receiver || baton.receiverRole || 'receiver'} ·{' '}
                  {statusLabel(baton.status)}
                </p>
              </div>
              {baton.gateBand ? <GateStatusSeal band={baton.gateBand} compact /> : null}
            </div>

            <RelayRunwayTrack baton={baton} />

            <div className={styles.actions}>
              <Button
                variant="primary"
                icon={Send}
                disabled={!canPass || busy}
                loading={busy && canPass}
                onClick={() => run(passBaton, 'Baton released onto the runway')}
              >
                Pass baton
              </Button>
              <Button
                variant="teal"
                icon={Waves}
                disabled={!canMirror}
                to={canMirror ? `/mirror?baton=${baton.id}` : undefined}
              >
                Receiver mirror
              </Button>
              <Button
                variant="ghost"
                icon={CheckCheck}
                disabled={!canAccept || busy}
                onClick={() => run(acceptBaton, 'Handoff accepted, proof minted')}
              >
                Simulate acceptance
              </Button>
              <Button variant="quiet" icon={Wrench} to={`/repair?baton=${baton.id}`}>
                Request repair
              </Button>
            </div>

            {baton.status === 'blocked' || baton.status === 'needs_repair' ? (
              <p className={styles.blockedNote}>
                This baton has not cleared the gate. Repair it before it can be passed.
              </p>
            ) : null}

            {proof ? (
              <div className={styles.proofRow}>
                <GenLayerProofBadge proofHash={proof.proofHash} sealing />
                <Button variant="quiet" size="sm" iconRight={ArrowRight} to={`/baton/${baton.id}`}>
                  Inspect the proof chain
                </Button>
              </div>
            ) : null}
          </div>

          <aside className={styles.side}>
            <div className={styles.sideHead}>
              <ShieldCheck size={16} aria-hidden="true" />
              <h3 className={styles.sideTitle}>Relay events</h3>
            </div>
            <EventPulseLog events={baton.events} />
          </aside>
        </div>
      )}
    </div>
  );
}
