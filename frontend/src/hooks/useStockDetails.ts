import { useState, useEffect, useCallback } from 'react';
import { stocksApi, portfolioApi, watchlistApi } from '../lib/api';
import { StockDetail, WatchlistSummary } from '../types';
import { useToast } from '../context/ToastContext';

export const useStockDetails = (symbol: string | undefined) => {
  const [stock, setStock] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [watchlists, setWatchlists] = useState<WatchlistSummary[]>([]);
  const [wlLoading, setWlLoading] = useState(false);
  const { addToast } = useToast();

  const loadStock = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const r = await stocksApi.getDetails(symbol);
      setStock(r.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.status === 404 ? `Stock "${symbol}" not found.` : 'Failed to load stock data.');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  const loadWatchlists = useCallback(async () => {
    try {
      const r = await watchlistApi.getAll();
      setWatchlists(r.data);
    } catch (err) {
      console.error('Failed to load watchlists', err);
    }
  }, []);

  useEffect(() => {
    loadStock();
    loadWatchlists();
  }, [loadStock, loadWatchlists]);

  const addToWatchlist = async (wlId: number, wlName: string) => {
    if (!symbol) return false;
    setWlLoading(true);
    try {
      await watchlistApi.addStock(wlId, symbol);
      addToast(`Added to ${wlName}`, 'success');
      return true;
    } catch (err: any) {
      addToast(err.response?.data?.message || `Failed to add to ${wlName}`, 'error');
      return false;
    } finally {
      setWlLoading(false);
    }
  };

  const buyStock = async (quantity: number) => {
    if (!symbol) return false;
    try {
      await portfolioApi.buyStock(symbol, quantity);
      addToast(`Bought ${quantity} shares of ${symbol}`, 'success');
      return true;
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Purchase failed', 'error');
      return false;
    }
  };

  const sellStock = async (quantity: number) => {
    if (!symbol) return false;
    try {
      await portfolioApi.sellStock(symbol, quantity);
      addToast(`Sold ${quantity} shares of ${symbol}`, 'success');
      return true;
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Sale failed', 'error');
      return false;
    }
  };

  return {
    stock,
    loading,
    error,
    watchlists,
    wlLoading,
    addToWatchlist,
    buyStock,
    sellStock,
    refreshStock: loadStock,
  };
};
