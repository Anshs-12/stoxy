import { useState, useEffect, useCallback } from 'react';
import { portfolioApi, stocksApi, tickerApi } from '../lib/api';
import { PortfolioResponse, TransactionResponse, PortfolioStock } from '../types';
import { useToast } from '../context/ToastContext';

export const usePortfolio = () => {
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [txHistory, setTxHistory] = useState<TransactionResponse[] | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [buyResults, setBuyResults] = useState<{ stockName: string; stockSymbol: string; instrumentKey: string; isin: string; exchange: string; companyName: string }[]>([]);
  const { addToast } = useToast();

  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await portfolioApi.getPortfolio();
      const portfolioData = r.data;

      // Fetch live prices for all held stocks
      const keys = portfolioData.stocks.map(s => s.instrumentKey).filter(Boolean);
      let liveData: Record<string, { ltp: number; cp: number }> = {};
      if (keys.length > 0) {
        try {
          const t = await tickerApi.getLtpc(keys);
          liveData = t.data as any;
        } catch {
          // live price failure is non-fatal — use backend values
        }
      }

      const enrichedStocks: PortfolioStock[] = portfolioData.stocks.map(s => {
        const live = liveData[s.instrumentKey];
        // Backend already computes ltp, currentValue, unrealizedPnL etc.
        // Prefer live ticker ltp if available, fall back to backend value
        const ltpValue = live?.ltp ? Number(live.ltp) : Number(s.ltp) || Number(s.avgBuyingPrice) || 0;
        const cpValue = live?.cp ? Number(live.cp) : ltpValue;
        const currentVal = ltpValue * s.totalQuantity;
        const invested = Number(s.investedAmount) || 0;
        const unrealizedPnL = currentVal - invested;
        const unrealizedPnLPercent = invested > 0 ? (unrealizedPnL / invested) * 100 : 0;
        const dayPnL = (ltpValue - cpValue) * s.totalQuantity;
        const dayPnLPercent = cpValue > 0 ? ((ltpValue - cpValue) / cpValue) * 100 : 0;

        return {
          ...s,
          ltp: ltpValue,
          currentValue: currentVal,
          unrealizedPnL,
          unrealizedPnLPercent,
          dayPnL,
          dayPnLPercent,
        };
      });

      const totalCurrentValue = enrichedStocks.reduce((sum, s) => sum + s.currentValue, 0);
      const totalDayPnL = enrichedStocks.reduce((sum, s) => sum + s.dayPnL, 0);
      const totalInvested = Number(portfolioData.totalInvestedValue) || 0;
      const totalUnrealizedPnL = totalCurrentValue - totalInvested;
      const totalUnrealizedPnLPercent = totalInvested > 0 ? (totalUnrealizedPnL / totalInvested) * 100 : 0;
      const totalPrevClose = totalCurrentValue - totalDayPnL;
      const totalDayPnLPercent = totalPrevClose > 0 ? (totalDayPnL / totalPrevClose) * 100 : 0;

      setPortfolio({
        ...portfolioData,
        stocks: enrichedStocks,
        totalCurrentValue,
        totalUnrealizedPnL,
        totalUnrealizedPnLPercent,
        totalDayPnL,
        totalDayPnLPercent,
      });
    } catch (err: unknown) {
      const status = (err as any).response?.status;
      setError(
        status === 404
          ? 'No portfolio found. Buy your first stock to create one!'
          : 'Failed to load portfolio. Are you logged in?'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const searchStocks = useCallback(async (query: string) => {
    if (query.length < 2) {
      setBuyResults([]);
      return;
    }
    try {
      const r = await stocksApi.search(query, 0, 6);
      setBuyResults(r.data.content as any);
    } catch {
      // non-fatal
    }
  }, []);

  // BuyStockRequestDTO: { stockSymbol, quantity, buyPrice, instrumentKey }
  const buyStock = async (symbol: string, quantity: number, buyPrice: number, instrumentKey: string) => {
    try {
      await portfolioApi.buyStock(symbol, quantity, buyPrice, instrumentKey);
      addToast(`Successfully bought ${quantity} shares of ${symbol}`, 'success');
      loadPortfolio();
      return true;
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Transaction failed. Please try again.', 'error');
      return false;
    }
  };

  // SellStockRequestDTO: { stockSymbol, quantity, instrumentKey, sellingPrice }
  const sellStock = async (symbol: string, quantity: number, sellingPrice: number, instrumentKey: string) => {
    try {
      await portfolioApi.sellStock(symbol, quantity, sellingPrice, instrumentKey);
      addToast(`Successfully sold ${quantity} shares of ${symbol}`, 'success');
      loadPortfolio();
      return true;
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Transaction failed. Please try again.', 'error');
      return false;
    }
  };

  const fetchTransactionHistory = async (symbol?: string) => {
    setTxLoading(true);
    try {
      const r = symbol
        ? await portfolioApi.getTransactionsByStock(symbol)
        : await portfolioApi.getTransactionHistory();
      setTxHistory(r.data);
    } catch {
      addToast('Failed to fetch transaction history', 'error');
    } finally {
      setTxLoading(false);
    }
  };

  const exportPDF = async () => {
    try {
      const r = await portfolioApi.exportTransactionsPDF();
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Stoxy_Transaction_Statement.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      addToast('Statement downloaded successfully', 'success');
    } catch {
      addToast('Failed to export PDF', 'error');
    }
  };

  return {
    portfolio,
    loading,
    error,
    loadPortfolio,
    buyStock,
    sellStock,
    txHistory,
    txLoading,
    fetchTransactionHistory,
    exportPDF,
    buyResults,
    searchStocks,
  };
};
