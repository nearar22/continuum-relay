// localContinuityEngine.js
// =========================
// The backend's copy of the deterministic continuity engine. It is the same
// logic the frontend mock and the GenLayer contract apply: not a field-presence
// check, but a semantic reading of the handoff (intent vs next action, internal
// contradiction, protected-constraint safety, risk and done clarity), collapsed
// into a gate band. Kept dependency-free so the backend runs offline.

const REQUIRED_LAYERS = ['mission', 'currentState', 'unresolvedRisks', 'nextAction', 'definitionOfDone'];
const OPTIONAL_LAYERS = ['originalIntent', 'completedWork', 'decisions', 'constraints', 'peopleWaiting'];
const ALL_LAYERS = [...REQUIRED_LAYERS, ...OPTIONAL_LAYERS];

const VAGUE_WORDS = ['stuff', 'things', 'etc', 'tbd', 'somehow', 'various', 'misc', 'whatever', 'figure it out', 'as needed', 'and so on', 'we will see', 'later'];
const COMPLETION_CLAIMS = ['done', 'complete', 'completed', 'finished', 'shipped', 'ready'];
const WORK_REMAINING = ['implement', 'build', 'write', 'add', 'fix', 'finish', 'create', 'design', 'review', 'test', 'develop'];
const NEGATION_CONSTRAINT = ['do not', "don't", 'never', 'must not', 'cannot', 'should not', 'avoid', 'keep private', 'confidential', 'private'];
const ACTION_NEGATION = ['do not', "don't", 'never', 'must not', 'cannot', 'should not', 'avoid', 'without'];
const EXPOSURE_VERBS = ['expose', 'publish', 'reveal', 'share', 'show', 'release', 'leak', 'post', 'display', 'make public'];

const norm = (s) => String(s || '').toLowerCase().trim();
const words = (s) => norm(s).replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

function overlapRatio(a, b) {
  const wa = new Set(words(a).filter((w) => w.length > 3));
  const wb = new Set(words(b).filter((w) => w.length > 3));
  if (wa.size === 0 || wb.size === 0) return 0;
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared += 1;
  return shared / Math.min(wa.size, wb.size);
}

function lengthScore(text, ideal = 60) {
  const n = norm(text).length;
  if (n === 0) return 0;
  if (n < 12) return 25;
  if (n < ideal) return clamp(40 + (n / ideal) * 45);
  return clamp(85 + Math.min(15, (n - ideal) / 40));
}

function vaguePenalty(text) {
  const t = norm(text);
  let hits = 0;
  for (const v of VAGUE_WORDS) if (t.includes(v)) hits += 1;
  return Math.min(40, hits * 14);
}

function detectContradictions(baton) {
  const issues = [];
  const constraints = norm(baton.constraints);
  const nextAction = norm(baton.nextAction);
  const dod = norm(baton.definitionOfDone);
  const state = norm(baton.currentState);

  const constraintForbidsExposure =
    NEGATION_CONSTRAINT.some((n) => constraints.includes(n)) && EXPOSURE_VERBS.some((v) => constraints.includes(v));
  if (constraintForbidsExposure) {
    const target = EXPOSURE_VERBS.find((v) => constraints.includes(v));
    const proposesForbidden =
      (nextAction + ' ' + dod).includes(target) && !ACTION_NEGATION.some((n) => nextAction.includes(n));
    if (proposesForbidden) {
      issues.push({
        type: 'Contradiction',
        severity: 'High',
        reason: 'A protected constraint forbids an action the next action or definition of done appears to require.',
        repairPrompt: 'Align the next action with the protected constraint, or relax the constraint explicitly.',
      });
    }
  }

  const claimsDone = COMPLETION_CLAIMS.some((c) => state.includes(c));
  const remainingCore = WORK_REMAINING.filter((w) => nextAction.includes(w)).length;
  if (claimsDone && remainingCore >= 1 && norm(baton.completedWork) === '') {
    issues.push({
      type: 'Fake Completion',
      severity: 'High',
      reason: 'The current state claims completion while the next action still requires core implementation.',
      repairPrompt: 'Clarify what is actually finished versus what still needs core work before this handoff.',
    });
  }
  return issues;
}

