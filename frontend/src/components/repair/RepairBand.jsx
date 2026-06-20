// RepairBand.jsx
// ==============
// One broken layer in the repair workbench. Shows the layer name, the issues
// flagged against it with their repair prompts, and an editable field. As the
// user edits, the band visually reconnects (the broken light fills in). Submits
// nothing on its own; the workbench collects all edited layers.

import { LightBand } from '../relay/LightBand.jsx';
import { getLayerMeta } from '../../data/layerMeta.js';
import styles from './RepairBand.module.css';

export function RepairBand({ group, value, onChange }) {
  const meta = group.meta || getLayerMeta(group.layer);
  const accent = meta ? meta.accent : 'var(--relay-amber)';
  const original = value;
  // Considered reconnected once the user has written something substantive.
  const reconnected = original.trim().length >= 12;

  return (
    <div className={styles.band} data-fixed={reconnected ? 'true' : 'false'}>
      <div className={styles.head}>
        <span className={styles.name} style={{ color: accent }}>
          {meta ? meta.label : group.layer}
        </span>
        <span className={styles.state} data-fixed={reconnected ? 'true' : 'false'}>
          {reconnected ? 'reconnected' : 'broken'}
        </span>
      </div>

      <div className={styles.bandVisual}>
        <LightBand accent={accent} broken={!reconnected} />
      </div>

      <ul className={styles.issues}>
        {group.items.map((item, i) => (
          <li key={`${item.type}-${i}`} className={styles.issue}>
            <span className={styles.issueType}>{item.type}</span>
            <span className={styles.issueReason}>{item.reason}</span>
            <span className={styles.prompt}>{item.repairPrompt}</span>
          </li>
        ))}
      </ul>

      <textarea
        className={styles.input}
        value={value}
        onChange={(e) => onChange(group.layer, e.target.value)}
        placeholder={meta ? meta.placeholder : 'Repair this layer.'}
        rows={3}
        style={{ borderColor: reconnected ? accent : undefined }}
        aria-label={`Repair ${meta ? meta.label : group.layer}`}
      />
    </div>
  );
}
