import { useEffect, useRef } from 'react';
import { fillPrevClose, getPrevClose } from '../lib/prevClose';

export interface ChangeShape {
  cp: number | null;
  ltp: number | null;
  change: number | null;
  pChange: number | null;
}

/** Default patch for the common list shape (cp/ltp/change/pChange). */
export const recomputeChange = <T extends ChangeShape>(item: T, prevClose: number): T => {
  const change = item.ltp != null ? item.ltp - prevClose : null;
  return {
    ...item,
    cp: prevClose,
    change,
    pChange: prevClose > 0 && change != null ? (change / prevClose) * 100 : null,
  };
};

/**
 * One-shot per-day repair for list surfaces. After the initial REST snapshot,
 * entries whose cp is stale (cp == ltp — typical on closed days once the 2h
 * Redis cache expires) get their previous close filled from the daily candle
 * history, then `recompute` patches change/pChange. Only stale keys are
 * fetched, and results are cached for the rest of the day (survives reloads).
 */
export function usePrevCloseFix<T>(
  items: T[],
  setItems: React.Dispatch<React.SetStateAction<T[]>>,
  getKey: (item: T) => string,
  getCps: (item: T) => { cp: number | null | undefined; ltp: number | null | undefined },
  recompute: (item: T, prevClose: number) => T
) {
  const ref = useRef({ getKey, getCps, recompute, setItems });
  ref.current = { getKey, getCps, recompute, setItems };

  useEffect(() => {
    const { getKey, getCps } = ref.current;
    const staleKeys = items
      .filter(i => getPrevClose(getKey(i), getCps(i).cp, getCps(i).ltp) == null)
      .map(getKey);
    if (staleKeys.length === 0) return;

    let cancelled = false;
    (async () => {
      await Promise.all(staleKeys.map(k => fillPrevClose(k)));
      if (cancelled) return;
      ref.current.setItems(prev =>
        prev.map(item => {
          const prevClose = getPrevClose(getKey(item), getCps(item).cp, getCps(item).ltp);
          return prevClose != null ? ref.current.recompute(item, prevClose) : item;
        })
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);
}