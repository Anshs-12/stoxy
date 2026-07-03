/**
 * TickerContext.tsx
 *
 * Provides live LTPC and FullFeed data to the entire component tree via a
 * single, shared WebSocket connection to ws(s)://<host>/wss/market.
 *
 * Design:
 *  - On mount, REST snapshot endpoints are called once for all subscribed keys.
 *  - The WebSocket is opened and ticks are merged into state as they arrive.
 *  - On close code 4000 (market closed): WebSocket is NOT retried; the REST
 *    snapshot data remains visible (stale-but-acceptable while market is shut).
 *  - On any other unexpected disconnect: exponential back-off reconnect handled
 *    by marketSocket singleton.
 *  - Subscription management is identical to the old design (ref-counted) so
 *    all existing useLtpc / useFullFeed hook call-sites are unchanged.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { tickerApi, parseApiError } from '@/lib/api';
import { marketSocket, type SocketStatus, type TickMessage } from '@/lib/marketSocket';
import type { LtpcData, FullFeedData } from '@/types';

interface TickerContextType {
  ltpcData: Record<string, LtpcData | null>;
  fullFeedData: Record<string, FullFeedData | null>;
  subscribeLtpc: (keys: string[]) => () => void;
  subscribeFullFeed: (key: string) => () => void;
  lastError: string | null;
  consecutiveFailures: number;
  /** 'open' | 'connecting' | 'reconnecting' | 'market_closed' | 'closed' */
  socketStatus: SocketStatus;
}

const TickerContext = createContext<TickerContextType | undefined>(undefined);

