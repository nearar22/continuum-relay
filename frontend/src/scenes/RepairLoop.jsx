// RepairLoop.jsx
// ==============
// The workshop that restores broken context. It reads the current evaluation,
// groups the issues by layer, and offers a repair band per broken layer with
// the suggested repair prompts. The user edits, sees a projected before/after
// continuity score, and resubmits to the gate. On repair the broken bands
// reconnect and the baton brightens. All editable layers are also exposed so
// the user can strengthen any context, not only the flagged ones.

import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, RefreshCw, ArrowRight, PlusCircle } from 'lucide-react';
import { useRelay } from '../context/RelayContext.jsx';
import { useActiveBaton } from '../hooks/useActiveBaton.js';
import { SceneHeader } from '../components/shell/SceneHeader.jsx';
import { Button } from '../components/common/Button.jsx';
import { BatonPicker } from '../components/relay/BatonPicker.jsx';
import { RepairBand } from '../components/repair/RepairBand.jsx';
import { BatonLayer } from '../components/composer/BatonLayer.jsx';
import { ContinuityScoreRing } from '../components/relay/ContinuityScoreRing.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { evaluateBatonContinuity, groupRepairsByLayer } from '../utils/repairSuggestions.js';
import { LAYER_META } from '../data/layerMeta.js';
import { clampScore } from '../utils/formatters.js';
import styles from './RepairLoop.module.css';

