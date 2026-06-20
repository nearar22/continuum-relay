// BatonPicker.jsx
// ===============
// A compact selector used by the single-baton scenes (gate, runway, mirror,
// repair). Lets the user choose which baton this scene operates on. Renders as
// a labelled select plus the chosen baton's title and status.

import { statusLabel } from '../../utils/formatters.js';
import styles from './BatonPicker.module.css';

export function BatonPicker({ batons, activeId, onChange, filterFn, emptyHint }) {
  const list = filterFn ? batons.filter(filterFn) : batons;

  return (
    <div className={styles.picker}>
      <label htmlFor="baton-picker" className={styles.label}>
        Active baton
      </label>
      <select
        id="baton-picker"
        className={styles.select}
        value={activeId || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select a baton</option>
        {list.map((b) => (
          <option key={b.id} value={b.id}>
            {b.title} ({statusLabel(b.status)})
          </option>
        ))}
      </select>
      {list.length === 0 && emptyHint ? <p className={styles.hint}>{emptyHint}</p> : null}
    </div>
  );
}