export function TickerProvider({ children }: { children: React.ReactNode }) {
  // ── Price state (accumulated — never reset between ticks) ──
  const [ltpcData, setLtpcData] = useState<Record<string, LtpcData | null>>({});
  const [fullFeedData, setFullFeedData] = useState<Record<string, FullFeedData | null>>({});
  const [lastError, setLastError] = useState<string | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>(marketSocket.getStatus());

  // ── Active subscription keys (drives REST snapshot refetch on key changes) ──
  const [activeLtpcKeys, setActiveLtpcKeys] = useState<string[]>([]);
  const [activeFullFeedKeys, setActiveFullFeedKeys] = useState<string[]>([]);

  // ── Ref-counted subscription maps ──
  const ltpcSubsRef = useRef<Map<string, number>>(new Map());
  const fullFeedSubsRef = useRef<Map<string, number>>(new Map());

  // ── WebSocket: listen for status changes ──
  useEffect(() => {
    const unsub = marketSocket.addStatusListener(setSocketStatus);
    return unsub;
  }, []);

  // ── WebSocket: listen for tick messages and merge into state ──
  useEffect(() => {
    const unsub = marketSocket.addTickListener((msg: TickMessage) => {
      const key = msg.instrumentKey;
      if (!key) return;

      // FullFeedDataDTO has 'vtt' (volumeTradedToday) and 'marketLevel'; LtpcDataDTO does not
      if ('vtt' in msg || 'marketLevel' in msg) {
        setFullFeedData(prev => ({ ...prev, [key]: msg as unknown as FullFeedData }));
      } else {
        setLtpcData(prev => ({ ...prev, [key]: msg as unknown as LtpcData }));
      }
    });
    return unsub;
  }, []);

  // ── REST snapshot: fetch once whenever the set of LTPC keys changes ──
  useEffect(() => {
    if (activeLtpcKeys.length === 0) return;
    tickerApi
      .getLtpc(activeLtpcKeys)
      .then(r => {
        if (r.data) {
          setLtpcData(prev => ({ ...prev, ...r.data }));
          setLastError(null);
          setConsecutiveFailures(0);
        }
      })
      .catch(err => {
        setLastError(parseApiError(err));
        setConsecutiveFailures(prev => prev + 1);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLtpcKeys.join(',')]);

  // ── REST snapshot: fetch once whenever the set of FullFeed keys changes ──
  useEffect(() => {
    if (activeFullFeedKeys.length === 0) return;
    tickerApi
      .getFullFeed(activeFullFeedKeys)
      .then(r => {
        if (r.data) {
          setFullFeedData(prev => ({ ...prev, ...r.data }));
          setLastError(null);
          setConsecutiveFailures(0);
        }
      })
      .catch(err => {
        setLastError(parseApiError(err));
        setConsecutiveFailures(prev => prev + 1);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFullFeedKeys.join(',')]);

  // ── Page Visibility: re-fetch REST snapshot when tab regains focus ──
  // (WebSocket will have stayed alive or reconnected automatically)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      if (activeLtpcKeys.length > 0) {
        tickerApi.getLtpc(activeLtpcKeys).then(r => {
          if (r.data) setLtpcData(prev => ({ ...prev, ...r.data }));
        }).catch(() => {});
      }
      if (activeFullFeedKeys.length > 0) {
        tickerApi.getFullFeed(activeFullFeedKeys).then(r => {
          if (r.data) setFullFeedData(prev => ({ ...prev, ...r.data }));
        }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLtpcKeys.length, activeFullFeedKeys.length]);

  // ── Subscription management ──
  const subscribeLtpc = useCallback((keys: string[]) => {
    const subs = ltpcSubsRef.current;
    for (const k of keys) {
      subs.set(k, (subs.get(k) || 0) + 1);
    }
    const allKeys = Array.from(subs.keys());
    setActiveLtpcKeys(allKeys);

    // Register with the WebSocket singleton
    const wsUnsub = marketSocket.subscribe(keys, 'ltpc');

    return () => {
      for (const k of keys) {
        const count = subs.get(k) || 0;
        if (count <= 1) subs.delete(k);
        else subs.set(k, count - 1);
      }
      setActiveLtpcKeys(Array.from(subs.keys()));
      wsUnsub();
    };
  }, []);

  const subscribeFullFeed = useCallback((key: string) => {
    const subs = fullFeedSubsRef.current;
    subs.set(key, (subs.get(key) || 0) + 1);
    const allKeys = Array.from(subs.keys());
    setActiveFullFeedKeys(allKeys);

    // Register with the WebSocket singleton
    const wsUnsub = marketSocket.subscribe([key], 'fullFeed');

    return () => {
      const count = subs.get(key) || 0;
      if (count <= 1) subs.delete(key);
      else subs.set(key, count - 1);
      setActiveFullFeedKeys(Array.from(subs.keys()));
      wsUnsub();
    };
  }, []);

  const contextValue = useMemo<TickerContextType>(
    () => ({
      ltpcData,
      fullFeedData,
      subscribeLtpc,
      subscribeFullFeed,
      lastError,
      consecutiveFailures,
      socketStatus,
    }),
    [ltpcData, fullFeedData, lastError, consecutiveFailures, subscribeLtpc, subscribeFullFeed, socketStatus]
  );

  return (
    <TickerContext.Provider value={contextValue}>
      {children}
    </TickerContext.Provider>
  );
}

export function useTicker() {
  const ctx = useContext(TickerContext);
  if (!ctx) throw new Error('useTicker must be used within TickerProvider');
  return ctx;
}

// ── Convenience hooks — kept for backward-compat with existing call sites ──

/**
 * One-time REST snapshot hook for LTPC.
 * Used only for components that need data without joining the shared subscription
 * system (e.g. standalone detail pages that manage their own WebSocket sub).
 */
export function useLtpcSnapshot(instrumentKeys: string[]) {
  const [data, setData] = useState<Record<string, LtpcData> | null>(null);
  const [loading, setLoading] = useState(instrumentKeys.length > 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (instrumentKeys.length === 0) return;
    setLoading(true);
    tickerApi
      .getLtpc(instrumentKeys)
      .then(r => { setData(r.data ?? null); setError(null); })
      .catch(err => setError(parseApiError(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instrumentKeys.join(',')]);

  return { data, loading, error };
}

/**
 * One-time REST snapshot hook for FullFeed.
 */
export function useFullFeedSnapshot(instrumentKey: string | null) {
  const [data, setData] = useState<FullFeedData | null>(null);
  const [loading, setLoading] = useState(!!instrumentKey);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!instrumentKey) return;
    setLoading(true);
    tickerApi
      .getFullFeed([instrumentKey])
      .then(r => { setData(r.data?.[instrumentKey] ?? null); setError(null); })
      .catch(err => setError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, [instrumentKey]);

  return { data, loading, error };
}
