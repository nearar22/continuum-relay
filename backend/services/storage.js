// storage.js
// ===========
// Local JSON-file persistence for batons and proofs. No external database, no
// network. The store is loaded once, mutated in memory, and flushed to disk on
// every change so a restart preserves the relay history.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'storage');
const DB_FILE = path.join(DATA_DIR, 'relay.json');
const SEED_FILE = path.join(DATA_DIR, 'seed.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load() {
  ensureDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch {
      // fall through to seed on corrupt file
    }
  }
  if (fs.existsSync(SEED_FILE)) {
    try {
      const seeded = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
      const db = { batons: seeded.batons || [], proofs: {}, seq: (seeded.batons || []).length };
      flush(db);
      return db;
    } catch {
      // fall through to empty
    }
  }
  const empty = { batons: [], proofs: {}, seq: 0 };
  flush(empty);
  return empty;
}

let db = load();

function flush(next) {
  ensureDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(next || db, null, 2), 'utf8');
}

module.exports = {
  listBatons() {
    return db.batons.slice().sort((a, b) => b.seq - a.seq);
  },
  getBaton(id) {
    return db.batons.find((b) => b.id === id) || null;
  },
  createBaton(baton) {
    db.seq += 1;
    const id = `baton-${db.seq}`;
    const now = new Date().toISOString();
    const record = {
      id,
      seq: db.seq,
      createdAt: now,
      updatedAt: now,
      status: 'draft',
      gate: null,
      mirror: null,
      proofHash: '',
      repairCount: 0,
      events: [{ kind: 'created', detail: baton.title || id, at: now }],
      ...baton,
    };
    db.batons.push(record);
    flush();
    return record;
  },
  updateBaton(id, patch) {
    const idx = db.batons.findIndex((b) => b.id === id);
    if (idx < 0) return null;
    db.batons[idx] = { ...db.batons[idx], ...patch, updatedAt: new Date().toISOString() };
    flush();
    return db.batons[idx];
  },
  addEvent(id, kind, detail) {
    const b = this.getBaton(id);
    if (!b) return null;
    b.events = b.events || [];
    b.events.push({ kind, detail: detail || '', at: new Date().toISOString() });
    b.events = b.events.slice(-50);
    flush();
    return b;
  },
  setProof(id, proof) {
    db.proofs[id] = proof;
    flush();
    return proof;
  },
  getProof(id) {
    return db.proofs[id] || null;
  },
  clearAll() {
    db = { batons: [], proofs: {}, seq: 0 };
    flush();
    return db;
  },
  reseed() {
    db = load();
    if (fs.existsSync(SEED_FILE)) {
      const seeded = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
      db = { batons: seeded.batons || [], proofs: {}, seq: (seeded.batons || []).length };
      flush();
    }
    return db;
  },
};
