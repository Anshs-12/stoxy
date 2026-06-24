import { useState, useEffect, useCallback } from 'react';
import { indexApi, tickerApi } from '../lib/api';
import type { IndexDetail, LtpcData } from '../types';

export interface IndexDetailWithLive extends IndexDetail {
  liveLtp: number | null;
  liveCp: number | null;
  liveChange: number | null;
  livePChange: number | null;
}

export const useIndexDetail = (symbol: string | undefined) => {
  const [index, setIndex] = useState<IndexDetailWithLive | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadIndex = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError('');
    try {
      // Decode the instrument key from the URL param
      const instrumentKey = decodeURIComponent(symbol);
      const r = await indexApi.getByInstrumentKey(instrumentKey);
      const data = r.data;

      // Fetch live LTPC from the ticker endpoint — indexPriceInfoDTO is null at rest-level
      let liveData: LtpcData | null = null;
      try {
        const t = await tickerApi.getLtpc([instrumentKey]);
        liveData = t.data?.[instrumentKey] ?? null;
      } catch {
        // non-fatal — market may be closed
      }

      const ltp = liveData?.ltp ?? null;
      const cp = liveData?.cp ?? null;
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
        status === 404
          ? `Index not found.`
          : 'Failed to load index data.'
      );
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    loadIndex();
  }, [loadIndex]);

  // Poll live prices every 5 seconds while mounted
  useEffect(() => {
    if (!symbol || !index) return;
    const instrumentKey = decodeURIComponent(symbol);
    const interval = setInterval(async () => {
      try {
        const t = await tickerApi.getLtpc([instrumentKey]);
        const liveData = t.data?.[instrumentKey] ?? null;
        if (!liveData) return;
        const ltp = liveData.ltp;
        const cp = liveData.cp;
        const change = ltp - cp;
        const pChange = cp > 0 ? (change / cp) * 100 : 0;
        setIndex(prev =>
          prev
            ? { ...prev, liveLtp: ltp, liveCp: cp, liveChange: change, livePChange: pChange }
            : prev
        );
      } catch {
        // silent — keep showing stale data
      }
    }, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, !!index]);

  return {
    index,
    loading,
    error,
    refreshIndex: loadIndex,
  };
};
