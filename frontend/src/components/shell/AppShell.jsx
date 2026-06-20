// AppShell.jsx
// ============
// The persistent chrome of the relay instrument: a brand mark, the scene
// navigation rail, the live relay status, the mock wallet, and a bottom
// mini-map of the relay path. The chrome always renders even when data fails.
// On narrow viewports the rail collapses into a bottom bar.

import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { SCENES } from '../../scenes/sceneManifest.js';
import { ChainStatusBadge } from '../relay/ChainStatusBadge.jsx';
import { WalletButton } from '../relay/WalletButton.jsx';
import { MiniMap } from './MiniMap.jsx';
import { BrandMark } from './BrandMark.jsx';
import styles from './AppShell.module.css';

export function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navScenes = SCENES.filter((s) => s.nav);

  return (
    <div className={styles.shell}>
      <a className="cr-skip-link" href="#scene-main">
        Skip to scene content
      </a>

      <header className={styles.topbar}>
        <div className={styles.topLeft}>
          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <BrandMark />
        </div>
        <div className={styles.topRight}>
          <ChainStatusBadge />
          <WalletButton />
        </div>
      </header>

      <div className={styles.body}>
        <nav
          className={styles.rail}
          data-open={mobileOpen ? 'true' : 'false'}
          aria-label="Relay scenes"
        >
          <ul className={styles.navList}>
            {navScenes.map((scene) => {
              const Icon = scene.icon;
              return (
                <li key={scene.id}>
                  <NavLink
                    to={scene.path}
                    end={scene.path === '/'}
                    className={({ isActive }) =>
                      [styles.navItem, isActive ? styles.navActive : ''].filter(Boolean).join(' ')
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className={styles.navIcon} aria-hidden="true">
                      <Icon size={18} />
                    </span>
                    <span className={styles.navLabel}>{scene.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
          <div className={styles.railFooter}>
            <p className={styles.tagline}>Never lose the thread.</p>
          </div>
        </nav>

        {mobileOpen ? (
          <button
            type="button"
            className={styles.scrim}
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <main id="scene-main" className={styles.main} key={location.pathname}>
          {children}
        </main>
      </div>

      <MiniMap />
    </div>
  );
}
