// Motion.jsx
// ==========
// Shared motion primitives for the relay. Every scene enters with a soft rise,
// section blocks reveal on scroll, and lists stagger their children. All of it
// collapses to instant when the user prefers reduced motion, so motion is felt
// but never required. Built on framer-motion.

import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';

const EASE = [0.16, 1, 0.3, 1];

// A whole scene rising into place on route change.
export function SceneEnter({ children, className }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// A block that reveals as it scrolls into view, once.
export function Reveal({ children, delay = 0, className, y = 22 }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

// A container whose direct children stagger in. Pair with StaggerItem.
export function Stagger({ children, className, gap = 0.06, as = 'div' }) {
  const reduced = useReducedMotion();
  const Comp = motion[as] || motion.div;
  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }
  return (
    <Comp
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap } },
      }}
    >
      {children}
    </Comp>
  );
}

export function StaggerItem({ children, className, as = 'div', y = 16 }) {
  const reduced = useReducedMotion();
  const Comp = motion[as] || motion.div;
  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }
  return (
    <Comp
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
      }}
    >
      {children}
    </Comp>
  );
}
