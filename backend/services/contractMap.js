// contractMap.js
// ==============
// Translates the on-chain contract view shape (genlayer-js returns Map objects
// and the gate/mirror carry raw readings) into the exact shape the frontend
// scenes already expect. This keeps the existing premium UI intact while every
// value now comes from the live Intelligent Contract.

function pick(obj, key) {
  if (obj instanceof Map) return obj.get(key);
  if (obj && typeof obj === 'object') return obj[key];
  return undefined;
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

function num(v) {
  if (typeof v === 'bigint') return Number(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v) {
  return v === undefined || v === null ? '' : String(v);
}

// Build the five validator rows the UI renders, derived from the gate readings
// and the deterministic band the contract committed to.
function validatorsFromGate(readings, band, missingRequired) {
  const r = readings || {};
  const missing = Array.isArray(missingRequired) ? missingRequired : [];
  const contradiction = num(r.contradiction);
  const intent = num(r.intentPreservation);
  const dod = num(r.definitionOfDoneClarity);
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

function mapIssues(rawIssues) {
  if (!Array.isArray(rawIssues)) return [];
  return rawIssues.map((it) => ({
    type: 'Continuity',
    severity: 'High',
    reason: str(it),
    repairPrompt: 'Address this gap and re-run the continuity gate.',
  }));
}

// Map the contract's gate_result block into the UI gate shape.
function mapGate(rawGate) {
  if (!rawGate) return null;
  const g = rawGate instanceof Map ? toPlain(rawGate) : rawGate;
  const readings = g.readings || {};
  const band = str(g.band);
  const missingRequired = Array.isArray(g.missingRequired) ? g.missingRequired.map(str) : [];
  const completeness = num(readings.completeness);
  const intentPreservation = num(readings.intentPreservation);
  const riskClarity = num(readings.riskClarity);
  const nextActionClarity = num(readings.nextActionClarity);
  const definitionOfDoneClarity = num(readings.definitionOfDoneClarity);
  const contradiction = num(readings.contradiction);
  const continuityScore = Object.keys(readings).length
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
    issues: mapIssues(g.issues),
    rationale: str(g.rationale),
    validatorResults: validatorsFromGate(readings, band, missingRequired),
    missingRequired,
  };
}

// Map the contract's mirror block into the UI mirror shape.
function mapMirror(rawMirror) {
  if (!rawMirror) return null;
  const m = rawMirror instanceof Map ? toPlain(rawMirror) : rawMirror;
  const readings = m.readings || {};
  const band = str(m.band);
  const alignment = num(readings.alignment);
  const criticalOmission = num(readings.criticalOmission);
  const constraintViolated = num(readings.constraintViolated) >= 50;
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
    note: str(m.note),
  };
}

function mapEvents(rawEvents) {
  if (!Array.isArray(rawEvents)) return [];
  return rawEvents.map((e) => {
    const ev = e instanceof Map ? toPlain(e) : e;
    return { kind: str(ev.kind), detail: str(ev.detail), by: str(ev.by) };
  });
}

// Map a full get_baton response into the frontend baton record.
function mapBaton(raw) {
  if (!raw) return null;
  const b = raw instanceof Map ? toPlain(raw) : raw;
  const layers = b.layers && typeof b.layers === 'object' ? b.layers : {};
  return {
    id: str(b.id),
    seq: num(b.seq),
    title: str(b.title),
    sender: str(b.sender),
    senderAddr: str(b.sender),
    receiver: str(b.receiver),
    receiverAddr: str(b.receiver),
    receiverRole: str(b.receiverRole),
    status: str(b.status),
    gateBand: str(b.gateBand),
    continuityScore: num(b.continuityScore),
    mirrorBand: str(b.mirrorBand),
    repairCount: num(b.repairCount),
    proofHash: str(b.proofHash),
    layers,
    gate: mapGate(b.gate),
    mirror: mapMirror(b.mirror),
    events: mapEvents(b.events),
    proof: b.proof ? toPlain(b.proof) : null,
  };
}

// Map a get_batons list row (public state only, no layers/gate detail).
function mapBatonSummary(raw) {
  const b = raw instanceof Map ? toPlain(raw) : raw;
  return {
    id: str(b.id),
    seq: num(b.seq),
    title: str(b.title),
    sender: str(b.sender),
    senderAddr: str(b.sender),
    receiver: str(b.receiver),
    receiverAddr: str(b.receiver),
    receiverRole: str(b.receiverRole),
    status: str(b.status),
    gateBand: str(b.gateBand),
    continuityScore: num(b.continuityScore),
    mirrorBand: str(b.mirrorBand),
    repairCount: num(b.repairCount),
    proofHash: str(b.proofHash),
  };
}

module.exports = { toPlain, mapBaton, mapBatonSummary, mapGate, mapMirror, mapEvents, pick };
