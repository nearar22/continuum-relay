// BatonLayer.jsx
// ==============
// A single layer input in the composer. Not a plain field: it is framed as a
// context layer wrapping the baton, with its accent, an icon, a required mark,
// and a live fill indicator that brightens as the layer gains substance.

import { getLayerMeta } from '../../data/layerMeta.js';
import styles from './BatonLayer.module.css';

export function BatonLayer({ layerKey, value, onChange, autoFocus = false }) {
  const meta = getLayerMeta(layerKey);
  if (!meta) return null;
  const Icon = meta.icon;
  const filled = value.trim().length;
  const strength = Math.min(1, filled / 80);

  return (
    <div className={styles.layer} data-filled={filled > 0 ? 'true' : 'false'}>
      <label className={styles.head} htmlFor={`layer-${layerKey}`}>
        <span className={styles.iconWrap} style={{ color: meta.accent }} aria-hidden="true">
          <Icon size={16} />
        </span>
        <span className={styles.labelText}>
          {meta.label}
          {meta.required ? <span className={styles.required} aria-hidden="true"> required</span> : null}
        </span>
        <span
          className={styles.strength}
          aria-hidden="true"
          style={{
            background: meta.accent,
            opacity: 0.25 + strength * 0.75,
            transform: `scaleX(${0.2 + strength * 0.8})`,
          }}
        />
      </label>
      <textarea
        id={`layer-${layerKey}`}
        className={styles.input}
        value={value}
        onChange={(e) => onChange(layerKey, e.target.value)}
        placeholder={meta.placeholder}
        rows={2}
        autoFocus={autoFocus}
        aria-required={meta.required}
        aria-describedby={`layer-help-${layerKey}`}
        style={{ borderColor: filled > 0 ? meta.accent : undefined }}
      />
      <p id={`layer-help-${layerKey}`} className={styles.help}>
        {meta.help}
      </p>
    </div>
  );
}
