// WalletButton.jsx
// ================
// The real wallet control. Disconnected: a connect action that requests the
// browser wallet and switches to Bradbury. Connected: shows the live address
// with a popover to copy it, jump to the explorer, or disconnect. When the
// wallet is on the wrong chain it offers a one-click switch.

import { useState, useRef, useEffect } from 'react';
import { Wallet, LogOut, Check, Copy, ExternalLink, AlertTriangle } from 'lucide-react';
import { useRelay } from '../../context/RelayContext.jsx';
import { addressUrl } from '../../genlayer/chain.js';
import styles from './MockWalletButton.module.css';

function shorten(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

export function WalletButton() {
  const { wallet } = useRelay();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  if (!wallet.address) {
    return (
      <button type="button" className={styles.connect} onClick={wallet.connect} disabled={wallet.connecting}>
        <Wallet size={16} aria-hidden="true" />
        <span>{wallet.connecting ? 'Connecting...' : 'Connect wallet'}</span>
      </button>
    );
  }

  if (!wallet.onRightChain) {
    return (
      <button type="button" className={styles.connect} onClick={wallet.switchChain}>
        <AlertTriangle size={16} aria-hidden="true" />
        <span>Switch to Bradbury</span>
      </button>
    );
  }

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={styles.address}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.addrText}>{shorten(wallet.address)}</span>
      </button>
      {open ? (
        <div className={styles.popover} role="menu">
          <p className={styles.full}>{wallet.address}</p>
          <button type="button" className={styles.item} onClick={copy} role="menuitem">
            {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy address'}
          </button>
          <a
            className={styles.item}
            href={addressUrl(wallet.address)}
            target="_blank"
            rel="noreferrer"
            role="menuitem"
          >
            <ExternalLink size={15} aria-hidden="true" />
            View on explorer
          </a>
          <button
            type="button"
            className={styles.item}
            onClick={() => {
              wallet.disconnect();
              setOpen(false);
            }}
            role="menuitem"
          >
            <LogOut size={15} aria-hidden="true" />
            Disconnect
          </button>
        </div>
      ) : null}
    </div>
  );
}
