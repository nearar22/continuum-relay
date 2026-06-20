// ValidatorResultLayer.jsx
// ========================
// One validator reading shown as a layer: a pass/fail node, the validator name,
// and the reason. Failed validators glow infrared; passed ones glow teal. Used
// as the stack of readings behind the continuity gate.

import { Check, X } from 'lucide-react';
import styles from './ValidatorResultLayer.module.css';

export function ValidatorResultLayer({ result, index }) {
  const passed = result.status === 'passed';
  return (
    <div className={styles.layer} data-passed={passed ? 'true' : 'false'}>
      <span className={styles.index} aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className={styles.node} aria-hidden="true">
        {passed ? <Check size={14} /> : <X size={14} />}
      </span>
      <div className={styles.text}>
        <span className={styles.name}>{result.validator}</span>
        <span className={styles.reason}>{result.reason}</span>
      </div>
      <span className={styles.status}>{passed ? 'passed' : 'failed'}</span>
    </div>
  );
}
