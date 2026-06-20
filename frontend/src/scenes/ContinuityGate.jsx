// ContinuityGate.jsx
// ==================
// The gate that opens only when continuity is strong. The user picks a baton,
// runs the evaluation, and watches the gate react: a complete baton opens it, a
// contradiction sparks and locks it, missing context shows broken bands. The
// continuity score is a ring; each sub-reading is a meter; the validator
// readings stack as layers. Outcomes route the user onward (pass, repair).

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge, ArrowRight, Wrench, Waves } from 'lucide-react';
import { useRelay } from '../context/RelayContext.jsx';
import { useActiveBaton } from '../hooks/useActiveBaton.js';
import { SceneHeader } from '../components/shell/SceneHeader.jsx';
import { Button } from '../components/common/Button.jsx';
import { BatonPicker } from '../components/relay/BatonPicker.jsx';
import { ContinuityGateVisual } from '../components/relay/ContinuityGateVisual.jsx';
import { GateStatusSeal } from '../components/relay/GateStatusSeal.jsx';
import { ContinuityScoreRing } from '../components/relay/ContinuityScoreRing.jsx';
import { ContextLayerMeter } from '../components/relay/ContextLayerMeter.jsx';
import { ValidatorResultLayer } from '../components/relay/ValidatorResultLayer.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { Stagger, StaggerItem } from '../components/common/Motion.jsx';
import styles from './ContinuityGate.module.css';

export function ContinuityGate() {
  const navigate = useNavigate();
  const { evaluateBaton, pushToast } = useRelay();
  const { baton, activeId, setActiveId, batons } = useActiveBaton();
  const [evaluating, setEvaluating] = useState(false);

  // The evaluated gate result lives on the baton (baton.gate) after evaluation.
  const gate = baton && baton.gate ? baton.gate : null;

  // Auto-select first eligible baton if none chosen.
  useEffect(() => {
    if (!activeId && batons.length > 0) {
      const eligible = batons.find((b) => !['accepted', 'completed'].includes(b.status));
      if (eligible) setActiveId(eligible.id);
    }
  }, [activeId, batons, setActiveId]);

  const runGate = async () => {
    if (!baton) return;
    setEvaluating(true);
    try {
      const res = await evaluateBaton(baton.id);
      const band = res.gate.gateBand;
      pushToast({
        tone: band === 'open' ? 'success' : band === 'blocked' ? 'error' : 'warning',
        title:
          band === 'open' ? 'Gate opens' : band === 'blocked' ? 'Gate blocked' : 'Needs repair',
        message:
          band === 'open'
            ? 'Continuity preserved. The baton can be passed.'
            : band === 'blocked'
              ? 'A contradiction or unsafe handoff. Repair before passing.'
              : 'Context is incomplete. Repair the broken layers.',
      });
    } catch (err) {
      pushToast({ tone: 'error', title: 'Evaluation failed', message: err.message });
    } finally {
      setEvaluating(false);
    }
  };

  const subReadings = gate
    ? [
        { label: 'Intent preservation', value: gate.intentPreservation },
        { label: 'Context completeness', value: gate.contextCompleteness },
        { label: 'Risk clarity', value: gate.riskClarity },
        { label: 'Next action clarity', value: gate.nextActionClarity },
        { label: 'Definition of done clarity', value: gate.definitionOfDoneClarity },
        { label: 'Constraint safety', value: gate.constraintSafety },
      ]
    : [];

  return (
    <div>
      <SceneHeader
        eyebrow="The continuity gate"
        title="Continuity gate"
        lead="GenLayer reads whether meaning survives the handoff and collapses many readings into one gate. It opens only when continuity is strong."
        actions={
          <BatonPicker
            batons={batons}
            activeId={activeId}
            onChange={setActiveId}
            filterFn={(b) => !['accepted', 'completed'].includes(b.status)}
            emptyHint="No batons awaiting evaluation. Compose one first."
          />
        }
      />

      {!baton ? (
        <EmptyState
          icon={Gauge}
          title="Select a baton to evaluate"
          action={
            <Button to="/compose" variant="ghost">
              Compose a baton
            </Button>
          }
        >
          Pick a baton from the selector above, or compose a new one to run it through the gate.
        </EmptyState>
      ) : (
        <div className={styles.layout}>
          <div className={styles.gateColumn}>
            <div className={styles.batonHead}>
              <h2 className={styles.batonTitle}>{baton.title}</h2>
              <p className={styles.batonSub}>
                {baton.sender} to {baton.receiverRole || 'receiver'}
              </p>
            </div>

            <ContinuityGateVisual band={gate ? gate.gateBand : null} evaluating={evaluating} />

            <div className={styles.gateActions}>
              <Button variant="primary" icon={Gauge} onClick={runGate} loading={evaluating}>
                {gate ? 'Re-evaluate at gate' : 'Run continuity gate'}
              </Button>
              {gate && gate.gateBand === 'open' ? (
                <Button variant="teal" iconRight={ArrowRight} to={`/runway?baton=${baton.id}`}>
                  Take to runway
                </Button>
              ) : null}
              {gate && gate.gateBand !== 'open' ? (
                <Button variant="ghost" icon={Wrench} to={`/repair?baton=${baton.id}`}>
                  Open repair loop
                </Button>
              ) : null}
            </div>

            {gate ? (
              <div className={styles.sealRow}>
                <GateStatusSeal band={gate.gateBand} />
              </div>
            ) : (
              <p className={styles.idleHint}>
                The gate is idle. Run the evaluation to see it react to this baton.
              </p>
            )}
          </div>

          <div className={styles.readingColumn}>
            {gate ? (
              <>
                <div className={styles.ringRow}>
                  <ContinuityScoreRing score={gate.continuityScore} />
                  <div className={styles.ringNote}>
                    <p className="cr-eyebrow">Outcome</p>
                    <p className={styles.ringText}>
                      {gate.gateBand === 'open'
                        ? 'Every reading clears the threshold. The baton can pass to the runway.'
                        : gate.gateBand === 'blocked'
                          ? 'A protected constraint or contradiction blocks the pass entirely.'
                          : 'One or more readings fall short. Repair the flagged layers and re-run.'}
                    </p>
                    {baton.status === 'ready_to_accept' ? (
                      <Button variant="quiet" size="sm" icon={Waves} to={`/mirror?baton=${baton.id}`}>
                        Send to receiver mirror
                      </Button>
                    ) : null}
                  </div>
                </div>

                <section aria-labelledby="readings-title">
                  <h3 id="readings-title" className={styles.sectionTitle}>
                    Sub-readings
                  </h3>
                  <div className={styles.meters}>
                    {subReadings.map((r) => (
                      <ContextLayerMeter key={r.label} label={r.label} value={r.value} />
                    ))}
                  </div>
                </section>

                <section aria-labelledby="validators-title">
                  <h3 id="validators-title" className={styles.sectionTitle}>
                    Validator readings
                  </h3>
                  <Stagger className={styles.validators}>
                    {gate.validatorResults.map((v, i) => (
                      <StaggerItem key={v.validator}>
                        <ValidatorResultLayer result={v} index={i} />
                      </StaggerItem>
                    ))}
                  </Stagger>
                </section>
              </>
            ) : (
              <div className={styles.preEval}>
                <p className="cr-eyebrow">Before evaluation</p>
                <p className={styles.preText}>
                  This baton carries{' '}
                  {Object.values(baton.layers || {}).filter((v) => String(v || '').trim()).length} of 10
                  context layers. Run the gate to read intent preservation, contradiction, constraint
                  safety, and definition of done.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
