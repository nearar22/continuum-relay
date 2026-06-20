// Skeleton.jsx
// ============
// Loading placeholders. No spinners anywhere in the app: a loading relay shows
// shimmering skeleton lanes that match the shape of what is arriving.

import styles from './Skeleton.module.css';

export function Skeleton({ width, height = 16, radius = 'var(--radius-xs)', style }) {
  return (
    <span
      className={styles.skeleton}
      style={{ width: width || '100%', height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.row}>
        <Skeleton width={44} height={44} radius="var(--radius-pill)" />
        <div className={styles.col}>
          <Skeleton width="62%" height={14} />
          <Skeleton width="40%" height={11} />
        </div>
      </div>
      <Skeleton height={8} />
      <Skeleton width="80%" height={8} />
    </div>
  );
}

export function SkeletonLane() {
  return (
    <div className={styles.lane} aria-hidden="true">
      <Skeleton width={120} height={12} />
      <div className={styles.track}>
        <Skeleton height={6} />
      </div>
    </div>
  );
}
