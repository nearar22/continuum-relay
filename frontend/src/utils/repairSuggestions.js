// repairSuggestions.js
// ====================
// Re-exports the engine's repair suggestion logic plus a couple of presentation
// helpers used by the Repair Loop scene. Keeping this thin keeps the engine the
// single source of truth for what a repair should say.

import { suggestRepairs, evaluateBatonContinuity } from './continuityScoring.js';
import { getLayerMeta } from '../data/layerMeta.js';

export { suggestRepairs, evaluateBatonContinuity };

// Group raw repair suggestions by the layer they target, attaching layer meta
// so the workbench can render a labelled band per broken layer.
export function groupRepairsByLayer(baton, evaluation) {
  const ev = evaluation || evaluateBatonContinuity({ id: baton.id, ...baton.layers });
  const repairs = suggestRepairs({ id: baton.id, ...baton.layers }, ev);
  const byLayer = new Map();
  for (const r of repairs) {
    const layerKey = r.layer || 'currentState';
    if (!byLayer.has(layerKey)) {
      byLayer.set(layerKey, { layer: layerKey, meta: getLayerMeta(layerKey), items: [] });
    }
    byLayer.get(layerKey).items.push(r);
  }
  return Array.from(byLayer.values());
}

export function severityRank(severity) {
  switch (String(severity || '').toLowerCase()) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}
