// App.jsx
// =======
// Top-level router. The AppShell renders the persistent chrome; the Routes swap
// the active scene with a cinematic transition. Every scene is wrapped so a
// data error inside it never removes the chrome.

import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/shell/AppShell.jsx';
import { ToastStack } from './components/common/Toast.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { OpeningSignal } from './scenes/OpeningSignal.jsx';
import { RelayRoom } from './scenes/RelayRoom.jsx';
import { BatonComposer } from './scenes/BatonComposer.jsx';
import { ContinuityGate } from './scenes/ContinuityGate.jsx';
import { RelayRunway } from './scenes/RelayRunway.jsx';
import { ReceiverMirror } from './scenes/ReceiverMirror.jsx';
import { RepairLoop } from './scenes/RepairLoop.jsx';
import { ContinuityLedger } from './scenes/ContinuityLedger.jsx';
import { BatonDetail } from './scenes/BatonDetail.jsx';
import { SettingsScene } from './scenes/SettingsScene.jsx';

export default function App() {
  return (
    <AppShell>
      <ErrorBoundary title="This scene hit an error.">
        <Routes>
          <Route path="/" element={<OpeningSignal />} />
          <Route path="/room" element={<RelayRoom />} />
          <Route path="/compose" element={<BatonComposer />} />
          <Route path="/gate" element={<ContinuityGate />} />
          <Route path="/runway" element={<RelayRunway />} />
          <Route path="/mirror" element={<ReceiverMirror />} />
          <Route path="/repair" element={<RepairLoop />} />
          <Route path="/ledger" element={<ContinuityLedger />} />
          <Route path="/baton/:id" element={<BatonDetail />} />
          <Route path="/settings" element={<SettingsScene />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
      <ToastStack />
    </AppShell>
  );
}
