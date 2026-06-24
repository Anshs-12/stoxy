import { useState, useEffect, useCallback, useRef } from 'react';
import { stocksApi, portfolioApi, watchlistApi, tickerApi } from '../lib/api';
import { StockDetail, WatchlistSummary } from '../types';
import { useToast } from '../context/ToastContext';

export const useStockDetails = (symbol: string | undefined, preloadedState?: any) => {
  const [stock, setStock] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [watchlists, setWatchlists] = useState<WatchlistSummary[]>([]);
  const [wlLoading, setWlLoading] = useState(false);
  const [ltp, setLtp] = useState<number | null>(null);
  const [ltt, setLtt] = useState<number | null>(null);   // last traded timestamp (ms)
  const [cp, setCp] = useState<number | null>(null);     // previous close
  const instrumentKeyRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addToast } = useToast();

  const loadStock = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError('');
    try {
      let payload: {
        stockName?: string; stockSymbol: string; companyName?: string;
        exchange?: string; instrumentKey?: string; isin?: string;
      };

      if (preloadedState?.isin) {
        payload = {
          stockName: preloadedState.stockName,
          stockSymbol: preloadedState.stockSymbol,
          companyName: preloadedState.companyName,
          exchange: preloadedState.exchange,
          instrumentKey: preloadedState.instrumentKey,
          isin: preloadedState.isin,
        };
      } else {
        const searchRes = await stocksApi.search(symbol, 0, 1);
        const found = searchRes.data.content?.[0];
        if (!found) {
          setError(`Stock "${symbol}" not found.`);
          setLoading(false);
          return;
        }
        payload = {
          stockName: found.stockName,
          stockSymbol: found.stockSymbol,
          companyName: found.companyName,
          exchange: found.exchange,
          instrumentKey: found.instrumentKey,
          isin: found.isin,
        };
      }

      const r = await stocksApi.getDetails(payload);
      setStock(r.data);

      const key = r.data.instrumentKey;
      instrumentKeyRef.current = key || null;

      // Initial live price fetch
      if (key) {
        try {
          const t = await tickerApi.getLtpc([key]);
          const live = t.data?.[key];
          if (live?.ltp != null) {
            setLtp(Number(live.ltp));
            setLtt(live.ltt ? Number(live.ltt) : null);
            setCp(live.cp != null ? Number(live.cp) : null);
          }
        } catch {
          // non-fatal — market may be closed
        }
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        setError(`Stock "${symbol}" not found.`);
      } else {
        setError('Failed to load stock data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [symbol, preloadedState]);

  const loadWatchlists = useCallback(async () => {
    try {
      const r = await watchlistApi.getAll();
      setWatchlists(r.data);
    } catch {
      // non-fatal — user may not be logged in
    }
  }, []);

  useEffect(() => {
    loadStock();
    loadWatchlists();
  }, [loadStock, loadWatchlists]);

  // ── Live price polling every 2 seconds ──
  useEffect(() => {
    const poll = async () => {
      const key = instrumentKeyRef.current;
      if (!key) return;
      try {
        const t = await tickerApi.getLtpc([key]);
        const live = t.data?.[key];
        if (live?.ltp != null) {
          setLtp(Number(live.ltp));
          setLtt(live.ltt ? Number(live.ltt) : null);
          setCp(live.cp != null ? Number(live.cp) : null);
        }
      } catch {
        // silent — keep showing last known price
      }
    };

    intervalRef.current = setInterval(poll, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);   // only runs once on mount; reads instrumentKeyRef dynamically

  const addToWatchlist = async (wlId: number, wlName: string) => {
    if (!symbol || !stock) return false;
    setWlLoading(true);
    try {
      const priceAddedAt = ltp ?? 0;
      await watchlistApi.addStock(wlId, stock.stockSymbol, stock.instrumentKey, priceAddedAt);
      addToast(`Added to ${wlName}`, 'success');
      return true;
    } catch (err: any) {
      addToast(err.response?.data?.message || `Failed to add to ${wlName}`, 'error');
      return false;
    } finally {
      setWlLoading(false);
    }
  };

  const buyStock = async (quantity: number, buyPrice: number) => {
    if (!symbol || !stock) return false;
    try {
      await portfolioApi.buyStock(stock.stockSymbol, quantity, buyPrice, stock.instrumentKey);
      addToast(`Bought ${quantity} shares of ${symbol}`, 'success');
      return true;
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Purchase failed', 'error');
      return false;
    }
  };

  const sellStock = async (quantity: number, sellingPrice: number) => {
    if (!symbol || !stock) return false;
    try {
      await portfolioApi.sellStock(stock.stockSymbol, quantity, sellingPrice, stock.instrumentKey);
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
    ltp,
    ltt,
    cp,
    watchlists,
    wlLoading,
    addToWatchlist,
    buyStock,
    sellStock,
    refreshStock: loadStock,
  };
};
