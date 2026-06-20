// batonBuilder.js
// ===============
// Helpers for assembling and normalizing baton records on the client. Used by
// the composer and the mock GenLayer path so a locally created baton has the
// same shape the backend would return.

import { emptyLayers, LAYER_KEYS } from '../data/layerMeta.js';

let localSeq = 1000;

export function nextLocalId() {
  localSeq += 1;
  return `baton-local-${localSeq}`;
}

export function normalizeLayers(layers) {
  const base = emptyLayers();
  if (layers && typeof layers === 'object') {
    for (const k of LAYER_KEYS) {
      if (typeof layers[k] === 'string') base[k] = layers[k];
    }
  }
  return base;
}

export function buildBaton({ title, sender, senderAddr, receiverRole, layers }) {
  const now = new Date().toISOString();
  return {
    id: nextLocalId(),
    seq: localSeq,
    title: title || 'Untitled baton',
    sender: sender || 'Anonymous',
    senderAddr: senderAddr || '',
    receiver: '',
    receiverRole: receiverRole || '',
    status: 'draft',
    layers: normalizeLayers(layers),
    gate: null,
    mirror: null,
    mirrorInput: null,
    mirrorBand: null,
    continuityScore: 0,
    gateBand: null,
    repairCount: 0,
    proofHash: '',
    createdAt: now,
    updatedAt: now,
    events: [{ kind: 'created', detail: title || 'Untitled baton', at: now }],
  };
}

export function filledLayerCount(layers) {
  const norm = normalizeLayers(layers);
  return LAYER_KEYS.filter((k) => norm[k].trim().length > 0).length;
}

export function withEvent(baton, kind, detail) {
  const events = (baton.events || []).slice();
  events.push({ kind, detail: detail || '', at: new Date().toISOString() });
  return { ...baton, events: events.slice(-50), updatedAt: new Date().toISOString() };
}
