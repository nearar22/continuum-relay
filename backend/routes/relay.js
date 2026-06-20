// routes/relay.js
// ===============
// Relay motion against the LIVE contract. Passing is a UI motion state (the
// contract has no separate pass step; a baton is "ready" once the gate opens).
// Acceptance calls accept_baton signed by the receiver, and the contract mints
// the continuity proof. Acceptance is gated in the contract by the mirror band.

const express = require('express');
const relay = require('../services/genlayerRelay');
const { mapBaton } = require('../services/contractMap');

const router = express.Router();

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// POST /api/relay/:id/pass  (sender releases the baton onto the runway; UI state)
router.post('/:id/pass', asyncRoute(async (req, res) => {
  const { emitRelay } = req.app.locals;
  const id = req.params.id;
  const baton = mapBaton(await relay.readView('get_baton', [id]));
  if (!baton || !baton.id) return res.status(404).json({ error: 'unknown baton' });
  if (baton.status !== 'ready_to_accept' && baton.status !== 'receiver_clarification') {
    return res.status(409).json({ error: 'baton must clear the continuity gate before it can be passed' });
  }
  emitRelay('baton:passed', { batonId: id });
  res.json({ baton });
}));

// POST /api/relay/:id/accept  (receiver accepts; contract mints continuity proof)
router.post('/:id/accept', asyncRoute(async (req, res) => {
  const { emitRelay } = req.app.locals;
  const id = req.params.id;
  if (!relay.hasReceiver()) {
    return res.status(503).json({ error: 'receiver signer not configured on the relay' });
  }

  await relay.writeAsReceiver('accept_baton', [id]);

  const baton = mapBaton(await relay.readView('get_baton', [id]));
  let proof = null;
  try {
    proof = await relay.readView('get_proof', [id]);
    proof = require('../services/contractMap').toPlain(proof);
  } catch {
    proof = baton.proof;
  }
  emitRelay('baton:accepted', { batonId: id, proofHash: baton.proofHash });
  res.json({ baton, proof });
}));

// On-chain state is immutable from the relay: clear/reseed are not supported
// against the live contract. Respond clearly instead of silently no-opping.
router.post('/clear', (req, res) => {
  res.status(409).json({ error: 'state lives on-chain and cannot be cleared from the relay' });
});

router.post('/reseed', (req, res) => {
  res.status(409).json({ error: 'state lives on-chain; seed by creating batons through the relay' });
});

module.exports = router;
