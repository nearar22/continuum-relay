// relaySocket.js
// ==============
// Real-time relay channel. Clients subscribe and receive baton motion events
// (created, evaluating, gate_result, passed, received, repair_requested,
// repaired, accepted) so the Relay Runway and Relay Room animate live.

const RELAY_EVENTS = [
  'baton:created',
  'baton:evaluating',
  'baton:gate_result',
  'baton:passed',
  'baton:received',
  'baton:repair_requested',
  'baton:repaired',
  'baton:accepted',
];

function registerRelaySocket(io) {
  io.on('connection', (socket) => {
    socket.emit('relay:hello', { ok: true, events: RELAY_EVENTS, at: new Date().toISOString() });
    socket.on('relay:ping', () => socket.emit('relay:pong', { at: new Date().toISOString() }));
  });
}

function emitRelay(io, event, payload) {
  if (!io) return;
  io.emit(event, { ...payload, at: new Date().toISOString() });
}

module.exports = { registerRelaySocket, emitRelay, RELAY_EVENTS };
