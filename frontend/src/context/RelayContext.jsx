// RelayContext.jsx
// ================
// The relay's shared data store, wired straight to the live GenLayer contract.
// Reads come from contract views on a background poll; writes go through the
// user's own wallet so the contract can enforce that the sender and receiver
// are different people. There is no backend and no mock: the chain is the
// single source of truth. A toast queue and transient relay pulses drive the UI.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  CONTRACT_ADDRESS,
  submitWalletWrite,
  fetchBatons,
  fetchBaton,
  fetchStats,
  fetchProof,
} from '../genlayer/chain.js';
import { pollUntilDecided, assertSuccessfulTransaction } from '../genlayer/tx.js';
import { useWallet } from '../hooks/useWallet.js';

const RelayContext = createContext(null);

const REQUIRED = ['mission', 'currentState', 'unresolvedRisks', 'nextAction', 'definitionOfDone'];
const OPTIONAL = ['originalIntent', 'completedWork', 'decisions', 'constraints', 'peopleWaiting'];

let toastSeq = 0;

function friendlyError(e) {
  const s = String(e && e.message ? e.message : e);
  if (/user rejected|denied/i.test(s)) return 'You declined the signature request.';
  if (/LackOfFundForMaxFee|insufficient/i.test(s)) return 'Wallet balance is below the write fee reserve. Claim test GEN and retry.';
  if (/rate limit|429/i.test(s)) return 'The network is busy. Wait a moment and retry.';
  if (/different person|different than the sender/i.test(s)) return 'The receiver must be a different wallet than the sender.';
  return s.replace(/^\[[A-Z_]+\]\s*/, '') || 'The transaction could not be completed.';
}

