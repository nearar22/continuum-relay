// Button.jsx
// ==========
// The relay's button voice. Three variants (primary amber, ghost, quiet) plus
// an icon-only mode. Renders as a button or, when `to` is given, a router link.
// Full state coverage lives in the stylesheet (hover, focus, active, disabled).

import { Link } from 'react-router-dom';
import styles from './Button.module.css';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  href,
  icon: Icon,
  iconRight: IconRight,
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  ...rest
}) {
  const cls = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.full : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {Icon ? <Icon size={size === 'sm' ? 15 : 17} aria-hidden="true" /> : null}
      {children ? <span className={styles.label}>{children}</span> : null}
      {IconRight ? <IconRight size={size === 'sm' ? 15 : 17} aria-hidden="true" /> : null}
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={cls} {...rest}>
        {content}
      </Link>
    );
  }
  if (href && !disabled) {
    return (
      <a href={href} className={cls} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled || loading}
      data-loading={loading ? 'true' : undefined}
      {...rest}
    >
      {content}
    </button>
  );
}

export function IconButton({ icon: Icon, label, variant = 'ghost', className = '', ...rest }) {
  return (
    <button
      type="button"
      className={[styles.iconButton, styles[variant], className].filter(Boolean).join(' ')}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon size={17} aria-hidden="true" />
    </button>
  );
}
