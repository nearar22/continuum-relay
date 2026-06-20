// server.js
// =========
// Continuum Relay backend. A thin relayer in front of the LIVE GenLayer
// Intelligent Contract: it forwards baton lifecycle calls as real on-chain
// transactions and reads all state from contract views. No mock, no local
// database. Express REST API plus a Socket.io channel that broadcasts baton
// motion so the Relay Room and Relay Runway animate live.
//
// Start with: npm start (from the backend folder). Requires GENLAYER_PRIVATE_KEY
// (sender) and RECEIVER_PRIVATE_KEY (receiver) in the environment or .env.

const path = require('path');
const fs = require('fs');

// Load the workspace .env (shared deployer key) then the backend .env.
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Fallback: load the generated receiver key if not provided in the environment.
if (!process.env.RECEIVER_PRIVATE_KEY) {
  const rk = path.join(__dirname, '..', 'scripts', 'receiver_key.txt');
  if (fs.existsSync(rk)) {
    process.env.RECEIVER_PRIVATE_KEY = fs.readFileSync(rk, 'utf8').trim();
  }
}

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const relay = require('./services/genlayerRelay');
const { registerRelaySocket, emitRelay } = require('./socket/relaySocket');
const batonsRouter = require('./routes/batons');
const relayRouter = require('./routes/relay');
const proofsRouter = require('./routes/proofs');

const PORT = process.env.PORT || 4500;

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (req, res) => {
  let batons = null;
  try {
    const stats = await relay.readView('get_stats');
    batons = require('./services/contractMap').toPlain(stats);
  } catch {
    batons = null;
  }
  res.json({
    ok: true,
    service: 'continuum-relay',
    mode: 'genlayer-live',
    contract: relay.CONTRACT_ADDRESS,
    sender: relay.senderAddress(),
    receiver: relay.receiverAddress(),
    hasReceiver: relay.hasReceiver(),
    stats: batons,
    time: new Date().toISOString(),
  });
});

app.use('/api/batons', batonsRouter);
app.use('/api/relay', relayRouter);
app.use('/api/proofs', proofsRouter);

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-unused-vars, no-console
  console.error('relay error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'internal error' });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
registerRelaySocket(io);

app.locals.emitRelay = (event, payload) => emitRelay(io, event, payload);

if (require.main === module) {
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Continuum Relay backend (GenLayer live) on http://localhost:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`  contract: ${relay.CONTRACT_ADDRESS}`);
    // eslint-disable-next-line no-console
    console.log(`  sender:   ${relay.senderAddress()}`);
    // eslint-disable-next-line no-console
    console.log(`  receiver: ${relay.receiverAddress()} (configured: ${relay.hasReceiver()})`);
  });
}

module.exports = { app, server };
