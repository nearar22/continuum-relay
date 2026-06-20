// routes/batons.js
// ================
// Baton lifecycle, backed by the LIVE GenLayer contract. Every mutation is a
// real on-chain transaction (sender signs create/gate/repair; receiver signs the
// mirror). Reads come straight from contract views. Each mutation broadcasts a
// relay event for the live UI.

const express = require('express');
const relay = require('../services/genlayerRelay');
const { mapBaton, mapBatonSummary } = require('../services/contractMap');

const router = express.Router();

const REQUIRED = ['mission', 'currentState', 'unresolvedRisks', 'nextAction', 'definitionOfDone'];
const OPTIONAL = ['originalIntent', 'completedWork', 'decisions', 'constraints', 'peopleWaiting'];

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// GET /api/batons
router.get('/', asyncRoute(async (req, res) => {
  const raw = await relay.readView('get_batons', [0]);
  const batons = Array.isArray(raw) ? raw.map(mapBatonSummary) : [];
  res.json({ batons });
}));

// POST /api/batons  { title, receiverRole, layers }
router.post('/', asyncRoute(async (req, res) => {
  const { emitRelay } = req.app.locals;
  const { title, receiverRole, layers } = req.body || {};
  if (!title || !layers || typeof layers !== 'object') {
    return res.status(400).json({ error: 'title and layers are required' });
  }
  const cleanLayers = {};
  for (const k of [...REQUIRED, ...OPTIONAL]) cleanLayers[k] = String(layers[k] || '').trim();

  await relay.writeAsSender('create_baton', [
    String(title), String(receiverRole || ''), JSON.stringify(cleanLayers),
  ]);

  // Read back the newest baton (the contract assigns the id).
  const list = await relay.readView('get_batons', [0]);
  const newest = Array.isArray(list) && list.length ? mapBatonSummary(list[0]) : null;
  if (newest) {
    emitRelay('baton:created', { batonId: newest.id, title: newest.title, status: newest.status });
  }
  res.status(201).json({ baton: newest });
}));

// GET /api/batons/:id
router.get('/:id', asyncRoute(async (req, res) => {
  const raw = await relay.readView('get_baton', [req.params.id]);
  const baton = mapBaton(raw);
  if (!baton || !baton.id) return res.status(404).json({ error: 'unknown baton' });
  res.json({ baton });
}));

// POST /api/batons/:id/evaluate  (continuity gate, on-chain AI write)
router.post('/:id/evaluate', asyncRoute(async (req, res) => {
  const { emitRelay } = req.app.locals;
  const id = req.params.id;
  emitRelay('baton:evaluating', { batonId: id });

  await relay.writeAsSender('evaluate_baton_completeness', [id]);

  const baton = mapBaton(await relay.readView('get_baton', [id]));
  const gate = baton.gate || { gateBand: baton.gateBand, continuityScore: baton.continuityScore };
  emitRelay('baton:gate_result', {
    batonId: id, gateBand: baton.gateBand, continuityScore: baton.continuityScore, status: baton.status,
  });
  res.json({ baton, gate });
}));

// POST /api/batons/:id/receiver-mirror  { mirror }
router.post('/:id/receiver-mirror', asyncRoute(async (req, res) => {
  const { emitRelay } = req.app.locals;
  const id = req.params.id;
  const { mirror } = req.body || {};
  if (!mirror || typeof mirror !== 'object') return res.status(400).json({ error: 'mirror is required' });
  if (!relay.hasReceiver()) {
    return res.status(503).json({ error: 'receiver signer not configured on the relay' });
  }

  await relay.writeAsReceiver('submit_receiver_mirror', [id, JSON.stringify(mirror)]);

  const baton = mapBaton(await relay.readView('get_baton', [id]));
  emitRelay('baton:received', {
    batonId: id, mirrorBand: baton.mirrorBand, canAccept: baton.mirror ? baton.mirror.canAccept : false,
  });
  res.json({ baton, mirror: baton.mirror });
}));

// POST /api/batons/:id/repair  { repairedLayers }
router.post('/:id/repair', asyncRoute(async (req, res) => {
  const { emitRelay } = req.app.locals;
  const id = req.params.id;
  const { repairedLayers } = req.body || {};
  if (!repairedLayers || typeof repairedLayers !== 'object') {
    return res.status(400).json({ error: 'repairedLayers is required' });
  }
  emitRelay('baton:repair_requested', { batonId: id });

  const patch = {};
  for (const [k, v] of Object.entries(repairedLayers)) {
    const nv = String(v || '').trim();
    if (nv) patch[k] = nv;
  }
  const result = await relay.writeAsSender('request_repair', [id, JSON.stringify(patch)]);

  const baton = mapBaton(await relay.readView('get_baton', [id]));
  const changed = Object.keys(patch).length;
  emitRelay('baton:repaired', { batonId: id, layersChanged: changed });
  res.json({ baton, layersChanged: changed, tx: result.txHash });
}));

module.exports = router;
