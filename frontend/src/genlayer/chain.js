// chain.js
// ========
// Direct connection to the live Continuum Relay Intelligent Contract on the
// GenLayer Bradbury testnet. The site reads baton state straight from contract
// views and writes through the user's own wallet (the contributor signs the
// create and gate; the receiver signs the mirror and accept). No backend, no
// mock: the chain is the single source of truth.

import { createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';

export const CONTRACT_ADDRESS = '0x506a4b01D85A23BdF5817EEA6DB370a550DD4753';
export const DEPLOY_TX = '0x39295612bbb8b02b98e0425b06bd4a46614f6fb07804ca4ed2f608842508fb6a';
export const EXPLORER = 'https://explorer-bradbury.genlayer.com';
export const FAUCET = 'https://testnet-faucet.genlayer.foundation/';
export const RPC_URL = 'https://rpc-bradbury.genlayer.com';
export const NETWORK_NAME = 'Bradbury';
export const CHAIN_ID = 4221;
export const CHAIN_ID_HEX = '0x107D';

export const addressUrl = (addr) => `${EXPLORER}/address/${addr}`;
export const txUrl = (hash) => `${EXPLORER}/tx/${hash}`;

export const readClient = createClient({ chain: testnetBradbury });
export const makeWalletClient = (account) => createClient({ chain: testnetBradbury, account });

// Reads can hit transient RPC errors; retry with exponential backoff.
export async function withRpcRetry(fn, tries = 5) {
  let last;
  for (let i = 0; i < tries; i += 1) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!/rate limit|429|timeout|network|fetch|ECONN|503|502|gateway/i.test(String(e))) throw e;
      await new Promise((r) => setTimeout(r, 2000 * 2 ** i));
    }
  }
  throw last;
}

// ----- value coercion (the SDK returns Map / bigint shapes) -----------------

function asNumber(v) {
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function asString(v) {
  return v === undefined || v === null ? '' : String(v);
}
function pick(obj, key) {
  if (obj instanceof Map) return obj.get(key);
  if (obj && typeof obj === 'object') return obj[key];
  return undefined;
}
function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v instanceof Map) return Array.from(v.values());
  return [];
}
function toPlain(v) {
  if (v instanceof Map) {
    const o = {};
    for (const [k, val] of v.entries()) o[k] = toPlain(val);
    return o;
  }
  if (Array.isArray(v)) return v.map(toPlain);
  if (typeof v === 'bigint') return Number(v);
  return v;
}

// ----- shape constants ------------------------------------------------------

export const REQUIRED_LAYERS = ['mission', 'currentState', 'unresolvedRisks', 'nextAction', 'definitionOfDone'];
export const OPTIONAL_LAYERS = ['originalIntent', 'completedWork', 'decisions', 'constraints', 'peopleWaiting'];

// ----- gate / mirror derived UI shapes --------------------------------------

function validatorsFromGate(readings, band, missingRequired) {
  const r = readings || {};
  const missing = Array.isArray(missingRequired) ? missingRequired : [];
  const contradiction = asNumber(r.contradiction);
  const intent = asNumber(r.intentPreservation);
  const dod = asNumber(r.definitionOfDoneClarity);
  return [
    {
      validator: 'Missing Context Validator',
      status: missing.length > 0 ? 'failed' : 'passed',
      reason: missing.length > 0
        ? `Missing required layers: ${missing.join(', ')}.`
        : 'All required handoff layers are present.',
    },
    {
      validator: 'Intent Preservation Validator',
      status: intent < 45 ? 'failed' : 'passed',
      reason: intent < 45
        ? 'The next action does not preserve the original intent.'
        : 'The next action serves the original intent.',
    },
    {
      validator: 'Contradiction Validator',
      status: contradiction >= 60 ? 'failed' : 'passed',
      reason: contradiction >= 60
        ? 'The baton contains incompatible instructions.'
        : 'No internal contradiction detected.',
    },
    {
      validator: 'Constraint Violation Validator',
      status: band === 'blocked' ? 'failed' : 'passed',
      reason: band === 'blocked'
        ? 'A protected constraint or contradiction blocks the pass.'
        : 'Protected constraints checked against the next action and definition of done.',
    },
    {
      validator: 'Definition of Done Validator',
      status: dod < 45 ? 'failed' : 'passed',
      reason: dod < 45
        ? 'Definition of done is missing or too vague to verify.'
        : 'Definition of done is concrete and verifiable.',
    },
  ];
}

