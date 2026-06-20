// SceneHeader.jsx
// ===============
// Consistent scene heading: a mono eyebrow, a display title, and a lead line,
// with an optional actions slot on the right. The text rises in sequence on
// mount so every scene opens with motion, and collapses to static under reduced
// motion. Used at the top of every scene except the immersive opening hero.

import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import styles from './SceneHeader.module.css';

const EASE = [0.16, 1, 0.3, 1];

export function SceneHeader({ eyebrow, title, lead, actions }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <header className={styles.header}>
        <div className={styles.text}>
          {eyebrow ? <p className="cr-eyebrow">{eyebrow}</p> : null}
          <h1 className={styles.title}>{title}</h1>
          {lead ? <p className={styles.lead}>{lead}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>
    );
  }

  const rise = (delay) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: EASE, delay },
  });

  return (
    <header className={styles.header}>
      <div className={styles.text}>
        {eyebrow ? (
          <motion.p className="cr-eyebrow" {...rise(0)}>
            {eyebrow}
          </motion.p>
        ) : null}
        <motion.h1 className={styles.title} {...rise(0.06)}>
          {title}
        </motion.h1>
        {lead ? (
          <motion.p className={styles.lead} {...rise(0.12)}>
            {lead}
          </motion.p>
        ) : null}
      </div>
      {actions ? (
        <motion.div className={styles.actions} {...rise(0.16)}>
          {actions}
        </motion.div>
      ) : null}
    </header>
  );
}
