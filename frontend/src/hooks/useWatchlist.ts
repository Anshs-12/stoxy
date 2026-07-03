import { useState, useEffect, useCallback, useRef } from 'react';
import { watchlistApi, stocksApi, tickerApi } from '../lib/api';
import { marketSocket } from '../lib/marketSocket';
import { WatchlistSummary, WatchlistDetail } from '../types';
import { useToast } from '../context/ToastContext';

interface LivePrice {
  symbol: string;
  ltp: number;
  pChange: number;
}

export const useWatchlist = () => {
  const [lists, setLists] = useState<WatchlistSummary[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeList, setActiveList] = useState<WatchlistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<{ stockName: string; stockSymbol: string; instrumentKey: string; isin: string; exchange: string; companyName: string }[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({});
  const [livePricesLoading, setLivePricesLoading] = useState(false);
  const { addToast } = useToast();

  // Track the symbol→instrumentKey map so tick listener can update livePrices
  const symbolToKeyRef = useRef<Map<string, string>>(new Map());

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const r = await watchlistApi.getAll();
      setLists(r.data);
      setError('');
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        setError('Please login first to access your watchlists.');
      } else {
        setError('Could not load watchlists. Is the backend running?');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const loadDetail = useCallback(async (id: number) => {
    setActiveId(id);
    setDetailLoading(true);
    try {
      const r = await watchlistApi.getById(id);
      setActiveList(r.data);

      // ── REST snapshot for initial live prices ──
      setLivePricesLoading(true);
      const keys = r.data.watchlistStocks.map(s => s.instrumentKey).filter(Boolean);

      // Build symbol→key map for WebSocket tick updates
      const map = new Map<string, string>();
      r.data.watchlistStocks.forEach(s => {
        if (s.instrumentKey) map.set(s.stockSymbol, s.instrumentKey);
      });
      symbolToKeyRef.current = map;

      if (keys.length > 0) {
        try {
          const t = await tickerApi.getLtpc(keys);
          const liveData = t.data || {};
          const priceMap: Record<string, LivePrice> = {};
          r.data.watchlistStocks.forEach(s => {
            const live = liveData[s.instrumentKey];
            if (live) {
              const ltpVal = Number(live.ltp);
              const cpVal = Number(live.cp);
              priceMap[s.stockSymbol] = {
                symbol: s.stockSymbol,
                ltp: ltpVal,
                pChange: cpVal > 0 ? ((ltpVal - cpVal) / cpVal) * 100 : 0,
              };
            }
          });
          setLivePrices(priceMap);
        } catch {
          // non-fatal
        }
      }
    } catch {
      setActiveList(null);
      addToast('Failed to load watchlist details', 'error');
    } finally {
      setDetailLoading(false);
      setLivePricesLoading(false);
    }
  }, [addToast]);

  // ── WebSocket live price updates for the active watchlist ──
  useEffect(() => {
    if (!activeList) return;

    const keys = activeList.watchlistStocks
      .map(s => s.instrumentKey)
      .filter(Boolean);

    if (keys.length === 0) return;

    const wsUnsub = marketSocket.subscribe(keys, 'ltpc');

    const tickUnsub = marketSocket.addTickListener(msg => {
      const instrKey = msg.instrumentKey;
      if (!instrKey) return;
      const ltp = msg.ltp;
      const cp = msg.cp;
      if (ltp == null) return;
      const cpVal = cp ?? ltp;
      const pChange = cpVal > 0 ? ((ltp - cpVal) / cpVal) * 100 : 0;

      // Find which stock symbol maps to this instrumentKey
      activeList.watchlistStocks.forEach(s => {
        if (s.instrumentKey === instrKey) {
          setLivePrices(prev => ({
            ...prev,
            [s.stockSymbol]: { symbol: s.stockSymbol, ltp, pChange },
          }));
        }
      });
    });

    return () => {
      wsUnsub();
      tickUnsub();
    };
  }, [activeList]);

  const createWatchlist = async (name: string) => {
    if (!name.trim()) return false;
    try {
      await watchlistApi.create(name.trim());
      await loadLists();
      addToast('Watchlist created', 'success');
      return true;
    } catch {
      addToast('Failed to create watchlist', 'error');
      return false;
    }
  };

  const deleteWatchlist = async (id: number) => {
    try {
      await watchlistApi.delete(id);
      if (activeId === id) {
        setActiveId(null);
        setActiveList(null);
        setLivePrices({});
        symbolToKeyRef.current.clear();
      }
      await loadLists();
      addToast('Watchlist deleted', 'success');
      return true;
    } catch {
      addToast('Failed to delete watchlist', 'error');
      return false;
    }
  };

  // WatchlistStockRequestDTO: { stockSymbol, instrumentKey, priceAddedAt }
  const addStock = async (stockSymbol: string, instrumentKey: string, priceAddedAt: number) => {
    if (!activeId) return false;
    try {
      await watchlistApi.addStock(activeId, stockSymbol, instrumentKey, priceAddedAt);
      await loadDetail(activeId);
      addToast(`Added ${stockSymbol} to watchlist`, 'success');
      return true;
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to add stock', 'error');
      return false;
    }
  };

  const removeStock = async (instrumentKey: string) => {
    if (!activeId) return false;
    try {
      await watchlistApi.removeStock(activeId, instrumentKey);
      await loadDetail(activeId);
      addToast('Removed stock from watchlist', 'info');
      return true;
    } catch {
      addToast('Failed to remove stock', 'error');
      return false;
    }
  };

  // Returns full StockSearchResult objects so callers have instrumentKey + isin
  const searchStocks = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const r = await stocksApi.search(query, 0, 5);
      setSearchResults(r.data.content as any);
    } catch {
      // non-fatal
    }
  }, []);

  return {
    lists,
    activeId,
    activeList,
    loading,
    detailLoading,
    error,
    searchResults,
    livePrices,
    livePricesLoading,
    loadLists,
    loadDetail,
    createWatchlist,
    deleteWatchlist,
    addStock,
    removeStock,
    searchStocks,
  };
};
