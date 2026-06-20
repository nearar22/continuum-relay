// SettingsScene.jsx
// =================
// Controls for the relay instrument: theme, animation intensity, reduced motion,
// and the live GenLayer connection (contract address, explorer, signers). State
// lives on-chain, so there is no local data to clear or import here.

import {
  Sun,
  Moon,
  Gauge,
  ExternalLink,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext.jsx';
import { useRelay } from '../context/RelayContext.jsx';
import { SceneHeader } from '../components/shell/SceneHeader.jsx';
import { ReducedMotionToggle } from '../components/relay/ReducedMotionToggle.jsx';
import { ChainStatusBadge } from '../components/relay/ChainStatusBadge.jsx';
import { CONTRACT_ADDRESS, EXPLORER } from '../genlayer/chain.js';
import styles from './SettingsScene.module.css';

export function SettingsScene() {
  const { theme, setTheme, intensity, setIntensity } = useSettings();
  const { batons, stats, wallet } = useRelay();

  return (
    <div>
      <SceneHeader
        eyebrow="Instrument settings"
        title="Settings"
        lead="Tune how the relay looks and moves. Baton state lives on the GenLayer contract; appearance settings are stored on this device."
      />

      <div className={styles.grid}>
        {/* Appearance */}
        <section className={styles.panel} aria-labelledby="appearance-title">
          <h2 id="appearance-title" className={styles.panelTitle}>
            Appearance
          </h2>

          <div className={styles.control}>
            <div className={styles.controlText}>
              <span className={styles.controlLabel}>Theme</span>
              <span className={styles.controlHint}>Dark is the control-room default; light is a daytime variant.</span>
            </div>
            <div className={styles.segmented} role="group" aria-label="Theme">
              <button
                type="button"
                className={styles.segment}
                data-active={theme === 'dark' ? 'true' : 'false'}
                onClick={() => setTheme('dark')}
              >
                <Moon size={15} aria-hidden="true" /> Dark
              </button>
              <button
                type="button"
                className={styles.segment}
                data-active={theme === 'light' ? 'true' : 'false'}
                onClick={() => setTheme('light')}
              >
                <Sun size={15} aria-hidden="true" /> Light
              </button>
            </div>
          </div>

          <div className={styles.control}>
            <div className={styles.controlText}>
              <span className={styles.controlLabel}>Animation intensity</span>
              <span className={styles.controlHint}>How lively the relay motion is.</span>
            </div>
            <div className={styles.segmented} role="group" aria-label="Animation intensity">
              <button
                type="button"
                className={styles.segment}
                data-active={intensity === 'full' ? 'true' : 'false'}
                onClick={() => setIntensity('full')}
              >
                <Gauge size={15} aria-hidden="true" /> Full
              </button>
              <button
                type="button"
                className={styles.segment}
                data-active={intensity === 'calm' ? 'true' : 'false'}
                onClick={() => setIntensity('calm')}
              >
                Calm
              </button>
            </div>
          </div>

          <div className={styles.controlBlock}>
            <ReducedMotionToggle />
          </div>
        </section>

        {/* GenLayer connection */}
        <section className={styles.panel} aria-labelledby="connection-title">
          <h2 id="connection-title" className={styles.panelTitle}>
            GenLayer connection
          </h2>

          <div className={styles.statusLine}>
            <ChainStatusBadge />
            <span className={styles.statusDetail}>
              {stats.batons} batons, {stats.accepted} accepted on Bradbury
              {wallet.address ? ` · wallet ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : ' · wallet not connected'}
            </span>
          </div>

          <div className={styles.control}>
            <div className={styles.controlText}>
              <span className={styles.controlLabel}>
                <ShieldCheck size={15} aria-hidden="true" /> Intelligent Contract
              </span>
              <span className={styles.controlHint}>
                Every baton, continuity gate, receiver mirror, and proof is a real transaction against this contract.
              </span>
            </div>
          </div>
          <a
            className={styles.contractLink}
            href={`${EXPLORER}/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            <Radio size={15} aria-hidden="true" />
            <code className={styles.contractAddr}>{CONTRACT_ADDRESS}</code>
            <ExternalLink size={14} aria-hidden="true" />
          </a>
          <p className={styles.dataCount}>{batons.length} batons live on-chain.</p>
        </section>
      </div>
    </div>
  );
}
