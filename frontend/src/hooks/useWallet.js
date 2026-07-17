// useWallet.js
// ============
// Real browser-wallet connection (MetaMask and compatible). Requests accounts,
// adds and switches to the GenLayer Bradbury testnet, and tracks the active
// address and chain. The contributor and the receiver each sign with their own
// wallet, which is what lets the contract enforce that they are different people.

import { useCallback, useEffect, useState } from 'react';
import { CHAIN_ID, CHAIN_ID_HEX, RPC_URL, EXPLORER } from '../genlayer/chain.js';

const BRADBURY_PARAMS = {
  chainId: CHAIN_ID_HEX,
  chainName: 'GenLayer Bradbury Testnet',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: [`${EXPLORER}/`],
};

function getEth() {
  if (typeof window === 'undefined') return null;
  return window.ethereum ?? null;
}

export function useWallet() {
  const [state, setState] = useState({
    address: null,
    chainId: null,
    connecting: false,
    hasProvider: false,
    error: null,
  });

  useEffect(() => {
    setState((s) => ({ ...s, hasProvider: !!getEth() }));
  }, []);

  const refreshChain = useCallback(async () => {
    const eth = getEth();
    if (!eth) return;
    try {
      const cid = await eth.request({ method: 'eth_chainId' });
      setState((s) => ({ ...s, chainId: parseInt(cid, 16) }));
    } catch {
      /* ignore */
    }
  }, []);

  const connect = useCallback(async () => {
    const eth = getEth();
    if (!eth) {
      const error = new Error('No browser wallet detected. Install MetaMask to continue.');
      setState((s) => ({ ...s, error: error.message }));
      throw error;
    }
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      let cid = await eth.request({ method: 'eth_chainId' });
      if (parseInt(cid, 16) !== CHAIN_ID) {
        try {
          await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
        } catch (switchError) {
          if (switchError?.code !== 4902) throw switchError;
          await eth.request({ method: 'wallet_addEthereumChain', params: [BRADBURY_PARAMS] });
          await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
        }
        cid = await eth.request({ method: 'eth_chainId' });
      }
      if (parseInt(cid, 16) !== CHAIN_ID) throw new Error('Wallet is not connected to Bradbury.');
      const address = accounts[0] ?? null;
      setState((s) => ({ ...s, address, chainId: CHAIN_ID, connecting: false }));
      return { address, chainId: CHAIN_ID, provider: eth };
    } catch (e) {
      const msg = /user rejected|denied/i.test(String(e))
        ? 'Connection or network switch declined.'
        : (e?.message || 'Could not connect wallet to Bradbury.');
      setState((s) => ({ ...s, connecting: false, error: msg }));
      throw new Error(msg);
    }
  }, []);

  const switchChain = useCallback(async () => {
    const eth = getEth();
    if (!eth) throw new Error('No browser wallet detected.');
    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
    } catch (switchError) {
      if (switchError?.code !== 4902) throw switchError;
      await eth.request({ method: 'wallet_addEthereumChain', params: [BRADBURY_PARAMS] });
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
    }
    const cid = await eth.request({ method: 'eth_chainId' });
    if (parseInt(cid, 16) !== CHAIN_ID) throw new Error('Wallet is not connected to Bradbury.');
    setState((s) => ({ ...s, chainId: CHAIN_ID, error: null }));
    return { chainId: CHAIN_ID, provider: eth };
  }, []);

  const disconnect = useCallback(() => setState((s) => ({ ...s, address: null })), []);

  useEffect(() => {
    const eth = getEth();
    if (!eth?.on) return undefined;
    const onAccounts = (accts) =>
      setState((s) => ({ ...s, address: accts && accts.length ? accts[0] : null }));
    const onChain = () => refreshChain();
    eth.on('accountsChanged', onAccounts);
    eth.on('chainChanged', onChain);
    return () => {
      eth.removeListener?.('accountsChanged', onAccounts);
      eth.removeListener?.('chainChanged', onChain);
    };
  }, [refreshChain]);

  const onRightChain = state.chainId === CHAIN_ID;
  const connected = !!state.address;
  return {
    ...state,
    provider: getEth(),
    connected,
    onRightChain,
    connect,
    disconnect,
    switchChain,
  };
}