function buildValidatorResults({ missingRequired, contradictions, definitionOfDoneClarity = 100, intentPreservation = 100 }) {
  const hasContradiction = contradictions && contradictions.some((c) => c.type === 'Contradiction');
  return [
    {
      validator: 'Missing Context Validator',
      status: missingRequired && missingRequired.length > 0 ? 'failed' : 'passed',
      reason: missingRequired && missingRequired.length > 0 ? `Missing required layers: ${missingRequired.join(', ')}.` : 'All required handoff layers are present.',
    },
    {
      validator: 'Intent Preservation Validator',
      status: intentPreservation < 45 ? 'failed' : 'passed',
      reason: intentPreservation < 45 ? 'The next action does not preserve the original intent.' : 'The next action serves the original intent.',
    },
    {
      validator: 'Contradiction Validator',
      status: hasContradiction ? 'failed' : 'passed',
      reason: hasContradiction ? 'The baton contains incompatible instructions.' : 'No internal contradiction detected.',
    },
    {
      validator: 'Constraint Violation Validator',
      status: hasContradiction ? 'failed' : 'passed',
      reason: 'Protected constraints checked against the next action and definition of done.',
    },
    {
      validator: 'Definition of Done Validator',
      status: definitionOfDoneClarity < 45 ? 'failed' : 'passed',
      reason: definitionOfDoneClarity < 45 ? 'Definition of done is missing or too vague to verify.' : 'Definition of done is concrete and verifiable.',
    },
  ];
}

function evaluateBatonContinuity(baton) {
  const missingRequired = REQUIRED_LAYERS.filter((k) => norm(baton[k]).length < 2);
  if (missingRequired.length > 0) {
    return {
      batonId: baton.id || null,
      gateStatus: 'Needs Repair',
      gateBand: 'needs_repair',
      continuityScore: 0,
      intentPreservation: 0,
      contextCompleteness: 0,
      riskClarity: 0,
      nextActionClarity: 0,
      constraintSafety: 100,
      definitionOfDoneClarity: 0,
      contradiction: 0,
      issues: missingRequired.map((m) => ({
        type: 'Missing Context',
        severity: 'High',
        reason: `The baton is missing a required layer: ${m}.`,
        repairPrompt: `Add the ${m} so the receiver can continue without guessing.`,
      })),
      validatorResults: buildValidatorResults({ missingRequired, contradictions: [] }),
      missingRequired,
      mockProofHash: null,
    };
  }

  const contradictions = detectContradictions(baton);
  const contextCompleteness = clamp(
    0.35 * lengthScore(baton.currentState) +
      0.25 * lengthScore(baton.unresolvedRisks) +
      0.2 * lengthScore(baton.completedWork || baton.currentState, 40) +
      0.2 * lengthScore(baton.decisions || baton.originalIntent || baton.mission, 40),
  );
  const intentPreservation = clamp(52 + overlapRatio(`${baton.mission} ${baton.originalIntent} ${baton.completedWork}`, baton.nextAction) * 48 - vaguePenalty(baton.nextAction) * 0.5);
  const riskClarity = clamp(lengthScore(baton.unresolvedRisks, 50) - vaguePenalty(baton.unresolvedRisks));
  const nextActionClarity = clamp(lengthScore(baton.nextAction, 50) - vaguePenalty(baton.nextAction));
  const definitionOfDoneClarity = clamp(lengthScore(baton.definitionOfDone, 50) - vaguePenalty(baton.definitionOfDone));
  const constraintSafety = contradictions.some((i) => i.type === 'Contradiction') ? 20 : 92;
  const contradictionScore = contradictions.length > 0 ? 70 : 8;

  const issues = [...contradictions];
  if (definitionOfDoneClarity < 45) issues.push({ type: 'Missing Context', severity: 'High', reason: "The baton does not clearly define what 'done' means for the receiver.", repairPrompt: 'Add a concrete definition of done that the receiver can verify.' });
  if (riskClarity < 45) issues.push({ type: 'Risk Ambiguity', severity: 'Medium', reason: 'Unresolved risks are mentioned but not explained well enough to act on.', repairPrompt: 'Describe the main unresolved risk and why it matters.' });
  if (intentPreservation < 45) issues.push({ type: 'Intent Drift', severity: 'High', reason: 'The next action does not clearly serve the original intent or mission.', repairPrompt: 'Rewrite the next action so it visibly advances the stated mission.' });

  const continuityScore = clamp((contextCompleteness + intentPreservation + riskClarity + nextActionClarity + definitionOfDoneClarity) / 5);

  let gateBand;
  if (contradictionScore >= 60) gateBand = 'blocked';
  else {
    const open = Math.min(contextCompleteness, intentPreservation);
    const needs = 100 - contextCompleteness;
    gateBand = open >= needs && open >= 55 ? 'open' : 'needs_repair';
  }
  const gateStatus = gateBand === 'open' ? 'Gate Opens' : gateBand === 'blocked' ? 'Blocked' : 'Needs Repair';

  return {
    batonId: baton.id || null,
    gateStatus,
    gateBand,
    continuityScore,
    intentPreservation,
    contextCompleteness,
    riskClarity,
    nextActionClarity,
    constraintSafety,
    definitionOfDoneClarity,
    contradiction: contradictionScore,
    issues,
    validatorResults: buildValidatorResults({ missingRequired: [], contradictions, definitionOfDoneClarity, intentPreservation }),
    missingRequired: [],
    mockProofHash: null,
  };
}

