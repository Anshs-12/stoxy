import { useState, useEffect, useCallback, useRef } from 'react';
import { indexApi, tickerApi } from '../lib/api';
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // React Router v7 already URL-decodes params, so rawSymbol is the decoded key
  // e.g. "NSE_INDEX|Nifty 50" (NOT "NSE_INDEX%7CNifty%2050")
  const instrumentKey = rawSymbol ? decodeURIComponent(rawSymbol) : undefined;

  const fetchLivePrice = useCallback(
    async (key: string): Promise<{ ltp: number; cp: number } | null> => {
      try {
        const t = await tickerApi.getLtpc([key]);
        const live: LtpcData | null = t.data?.[key] ?? null;
        if (live?.ltp != null) return { ltp: live.ltp, cp: live.cp ?? live.ltp };
      } catch {
        // non-fatal — market may be closed
      }
      return null;
    },
    []
  );

  const loadIndex = useCallback(async () => {
    if (!instrumentKey) return;
    setLoading(true);
    setError('');
    try {
      const r = await indexApi.getByInstrumentKey(instrumentKey);
      const data = r.data;

      // Fetch live LTPC — indexPriceInfoDTO is null at REST level
      const live = await fetchLivePrice(instrumentKey);
      const ltp = live?.ltp ?? null;
      const cp = live?.cp ?? null;
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
      setError(
        status === 404 ? `Index not found.` : 'Failed to load index data.'
      );
    } finally {
      setLoading(false);
    }
  }, [instrumentKey, fetchLivePrice]);

  // Initial load
  useEffect(() => {
    loadIndex();
  }, [loadIndex]);

  // Poll live prices every 5 seconds
  useEffect(() => {
    if (!instrumentKey) return;

    const poll = async () => {
      const live = await fetchLivePrice(instrumentKey);
      if (!live) return;
      const { ltp, cp } = live;
      const change = ltp - cp;
      const pChange = cp > 0 ? (change / cp) * 100 : 0;
      setIndex(prev =>
        prev
          ? { ...prev, liveLtp: ltp, liveCp: cp, liveChange: change, livePChange: pChange }
          : prev
      );
    };

    intervalRef.current = setInterval(poll, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [instrumentKey, fetchLivePrice]);

  return {
    index,
    loading,
    error,
    refreshIndex: loadIndex,
  };
};