function mapGate(rawGate) {
  if (!rawGate) return null;
  const g = toPlain(rawGate);
  const readings = g.readings || {};
  const band = asString(g.band);
  const missingRequired = Array.isArray(g.missingRequired) ? g.missingRequired.map(asString) : [];
  const completeness = asNumber(readings.completeness);
  const intentPreservation = asNumber(readings.intentPreservation);
  const riskClarity = asNumber(readings.riskClarity);
  const nextActionClarity = asNumber(readings.nextActionClarity);
  const definitionOfDoneClarity = asNumber(readings.definitionOfDoneClarity);
  const contradiction = asNumber(readings.contradiction);
  const hasReadings = Object.keys(readings).length > 0;
  const continuityScore = hasReadings
    ? Math.round((completeness + intentPreservation + riskClarity + nextActionClarity + definitionOfDoneClarity) / 5)
    : 0;
  return {
    gateBand: band,
    gateStatus: band === 'open' ? 'Gate Opens' : band === 'blocked' ? 'Blocked' : 'Needs Repair',
    continuityScore,
    contextCompleteness: completeness,
    intentPreservation,
    riskClarity,
    nextActionClarity,
    definitionOfDoneClarity,
    contradiction,
    constraintSafety: band === 'blocked' ? 20 : 92,
    issues: Array.isArray(g.issues)
      ? g.issues.map((it) => ({ type: 'Continuity', severity: 'High', reason: asString(it), repairPrompt: 'Address this gap and re-run the continuity gate.' }))
      : [],
    rationale: asString(g.rationale),
    validatorResults: validatorsFromGate(readings, band, missingRequired),
    missingRequired,
  };
}

function mapMirror(rawMirror) {
  if (!rawMirror) return null;
  const m = toPlain(rawMirror);
  const readings = m.readings || {};
  const band = asString(m.band);
  const alignment = asNumber(readings.alignment);
  const criticalOmission = asNumber(readings.criticalOmission);
  const constraintViolated = asNumber(readings.constraintViolated) >= 50;
  const labelMap = {
    match: 'Understanding Match',
    partial: 'Partial Match',
    misunderstanding: 'Misunderstanding Detected',
    critical_omission: constraintViolated ? 'Critical Misunderstanding' : 'Critical Omission',
  };
  return {
    band,
    label: labelMap[band] || band,
    alignment,
    criticalOmission,
    constraintViolated,
    canAccept: band === 'match' || band === 'partial',
    note: asString(m.note),
  };
}

export function normBatonSummary(raw) {
  return {
    id: asString(pick(raw, 'id')),
    seq: asNumber(pick(raw, 'seq')),
    title: asString(pick(raw, 'title')),
    sender: asString(pick(raw, 'sender')),
    senderAddr: asString(pick(raw, 'sender')),
    receiver: asString(pick(raw, 'receiver')),
    receiverAddr: asString(pick(raw, 'receiver')),
    receiverRole: asString(pick(raw, 'receiverRole')),
    status: asString(pick(raw, 'status')),
    gateBand: asString(pick(raw, 'gateBand')),
    continuityScore: asNumber(pick(raw, 'continuityScore')),
    mirrorBand: asString(pick(raw, 'mirrorBand')),
    repairCount: asNumber(pick(raw, 'repairCount')),
    proofHash: asString(pick(raw, 'proofHash')),
    // Safe defaults: the list view carries only public summary fields. Scenes
    // that read layers/gate/mirror fetch the full baton separately; until that
    // resolves these defaults keep the UI from crashing on a partial baton.
    layers: {},
    gate: null,
    mirror: null,
    events: [],
    proof: null,
  };
}

export function normBaton(raw) {
  const b = toPlain(raw);
  const layers = b.layers && typeof b.layers === 'object' ? b.layers : {};
  return {
    id: asString(b.id),
    seq: asNumber(b.seq),
    title: asString(b.title),
    sender: asString(b.sender),
    senderAddr: asString(b.sender),
    receiver: asString(b.receiver),
    receiverAddr: asString(b.receiver),
    receiverRole: asString(b.receiverRole),
    status: asString(b.status),
    gateBand: asString(b.gateBand),
    continuityScore: asNumber(b.continuityScore),
    mirrorBand: asString(b.mirrorBand),
    repairCount: asNumber(b.repairCount),
    proofHash: asString(b.proofHash),
    layers,
    gate: mapGate(b.gate),
    mirror: mapMirror(b.mirror),
    events: Array.isArray(b.events) ? b.events.map((e) => ({ kind: asString(pick(e, 'kind')), detail: asString(pick(e, 'detail')), by: asString(pick(e, 'by')) })) : [],
    proof: b.proof ? toPlain(b.proof) : null,
  };
}

// ----- view reads -----------------------------------------------------------

async function readView(functionName, args = []) {
  return withRpcRetry(() => readClient.readContract({ address: CONTRACT_ADDRESS, functionName, args }));
}

export async function fetchBatons(limit = 60) {
  const out = [];
  let start = 0;
  for (let guard = 0; guard < 200; guard += 1) {
    const page = asArray(await readView('get_batons', [start])).map(normBatonSummary);
    out.push(...page);
    if (page.length < 20 || out.length >= limit) break;
    start += page.length;
  }
  return out.slice(0, limit);
}

export async function fetchBaton(id) {
  return normBaton(await readView('get_baton', [id]));
}

export async function fetchStats() {
  const raw = toPlain(await readView('get_stats'));
  return {
    batons: asNumber(raw.batons),
    evaluations: asNumber(raw.evaluations),
    accepted: asNumber(raw.accepted),
  };
}

export async function fetchProof(id) {
  return toPlain(await readView('get_proof', [id]));
}
