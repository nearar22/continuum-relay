// ErrorBoundary.jsx
// =================
// Wraps data-dependent sections so a thrown render error never takes down the
// chrome. It shows a calm operational fallback and a retry, keeping the relay
// instrument usable even when one panel fails.

import { Component } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import styles from './ErrorBoundary.module.css';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error && error.message ? error.message : 'Unexpected error.' };
  }

  componentDidCatch() {
    // Intentionally silent: the fallback UI is the user-facing signal.
  }

  reset = () => {
    this.setState({ hasError: false, message: '' });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.fallback} role="alert">
          <AlertTriangle size={22} aria-hidden="true" />
          <div className={styles.body}>
            <p className={styles.title}>{this.props.title || 'This panel could not render.'}</p>
            <p className={styles.message}>
              {this.state.message} The relay fell back to local data where it could.
            </p>
          </div>
          <button type="button" className={styles.retry} onClick={this.reset}>
            <RotateCw size={15} aria-hidden="true" />
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
