// LiveContinuityPreview.jsx
// =========================
// A sticky panel beside the composer that runs the local continuity engine on
// the in-progress layers (debounced) and shows the baton core, the projected
// gate band, the continuity score, and the most pressing issues. This is a
// preview only: it never mutates relay state.

import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { evaluateBatonContinuity } from '../../utils/continuityScoring.js';
import { BatonCore } from '../relay/BatonCore.jsx';
import { GateStatusSeal } from '../relay/GateStatusSeal.jsx';
import { ContinuityScoreRing } from '../relay/ContinuityScoreRing.jsx';
import styles from './LiveContinuityPreview.module.css';

export function LiveContinuityPreview({ layers }) {
  const evaluation = useMemo(
    () => evaluateBatonContinuity({ id: 'preview', ...layers }),
    [layers],
  );

  const hasContent = Object.values(layers).some((v) => String(v || '').trim().length > 0);

  return (
    <aside className={styles.panel} aria-label="Live continuity preview">
      <p className="cr-eyebrow">Live continuity preview</p>
      <div className={styles.core}>
        <BatonCore layers={layers} size={200} showLabels />
      </div>

      {hasContent ? (
        <>
          <div className={styles.verdict}>
            <GateStatusSeal band={evaluation.gateBand} compact />
            <ContinuityScoreRing score={evaluation.continuityScore} size={96} stroke={7} />
          </div>

          {evaluation.missingRequired.length > 0 ? (
            <div className={styles.missing}>
              <AlertTriangle size={15} aria-hidden="true" />
              <span>
                Missing required: {evaluation.missingRequired.join(', ')}
              </span>
            </div>
          ) : null}

          <ul className={styles.issues}>
            {evaluation.issues.length === 0 ? (
              <li className={styles.issueOk}>
                <CheckCircle2 size={15} aria-hidden="true" />
                No continuity issues detected.
              </li>
            ) : (
              evaluation.issues.slice(0, 4).map((issue, i) => (
                <li key={`${issue.type}-${i}`} className={styles.issue} data-sev={issue.severity}>
                  <span className={styles.issueType}>{issue.type}</span>
                  <span className={styles.issueReason}>{issue.reason}</span>
                </li>
              ))
            )}
          </ul>
        </>
      ) : (
        <p className={styles.hint}>
          Start filling layers. The baton brightens and the projected gate band updates as the
          context becomes complete.
        </p>
      )}
    </aside>
  );
}
