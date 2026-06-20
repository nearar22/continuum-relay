// ReceiverMirror.jsx
// ==================
// The receiver restates what they understood: the task, the next action, the
// key risk, the constraint they must not violate, and the definition of done.
// The relay compares it to the baton (compareReceiverMirror) and shows the band
// as two waveforms aligning or diverging. A constraint violation produces a
// Critical Misunderstanding and visibly blocks acceptance. The Grant Review
// demo can load the canonical misunderstanding case in one click.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Waves, CheckCheck, AlertOctagon, Sparkles, ArrowRight } from 'lucide-react';
import { useRelay } from '../context/RelayContext.jsx';
import { useActiveBaton } from '../hooks/useActiveBaton.js';
import { SceneHeader } from '../components/shell/SceneHeader.jsx';
import { Button } from '../components/common/Button.jsx';
import { BatonPicker } from '../components/relay/BatonPicker.jsx';
import { WaveformCompare } from '../components/mirror/WaveformCompare.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { DEMO_MISUNDERSTANDING_MIRROR } from '../data/demoBatons.js';
import { mirrorBandLabel } from '../utils/formatters.js';
import styles from './ReceiverMirror.module.css';

const MIRROR_FIELDS = [
  { key: 'task', label: 'The task as you understand it', placeholder: 'Restate what you are picking up.' },
  { key: 'nextAction', label: 'Your next action', placeholder: 'What will you do first?' },
  { key: 'keyRisk', label: 'The key risk', placeholder: 'What is the main thing that could go wrong?' },
  { key: 'constraint', label: 'The constraint you must not violate', placeholder: 'What boundary must you respect?' },
  { key: 'definitionOfDone', label: 'Your definition of done', placeholder: 'How will you know it is complete?' },
];

const emptyMirror = { task: '', nextAction: '', keyRisk: '', constraint: '', definitionOfDone: '' };

