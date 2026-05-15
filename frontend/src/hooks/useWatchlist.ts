import { useState, useEffect, useCallback } from 'react';
import { watchlistApi, stocksApi } from '../lib/api';
import { WatchlistSummary, WatchlistDetail } from '../types';
import { useToast } from '../context/ToastContext';

interface LivePrice {
  symbol: string;
  lastPrice: number;
  pChange: number;
}

export const useWatchlist = () => {
  const [lists, setLists] = useState<WatchlistSummary[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeList, setActiveList] = useState<WatchlistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<{ stockName: string; stockSymbol: string }[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({});
  const [livePricesLoading, setLivePricesLoading] = useState(false);
  const { addToast } = useToast();

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

      // Fetch live prices for each stock in the watchlist
      setLivePricesLoading(true);
      const symbols = r.data.watchlistStocks.map(s => s.stockSymbol);
      const priceMap: Record<string, LivePrice> = {};
      await Promise.allSettled(
        symbols.map(async (sym) => {
          try {
            const res = await stocksApi.getDetails(sym);
            const p = res.data.stockPriceInfoDTO;
            priceMap[sym] = {
              symbol: sym,
              lastPrice: p?.lastPrice ?? 0,
              pChange: (p as any)?.pChange ?? (p as any)?.pchange ?? 0,
            };
          } catch (_) { /* skip unavailable symbols */ }
        })
      );
      setLivePrices(priceMap);
    } catch (err) {
      setActiveList(null);
      addToast('Failed to load watchlist details', 'error');
    } finally {
      setDetailLoading(false);
      setLivePricesLoading(false);
    }
  }, [addToast]);

  const createWatchlist = async (name: string) => {
    if (!name.trim()) return false;
    try {
      await watchlistApi.create(name.trim());
      await loadLists();
      addToast('Watchlist created', 'success');
      return true;
    } catch (err) {
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
      }
      await loadLists();
      addToast('Watchlist deleted', 'success');
      return true;
    } catch (err) {
      addToast('Failed to delete watchlist', 'error');
      return false;
    }
  };

  const addStock = async (symbol: string) => {
    if (!activeId) return false;
    try {
      await watchlistApi.addStock(activeId, symbol);
      await loadDetail(activeId);
      addToast(`Added ${symbol} to watchlist`, 'success');
      return true;
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to add stock', 'error');
      return false;
    }
  };

  const removeStock = async (symbol: string) => {
    if (!activeId) return false;
    try {
      await watchlistApi.removeStock(activeId, symbol);
      await loadDetail(activeId);
      addToast(`Removed ${symbol} from watchlist`, 'info');
      return true;
    } catch (err) {
      addToast('Failed to remove stock', 'error');
      return false;
    }
  };

  const searchStocks = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const r = await stocksApi.search(query, 0, 5);
      setSearchResults(r.data.content || []);
    } catch (err) {
      console.error('Failed to search stocks', err);
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
