// routes/proofs.js
// ================
// Continuity proofs read directly from the live contract: the tamper-evident
// record the contract mints when a baton is accepted.

const express = require('express');
const relay = require('../services/genlayerRelay');
const { toPlain } = require('../services/contractMap');

const router = express.Router();

router.get('/:id', (req, res, next) => {
  relay
    .readView('get_proof', [req.params.id])
    .then((raw) => res.json({ proof: toPlain(raw) }))
    .catch(() => res.status(404).json({ error: 'no continuity proof for this baton' }));
});

module.exports = router;