export function ReceiverMirror() {
  const navigate = useNavigate();
  const { submitMirror, acceptBaton, pushToast, wallet } = useRelay();
  const { baton, activeId, setActiveId, batons } = useActiveBaton();

  const [receiver, setReceiver] = useState('');
  const [mirror, setMirror] = useState(emptyMirror);
  const [submitting, setSubmitting] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const result = baton && baton.mirror ? baton.mirror : null;

  useEffect(() => {
    if (!activeId && batons.length > 0) {
      const eligible = batons.find((b) =>
        ['ready_to_accept', 'receiver_clarification'].includes(b.status),
      );
      if (eligible) setActiveId(eligible.id);
    }
  }, [activeId, batons, setActiveId]);

  const setField = (key, val) => setMirror((m) => ({ ...m, [key]: val }));

  const loadDemoMisunderstanding = () => {
    setMirror({ ...DEMO_MISUNDERSTANDING_MIRROR });
    setReceiver(receiver || 'Reviewer B');
    pushToast({
      tone: 'info',
      title: 'Sample restatement loaded',
      message: 'This restatement plans to publish reviewer notes, which the constraint forbids. Submit it to see the gate block acceptance.',
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!baton) return;
    const filled = Object.values(mirror).filter((v) => v.trim()).length;
    if (filled < 3) {
      pushToast({ tone: 'warning', title: 'Restatement too thin', message: 'Fill at least the task, next action, and a constraint.' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitMirror(baton.id, { mirror });
      const band = res.mirror.band;
      pushToast({
        tone: res.mirror.canAccept ? 'success' : 'error',
        title: mirrorBandLabel(band),
        message: res.mirror.note,
      });
    } catch (err) {
      pushToast({ tone: 'error', title: 'Mirror failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const accept = async () => {
    if (!baton) return;
    setAccepting(true);
    try {
      await acceptBaton(baton.id);
      pushToast({ tone: 'success', title: 'Handoff accepted', message: 'A continuity proof was minted.' });
      navigate(`/baton/${baton.id}`);
    } catch (err) {
      pushToast({ tone: 'error', title: 'Acceptance blocked', message: err.message });
      setAccepting(false);
    }
  };

  const blocked = result && !result.canAccept;

  return (
    <div>
      <SceneHeader
        eyebrow="The receiver mirror"
        title="Receiver mirror"
        lead="Before a handoff is accepted, the receiver restates their understanding. The relay compares it to the baton. A restatement that crosses a protected constraint is blocked, even if it sounds confident."
        actions={
          <BatonPicker
            batons={batons}
            activeId={activeId}
            onChange={setActiveId}
            filterFn={(b) => ['ready_to_accept', 'receiver_clarification'].includes(b.status)}
            emptyHint="No batons have cleared the gate yet."
          />
        }
      />

      {!baton ? (
        <EmptyState
          icon={Waves}
          title="No baton ready for a mirror"
          action={
            <Button to="/gate" variant="ghost">
              Open the continuity gate
            </Button>
          }
        >
          A baton must clear the continuity gate before a receiver can mirror it. Run one through the
          gate first.
        </EmptyState>
      ) : (
        <div className={styles.layout}>
          <form className={styles.formCol} onSubmit={submit}>
            <div className={styles.batonRecap}>
              <h2 className={styles.title}>{baton.title}</h2>
              <p className={styles.constraint}>
                <span className={styles.constraintLabel}>Protected constraint</span>
                {(baton.layers && baton.layers.constraints) || 'No explicit constraint on this baton.'}
              </p>
            </div>

            <div className={styles.field}>
              <label htmlFor="mirror-receiver" className={styles.label}>
                Receiver name
              </label>
              <input
                id="mirror-receiver"
                className={styles.input}
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                placeholder={wallet.connected ? 'You' : 'Who is receiving this?'}
              />
            </div>

            {MIRROR_FIELDS.map((f) => (
              <div key={f.key} className={styles.field}>
                <label htmlFor={`mirror-${f.key}`} className={styles.label}>
                  {f.label}
                </label>
                <textarea
                  id={`mirror-${f.key}`}
                  className={styles.textarea}
                  value={mirror[f.key]}
                  onChange={(e) => setField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={2}
                />
              </div>
            ))}

            <div className={styles.formActions}>
              {baton.id === 'baton-1' ? (
                <Button type="button" variant="quiet" icon={Sparkles} onClick={loadDemoMisunderstanding}>
                  Load sample restatement
                </Button>
              ) : null}
              <Button type="submit" variant="primary" icon={Waves} loading={submitting}>
                Compare to baton
              </Button>
            </div>
          </form>

          <div className={styles.resultCol}>
            {result ? (
              <div className={styles.result} data-band={result.band}>
                <div className={styles.resultHead}>
                  <span className={styles.resultBand} data-band={result.band}>
                    {result.label}
                  </span>
                  {result.constraintViolated ? (
                    <span className={styles.violation}>
                      <AlertOctagon size={15} aria-hidden="true" />
                      Constraint violated
                    </span>
                  ) : null}
                </div>

                <WaveformCompare alignment={result.alignment} constraintViolated={result.constraintViolated} />

                <p className={styles.note}>{result.note}</p>

                <div className={styles.resultMeta}>
                  <div>
                    <span className={styles.metaLabel}>Alignment</span>
                    <span className={styles.metaValue}>{result.alignment}</span>
                  </div>
                  <div>
                    <span className={styles.metaLabel}>Omission risk</span>
                    <span className={styles.metaValue}>{result.criticalOmission}</span>
                  </div>
                  <div>
                    <span className={styles.metaLabel}>Can accept</span>
                    <span className={styles.metaValue}>{result.canAccept ? 'yes' : 'no'}</span>
                  </div>
                </div>

                {blocked ? (
                  <div className={styles.blocked}>
                    <AlertOctagon size={18} aria-hidden="true" />
                    <div>
                      <p className={styles.blockedTitle}>Acceptance is blocked</p>
                      <p className={styles.blockedBody}>
                        The receiver must mirror the baton without crossing a protected constraint or
                        omitting something essential. Adjust the restatement and compare again.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className={styles.acceptRow}>
                    <Button variant="teal" icon={CheckCheck} onClick={accept} loading={accepting}>
                      Accept handoff
                    </Button>
                    <Button variant="quiet" iconRight={ArrowRight} to={`/baton/${baton.id}`}>
                      View baton
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.placeholder}>
                <Waves size={26} aria-hidden="true" />
                <p>
                  Submit a restatement to see the two waveforms align or diverge. A strong match opens
                  acceptance; a constraint violation blocks it.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
