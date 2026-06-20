// sceneManifest.js
// ================
// The ordered relay scenes. Drives the nav, the mini-map, and the router. Each
// scene is a station in the relay system; the order is the path a baton travels.

import {
  Radio,
  Boxes,
  PenLine,
  DoorOpen,
  Route,
  Waves,
  Wrench,
  ScrollText,
  Settings,
} from 'lucide-react';

export const SCENES = [
  { path: '/', id: 'opening', label: 'Opening Signal', short: 'Signal', icon: Radio, nav: true },
  { path: '/room', id: 'room', label: 'Relay Room', short: 'Room', icon: Boxes, nav: true },
  { path: '/compose', id: 'compose', label: 'Baton Composer', short: 'Compose', icon: PenLine, nav: true },
  { path: '/gate', id: 'gate', label: 'Continuity Gate', short: 'Gate', icon: DoorOpen, nav: true },
  { path: '/runway', id: 'runway', label: 'Relay Runway', short: 'Runway', icon: Route, nav: true },
  { path: '/mirror', id: 'mirror', label: 'Receiver Mirror', short: 'Mirror', icon: Waves, nav: true },
  { path: '/repair', id: 'repair', label: 'Repair Loop', short: 'Repair', icon: Wrench, nav: true },
  { path: '/ledger', id: 'ledger', label: 'Continuity Ledger', short: 'Ledger', icon: ScrollText, nav: true },
  { path: '/settings', id: 'settings', label: 'Settings', short: 'Settings', icon: Settings, nav: true },
];

// Scenes that take an optional :id of a baton in context.
export const GATE_PATH = '/gate';
export const RUNWAY_PATH = '/runway';
export const MIRROR_PATH = '/mirror';
export const REPAIR_PATH = '/repair';
