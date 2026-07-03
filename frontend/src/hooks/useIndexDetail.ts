import { useState, useEffect, useCallback } from 'react';
import { indexApi, tickerApi } from '../lib/api';
import { marketSocket } from '../lib/marketSocket';
import type { IndexDetail, LtpcData } from '../types';

export interface IndexDetailWithLive extends IndexDetail {
  liveLtp: number | null;
  liveCp: number | null;
  liveChange: number | null;
  livePChange: number | null;
}

export const useIndexDetail = (rawSymbol: string | undefined) => {
  const [index, setIndex] = useState<IndexDetailWithLive | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // React Router v7 already URL-decodes params, so rawSymbol is the decoded key
  // e.g. "NSE_INDEX|Nifty 50" (NOT "NSE_INDEX%7CNifty%2050")
  const instrumentKey = rawSymbol ? decodeURIComponent(rawSymbol) : undefined;

  const loadIndex = useCallback(async () => {
    if (!instrumentKey) return;
    setLoading(true);
    setError('');
    try {
      const r = await indexApi.getByInstrumentKey(instrumentKey);
      const data = r.data;

      // ── Initial REST snapshot (before WebSocket ticks start arriving) ──
      let ltp: number | null = null;
      let cp: number | null = null;
      try {
        const t = await tickerApi.getLtpc([instrumentKey]);
        const live: LtpcData | null = t.data?.[instrumentKey] ?? null;
        if (live?.ltp != null) {
          ltp = live.ltp;
          cp = live.cp ?? live.ltp;
        }
      } catch {
        // non-fatal — market may be closed
      }

      const change = ltp != null && cp != null ? ltp - cp : null;
      const pChange =
        cp != null && cp > 0 && change != null ? (change / cp) * 100 : null;

      setIndex({
        ...data,
        liveLtp: ltp,
        liveCp: cp,
        liveChange: change,
        livePChange: pChange,
      });
    } catch (err: any) {
      const status = err?.response?.status;
      setError(status === 404 ? `Index not found.` : 'Failed to load index data.');
    } finally {
      setLoading(false);
    }
  }, [instrumentKey]);

  // Initial load
  useEffect(() => {
    loadIndex();
  }, [loadIndex]);

  // ── Live price updates via WebSocket (ltpc mode for indices) ──
  // No polling interval — ticks pushed from backend.
  // If market is closed (code 4000) the socket won't reconnect; we keep
  // showing the REST snapshot data loaded above.
  useEffect(() => {
    if (!instrumentKey) return;

    const wsUnsub = marketSocket.subscribe([instrumentKey], 'ltpc');

    const tickUnsub = marketSocket.addTickListener(msg => {
      if (msg.instrumentKey !== instrumentKey) return;
      const ltp = msg.ltp;
      const cp = msg.cp;
      if (ltp == null) return;
      const cpVal = cp ?? ltp;
      const change = ltp - cpVal;
      const pChange = cpVal > 0 ? (change / cpVal) * 100 : 0;
      setIndex(prev =>
        prev
          ? { ...prev, liveLtp: ltp, liveCp: cpVal, liveChange: change, livePChange: pChange }
          : prev
      );
    });

    return () => {
      wsUnsub();
      tickUnsub();
    };
  }, [instrumentKey]);

  return {
    index,
    loading,
    error,
    refreshIndex: loadIndex,
  };
};
