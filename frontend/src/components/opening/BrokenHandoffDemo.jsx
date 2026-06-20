// BrokenHandoffDemo.jsx
// =====================
// A small self-running visual: a handoff that starts with missing context
// (broken bands, gaps) and, on a loop or on user action, reconnects into a
// complete baton with glowing bands. Demonstrates the core promise in one view.

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link2, Unlink } from 'lucide-react';
import { LightBand } from '../relay/LightBand.jsx';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import styles from './BrokenHandoffDemo.module.css';

const BANDS = [
  { label: 'mission', accent: 'var(--relay-amber)' },
  { label: 'current state', accent: 'var(--voltage-blue)' },
  { label: 'risks', accent: 'var(--warning)' },
  { label: 'constraints', accent: 'var(--soft-infrared)' },
  { label: 'next action', accent: 'var(--relay-amber)' },
  { label: 'done', accent: 'var(--signal-teal)' },
];

export function BrokenHandoffDemo() {
  const reduced = useReducedMotion();
  const [repaired, setRepaired] = useState(false);

  // Auto-cycle when motion is allowed, so the promise is visible without input.
  useEffect(() => {
    if (reduced) {
      setRepaired(true);
      return undefined;
    }
    const timer = setInterval(() => setRepaired((r) => !r), 3600);
    return () => clearInterval(timer);
  }, [reduced]);

  return (
    <div className={styles.demo}>
      <div className={styles.head}>
        <span className={styles.state} data-on={repaired ? 'true' : 'false'}>
          {repaired ? <Link2 size={15} aria-hidden="true" /> : <Unlink size={15} aria-hidden="true" />}
          {repaired ? 'Context reconnected' : 'Context broken'}
        </span>
        {!reduced ? (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setRepaired((r) => !r)}
          >
            {repaired ? 'Break it' : 'Repair it'}
          </button>
        ) : null}
      </div>
      <div className={styles.bands}>
        {BANDS.map((b, i) => (
          <LightBand
            key={b.label}
            accent={b.accent}
            label={b.label}
            broken={!repaired && i % 2 === 1}
            delay={i * 0.12}
          />
        ))}
      </div>
      <motion.p
        className={styles.caption}
        animate={{ opacity: repaired ? 1 : 0.7 }}
        transition={{ duration: reduced ? 0 : 0.4 }}
      >
        {repaired
          ? 'Every layer present. The continuity gate opens and the baton can pass.'
          : 'Half the context is missing. The gate stays closed until it is repaired.'}
      </motion.p>
    </div>
  );
}
