// Toast.jsx
// =========
// The relay's transient notifications. Rendered in a live region so screen
// readers announce relay outcomes. Each toast carries a tone that maps to an
// accent, and animates in as a small motion pulse rather than a heavy banner.

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useRelay } from '../../context/RelayContext.jsx';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import styles from './Toast.module.css';

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

export function ToastStack() {
  const { toasts, dismissToast } = useRelay();
  const reduced = useReducedMotion();

  return (
    <div className={styles.stack} role="region" aria-label="Relay notifications" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = ICONS[t.tone] || Info;
          return (
            <motion.div
              key={t.id}
              className={styles.toast}
              data-tone={t.tone}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <Icon size={18} aria-hidden="true" className={styles.icon} />
              <div className={styles.content}>
                {t.title ? <p className={styles.title}>{t.title}</p> : null}
                {t.message ? <p className={styles.message}>{t.message}</p> : null}
              </div>
              <button
                type="button"
                className={styles.close}
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss notification"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
