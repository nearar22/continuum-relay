// BatonDetail.jsx
// ===============
// The full preserved chain of meaning for one baton: the original layers, the
// gate evaluation with validator results, the receiver mirror result, the
// repair history, the final continuity proof, and the event timeline. Built to
// feel like inspecting a sealed record, not editing a row.

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Gauge,
  Waves,
  Wrench,
  Route,
  Download,
  Copy,
} from 'lucide-react';
import { useRelay } from '../context/RelayContext.jsx';
import { Button } from '../components/common/Button.jsx';
import { BatonCore } from '../components/relay/BatonCore.jsx';
import { GateStatusSeal } from '../components/relay/GateStatusSeal.jsx';
import { ContinuityScoreRing } from '../components/relay/ContinuityScoreRing.jsx';
import { ValidatorResultLayer } from '../components/relay/ValidatorResultLayer.jsx';
import { GenLayerProofBadge } from '../components/relay/GenLayerProofBadge.jsx';
import { EventPulseLog } from '../components/relay/EventPulseLog.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { LAYER_META } from '../data/layerMeta.js';
import { exportSingleBaton } from '../utils/exportImport.js';
import {
  statusLabel,
  shortAddr,
  mirrorBandLabel,
  formatDate,
} from '../utils/formatters.js';
import styles from './BatonDetail.module.css';

export function BatonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getBaton, getProof, pushToast, lastUpdated } = useRelay();
  const [baton, setBaton] = useState(null);
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load the full baton (layers, gate, mirror, events) straight from the chain.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    getBaton(id)
      .then((full) => {
        if (alive) setBaton(full && full.id ? full : null);
      })
      .catch(() => alive && setBaton(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, getBaton, lastUpdated]);

  useEffect(() => {
    let alive = true;
    if (baton && baton.proofHash) {
      getProof(baton.id)
        .then((p) => alive && setProof(p))
        .catch(() => alive && setProof(null));
    }
    return () => {
      alive = false;
    };
  }, [baton, getProof]);

  if (!baton) {
    return (
      <EmptyState
        icon={Route}
        title={loading ? 'Loading baton...' : 'Baton not found'}
        action={
          <Button to="/ledger" variant="ghost" icon={ArrowLeft}>
            Back to ledger
          </Button>
        }
      >
        {loading
          ? 'Reading this baton from the chain.'
          : 'This baton is not on the contract. It may never have existed.'}
      </EmptyState>
    );
  }

  const gate = baton.gate;
  const mirror = baton.mirror;

  return (
    <div>
      <div className={styles.topNav}>
        <Button variant="quiet" size="sm" icon={ArrowLeft} to="/ledger">
          Ledger
        </Button>
        <div className={styles.topActions}>
          <Button
            variant="quiet"
            size="sm"
            icon={Download}
            onClick={() => exportSingleBaton(baton)}
          >
            Export JSON
          </Button>
        </div>
      </div>

      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className="cr-eyebrow">Preserved handoff</p>
          <h1 className={styles.title}>{baton.title}</h1>
          <p className={styles.sub}>
            {baton.sender}
            {baton.senderAddr ? ` (${shortAddr(baton.senderAddr)})` : ''} to{' '}
            {baton.receiver || baton.receiverRole || 'unassigned receiver'} · {statusLabel(baton.status)}
          </p>
          <div className={styles.quickActions}>
            <Button variant="ghost" size="sm" icon={Gauge} to={`/gate?baton=${baton.id}`}>
              Gate
            </Button>
            <Button variant="ghost" size="sm" icon={Waves} to={`/mirror?baton=${baton.id}`}>
              Mirror
            </Button>
            <Button variant="ghost" size="sm" icon={Wrench} to={`/repair?baton=${baton.id}`}>
              Repair
            </Button>
            <Button variant="ghost" size="sm" icon={Route} to={`/runway?baton=${baton.id}`}>
              Runway
            </Button>
          </div>
        </div>
        <div className={styles.headerVisual}>
          <BatonCore layers={baton.layers} size={200} showLabels />
        </div>
      </header>

      {proof ? (
        <div className={styles.proofRow}>
          <GenLayerProofBadge proofHash={proof.proofHash} />
          <span className={styles.proofMeta}>Sealed {formatDate(proof.sealedAt)}</span>
        </div>
      ) : null}

      <div className={styles.columns}>
        <section className={styles.section} aria-labelledby="layers-title">
          <h2 id="layers-title" className={styles.sectionTitle}>
            Original baton
          </h2>
          <dl className={styles.layers}>
            {LAYER_META.map((m) => {
              const val = baton.layers[m.key];
              return (
                <div key={m.key} className={styles.layerRow}>
                  <dt className={styles.layerLabel}>
                    <span className={styles.layerDot} style={{ background: m.accent }} aria-hidden="true" />
                    {m.label}
                  </dt>
                  <dd className={styles.layerValue} data-empty={val ? 'false' : 'true'}>
                    {val || 'Not provided'}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>

        <div className={styles.sideColumn}>
          {gate ? (
            <section className={styles.section} aria-labelledby="gate-title">
              <h2 id="gate-title" className={styles.sectionTitle}>
                Gate evaluation
              </h2>
              <div className={styles.gateBlock}>
                <ContinuityScoreRing score={gate.continuityScore} size={104} stroke={8} />
                <GateStatusSeal band={gate.gateBand} compact />
              </div>
              <div className={styles.validators}>
                {gate.validatorResults.map((v, i) => (
                  <ValidatorResultLayer key={v.validator} result={v} index={i} />
                ))}
              </div>
            </section>
          ) : (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Gate evaluation</h2>
              <p className={styles.muted}>This baton has not been evaluated at the gate yet.</p>
            </section>
          )}

          {mirror ? (
            <section className={styles.section} aria-labelledby="mirror-title">
              <h2 id="mirror-title" className={styles.sectionTitle}>
                Receiver mirror
              </h2>
              <div className={styles.mirrorBlock} data-band={mirror.band}>
                <span className={styles.mirrorBand}>{mirrorBandLabel(mirror.band)}</span>
                <p className={styles.mirrorNote}>{mirror.note}</p>
                <div className={styles.mirrorMeta}>
                  <span>Alignment {mirror.alignment}</span>
                  <span>Can accept: {mirror.canAccept ? 'yes' : 'no'}</span>
                  {mirror.constraintViolated ? <span className={styles.violated}>constraint violated</span> : null}
                </div>
              </div>
            </section>
          ) : null}

          <section className={styles.section} aria-labelledby="repair-title">
            <h2 id="repair-title" className={styles.sectionTitle}>
              Repair history
            </h2>
            <p className={styles.muted}>
              {baton.repairCount > 0
                ? `This baton was repaired ${baton.repairCount} time${baton.repairCount === 1 ? '' : 's'} before settling.`
                : 'No repairs were needed on this baton.'}
            </p>
          </section>

          <section className={styles.section} aria-labelledby="events-title">
            <h2 id="events-title" className={styles.sectionTitle}>
              Event timeline
            </h2>
            <EventPulseLog events={baton.events || []} />
          </section>
        </div>
      </div>
    </div>
  );
}