function compareReceiverMirror(baton, receiverMirror) {
  const constraints = norm(baton.constraints);
  const rConstraint = norm(receiverMirror.constraint);
  const rNext = norm(receiverMirror.nextAction);
  const rTask = norm(receiverMirror.task);

  let constraintViolated = false;
  const constraintForbidsExposure = NEGATION_CONSTRAINT.some((n) => constraints.includes(n)) && EXPOSURE_VERBS.some((v) => constraints.includes(v));
  if (constraintForbidsExposure) {
    const forbiddenVerb = EXPOSURE_VERBS.find((v) => constraints.includes(v));
    const receiverPlan = rNext + ' ' + rTask;
    const receiverDoesIt = EXPOSURE_VERBS.some((v) => receiverPlan.includes(v)) && !ACTION_NEGATION.some((n) => receiverPlan.includes(n));
    if (receiverDoesIt) constraintViolated = true;
    if (rConstraint && rConstraint.includes(forbiddenVerb) && !NEGATION_CONSTRAINT.some((n) => rConstraint.includes(n))) constraintViolated = true;
  }

  const alignment = clamp(
    30 +
      overlapRatio(baton.nextAction, receiverMirror.nextAction) * 35 +
      overlapRatio(`${baton.mission} ${baton.originalIntent}`, receiverMirror.task) * 25 +
      overlapRatio(baton.definitionOfDone, receiverMirror.definitionOfDone) * 10,
  );
  const omissionScore = clamp(
    (norm(receiverMirror.keyRisk).length < 8 ? 40 : 0) +
      (norm(receiverMirror.definitionOfDone).length < 8 ? 35 : 0) +
      (norm(receiverMirror.nextAction).length < 8 ? 30 : 0),
  );

  let band;
  if (constraintViolated) band = 'critical_omission';
  else if (omissionScore >= 60) band = 'critical_omission';
  else if (alignment >= 75) band = 'match';
  else if (alignment >= 45) band = 'partial';
  else band = 'misunderstanding';

  const labelMap = {
    match: 'Understanding Match',
    partial: 'Partial Match',
    misunderstanding: 'Misunderstanding Detected',
    critical_omission: constraintViolated ? 'Critical Misunderstanding' : 'Critical Omission',
  };
  let note;
  if (constraintViolated) note = 'Receiver interpretation violates a protected constraint; acceptance is blocked.';
  else if (band === 'critical_omission') note = 'The receiver omitted something essential (a key risk, the next action, or the definition of done).';
  else if (band === 'match') note = 'The receiver restated the task, action, and constraints consistently with the baton.';
  else if (band === 'partial') note = 'The receiver mostly understands the handoff but some details diverge from the baton.';
  else note = 'The receiver restatement diverges significantly from the original baton.';

  return { band, label: labelMap[band], alignment, criticalOmission: omissionScore, constraintViolated, canAccept: band === 'match' || band === 'partial', note };
}

function suggestRepairs(baton, evaluation) {
  const ev = evaluation || evaluateBatonContinuity(baton);
  const layerForIssue = (type) => ({ 'Missing Context': 'definitionOfDone', 'Risk Ambiguity': 'unresolvedRisks', 'Intent Drift': 'nextAction', Contradiction: 'constraints', 'Fake Completion': 'currentState' }[type] || 'currentState');
  return (ev.issues || []).map((issue) => ({ layer: layerForIssue(issue.type), type: issue.type, severity: issue.severity, reason: issue.reason, repairPrompt: issue.repairPrompt }));
}

function mockProofHash(baton, evaluation, mirror) {
  const seed = [baton.id, baton.sender || '', baton.receiver || '', evaluation ? evaluation.continuityScore : 0, evaluation ? evaluation.gateBand : '', mirror ? mirror.band : '', baton.repairCount || 0].join('|');
  let h = BigInt('14695981039346656037');
  const prime = BigInt('1099511628211');
  const mod = BigInt(2) ** BigInt(64);
  for (const ch of seed) {
    h ^= BigInt(ch.charCodeAt(0));
    h = (h * prime) % mod;
  }
  return '0x' + h.toString(16).padStart(16, '0');
}

module.exports = {
  REQUIRED_LAYERS,
  OPTIONAL_LAYERS,
  ALL_LAYERS,
  evaluateBatonContinuity,
  compareReceiverMirror,
  suggestRepairs,
  mockProofHash,
};
