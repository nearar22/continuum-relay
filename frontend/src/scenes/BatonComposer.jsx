// BatonComposer.jsx
// =================
// Composing a handoff. The twelve facets (title, sender, receiver role, plus
// the ten context layers) are framed as layers wrapping the baton core. A live
// continuity preview runs the mock engine as the user types (debounced) so the
// projected gate band is visible before submission. On submit the baton is
// created through the relay engine (backend or mock) and the user is sent to the
// gate.

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileStack, RotateCcw } from 'lucide-react';
import { useRelay } from '../context/RelayContext.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { SceneHeader } from '../components/shell/SceneHeader.jsx';
import { Button } from '../components/common/Button.jsx';
import { BatonLayer } from '../components/composer/BatonLayer.jsx';
import { LiveContinuityPreview } from '../components/composer/LiveContinuityPreview.jsx';
import { LAYER_META, emptyLayers } from '../data/layerMeta.js';
import { RELAY_TEMPLATES } from '../data/relayTemplates.js';
import { ROLE_PRESETS } from '../data/rolePresets.js';
import styles from './BatonComposer.module.css';

export function BatonComposer() {
  const navigate = useNavigate();
  const { createBaton, pushToast, wallet } = useRelay();

  const [title, setTitle] = useState('');
  const [sender, setSender] = useState('');
  const [receiverRole, setReceiverRole] = useState('');
  const [layers, setLayers] = useState(emptyLayers);
  const [submitting, setSubmitting] = useState(false);

  const debouncedLayers = useDebouncedValue(layers, 320);

  const setLayer = (key, val) => setLayers((l) => ({ ...l, [key]: val }));

  const applyTemplate = (tmpl) => {
    setLayers({ ...emptyLayers(), ...tmpl.layers });
    if (tmpl.receiverRole) setReceiverRole(tmpl.receiverRole);
    if (!title) setTitle(tmpl.name === 'Blank baton' ? '' : tmpl.name);
    pushToast({ tone: 'info', title: 'Template applied', message: `${tmpl.name} scaffold loaded.` });
  };

  const reset = () => {
    setLayers(emptyLayers());
    setTitle('');
    setReceiverRole('');
    setSender('');
  };

  const missingRequired = useMemo(
    () => LAYER_META.filter((m) => m.required && !layers[m.key].trim()).map((m) => m.label),
    [layers],
  );

  const canSubmit = title.trim().length > 0 && missingRequired.length === 0 && !submitting;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      pushToast({
        tone: 'warning',
        title: 'Baton incomplete',
        message:
          missingRequired.length > 0
            ? `Fill the required layers: ${missingRequired.join(', ')}.`
            : 'Give the baton a title before sending it.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const baton = await createBaton({
        title: title.trim(),
        receiverRole: receiverRole.trim(),
        layers,
      });
      pushToast({ tone: 'success', title: 'Baton composed', message: 'Sending it to the continuity gate.' });
      navigate(`/gate?baton=${baton.id}`);
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not compose', message: err.message || 'Unexpected error.' });
      setSubmitting(false);
    }
  };

  return (
    <div>
      <SceneHeader
        eyebrow="Compose a handoff"
        title="Baton composer"
        lead="Each layer you fill wraps the baton core in another band of light. The continuity preview on the right shows how the gate will read it, live."
        actions={
          <Button variant="quiet" icon={RotateCcw} onClick={reset} type="button">
            Reset
          </Button>
        }
      />

      <div className={styles.templates}>
        <span className={styles.templatesLabel}>
          <FileStack size={15} aria-hidden="true" /> Start from a template
        </span>
        <div className={styles.templateChips}>
          {RELAY_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={styles.templateChip}
              onClick={() => applyTemplate(t)}
              title={t.description}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <form className={styles.layout} onSubmit={submit}>
        <div className={styles.formColumn}>
          <div className={styles.identity}>
            <div className={styles.field}>
              <label htmlFor="baton-title" className={styles.fieldLabel}>
                Baton title <span className={styles.req}>required</span>
              </label>
              <input
                id="baton-title"
                className={styles.fieldInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What is this handoff about?"
              />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="baton-sender" className={styles.fieldLabel}>
                  Sender
                </label>
                <input
                  id="baton-sender"
                  className={styles.fieldInput}
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder={wallet.connected ? 'You' : 'Your name or handle'}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="baton-role" className={styles.fieldLabel}>
                  Receiver role
                </label>
                <input
                  id="baton-role"
                  className={styles.fieldInput}
                  value={receiverRole}
                  onChange={(e) => setReceiverRole(e.target.value)}
                  placeholder="Who is picking this up?"
                  list="role-presets"
                />
                <datalist id="role-presets">
                  {ROLE_PRESETS.map((r) => (
                    <option key={r.id} value={r.label} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <div className={styles.layers}>
            {LAYER_META.map((m, i) => (
              <BatonLayer
                key={m.key}
                layerKey={m.key}
                value={layers[m.key]}
                onChange={setLayer}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <div className={styles.submitRow}>
            {missingRequired.length > 0 ? (
              <p className={styles.missingNote}>
                Required layers still empty: {missingRequired.join(', ')}.
              </p>
            ) : (
              <p className={styles.readyNote}>All required layers are present.</p>
            )}
            <Button type="submit" variant="primary" iconRight={ArrowRight} disabled={!canSubmit} loading={submitting}>
              Compose and open gate
            </Button>
          </div>
        </div>

        <div className={styles.previewColumn}>
          <LiveContinuityPreview layers={debouncedLayers} />
        </div>
      </form>
    </div>
  );
}