export function RepairLoop() {
  const navigate = useNavigate();
  const { repairBaton, evaluateBaton, pushToast } = useRelay();
  const { baton, activeId, setActiveId, batons } = useActiveBaton();

  const [edits, setEdits] = useState({});
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!activeId && batons.length > 0) {
      const eligible = batons.find((b) => ['needs_repair', 'blocked', 'draft'].includes(b.status));
      if (eligible) setActiveId(eligible.id);
    }
  }, [activeId, batons, setActiveId]);

  // Reset edits when the active baton changes.
  useEffect(() => {
    setEdits({});
    setShowAll(false);
  }, [activeId]);

  // Current evaluation of the baton (uses stored gate or recomputes).
  const currentEval = useMemo(() => {
    if (!baton) return null;
    return baton.gate || evaluateBatonContinuity({ id: baton.id, ...(baton.layers || {}) });
  }, [baton]);

  const repairGroups = useMemo(() => {
    if (!baton) return [];
    return groupRepairsByLayer({ id: baton.id, ...(baton.layers || {}) }, currentEval);
  }, [baton, currentEval]);

  // Merge edits over the baton layers for the projected score.
  const projectedLayers = useMemo(() => {
    if (!baton) return {};
    return { ...(baton.layers || {}), ...edits };
  }, [baton, edits]);

  const projectedEval = useMemo(() => {
    if (!baton) return null;
    return evaluateBatonContinuity({ id: baton.id, ...projectedLayers });
  }, [baton, projectedLayers]);

  const setLayerEdit = (key, val) => setEdits((e) => ({ ...e, [key]: val }));

  const submitRepair = async () => {
    if (!baton) return;
    const repairedLayers = {};
    for (const [k, v] of Object.entries(edits)) {
      if (v.trim() && v !== (baton.layers || {})[k]) repairedLayers[k] = v;
    }
    if (Object.keys(repairedLayers).length === 0) {
      pushToast({ tone: 'warning', title: 'Nothing to repair', message: 'Edit at least one layer before resubmitting.' });
      return;
    }
    setBusy(true);
    try {
      await repairBaton(baton.id, repairedLayers);
      const res = await evaluateBaton(baton.id);
      const band = res.gate.gateBand;
      pushToast({
        tone: band === 'open' ? 'success' : band === 'blocked' ? 'error' : 'warning',
        title: band === 'open' ? 'Repaired and gate opens' : band === 'blocked' ? 'Still blocked' : 'Still needs repair',
        message:
          band === 'open'
            ? 'The broken bands reconnected. The baton can pass.'
            : 'Some readings still fall short. Keep repairing.',
      });
      setEdits({});
      if (band === 'open') {
        navigate(`/runway?baton=${baton.id}`);
      }
    } catch (err) {
      pushToast({ tone: 'error', title: 'Repair failed', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const beforeScore = currentEval ? clampScore(currentEval.continuityScore) : 0;
  const afterScore = projectedEval ? clampScore(projectedEval.continuityScore) : 0;
  const repairedLayerKeys = new Set(repairGroups.map((g) => g.layer));
  const otherLayers = LAYER_META.filter((m) => !repairedLayerKeys.has(m.key));

  return (
    <div>
      <SceneHeader
        eyebrow="The repair loop"
        title="Repair loop"
        lead="Restore the broken context: missing layers, contradictory lines, an unclear next action, a weak definition of done. Repair the flagged bands, watch the projected score lift, and resubmit to the gate."
        actions={
          <BatonPicker
            batons={batons}
            activeId={activeId}
            onChange={setActiveId}
            filterFn={(b) => !['accepted', 'completed'].includes(b.status)}
            emptyHint="No batons need repair."
          />
        }
      />

      {!baton ? (
        <EmptyState
          icon={Wrench}
          title="Nothing to repair"
          action={
            <Button to="/gate" variant="ghost">
              Run a baton through the gate
            </Button>
          }
        >
          Select a baton that needs repair, or evaluate one at the gate to surface its broken layers.
        </EmptyState>
      ) : (
        <div className={styles.layout}>
          <div className={styles.workbench}>
            {repairGroups.length === 0 ? (
              <div className={styles.clean}>
                <p className={styles.cleanTitle}>No broken bands flagged.</p>
                <p className={styles.cleanBody}>
                  This baton has no outstanding continuity issues. You can still strengthen any layer
                  below, or take it back to the gate.
                </p>
              </div>
            ) : (
              <div className={styles.bands}>
                {repairGroups.map((g) => (
                  <RepairBand
                    key={g.layer}
                    group={g}
                    value={edits[g.layer] ?? (baton.layers || {})[g.layer] ?? ''}
                    onChange={setLayerEdit}
                  />
                ))}
              </div>
            )}

            <div className={styles.allLayers}>
              <button
                type="button"
                className={styles.toggleAll}
                onClick={() => setShowAll((s) => !s)}
                aria-expanded={showAll}
              >
                <PlusCircle size={15} aria-hidden="true" />
                {showAll ? 'Hide other layers' : 'Strengthen other layers'}
              </button>
              {showAll ? (
                <div className={styles.otherGrid}>
                  {otherLayers.map((m) => (
                    <BatonLayer
                      key={m.key}
                      layerKey={m.key}
                      value={edits[m.key] ?? (baton.layers || {})[m.key] ?? ''}
                      onChange={setLayerEdit}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <aside className={styles.side}>
            <div className={styles.scorePanel}>
              <p className="cr-eyebrow">Before and after</p>
              <div className={styles.scores}>
                <div className={styles.scoreBlock}>
                  <ContinuityScoreRing score={beforeScore} size={104} stroke={8} label="Before" />
                </div>
                <ArrowRight size={20} aria-hidden="true" className={styles.scoreArrow} />
                <div className={styles.scoreBlock}>
                  <ContinuityScoreRing score={afterScore} size={104} stroke={8} label="Projected" />
                </div>
              </div>
              <p className={styles.delta}>
                {afterScore > beforeScore
                  ? `Projected lift of ${afterScore - beforeScore} points.`
                  : afterScore < beforeScore
                    ? 'This edit lowers the projected score.'
                    : 'Edit the flagged layers to project a new score.'}
              </p>
            </div>

            <Button variant="primary" icon={RefreshCw} onClick={submitRepair} loading={busy} fullWidth>
              Repair and resubmit to gate
            </Button>
            <Button variant="quiet" to={`/gate?baton=${baton.id}`} fullWidth>
              Back to the gate without repairing
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
