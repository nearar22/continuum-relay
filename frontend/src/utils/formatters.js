// formatters.js
// =============
// Small pure display helpers shared across scenes. No side effects.

export function shortAddr(addr) {
  if (!addr) return '';
  const a = String(addr);
  if (a.length <= 12) return a;
  return `${a.slice(0, 5)}...${a.slice(-4)}`;
}

export function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

export function formatDateShort(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return String(iso);
  }
}

export function relativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

const STATUS_LABELS = {
  draft: 'Draft',
  needs_repair: 'Needs repair',
  blocked: 'Blocked',
  ready_to_accept: 'Ready to accept',
  receiver_clarification: 'Receiver mirror',
  accepted: 'Accepted',
  completed: 'Completed',
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || 'Unknown';
}

const STATUS_TONES = {
  draft: 'muted',
  needs_repair: 'warning',
  blocked: 'error',
  ready_to_accept: 'teal',
  receiver_clarification: 'voltage',
  accepted: 'success',
  completed: 'success',
};

export function statusTone(status) {
  return STATUS_TONES[status] || 'muted';
}

const GATE_LABELS = {
  open: 'Gate opens',
  needs_repair: 'Needs repair',
  blocked: 'Blocked',
};

export function gateBandLabel(band) {
  return GATE_LABELS[band] || 'Not evaluated';
}

const MIRROR_LABELS = {
  match: 'Understanding match',
  partial: 'Partial match',
  misunderstanding: 'Misunderstanding detected',
  critical_omission: 'Critical omission',
};

export function mirrorBandLabel(band) {
  return MIRROR_LABELS[band] || 'No mirror';
}

export function scoreTone(score) {
  if (score >= 75) return 'success';
  if (score >= 50) return 'warning';
  return 'error';
}

export function clampScore(n) {
  const v = Math.round(Number(n) || 0);
  return Math.max(0, Math.min(100, v));
}

export function titleCase(str) {
  return String(str || '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