export function RelayProvider({ children }) {
  const wallet = useWallet();
  const [batons, setBatons] = useState([]);
  const [stats, setStats] = useState({ batons: 0, evaluations: 0, accepted: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [pulses, setPulses] = useState([]);
  const [txStatus, setTxStatus] = useState(null); // live status name while a write is in flight
  const [lastTx, setLastTx] = useState(null); // hash of the most recent confirmed write, for evidence

  const mounted = useRef(true);
  const paused = useRef(false);
  const pulseRef = useRef(0);

  const pushToast = useCallback((toast) => {
    toastSeq += 1;
    const id = toastSeq;
    const entry = { id, tone: 'info', duration: 4200, ...toast };
    setToasts((t) => [...t, entry]);
    if (entry.duration > 0) {
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), entry.duration);
    }
    return id;
  }, []);

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const pulse = useCallback((event, payload) => {
    pulseRef.current += 1;
    const pulseId = pulseRef.current;
    setPulses((p) => [...p.slice(-12), { id: pulseId, event, payload, at: Date.now() }]);
    setTimeout(() => setPulses((p) => p.filter((x) => x.id !== pulseId)), 2600);
  }, []);

  const refresh = useCallback(async (quiet = true) => {
    if (!quiet) setLoading(true);
    try {
      const [list, st] = await Promise.all([fetchBatons(60), fetchStats()]);
      if (!mounted.current) return list;
      setBatons(list);
      setStats(st);
      setLoadError(null);
      setLastUpdated(Date.now());
      return list;
    } catch (err) {
      if (mounted.current) setLoadError('The relay could not be read from the chain. Retrying shortly.');
      return [];
    } finally {
      if (mounted.current && !quiet) setLoading(false);
    }
  }, []);

  // Boot + slow background poll (the contract holds all state).
  useEffect(() => {
    mounted.current = true;
    refresh(false);
    const id = setInterval(() => {
      if (!paused.current) refresh(true);
    }, 60000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [refresh]);

  const pausePoll = useCallback(() => { paused.current = true; }, []);
  const resumePoll = useCallback(() => { paused.current = false; }, []);

  // ---- shared write runner -------------------------------------------------
  // Submits through the injected browser wallet and fails closed. No pulse,
  // refresh, success toast, or navigation can happen without a real hash and a
  // successful terminal contract execution result.
  const runWrite = useCallback(
    async (functionName, args, { pulseEvent } = {}) => {
      let account = wallet.address;
      let provider = wallet.provider;
      if (!account) {
        const connected = await wallet.connect();
        account = connected?.address;
        provider = connected?.provider;
      }
      if (!account || !provider) throw new Error('Connect your browser wallet to sign this transaction.');
      if (!wallet.onRightChain) await wallet.switchChain();

      pausePoll();
      setTxStatus('PENDING');
      try {
        const { client, hash } = await submitWalletWrite({
          account,
          provider,
          functionName,
          args,
        });
        const decision = await pollUntilDecided(
          client,
          hash,
          (status) => setTxStatus(status),
          { tries: 90, intervalMs: 6000 },
        );
        assertSuccessfulTransaction(decision);
        setLastTx({ hash, functionName });
        await refresh(true);
        if (pulseEvent) pulse(pulseEvent, { hash });
        return { hash, receipt: decision.tx };
      } catch (error) {
        throw new Error(friendlyError(error));
      } finally {
        setTxStatus(null);
        resumePoll();
      }
    },
    [wallet, pausePoll, resumePoll, pulse, refresh],
  );

  // ---- baton operations ----------------------------------------------------

  const getBaton = useCallback((id) => fetchBaton(id), []);
  const getProof = useCallback((id) => fetchProof(id), []);

  const createBaton = useCallback(
    async ({ title, receiverRole, layers }) => {
      const clean = {};
      for (const k of [...REQUIRED, ...OPTIONAL]) clean[k] = String((layers && layers[k]) || '').trim();
      await runWrite('create_baton', [String(title || ''), String(receiverRole || ''), JSON.stringify(clean)], { pulseEvent: 'baton:created' });
      const list = await fetchBatons(60);
      if (mounted.current) setBatons(list);
      // The newest baton is first in the list.
      return list[0] || null;
    },
    [runWrite],
  );

  const evaluateBaton = useCallback(
    async (id) => {
      pulse('baton:evaluating', { batonId: id });
      await runWrite('evaluate_baton_completeness', [id], { pulseEvent: 'baton:gate_result' });
      const baton = await fetchBaton(id);
      return { baton, gate: baton.gate || { gateBand: baton.gateBand, continuityScore: baton.continuityScore } };
    },
    [runWrite, pulse],
  );

  const submitMirror = useCallback(
    async (id, { mirror }) => {
      await runWrite('submit_receiver_mirror', [id, JSON.stringify(mirror)], { pulseEvent: 'baton:received' });
      const baton = await fetchBaton(id);
      return { baton, mirror: baton.mirror };
    },
    [runWrite],
  );

  const repairBaton = useCallback(
    async (id, repairedLayers) => {
      const patch = {};
      for (const [k, v] of Object.entries(repairedLayers || {})) {
        const nv = String(v || '').trim();
        if (nv) patch[k] = nv;
      }
      await runWrite('request_repair', [id, JSON.stringify(patch)], { pulseEvent: 'baton:repaired' });
      const baton = await fetchBaton(id);
      return { baton, layersChanged: Object.keys(patch).length };
    },
    [runWrite],
  );

  // Passing is a UI motion step; the contract has no separate pass call.
  const passBaton = useCallback(
    async (id) => {
      pulse('baton:passed', { batonId: id });
      return fetchBaton(id);
    },
    [pulse],
  );

  const acceptBaton = useCallback(
    async (id) => {
      await runWrite('accept_baton', [id], { pulseEvent: 'baton:accepted' });
      const baton = await fetchBaton(id);
      let proof = baton.proof;
      try { proof = await fetchProof(id); } catch { /* proof view may lag */ }
      return { baton, proof };
    },
    [runWrite],
  );

  const value = useMemo(
    () => ({
      batons,
      stats,
      loading,
      loadError,
      lastUpdated,
      txStatus,
      lastTx,
      wallet,
      contractAddress: CONTRACT_ADDRESS,
      pulses,
      toasts,
      pushToast,
      dismissToast,
      refresh,
      getBaton,
      getProof,
      createBaton,
      evaluateBaton,
      submitMirror,
      repairBaton,
      passBaton,
      acceptBaton,
    }),
    [
      batons, stats, loading, loadError, lastUpdated, txStatus, lastTx, wallet, pulses, toasts,
      pushToast, dismissToast, refresh, getBaton, getProof, createBaton, evaluateBaton,
      submitMirror, repairBaton, passBaton, acceptBaton,
    ],
  );

  return <RelayContext.Provider value={value}>{children}</RelayContext.Provider>;
}

export function useRelay() {
  const ctx = useContext(RelayContext);
  if (!ctx) throw new Error('useRelay must be used inside RelayProvider');
  return ctx;
}
