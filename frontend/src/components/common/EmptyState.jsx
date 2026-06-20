// EmptyState.jsx
// ==============
// A calm placeholder for empty scenes. Not a generic "no data" box: it frames
// the empty relay as a quiet corridor waiting for a baton, with an optional
// action.

import styles from './EmptyState.module.css';

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className={styles.empty}>
      {Icon ? (
        <span className={styles.glyph} aria-hidden="true">
          <Icon size={26} />
        </span>
      ) : null}
      <h3 className={styles.title}>{title}</h3>
      {children ? <p className={styles.body}>{children}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
