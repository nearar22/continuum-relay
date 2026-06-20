// layerMeta.js
// ============
// Presentation metadata for the twelve context layers a baton carries. Order,
// labels, helper text, required flags, and the accent each layer orbits with in
// the visual baton. The required set matches REQUIRED_LAYERS in the engine.

import {
  Compass,
  Target,
  Activity,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  ShieldAlert,
  ArrowRightCircle,
  Flag,
  Users,
} from 'lucide-react';

export const LAYER_META = [
  {
    key: 'mission',
    label: 'Mission',
    icon: Compass,
    required: true,
    accent: 'var(--relay-amber)',
    help: 'The objective the receiver is continuing.',
    placeholder: 'What is the receiver continuing toward?',
  },
  {
    key: 'originalIntent',
    label: 'Original intent',
    icon: Target,
    required: false,
    accent: 'var(--signal-teal)',
    help: 'The deeper why behind the work, beyond the headline.',
    placeholder: 'Why does this matter, in spirit?',
  },
  {
    key: 'currentState',
    label: 'Current state',
    icon: Activity,
    required: true,
    accent: 'var(--voltage-blue)',
    help: 'Where things actually stand right now.',
    placeholder: 'What is done, what is in flight, what is stuck?',
  },
  {
    key: 'completedWork',
    label: 'Completed work',
    icon: CheckCircle2,
    required: false,
    accent: 'var(--success)',
    help: 'Concrete work already finished.',
    placeholder: 'What can the receiver rely on as done?',
  },
  {
    key: 'unresolvedRisks',
    label: 'Unresolved risks',
    icon: AlertTriangle,
    required: true,
    accent: 'var(--warning)',
    help: 'The risk most likely to bite if ignored.',
    placeholder: 'What could go wrong, and why does it matter?',
  },
  {
    key: 'decisions',
    label: 'Decisions',
    icon: GitBranch,
    required: false,
    accent: 'var(--voltage-blue)',
    help: 'Decisions made that must hold.',
    placeholder: 'What has been decided, and why?',
  },
  {
    key: 'constraints',
    label: 'Protected constraints',
    icon: ShieldAlert,
    required: false,
    accent: 'var(--soft-infrared)',
    help: 'Hard boundaries the receiver must never cross.',
    placeholder: 'What must never be done or exposed?',
  },
  {
    key: 'nextAction',
    label: 'Next action',
    icon: ArrowRightCircle,
    required: true,
    accent: 'var(--relay-amber)',
    help: 'The single next concrete step.',
    placeholder: 'What should the receiver do first?',
  },
  {
    key: 'definitionOfDone',
    label: 'Definition of done',
    icon: Flag,
    required: true,
    accent: 'var(--signal-teal)',
    help: 'The verifiable condition that means finished.',
    placeholder: 'How will the receiver know it is complete?',
  },
  {
    key: 'peopleWaiting',
    label: 'People waiting',
    icon: Users,
    required: false,
    accent: 'var(--muted-steel)',
    help: 'Who is blocked or watching for the outcome.',
    placeholder: 'Who is waiting on this handoff?',
  },
];

export const LAYER_KEYS = LAYER_META.map((l) => l.key);

export function getLayerMeta(key) {
  return LAYER_META.find((l) => l.key === key) || null;
}

export function emptyLayers() {
  const out = {};
  for (const l of LAYER_META) out[l.key] = '';
  return out;
}
