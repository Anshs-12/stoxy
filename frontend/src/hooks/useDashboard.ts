import { useState, useEffect, useCallback } from 'react';
import { indexApi, tickerApi } from '../lib/api';
import { marketSocket } from '../lib/marketSocket';
import { getPrevClose } from '../lib/prevClose';
import { usePrevCloseFix, recomputeChange } from './usePrevCloseFix';
import type { IndexSearchResult, LtpcData } from '../types';

// Queries to bootstrap the dashboard indices — use the search endpoint
// to discover instrument keys dynamically, then fetch an initial REST
// snapshot and subscribe to WebSocket ltpc updates.
const INDEX_QUERIES = [
  'NIFTY 50', 'NIFTY 100', 'NIFTY 200', 'NIFTY 500',
  'NIFTY BANK', 'NIFTY AUTO', 'NIFTY FINANCIAL SERVICES', 'NIFTY FMCG',
  'NIFTY IT', 'NIFTY MEDIA', 'NIFTY METAL', 'NIFTY PHARMA',
  'NIFTY PSU BANK', 'NIFTY PRIVATE BANK', 'NIFTY REALTY',
  'NIFTY ENERGY', 'NIFTY INFRASTRUCTURE', 'NIFTY COMMODITIES',
  'SENSEX 50', 'SENSEX',
];

export interface DashboardIndex {
  indexName: string;
  indexSymbol: string;
  exchange: string;
  segment: string;
  instrumentKey: string;
  ltp: number | null;
  cp: number | null;
  change: number | null;
  pChange: number | null;
}

export const useDashboard = () => {
  const [indices, setIndices] = useState<DashboardIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Step 1: search for indices to get their instrument keys
  const discoverIndices = useCallback(async (): Promise<IndexSearchResult[]> => {
    const seen = new Set<string>();
    const found: IndexSearchResult[] = [];

    const results = await Promise.allSettled(
      INDEX_QUERIES.map(q => indexApi.search(q))
    );

    for (const r of results) {
      if (r.status === 'fulfilled') {
        const list = r.value.data.indexSearchDTOList ?? [];
        for (const item of list) {
          if (!seen.has(item.instrumentKey)) {
            seen.add(item.instrumentKey);
            found.push(item);
          }
        }
      }
    }
    return found;
  }, []);

  // Step 2: fetch initial REST snapshot for discovered instrument keys
  const fetchLivePrices = useCallback(
    async (keys: string[]): Promise<Record<string, LtpcData>> => {
      if (keys.length === 0) return {};
      try {
        const r = await tickerApi.getLtpc(keys);
        return r.data ?? {};
      } catch {
        return {};
      }
    },
    []
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const searchResults = await discoverIndices();

      if (searchResults.length === 0) {
        setError('No indices found. The index data may not be seeded yet.');
        setIndices([]);
        return;
      }

      const keys = searchResults.map(i => i.instrumentKey);
      const liveMap = await fetchLivePrices(keys);

      const dashboardIndices: DashboardIndex[] = searchResults.map(item => {
        const live = liveMap[item.instrumentKey];
        const ltp = live?.ltp ?? null;
        const cp = live?.cp ?? null;
        const prevClose = getPrevClose(item.instrumentKey, cp, ltp);
        const change = ltp != null && prevClose != null ? ltp - prevClose : null;
        const pChange = prevClose != null && prevClose > 0 && change != null
          ? (change / prevClose) * 100
          : null;
        return {
          ...item,
          ltp,
          cp,
          change,
          pChange,
        };
      });

      setIndices(dashboardIndices);
    } catch (err: any) {
      const status = err?.response?.status;
      if (!status) {
        setError('Could not connect to the backend. Please try again.');
      } else {
        setError(`Backend error (${status}): ${err?.response?.data?.message ?? 'Failed to load market data.'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [discoverIndices, fetchLivePrices]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── WebSocket live updates for dashboard index cards ──
  // Subscribes once indices are loaded; unsubscribes on unmount.
  // If market is closed (code 4000) no retry occurs — REST snapshot remains.
  useEffect(() => {
    if (indices.length === 0) return;

    const keys = indices.map(i => i.instrumentKey);
    const wsUnsub = marketSocket.subscribe(keys, 'ltpc');

    const tickUnsub = marketSocket.addTickListener(msg => {
      const key = msg.instrumentKey;
      if (!key) return;
      const ltp = msg.ltp;
      if (ltp == null) return;

      setIndices(prev =>
        prev.map(idx => {
          if (idx.instrumentKey !== key) return idx;
          const cpVal = msg.cp ?? idx.cp ?? ltp;
          const change = ltp - cpVal;
          const pChange = cpVal > 0 ? (change / cpVal) * 100 : 0;
          return { ...idx, ltp, cp: cpVal, change, pChange };
        })
      );
    });

    return () => {
      wsUnsub();
      tickUnsub();
    };
  }, [indices.length]); // re-subscribe if indices count changes (e.g. after refresh)

  // ── Previous-close repair: fills stale cp (cp == ltp on closed days) from
  // candle history once per day, then patches change/pChange. ──
  usePrevCloseFix(indices, setIndices, i => i.instrumentKey, i => ({ cp: i.cp, ltp: i.ltp }), recomputeChange);

  return {
    indices,
    loading,
    error,
    refreshDashboard: loadData,
  };
};
