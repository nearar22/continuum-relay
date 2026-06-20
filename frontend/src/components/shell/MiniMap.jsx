// MiniMap.jsx
// ===========
// A bottom mini-map of the relay path. Each scene is a station along a lane of
// light; the active station glows and the lane fills up to it, so navigating
// feels like moving a baton through the relay system. Hidden on the opening
// scene to keep the hero uncluttered; shown everywhere else.

import { NavLink, useLocation } from 'react-router-dom';
import { SCENES } from '../../scenes/sceneManifest.js';
import styles from './MiniMap.module.css';

export function MiniMap() {
  const location = useLocation();
  const stations = SCENES.filter((s) => s.nav);
  const activeIndex = stations.findIndex(
    (s) => s.path === location.pathname || (s.path !== '/' && location.pathname.startsWith(s.path)),
  );

  // Keep the hero immersive: no mini-map on the opening signal scene.
  if (location.pathname === '/') return null;

  const progress = activeIndex >= 0 ? activeIndex / (stations.length - 1) : 0;

  return (
    <nav className={styles.map} aria-label="Relay path mini-map">
      <span className={styles.lane} aria-hidden="true">
        <span className={styles.laneFill} style={{ width: `${progress * 100}%` }} />
      </span>
      <ol className={styles.stations}>
        {stations.map((s, i) => {
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;
          return (
            <li key={s.id} className={styles.stationItem}>
              <NavLink
                to={s.path}
                end={s.path === '/'}
                className={styles.station}
                data-active={isActive ? 'true' : 'false'}
                data-past={isPast ? 'true' : 'false'}
                title={s.label}
              >
                <span className={styles.node} aria-hidden="true" />
                <span className={styles.stationLabel}>{s.short}</span>
              </NavLink>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
