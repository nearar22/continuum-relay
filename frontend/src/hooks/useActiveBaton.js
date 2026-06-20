// useActiveBaton.js
// =================
// Scenes that operate on one baton (gate, runway, mirror, repair) select it via
// a ?baton=<id> search param so links between scenes carry context. This hook
// reads the param and resolves the FULL baton detail from the chain (the list
// view carries only public summary fields, not the layers, gate readings, or
// mirror), refetching whenever the id changes or the store refreshes after a
// write so the scene always reflects live on-chain state.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRelay } from '../context/RelayContext.jsx';

export function useActiveBaton() {
  const [params, setParams] = useSearchParams();
  const { batons, getBaton, lastUpdated } = useRelay();
  const activeId = params.get('baton') || '';

  const summary = useMemo(
    () => batons.find((b) => b.id === activeId) || null,
    [batons, activeId],
  );

  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch the full baton (with layers, gate, mirror, proof) for the active id.
  useEffect(() => {
    let alive = true;
    if (!activeId) {
      setDetail(null);
      return () => { alive = false; };
    }
    setLoadingDetail(true);
    getBaton(activeId)
      .then((full) => {
        if (alive) setDetail(full && full.id ? full : null);
      })
      .catch(() => {
        if (alive) setDetail(null);
      })
      .finally(() => {
        if (alive) setLoadingDetail(false);
      });
    return () => { alive = false; };
  }, [activeId, getBaton, lastUpdated]);

  // Prefer the rich detail; fall back to the summary while it loads.
  const baton = detail || summary;

  const setActiveId = useCallback(
    (id) => {
      const next = new URLSearchParams(params);
      if (id) next.set('baton', id);
      else next.delete('baton');
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  return { activeId, baton, setActiveId, batons, loadingDetail };
}
