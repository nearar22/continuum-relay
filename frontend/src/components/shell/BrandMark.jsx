// BrandMark.jsx
// =============
// The Continuum Relay wordmark with a small inline relay glyph: a baton of light
// passing between two stations. Links home.

import { Link } from 'react-router-dom';
import styles from './BrandMark.module.css';

export function BrandMark() {
  return (
    <Link to="/" className={styles.brand} aria-label="Continuum Relay, home">
      <span className={styles.glyph} aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <circle cx="4" cy="13" r="3" fill="var(--signal-teal)" />
          <circle cx="22" cy="13" r="3" fill="var(--voltage-blue)" />
          <rect x="10" y="9.5" width="6" height="7" rx="3" fill="var(--relay-amber)" />
          <path
            d="M7 13 H10 M16 13 H19"
            stroke="var(--relay-amber)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className={styles.text}>
        <span className={styles.name}>Continuum Relay</span>
        <span className={styles.sub}>Semantic handoff protocol</span>
      </span>
    </Link>
  );
}
