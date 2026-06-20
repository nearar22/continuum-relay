// exportImport.js
// ===============
// JSON export and import for batons, plus a single-baton duplicate helper. Pure
// functions plus a browser download/upload pair. Import is defensive: it never
// throws on bad input, it returns a result object the caller can surface.

import { normalizeLayers, nextLocalId } from './batonBuilder.js';

const EXPORT_VERSION = 1;

export function serializeBatons(batons) {
  return JSON.stringify(
    {
      kind: 'continuum-relay-export',
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      count: batons.length,
      batons,
    },
    null,
    2,
  );
}

export function downloadJson(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportBatonsToFile(batons, filename = 'continuum-relay-batons.json') {
  downloadJson(filename, serializeBatons(batons));
}

export function exportSingleBaton(baton) {
  const safe = (baton.title || 'baton').replace(/[^\w-]+/g, '-').toLowerCase();
  downloadJson(`${safe}.json`, JSON.stringify(baton, null, 2));
}

// Parse an imported export blob (or a single baton) into a clean baton array.
export function parseImport(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'The file is not valid JSON.', batons: [] };
  }

  let rawBatons = [];
  if (Array.isArray(data)) rawBatons = data;
  else if (data && Array.isArray(data.batons)) rawBatons = data.batons;
  else if (data && data.id && data.layers) rawBatons = [data];
  else return { ok: false, error: 'No batons found in the file.', batons: [] };

  const batons = rawBatons
    .filter((b) => b && typeof b === 'object')
    .map((b) => sanitizeImportedBaton(b));

  if (batons.length === 0) {
    return { ok: false, error: 'The file contained no usable batons.', batons: [] };
  }
  return { ok: true, error: null, batons };
}

function sanitizeImportedBaton(b) {
  const now = new Date().toISOString();
  return {
    id: typeof b.id === 'string' ? b.id : nextLocalId(),
    seq: Number(b.seq) || 0,
    title: String(b.title || 'Imported baton'),
    sender: String(b.sender || 'Anonymous'),
    senderAddr: String(b.senderAddr || ''),
    receiver: String(b.receiver || ''),
    receiverRole: String(b.receiverRole || ''),
    status: String(b.status || 'draft'),
    layers: normalizeLayers(b.layers),
    gate: b.gate || null,
    mirror: b.mirror || null,
    mirrorInput: b.mirrorInput || null,
    mirrorBand: b.mirrorBand || null,
    continuityScore: Number(b.continuityScore) || 0,
    gateBand: b.gateBand || null,
    repairCount: Number(b.repairCount) || 0,
    proofHash: String(b.proofHash || ''),
    createdAt: b.createdAt || now,
    updatedAt: b.updatedAt || now,
    events: Array.isArray(b.events) ? b.events.slice(-50) : [{ kind: 'imported', detail: '', at: now }],
  };
}

// Read a File object (from an <input type=file>) and resolve its text.
export function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsText(file);
  });
}
