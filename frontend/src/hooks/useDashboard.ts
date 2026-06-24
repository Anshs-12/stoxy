import { useState, useEffect, useCallback } from 'react';
import { indexApi, tickerApi } from '../lib/api';
import type { IndexSearchResult, LtpcData } from '../types';

// Queries to bootstrap the dashboard indices — use the search endpoint
// to discover instrument keys dynamically, then poll ticker for live prices.
const INDEX_QUERIES = ['NIFTY 50', 'NIFTY BANK', 'SENSEX'];

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

  // Step 2: fetch live prices for the discovered instrument keys
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
        const change = ltp != null && cp != null ? ltp - cp : null;
        const pChange = cp != null && cp > 0 && change != null
          ? (change / cp) * 100
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    indices,
    loading,
    error,
    refreshDashboard: loadData,
  };
};
