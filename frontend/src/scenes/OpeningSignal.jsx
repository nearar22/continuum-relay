// OpeningSignal.jsx
// =================
// The presentation scene. A cinematic hero with the live relay corridor canvas,
// then sections that build the argument: why handoffs fail, what a semantic
// baton carries, why GenLayer is essential, validator depth, a live relay
// preview, and who it is built for. Rich and premium, not a single line.

import { motion } from 'framer-motion';
import {
  ArrowRight,
  PlayCircle,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Network,
  Gauge,
  Building2,
  LifeBuoy,
  GitPullRequest,
  Vote,
} from 'lucide-react';
import { Button } from '../components/common/Button.jsx';
import { RelayCorridorCanvas } from '../components/opening/RelayCorridorCanvas.jsx';
import { BrokenHandoffDemo } from '../components/opening/BrokenHandoffDemo.jsx';
import { BatonCore } from '../components/relay/BatonCore.jsx';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { LAYER_META } from '../data/layerMeta.js';
import { DEMO_BATONS } from '../data/demoBatons.js';
import styles from './OpeningSignal.module.css';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

function Reveal({ children, delay = 0 }) {
  const reduced = useReducedMotion();
  if (reduced) return <div>{children}</div>;
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export function OpeningSignal() {
  const previewBaton = DEMO_BATONS[1]; // Incident Response, a complete baton

  return (
    <div className={styles.page}>
      {/* Hero. Asymmetric split: oversized headline and a single primary plus
          one secondary action on the left, a live status console on the right.
          One eyebrow only (hero counts as the page's first of three allowed). */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <RelayCorridorCanvas />
        <div className={styles.heroGrid}>
          <div className={styles.heroInner}>
            <p className="cr-eyebrow">Semantic handoff protocol</p>
            <h1 id="hero-title" className={styles.headline}>
              Never lose <span className={styles.headlineAccent}>the thread.</span>
            </h1>
            <p className={styles.sub}>
              Continuum Relay turns a handoff into a semantic baton carrying intent, state,
              unresolved risk, the decisions that must hold, and the next action. The gate opens only
              when meaning survives the pass.
            </p>
            <div className={styles.ctaRow}>
              <Button to="/room" variant="primary" size="lg" iconRight={ArrowRight}>
                Enter relay room
              </Button>
              <Button to="/gate?baton=baton-1" variant="ghost" size="lg" icon={PlayCircle}>
                Inspect a live baton
              </Button>
            </div>
          </div>
          <aside className={styles.heroConsole} aria-label="Live relay status">
            <div className={styles.consoleHead}>
              <span className={styles.consoleDot} aria-hidden="true" />
              <span className={styles.consoleLabel}>relay status</span>
            </div>
            <dl className={styles.consoleStats}>
              <div>
                <dt>Continuity gate</dt>
                <dd className={styles.consoleStrong}>open at 80</dd>
              </div>
              <div>
                <dt>Readings per pass</dt>
                <dd className={styles.consoleStrong}>5 semantic</dd>
              </div>
              <div>
                <dt>Last proof</dt>
                <dd className={styles.consoleMono}>0x0210cade0a4b86f0</dd>
              </div>
            </dl>
            <p className={styles.consoleFoot}>
              Acceptance is gated in code by the receiver mirror, never by a model verdict alone.
            </p>
          </aside>
        </div>
      </section>

      {/* Why handoffs fail */}
      <Reveal>
        <section className={styles.section} aria-labelledby="fail-title">
          <div className={styles.sectionHead}>
            <h2 id="fail-title" className={styles.h2}>
              Why handoffs fail
            </h2>
            <p className={styles.lead}>
              A handoff is not a status update. It is the transfer of a living understanding. When
              that understanding is compressed into a few lines, the parts that matter most go
              missing first.
            </p>
          </div>
          <div className={styles.grid3}>
            {[
              {
                icon: AlertTriangle,
                title: 'Context evaporates',
                body: 'The sender knows the risk that has not been written down. The receiver inherits the words, not the worry.',
              },
              {
                icon: Network,
                title: 'Intent drifts',
                body: 'The next action gets done, but it no longer serves the original goal. Nobody notices until the work is wrong.',
              },
              {
                icon: ShieldCheck,
                title: 'Constraints get crossed',
                body: 'A boundary that was obvious to the sender, like keeping notes private, is invisible to the receiver who never heard it.',
              },
            ].map((c) => (
              <article key={c.title} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  <c.icon size={20} />
                </span>
                <h3 className={styles.cardTitle}>{c.title}</h3>
                <p className={styles.cardBody}>{c.body}</p>
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      {/* What a semantic baton carries */}
      <Reveal>
        <section className={styles.section} aria-labelledby="baton-title">
          <div className={styles.split}>
            <div className={styles.splitText}>
              <h2 id="baton-title" className={styles.h2}>
                What a semantic baton carries
              </h2>
              <p className={styles.lead}>
                Every baton wraps a core of light in layers of context. Each layer is a distinct
                facet of understanding the receiver needs to continue without guessing.
              </p>
              <ul className={styles.layerList}>
                {LAYER_META.map((l) => (
                  <li key={l.key} className={styles.layerItem}>
                    <span
                      className={styles.layerDot}
                      style={{ background: l.accent }}
                      aria-hidden="true"
                    />
                    <span className={styles.layerName}>{l.label}</span>
                    <span className={styles.layerHelp}>{l.help}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.splitVisual}>
              <BatonCore layers={previewBaton.layers} size={300} showLabels />
            </div>
          </div>
        </section>
      </Reveal>

      {/* Broken handoff mini-demo */}
      <Reveal>
        <section className={styles.section} aria-labelledby="demo-title">
          <div className={styles.sectionHead}>
            <h2 id="demo-title" className={styles.h2}>
              A broken handoff becoming whole
            </h2>
            <p className={styles.lead}>
              Missing context shows as broken bands and gaps. When the relay repairs it, the bands
              reconnect and the baton brightens. This is the loop at the center of the protocol.
            </p>
          </div>
          <div className={styles.demoWrap}>
            <BrokenHandoffDemo />
          </div>
        </section>
      </Reveal>

      {/* Why GenLayer is essential. Asymmetric layout: a sticky thesis column on
          the left, three reasons stacked as connected rows on the right. This
          deliberately breaks from the card-grid rhythm used elsewhere. */}
      <Reveal>
        <section className={styles.section} aria-labelledby="genlayer-title">
          <div className={styles.thesis}>
            <aside className={styles.thesisHead}>
              <p className="cr-eyebrow">The judge</p>
              <h2 id="genlayer-title" className={styles.h2}>
                Why GenLayer is essential
              </h2>
              <p className={styles.lead}>
                A normal contract can check that a field is filled in. It cannot read whether the
                next action still serves the mission, whether two instructions contradict, or
                whether a restated understanding quietly violates a protected constraint.
              </p>
              <p className={styles.thesisKicker}>
                GenLayer evaluates the meaning of the handoff and collapses many validator readings
                into one continuity gate.
              </p>
            </aside>
            <ol className={styles.reasonList}>
              {[
                {
                  icon: Layers,
                  title: 'Reads meaning, not fields',
                  body: 'Intent preservation and contradiction are judged semantically, the way a careful teammate would.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Gates on safety',
                  body: 'A handoff that would cross a protected constraint stays locked, even if every field is present.',
                },
                {
                  icon: Gauge,
                  title: 'Deterministic backstop',
                  body: 'Acceptance is gated in code by the receiver mirror band, never by a model verdict alone.',
                },
              ].map((c) => (
                <li key={c.title} className={styles.reason}>
                  <span className={styles.reasonIcon} aria-hidden="true">
                    <c.icon size={18} />
                  </span>
                  <div className={styles.reasonText}>
                    <h3 className={styles.reasonTitle}>{c.title}</h3>
                    <p className={styles.cardBody}>{c.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </Reveal>

      {/* Validator depth */}
      <Reveal>
        <section className={styles.section} aria-labelledby="validator-title">
          <div className={styles.sectionHead}>
            <h2 id="validator-title" className={styles.h2}>
              Five readings behind every gate
            </h2>
          </div>
          <div className={styles.validatorRow}>
            {[
              { name: 'Missing context', body: 'Are all required layers present and substantive?' },
              { name: 'Intent preservation', body: 'Does the next action still serve the mission?' },
              { name: 'Contradiction', body: 'Do any two instructions conflict with each other?' },
              { name: 'Constraint violation', body: 'Would the handoff cross a protected boundary?' },
              { name: 'Definition of done', body: 'Is done concrete enough for the receiver to verify?' },
            ].map((v, i) => (
              <div key={v.name} className={styles.validator}>
                <span className={styles.validatorIndex}>{String(i + 1).padStart(2, '0')}</span>
                <h3 className={styles.validatorName}>{v.name}</h3>
                <p className={styles.validatorBody}>{v.body}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Live relay preview */}
      <Reveal>
        <section className={styles.section} aria-labelledby="preview-title">
          <div className={styles.previewCard}>
            <div className={styles.previewText}>
              <p className="cr-eyebrow">Live relay preview</p>
              <h2 id="preview-title" className={styles.h2}>
                {previewBaton.title}
              </h2>
              <p className={styles.lead}>{previewBaton.layers.mission}</p>
              <dl className={styles.previewMeta}>
                <div>
                  <dt>Sender</dt>
                  <dd>{previewBaton.sender}</dd>
                </div>
                <div>
                  <dt>Receiver role</dt>
                  <dd>{previewBaton.receiverRole}</dd>
                </div>
                <div>
                  <dt>Protected constraint</dt>
                  <dd>{previewBaton.layers.constraints}</dd>
                </div>
              </dl>
              <div className={styles.ctaRow}>
                <Button to="/gate?baton=baton-2" variant="ghost" iconRight={ArrowRight}>
                  Run this through the gate
                </Button>
              </div>
            </div>
            <div className={styles.previewVisual}>
              <BatonCore layers={previewBaton.layers} size={240} />
            </div>
          </div>
        </section>
      </Reveal>

      {/* Built for */}
      <Reveal>
        <section className={styles.section} aria-labelledby="builtfor-title">
          <div className={styles.sectionHead}>
            <h2 id="builtfor-title" className={styles.h2}>
              Wherever a thread cannot be dropped
            </h2>
          </div>
          <div className={styles.grid4}>
            {[
              { icon: Building2, title: 'DAOs', body: 'Delegate rotations that keep the full nuance of a debate.' },
              { icon: Vote, title: 'Grants', body: 'Review handoffs that protect confidential reviewer notes.' },
              { icon: LifeBuoy, title: 'Incidents', body: 'On-call transfers across timezones with the timeline intact.' },
              { icon: GitPullRequest, title: 'Open source', body: 'Maintainer handoffs that preserve intent and definition of done.' },
            ].map((c) => (
              <article key={c.title} className={styles.useCase}>
                <span className={styles.cardIcon} aria-hidden="true">
                  <c.icon size={20} />
                </span>
                <h3 className={styles.cardTitle}>{c.title}</h3>
                <p className={styles.cardBody}>{c.body}</p>
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Closing CTA */}
      <Reveal>
        <section className={styles.closing} aria-labelledby="closing-title">
          <h2 id="closing-title" className={styles.closingTitle}>
            Compose a baton. Open the gate. Pass without losing the thread.
          </h2>
          <div className={styles.ctaRow}>
            <Button to="/compose" variant="primary" size="lg" iconRight={ArrowRight}>
              Compose a baton
            </Button>
            <Button to="/room" variant="ghost" size="lg">
              Enter the relay room
            </Button>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
